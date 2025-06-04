import { io } from 'socket.io-client'; 

// Make sure to replace with your Node.js server URL if it's different
const SOCKET_SERVER_URL = 'http://localhost:3000'; // The port your Node.js server is listening on
// Initialize Socket.io client
const socket = io(SOCKET_SERVER_URL);
let currentChatId = null; // The ID of the currently active chat
let availableStudents = []; // List of all students from backend
let selectedParticipants = new Set(); // For creating new chats

// Get current user info from Laravel Blade via window.Laravel
// This data is passed from your Blade file and is available globally
const currentUser = {
        mysqlUserId: window.chatConfig.studentId,
        loginName: window.chatConfig.loginName,
        name: window.chatConfig.studentName,       // <--- CHANGED
        lastname: window.chatConfig.studentLastname // <--- CHANGED
};

// --- DOM Elements ---
const chatsList = document.getElementById('chats-list');
const messagesHistory = document.getElementById('messages-history');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const currentChatName = document.getElementById('current-chat-name');
const createNewChatBtn = document.getElementById('create-new-chat-btn');
const createChatModal = document.getElementById('create-chat-modal');
const availableStudentsDiv = document.getElementById('available-students');
const newChatNameInput = document.getElementById('new-chat-name-input');
const confirmCreateChatBtn = document.getElementById('confirm-create-chat-btn');
const cancelCreateChatBtn = document.getElementById('cancel-create-chat-btn');

// --- Socket.io Event Handlers (Client Side) ---

// 1. On successful connection to the Node.js server
socket.on('connect', () => {
    console.log('Connected to chat server!', socket.id);
    // Send user identification to the server
    socket.emit('userConnected', {
        mysqlUserId: currentUser.mysqlUserId,
        loginName: currentUser.loginName,
        name: currentUser.name,       // <--- CHANGED
        lastname: currentUser.lastname // <--- CHANGED
    });
});

socket.on('disconnect', () => {
    console.log('Disconnected from chat server.');
});

socket.on('chatError', (message) => {
    console.error('Chat Error:', message);
    alert('Chat Error: ' + message); // Simple error display
});

// 2. Receive list of user's chats
socket.on('chatsList', (chats) => {
    console.log('Received chats list:', chats);
    chatsList.innerHTML = ''; // Clear existing
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.dataset.chatId = chat._id;
        let displayName = chat.name;
        if (chat.type === 'private' && chat.participants.length === 2) {
            const otherParticipantId = chat.participants.find(p => p !== currentUser.mysqlUserId);
            const otherUser = availableStudents.find(s => s.mysqlUserId === otherParticipantId);
            if (otherUser) {
                displayName = `${otherUser.name} ${otherUser.lastname}`;
            } else {
                displayName = `Private Chat with ID: ${otherParticipantId}`;
            }
        }
        chatItem.textContent = displayName;
        chatItem.addEventListener('click', () => joinChat(chat._id, displayName));
        chatsList.appendChild(chatItem);
    });
});

// 3. Receive new chat creation confirmation
socket.on('chatCreated', (newChat) => {
    console.log('New chat created:', newChat);
    const chatItem = document.createElement('div');
    chatItem.classList.add('chat-item');
    chatItem.dataset.chatId = newChat._id;
    let displayName = newChat.name;
    if (newChat.type === 'private' && newChat.participants.length === 2) {
        const otherParticipantId = newChat.participants.find(p => p !== currentUser.mysqlUserId);
        const otherUser = availableStudents.find(s => s.mysqlUserId === otherParticipantId);
        if (otherUser) {
            displayName = `${otherUser.name} ${otherUser.lastname}`;
        } else {
            displayName = `Private Chat with ID: ${otherParticipantId}`;
        }
    }
    chatItem.textContent = displayName;
    chatItem.addEventListener('click', () => joinChat(newChat._id, displayName));
    chatsList.prepend(chatItem); // Add to top of list
    closeCreateChatModal();
    joinChat(newChat._id, displayName); // Automatically join the new chat with correct name
});

// 4. Receive chat history
socket.on('chatHistory', (data) => {
    if (data.chatId === currentChatId) {
        messagesHistory.innerHTML = ''; // Clear current messages
        data.messages.forEach(msg => displayMessage(msg));
        messagesHistory.scrollTop = messagesHistory.scrollHeight; // Scroll to bottom
    }
});

// 5. Receive new message
socket.on('newMessage', (message) => {
    if (message.chatId === currentChatId) {
        displayMessage(message);
        messagesHistory.scrollTop = messagesHistory.scrollHeight; // Scroll to bottom
    } else {
        console.log('New message in another chat:', message);
        // Implement bell animation/notification logic here
    }
});

// 6. Receive user status updates
socket.on('userStatusUpdate', (data) => {
    console.log('User status update:', data);
    const userElement = document.querySelector(`.user-list-item[data-user-id="${data.mysqlUserId}"]`);
    if (userElement) {
        userElement.classList.remove('online', 'offline');
        userElement.classList.add(data.status);
    }
    renderAvailableStudents(); // Re-render to update status visually
});

// 7. Receive all students (for new chat creation)
socket.on('allStudents', (students) => {
    availableStudents = students.filter(s => s.mysqlUserId !== currentUser.mysqlUserId);
    renderAvailableStudents();
});


// --- Helper Functions ---

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message-item');
    let senderDisplayName = message.senderId === currentUser.mysqlUserId ? 'You' : message.senderId;

    if (message.senderId !== currentUser.mysqlUserId) {
        const senderUser = availableStudents.find(s => s.mysqlUserId === message.senderId);
        if (senderUser) {
            senderDisplayName = `${senderUser.name} ${senderUser.lastname}`;
        }
    } else {
        // --- THIS IS THE CRITICAL CHANGE ---
        senderDisplayName = `${currentUser.name} ${currentUser.lastname} (You)`; // Use currentUser.name and currentUser.lastname
    }

    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    messageElement.innerHTML = `<strong>${senderDisplayName}:</strong> ${message.message} <span class="timestamp">${timestamp}</span>`;
    messagesHistory.appendChild(messageElement);
}


function joinChat(chatId, chatName) {
    if (currentChatId) {
        const prevChatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
        if (prevChatItem) prevChatItem.classList.remove('active-chat');
    }

    currentChatId = chatId;
    currentChatName.textContent = chatName;

    socket.emit('joinChat', chatId);

    const newChatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
    if (newChatItem) newChatItem.classList.add('active-chat');
}


// --- UI Event Listeners ---

sendMessageBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message && currentChatId) {
        socket.emit('sendMessage', { chatId: currentChatId, message: message });
        messageInput.value = '';
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessageBtn.click();
    }
});

createNewChatBtn.addEventListener('click', () => {
    openCreateChatModal();
});

confirmCreateChatBtn.addEventListener('click', () => {
    const chatName = newChatNameInput.value.trim();
    const participantsArray = Array.from(selectedParticipants);
    if (participantsArray.length === 0) {
        alert('Please select at least one participant.');
        return;
    }

    const chatType = participantsArray.length === 1 ? 'private' : 'group';

    socket.emit('createChat', {
        participants: participantsArray,
        type: chatType,
        name: chatName
    });
});

cancelCreateChatBtn.addEventListener('click', () => {
    closeCreateChatModal();
});

function openCreateChatModal() {
    createChatModal.style.display = 'block';
    selectedParticipants.clear();
    newChatNameInput.value = '';
    renderAvailableStudents();
}

function closeCreateChatModal() {
    createChatModal.style.display = 'none';
}

function renderAvailableStudents() {
    availableStudentsDiv.innerHTML = '<h4>Select Participants:</h4>';
    if (availableStudents.length === 0) {
        availableStudentsDiv.innerHTML += '<p>No other students available.</p>';
        return;
    }

    availableStudents.forEach(student => {
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `student-${student.mysqlUserId}`;
        checkbox.value = student.mysqlUserId;
        checkbox.checked = selectedParticipants.has(student.mysqlUserId);

        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedParticipants.add(student.mysqlUserId);
            } else {
                selectedParticipants.delete(student.mysqlUserId);
            }
        });

        const label = document.createElement('label');
        label.htmlFor = `student-${student.mysqlUserId}`;
        label.textContent = `${student.name} ${student.lastname} (${student.loginName})`;
        const statusSpan = document.createElement('span');
        statusSpan.classList.add('user-status');
        if(student.status === 'online') {
            statusSpan.textContent = ' (online)';
            statusSpan.style.color = 'green';
            label.style.fontWeight = 'bold'; // Make online users bold
        } else {
            statusSpan.textContent = ' (offline)';
            statusSpan.style.color = 'gray';
        }
        label.appendChild(statusSpan);

        div.appendChild(checkbox);
        div.appendChild(label);
        availableStudentsDiv.appendChild(div);
    });
}

// --- General UI Script for hamburger menu and notification icon ---
// This part was previously in messages.blade.php
document.addEventListener('DOMContentLoaded', () => {
    // Ensure these elements exist before adding listeners
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const sidePanel = document.querySelector('.side-panel');
    const mainContent = document.querySelector('.main-content');
    const planeIcon = document.querySelector('.plane-icon');
    const notificationCircle = document.getElementById('notification-circle');
    const notificationsContainer = document.querySelector('.notifications');

    if (hamburgerMenu && sidePanel && mainContent) {
        hamburgerMenu.addEventListener('click', function () {
            sidePanel.classList.toggle('hidden');
            mainContent.classList.toggle('shifted');
        });
    }

    if (planeIcon && notificationCircle && notificationsContainer) {
        planeIcon.addEventListener('dblclick', function() {
            this.classList.add('animate');
            notificationCircle.style.opacity = 1;
            notificationsContainer.classList.add('no-hover'); // To temporarily disable hover effects

            setTimeout(() => {
                this.classList.remove('animate');
            }, 500);

            setTimeout(() => {
                notificationsContainer.classList.remove('no-hover');
            }, 750);
        });

        let clickTimer = null;
        planeIcon.addEventListener("click", function () {
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
                return;
            }

            clickTimer = setTimeout(() => {
                notificationCircle.style.opacity = 1;
                window.location.href = "/messages";
                clickTimer = null;
            }, 300);
        });
    }
});