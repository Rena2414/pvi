// socket-server/index.js

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

// Configure CORS for Socket.IO
// This is crucial because your Laravel app (e.g., localhost:8000 or my-laravel-site.test)
// will be trying to connect to this Socket.IO server (e.g., localhost:3000).
// Adjust 'http://my-laravel-site.test' to your actual Laravel app URL/domain.
// If you're using `php artisan serve`, it's likely 'http://127.0.0.1:8000' or 'http://localhost:8000'.
// If using Herd, it will be something like 'http://my-laravel-site.test'.
const io = new Server(server, {
  cors: {
    origin: "http://pvi-site.test", // <-- !!! IMPORTANT: Change this to your Laravel app's URL
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

// Basic Express route (optional, but good for testing if the server is running)
app.get('/', (req, res) => {
  res.send('Socket.IO server is running!');
});

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Example: Listen for a 'sendMessage' event from the client
  socket.on('sendMessage', (data) => {
    console.log('Message received:', data);

    // Broadcast the message to all connected clients (or to a specific room later)
    io.emit('newMessage', data); // Emits to all connected sockets
  });

  // Example: Listen for a 'disconnect' event
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});