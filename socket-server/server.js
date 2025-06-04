// C:\Users\Ira\Herd\pvi_site\socket-server\server.js

require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise'); // <--- IMPORT mysql2 for async/await

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("ERROR: MONGODB_URI environment variable is not set!");
    process.exit(1);
} else {
    console.log("MONGODB_URI loaded successfully (first 20 chars):", uri.substring(0, 20) + "...");
}

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db;
let usersCollection;
let chatsCollection;
let messagesCollection;

// --- MySQL Connection Pool ---
let mysqlPool;

async function connectMySQL() {
    console.log("Attempting to connect to MySQL...");
    try {
        mysqlPool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        // Try to get a connection to verify
        const connection = await mysqlPool.getConnection();
        connection.release();
        console.log("Successfully connected to MySQL database!");
    } catch (error) {
        console.error("MySQL connection FAILED!");
        console.error("Error details:", error);
        process.exit(1);
    }
}

// --- Function to Sync Students from MySQL to MongoDB ---
async function syncStudentsFromMySQLToMongo() {
    console.log("Starting student synchronization from MySQL to MongoDB...");
    if (!mysqlPool) {
        console.error("MySQL pool not initialized. Cannot sync students.");
        return;
    }

    try {
        const [rows] = await mysqlPool.execute('SELECT id, login, name, lastname FROM students'); // Corrected: login instead of login_name
        
        if (rows.length === 0) {
            console.log("No students found in MySQL 'students' table to sync.");
            return;
        }

        const bulkOperations = rows.map(student => ({
            updateOne: {
                filter: { mysqlUserId: student.id.toString() }, // Ensure IDs are strings as used in MongoDB
                update: {
                    $set: {
                        loginName: student.login,
                        name: student.name,
                        lastname: student.lastname,
                        // Set status to 'offline' for initial sync or if not explicitly online
                        status: 'offline', // Default to offline, will be updated to 'online' on Socket.io connect
                        lastActive: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                upsert: true // Create if not exists, update if exists
            }
        }));

        const result = await usersCollection.bulkWrite(bulkOperations);
        console.log(`Synchronization complete: Inserted ${result.upsertedCount} new students, Updated ${result.modifiedCount} existing students.`);

    } catch (error) {
        console.error("Error syncing students from MySQL to MongoDB:", error);
    }
}


async function connectDB() {
    console.log("Attempting to connect to MongoDB...");
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. Successfully connected to MongoDB!");

        db = client.db("pvi_chat_db"); // REPLACE 'pvi_chat_db' with your actual database name
        console.log(`Connected to database: ${db.databaseName}`);

        // Assign collections
        usersCollection = db.collection('users');
        chatsCollection = db.collection('chats');
        messagesCollection = db.collection('messages');

        return db;

    } catch (error) {
        console.error("MongoDB connection FAILED!");
        console.error("Error details:", error);
        process.exit(1);
    }
}

async function startApplication() {
    try {
        await connectDB(); // Ensure MongoDB is connected first
        await connectMySQL(); // Ensure MySQL is connected
        await syncStudentsFromMySQLToMongo(); // <--- Run synchronization here

        console.log("Database connections established. Starting application services...");

        const app = express();
        const server = http.createServer(app);

        const FRONTEND_URL = process.env.FRONTEND_URL; // Now correctly read from .env

        app.use(cors({
            origin: FRONTEND_URL,
            methods: ['GET', 'POST'],
            credentials: true
        }));

        const io = new socketIo.Server(server, {
            cors: {
                origin: FRONTEND_URL,
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        // =======================================================
        // Socket.io Logic
        // =======================================================
        io.on('connection', async (socket) => {
            console.log('A user connected:', socket.id);

            let currentUserId = null;
            let currentUserLoginName = null;

            socket.on('userConnected', async (userData) => {
                if (!userData || !userData.mysqlUserId || !userData.loginName) {
                    console.warn('Received userConnected without required data:', userData);
                    socket.disconnect(true);
                    return;
                }

                currentUserId = userData.mysqlUserId;
                currentUserLoginName = userData.loginName;

                // Update user in MongoDB, setting status to 'online'
                await usersCollection.updateOne(
                    { mysqlUserId: currentUserId },
                    {
                        $set: {
                            socketId: socket.id,
                            loginName: currentUserLoginName,
                            name: userData.name,       // <-- THIS IS THE PROBLEM LINE
                            lastname: userData.lastname,
                            status: 'online', // Set to online when they connect
                            lastActive: new Date()
                        },
                        // $setOnInsert: { createdAt: new Date() } // Removed, as syncStudentsFromMySQLToMongo handles initial creation
                    },
                    { upsert: true } // Upsert is fine here to catch any not-yet-synced users, but primarily for status update
                );
                console.log(`User ${currentUserLoginName} (ID: ${currentUserId}) connected with socket ${socket.id}`);

                socket.join(`user-${currentUserId}`);
                io.emit('userStatusUpdate', { mysqlUserId: currentUserId, status: 'online' });

                const userChats = await chatsCollection.find({ participants: currentUserId }).toArray();
                socket.emit('chatsList', userChats);

                // Fetch all students (including offline ones) for the 'create new chat' modal
                const allStudents = await usersCollection.find({}, { projection: { mysqlUserId: 1, loginName: 1, name: 1, lastname: 1, status: 1 } }).toArray();
                socket.emit('allStudents', allStudents);
            });

            // ... (rest of your Socket.io event handlers: createChat, joinChat, sendMessage) ...
            socket.on('createChat', async (data) => {
                // ... (your existing createChat logic) ...
                if (!currentUserId || !data.participants || !Array.isArray(data.participants) || data.participants.length < 1) {
                    socket.emit('chatError', 'Invalid chat creation request.');
                    return;
                }
                const uniqueParticipants = [...new Set([...data.participants, currentUserId])];
                if (data.type === 'private' && uniqueParticipants.length !== 2) {
                    socket.emit('chatError', 'Private chat must have exactly two participants.');
                    return;
                }
                if (data.type === 'group' && uniqueParticipants.length < 2) {
                    socket.emit('chatError', 'Group chat must have at least two participants.');
                    return;
                }
                let chatName = data.name;
                if (data.type === 'private') {
                    const otherParticipantId = uniqueParticipants.find(p => p !== currentUserId);
                    const otherUser = await usersCollection.findOne({ mysqlUserId: otherParticipantId });
                    const currentUserDoc = await usersCollection.findOne({ mysqlUserId: currentUserId });
                    if(otherUser && currentUserDoc) {
                        chatName = `${currentUserDoc.loginName} & ${otherUser.loginName}`;
                    } else {
                        chatName = `Private Chat (${uniqueParticipants.join(', ')})`;
                    }
                }
                const existingChat = await chatsCollection.findOne({
                    type: data.type,
                    participants: { $size: uniqueParticipants.length, $all: uniqueParticipants }
                });
                if (existingChat) {
                    socket.emit('chatError', 'Chat already exists.');
                    socket.emit('chatCreated', existingChat);
                    return;
                }
                const newChat = {
                    type: data.type,
                    participants: uniqueParticipants,
                    name: chatName,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const result = await chatsCollection.insertOne(newChat);
                newChat._id = result.insertedId;
                uniqueParticipants.forEach(participantId => {
                    io.to(`user-${participantId}`).emit('chatCreated', newChat);
                });
                console.log(`Chat created: ${newChat._id} with participants: ${uniqueParticipants.join(', ')}`);
            });


            socket.on('joinChat', async (chatId) => {
                if (!chatId) {
                    socket.emit('chatError', 'Invalid chat ID to join.');
                    return;
                }
                const chatObjectId = new ObjectId(chatId);
                const chat = await chatsCollection.findOne({ _id: chatObjectId, participants: currentUserId });
                if (!chat) {
                    socket.emit('chatError', 'Chat not found or user not a participant.');
                    return;
                }
                socket.join(chatId);
                console.log(`User ${currentUserLoginName} joined chat room: ${chatId}`);
                const history = await messagesCollection.find({ chatId: chatObjectId })
                                    .sort({ timestamp: 1 })
                                    .limit(100)
                                    .toArray();
                socket.emit('chatHistory', { chatId: chatId, messages: history });
            });


            socket.on('sendMessage', async (data) => {
                if (!currentUserId || !data.chatId || !data.message) {
                    socket.emit('chatError', 'Invalid message data.');
                    return;
                }
                const chatObjectId = new ObjectId(data.chatId);
                const chat = await chatsCollection.findOne({ _id: chatObjectId, participants: currentUserId });
                if (!chat) {
                    socket.emit('chatError', 'You are not a participant of this chat.');
                    return;
                }
                const newMessage = {
                    chatId: chatObjectId,
                    senderId: currentUserId,
                    message: data.message,
                    timestamp: new Date(),
                    readBy: [currentUserId]
                };
                const result = await messagesCollection.insertOne(newMessage);
                newMessage._id = result.insertedId;
                await chatsCollection.updateOne(
                    { _id: chatObjectId },
                    { $set: { updatedAt: new Date(), lastMessageSnippet: data.message.substring(0, 50) } }
                );
                io.to(data.chatId).emit('newMessage', newMessage);
                chat.participants.forEach(async participantId => { // Changed to async to allow await inside
                    if (participantId !== currentUserId) {
                        const participantUser = await usersCollection.findOne({ mysqlUserId: participantId }); // Fetch participant user
                        if (participantUser && participantUser.socketId && io.sockets.sockets.has(participantUser.socketId)) {
                             if (io.sockets.adapter.rooms.get(data.chatId)?.has(participantUser.socketId)) {
                                 // User is online AND in the same chat room, no need for bell animation
                             } else {
                                 // User is online but in a different chat or not on messages page, trigger bell/notification
                                 io.to(`user-${participantId}`).emit('newNotification', {
                                     chatId: data.chatId,
                                     sender: currentUserLoginName,
                                     snippet: data.message.substring(0, 50) + '...',
                                     type: 'message'
                                 });
                             }
                        }
                    }
                });
                console.log(`Message sent in chat ${data.chatId} by ${currentUserLoginName}: ${data.message}`);
            });


            socket.on('disconnect', async () => {
                if (currentUserId) {
                    console.log(`User ${currentUserLoginName} (ID: ${currentUserId}) disconnected from socket ${socket.id}`);
                    await usersCollection.updateOne(
                        { mysqlUserId: currentUserId },
                        { $set: { status: 'offline', socketId: null, lastActive: new Date() } }
                    );
                    io.emit('userStatusUpdate', { mysqlUserId: currentUserId, status: 'offline' });
                } else {
                    console.log('An unauthenticated user disconnected:', socket.id);
                }
            });

            socket.on('error', (err) => {
                console.error('Socket error:', err);
            });
        });

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Node.js Chat Server listening on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start application services:", error);
        process.exit(1);
    }
}

startApplication();