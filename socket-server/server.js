// C:\Users\Ira\Herd\pvi_site\socket-server\server.js

require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); // Import ObjectId
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors'); // For handling CORS with Express/Socket.io

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

let db; // Variable to hold the database object
let usersCollection; // MongoDB collection for chat users
let chatsCollection; // MongoDB collection for chats
let messagesCollection; // MongoDB collection for messages

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
        await connectDB(); // Ensure DB is connected first

        console.log("Database connection established. Starting application services...");

        const app = express();
        const server = http.createServer(app);

        // Configure CORS for Socket.io and Express
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'; // Your Vite dev server URL

        app.use(cors({
            origin: FRONTEND_URL,
            methods: ['GET', 'POST'],
            credentials: true // Allow cookies/session if needed for Laravel auth
        }));

        const io = new socketIo.Server(server, { // Use new socketIo.Server syntax
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

            let currentUserId = null; // To store the MySQL student ID for this socket
            let currentUserLoginName = null; // To store the login name

            // Event: 'userConnected' - Sent by client AFTER they know their login info
            // This is crucial for linking a socket.id to a MySQL user ID
            socket.on('userConnected', async (userData) => {
                // userData should contain { mysqlUserId: '...', loginName: '...', name: '...', lastname: '...' }
                if (!userData || !userData.mysqlUserId || !userData.loginName) {
                    console.warn('Received userConnected without required data:', userData);
                    socket.disconnect(true); // Disconnect invalid connections
                    return;
                }

                currentUserId = userData.mysqlUserId;
                currentUserLoginName = userData.loginName;

                // Update or create user in MongoDB chat_users collection
                await usersCollection.updateOne(
                    { mysqlUserId: currentUserId },
                    {
                        $set: {
                            socketId: socket.id,
                            loginName: currentUserLoginName,
                            name: userData.name, // Store full name for display
                            lastname: userData.lastname,
                            status: 'online',
                            lastActive: new Date()
                        },
                        $setOnInsert: { createdAt: new Date() } // Only set on first insert
                    },
                    { upsert: true } // Create if not exists, update if exists
                );
                console.log(`User ${currentUserLoginName} (ID: ${currentUserId}) connected with socket ${socket.id}`);

                // Join a room specific to this user for private notifications/chats
                socket.join(`user-${currentUserId}`);

                // Inform all connected clients about user's online status
                io.emit('userStatusUpdate', { mysqlUserId: currentUserId, status: 'online' });

                // Fetch and send list of available chats to the connected user
                const userChats = await chatsCollection.find({ participants: currentUserId }).toArray();
                socket.emit('chatsList', userChats); // Send list of chats this user is in

                // You might also want to fetch all students (users) for the "create new chat" functionality
                const allStudents = await usersCollection.find({}, { projection: { mysqlUserId: 1, loginName: 1, name: 1, lastname: 1, status: 1 } }).toArray();
                socket.emit('allStudents', allStudents);
            });


            // Event: 'createChat' - User wants to start a new chat
            socket.on('createChat', async (data) => {
                // data should contain { participants: ['mysqlUserId1', 'mysqlUserId2', ...], type: 'group' | 'private', name: 'Optional Group Name' }
                // Make sure currentUserId is always included as a participant
                if (!currentUserId || !data.participants || !Array.isArray(data.participants) || data.participants.length < 1) {
                    socket.emit('chatError', 'Invalid chat creation request.');
                    return;
                }

                // Ensure the current user is always a participant
                const uniqueParticipants = [...new Set([...data.participants, currentUserId])];

                // For private chats, ensure only two participants
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
                    // Generate a name for private chat based on participants
                    const otherParticipantId = uniqueParticipants.find(p => p !== currentUserId);
                    const otherUser = await usersCollection.findOne({ mysqlUserId: otherParticipantId });
                    const currentUser = await usersCollection.findOne({ mysqlUserId: currentUserId });
                    if(otherUser && currentUser) {
                       chatName = `${currentUser.loginName} & ${otherUser.loginName}`;
                    } else {
                       chatName = `Private Chat (${uniqueParticipants.join(', ')})`;
                    }
                }

                // Check if chat already exists (especially for private chats)
                const existingChat = await chatsCollection.findOne({
                    type: data.type,
                    participants: { $size: uniqueParticipants.length, $all: uniqueParticipants }
                });

                if (existingChat) {
                    socket.emit('chatError', 'Chat already exists.');
                    socket.emit('chatCreated', existingChat); // Send back existing chat
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

                // Inform all participants of the new chat
                uniqueParticipants.forEach(participantId => {
                    io.to(`user-${participantId}`).emit('chatCreated', newChat); // Send to all participants
                });

                console.log(`Chat created: ${newChat._id} with participants: ${uniqueParticipants.join(', ')}`);
            });


            // Event: 'joinChat' - User wants to open a specific chat and get history
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

                socket.join(chatId); // Join the Socket.io room for this chat
                console.log(`User ${currentUserLoginName} joined chat room: ${chatId}`);

                // Fetch chat history
                const history = await messagesCollection.find({ chatId: chatObjectId })
                                                     .sort({ timestamp: 1 })
                                                     .limit(100) // Limit history to 100 messages
                                                     .toArray();
                socket.emit('chatHistory', { chatId: chatId, messages: history });
            });


            // Event: 'sendMessage' - User sends a message
            socket.on('sendMessage', async (data) => {
                // data should contain { chatId: '...', message: '...' }
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
                    readBy: [currentUserId] // Sender has read it by default
                };

                const result = await messagesCollection.insertOne(newMessage);
                newMessage._id = result.insertedId; // Add generated _id to the message

                // Update chat's last message time
                await chatsCollection.updateOne(
                    { _id: chatObjectId },
                    { $set: { updatedAt: new Date(), lastMessageSnippet: data.message.substring(0, 50) } }
                );

                // Emit the message to all participants in that chat room
                io.to(data.chatId).emit('newMessage', newMessage); // Broadcast new message

                // Also notify other participants if they are not in this chat room
                chat.participants.forEach(participantId => {
                    if (participantId !== currentUserId) { // Don't notify sender
                        // Check if the other participant is currently connected to the server
                        // This is a simplified check, full solution might need more sophisticated tracking
                        const participantSocketId = usersCollection.findOne({ mysqlUserId: participantId, status: 'online' }).then(user => user ? user.socketId : null);
                        
                        if (participantSocketId && io.sockets.adapter.rooms.get(data.chatId)?.has(participantSocketId)) {
                            // User is online AND in the same chat room, no need for bell animation (as per requirement)
                            // Do nothing or send a silent update
                        } else if (participantSocketId) {
                            // User is online but in a different chat or not on messages page, trigger bell/notification
                            io.to(`user-${participantId}`).emit('newNotification', {
                                chatId: data.chatId,
                                sender: currentUserLoginName, // Or full name
                                snippet: data.message.substring(0, 50) + '...',
                                type: 'message'
                            });
                        }
                    }
                });

                console.log(`Message sent in chat ${data.chatId} by ${currentUserLoginName}: ${data.message}`);
            });


            // Event: 'disconnect'
            socket.on('disconnect', async () => {
                if (currentUserId) {
                    console.log(`User ${currentUserLoginName} (ID: ${currentUserId}) disconnected from socket ${socket.id}`);
                    // Update user status to offline in MongoDB
                    await usersCollection.updateOne(
                        { mysqlUserId: currentUserId },
                        { $set: { status: 'offline', socketId: null, lastActive: new Date() } }
                    );
                    // Inform all connected clients about user's offline status
                    io.emit('userStatusUpdate', { mysqlUserId: currentUserId, status: 'offline' });
                } else {
                    console.log('An unauthenticated user disconnected:', socket.id);
                }
            });

            // Handle errors
            socket.on('error', (err) => {
                console.error('Socket error:', err);
            });
        });

        // =======================================================
        // Express Routes (Optional, e.g., for API if needed)
        // =======================================================
        app.get('/api/users/online', async (req, res) => {
            try {
                const onlineUsers = await usersCollection.find({ status: 'online' }, { projection: { mysqlUserId: 1, loginName: 1, name: 1, lastname: 1 } }).toArray();
                res.json(onlineUsers);
            } catch (error) {
                console.error('Error fetching online users:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        // You might add more API routes here if your Laravel frontend needs to fetch
        // initial data or perform non-realtime operations from Node.js (e.g., getting a list of all students)

        // Start your HTTP server
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Node.js Chat Server listening on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start application services:", error);
        process.exit(1);
    }
}

// Start the entire application
startApplication();