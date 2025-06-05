import { io } from 'socket.io-client'; 

const SOCKET_SERVER_URL = 'http://localhost:3000'; 

const socket = io(SOCKET_SERVER_URL);
let currentChatId = null; 
let availableStudents = []; 
let selectedParticipants = new Set(); 


const currentUser = {
        mysqlUserId: window.chatConfig.studentId,
        loginName: window.chatConfig.loginName,
        name: window.chatConfig.studentName,       
        lastname: window.chatConfig.studentLastname 
};


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


socket.on('connect', () => {
    console.log('Connected to chat server!', socket.id);
    socket.emit('userConnected', {
        mysqlUserId: currentUser.mysqlUserId,
        loginName: currentUser.loginName,
        name: currentUser.name,       
        lastname: currentUser.lastname
    });
});

socket.on('disconnect', () => {
    console.log('Disconnected from chat server.');
});

socket.on('chatError', (message) => {
    console.error('Chat Error:', message);
    alert('Chat Error: ' + message); 
});

socket.on('chatsList', (chats) => {
    console.log('Received chats list:', chats);
    chatsList.innerHTML = ''; 
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
    chatsList.prepend(chatItem); 
    closeCreateChatModal();
    joinChat(newChat._id, displayName); 
});


socket.on('chatHistory', (data) => {
    if (data.chatId === currentChatId) {
        messagesHistory.innerHTML = ''; 
        data.messages.forEach(msg => displayMessage(msg));
        messagesHistory.scrollTop = messagesHistory.scrollHeight; 
    }
});


socket.on('newMessage', (message) => {
    if (message.chatId === currentChatId) {
        displayMessage(message);
        messagesHistory.scrollTop = messagesHistory.scrollHeight; 
    } else {
        console.log('New message in another chat:', message);
        const plane = document.querySelector('.plane-icon');
        plane.classList.add('animate');
        document.getElementById('notification-circle').style.opacity = 1;
        document.querySelector('.notifications').classList.add('no-hover');

        setTimeout(() => {
            plane.classList.remove('animate');
        }, 500);

        setTimeout(() => {
            document.querySelector('.notifications').classList.remove('no-hover');
        }, 750);
    }

    
});

socket.on('newNotification', (notification) => {
    if (notification.chatId !== currentChatId) {
        console.log('Notification received:', notification);

        const plane = document.querySelector('.plane-icon');
        plane.classList.add('animate');
        document.getElementById('notification-circle').style.opacity = 1;
        document.querySelector('.notifications').classList.add('no-hover');

        setTimeout(() => {
            plane.classList.remove('animate');
        }, 500);

        setTimeout(() => {
            document.querySelector('.notifications').classList.remove('no-hover');
        }, 750);
    }
});



socket.on('userStatusUpdate', (data) => {
    console.log('User status update:', data);
    const userElement = document.querySelector(`.user-list-item[data-user-id="${data.mysqlUserId}"]`);
    if (userElement) {
        userElement.classList.remove('online', 'offline');
        userElement.classList.add(data.status);
    }
    renderAvailableStudents(); 
});


socket.on('allStudents', (students) => {
    availableStudents = students.filter(s => s.mysqlUserId !== currentUser.mysqlUserId);
    renderAvailableStudents();
});


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
        senderDisplayName = `${currentUser.name} ${currentUser.lastname} (You)`; 
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
            label.style.fontWeight = 'bold'; 
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

