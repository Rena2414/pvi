
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise'); 

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
        const connection = await mysqlPool.getConnection();
        connection.release();
        console.log("Successfully connected to MySQL database!");
    } catch (error) {
        console.error("MySQL connection FAILED!");
        console.error("Error details:", error);
        process.exit(1);
    }
}

async function syncStudentsFromMySQLToMongo() {
    console.log("Starting student synchronization from MySQL to MongoDB...");
    if (!mysqlPool) {
        console.error("MySQL pool not initialized. Cannot sync students.");
        return;
    }

    try {
        const [rows] = await mysqlPool.execute('SELECT id, login, name, lastname FROM students'); 
        
        if (rows.length === 0) {
            console.log("No students found in MySQL 'students' table to sync.");
            return;
        }

        const bulkOperations = rows.map(student => ({
            updateOne: {
                filter: { mysqlUserId: student.id.toString() }, 
                update: {
                    $set: {
                        loginName: student.login,
                        name: student.name,
                        lastname: student.lastname,

                        status: 'offline',
                        lastActive: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                upsert: true 
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

        db = client.db("pvi_chat_db"); 
        console.log(`Connected to database: ${db.databaseName}`);


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
        await connectDB(); 
        await connectMySQL(); 
        await syncStudentsFromMySQLToMongo(); 

        console.log("Database connections established. Starting application services...");

        const app = express();
        const server = http.createServer(app);

        const FRONTEND_URL = process.env.FRONTEND_URL; 

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

    await usersCollection.updateOne(
        { mysqlUserId: currentUserId },
        {
            $set: {
                socketId: socket.id,
                loginName: currentUserLoginName,
                name: userData.name,
                lastname: userData.lastname,
                status: 'online',
                lastActive: new Date()
            },
        },
        { upsert: true }
    );
    console.log(`User ${currentUserLoginName} (ID: ${currentUserId}) connected with socket ${socket.id}`);

    socket.join(`user-${currentUserId}`);
    io.emit('userStatusUpdate', { mysqlUserId: currentUserId, status: 'online' });

    const userChats = await chatsCollection.find({ participants: currentUserId }).toArray();
    socket.emit('chatsList', userChats);

    const allStudents = await usersCollection.find({}, { projection: { mysqlUserId: 1, loginName: 1, name: 1, lastname: 1, status: 1 } }).toArray();
    socket.emit('allStudents', allStudents);

    io.to(`user-${currentUserId}`).emit('getUnreadMessages', currentUserId);
});

            socket.on('createChat', async (data) => {
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
    if (!chatId || !currentUserId) { 
        socket.emit('chatError', 'Invalid chat ID or user not connected.');
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

    try {
        const userIdStr = currentUserId.toString();
        const result = await messagesCollection.updateMany(
            { chatId: chatObjectId, readBy: { $nin: [userIdStr] } },
            { $addToSet: { readBy: userIdStr } }
        );
        console.log(`Marked ${result.modifiedCount} messages in chat ${chatId} as read by ${userIdStr}`);
    } catch (err) {
        console.error('Error marking messages as read on chat join:', err);
    }

    const history = await messagesCollection.find({ chatId: chatObjectId })
                                    .sort({ timestamp: 1 })
                                    .limit(100)
                                    .toArray();
    socket.emit('chatHistory', { chatId: chatId, messages: history });

    io.to(`user-${currentUserId}`).emit('getUnreadMessages', currentUserId);
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

    const readers = new Set([currentUserId]);
    const chatRoomSockets = io.sockets.adapter.rooms.get(data.chatId);

    if (chatRoomSockets) {
        for (const socketId of chatRoomSockets) {
            const user = await usersCollection.findOne({ socketId: socketId });
            if (user && user.mysqlUserId) {
                readers.add(user.mysqlUserId);
            }
        }
    }

    const newMessage = {
        chatId: chatObjectId,
        senderId: currentUserId,
        message: data.message,
        timestamp: new Date(),
        readBy: Array.from(readers) 
    };
    const result = await messagesCollection.insertOne(newMessage);
    newMessage._id = result.insertedId;
    await chatsCollection.updateOne(
        { _id: chatObjectId },
        { $set: { updatedAt: new Date(), lastMessageSnippet: data.message.substring(0, 50) } }
    );
    io.to(data.chatId).emit('newMessage', newMessage);


    chat.participants.forEach(async participantId => {

        if (!readers.has(participantId)) {
            io.to(`user-${participantId}`).emit('getUnreadMessages', participantId);
        }

        if (participantId !== currentUserId) {
            const participantUser = await usersCollection.findOne({ mysqlUserId: participantId });
            if (participantUser && participantUser.socketId && io.sockets.sockets.has(participantUser.socketId)) {
                if (!chatRoomSockets?.has(participantUser.socketId)) {
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

            socket.on('getUnreadMessages', async (userId) => {
    console.log(`[Server] getUnreadMessages called by userId: ${userId}`);
    try {
        const userIdStr = userId.toString();

        const userChats = await chatsCollection.find({ participants: userIdStr }).project({ _id: 1 }).toArray();
        const chatIds = userChats.map(c => c._id);

        const unreadMessages = await messagesCollection.find({
            chatId: { $in: chatIds },
            readBy: { $nin: [userIdStr] }
        }).sort({ timestamp: -1 }).limit(3).toArray();

        console.log(`[Server] Emitting unreadMessages to user ${userIdStr}`, unreadMessages);
        socket.emit('unreadMessages', unreadMessages);
    } catch (error) {
        console.error('Error getting unread messages:', error);
    }
});


socket.on('addParticipantsToChat', async ({ chatId, newParticipantIds }) => {
    if (!currentUserId || !chatId || !Array.isArray(newParticipantIds) || newParticipantIds.length === 0) {
        socket.emit('chatError', 'Invalid request to add participants.');
        return;
    }

    try {
        const chatObjectId = new ObjectId(chatId);
        const chat = await chatsCollection.findOne({ _id: chatObjectId });

        if (!chat) {
            socket.emit('chatError', 'Chat not found.');
            return;
        }

        if (!chat.participants.includes(currentUserId)) {
            socket.emit('chatError', 'You are not a participant of this chat.');
            return;
        }

        const validNewParticipants = [];
        for (const newPId of newParticipantIds) {
            const userExists = await usersCollection.countDocuments({ mysqlUserId: newPId });
            if (userExists && !chat.participants.includes(newPId)) {
                validNewParticipants.push(newPId);
            } else if (chat.participants.includes(newPId)) {
                console.warn(`Attempted to add participant ${newPId} who is already in chat ${chatId}`);
            } else {
                console.warn(`Attempted to add non-existent user ID: ${newPId}`);
            }
        }

        if (validNewParticipants.length === 0) {
            socket.emit('chatError', 'No valid new participants to add, or they are already in the chat.');
            return;
        }

        const result = await chatsCollection.updateOne(
            { _id: chatObjectId },
            { $addToSet: { participants: { $each: validNewParticipants } } }
        );

       if (result.modifiedCount > 0) {
            console.log(`Added participants ${validNewParticipants.join(', ')} to chat ${chatId}`);

            const updatedChat = await chatsCollection.findOne({ _id: chatObjectId });

            validNewParticipants.forEach(pId => {
                io.to(`user-${pId}`).emit('participantsAdded', { chatId: updatedChat._id, newParticipants: validNewParticipants });
            });

            updatedChat.participants.forEach(pId => {
                io.to(`user-${pId}`).emit('refreshMyChatsList');
            });

        } else {
            socket.emit('chatError', 'Failed to add participants (no change detected or already added).');
        }

    } catch (error) {
        console.error('Error adding participants to chat:', error);
        socket.emit('chatError', 'Server error adding participants.');
    }
});


socket.on('requestChatsList', async (userId) => {
    console.log(`[Server] User ${userId} requested their chats list.`);
    try {
        let userChats = await chatsCollection.find({ participants: userId.toString() }).toArray();

        for (const chat of userChats) {
            if (chat.type === 'private' && chat.participants.length === 2) {
                const otherParticipantId = chat.participants.find(p => p !== userId.toString());
                const currentUserDoc = await usersCollection.findOne({ mysqlUserId: userId.toString() }); // Fetch current user's details for their name

                if (otherParticipantId) {
                    const otherUser = await usersCollection.findOne({ mysqlUserId: otherParticipantId });
                    if (otherUser && currentUserDoc) {
                        chat.name = `${otherUser.name} ${otherUser.lastname}`;
                    } else {
                        chat.name = `Private Chat (User ID: ${otherParticipantId})`;
                    }
                }
            }
        }

        io.to(`user-${userId}`).emit('chatsList', userChats);
        console.log(`[Server] Sent ${userChats.length} chats to user ${userId}.`);
    } catch (error) {
        console.error(`Error fetching chats list for user ${userId}:`, error);
        io.to(`user-${userId}`).emit('chatError', 'Failed to retrieve chat list.');
    }
});

socket.on('markMessagesAsRead', async ({ chatId, userId }) => {
    try {
        const userIdStr = userId.toString();
        const chatObjectId = new ObjectId(chatId);
        const result = await messagesCollection.updateMany(
            { chatId: chatObjectId, readBy: { $nin: [userIdStr] } },
            { $addToSet: { readBy: userIdStr } }
        );
        console.log(`Marked ${result.modifiedCount} messages as read by ${userIdStr} in chat ${chatId}`);

        io.to(`user-${userIdStr}`).emit('getUnreadMessages', userIdStr);

    } catch (err) {
        console.error('Error marking messages as read:', err);
    }
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