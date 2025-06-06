
import { io } from 'socket.io-client'; 

const SOCKET_SERVER_URL = 'http://localhost:3000'; 

const socket = io(SOCKET_SERVER_URL);
let currentChatId = null; 
let availableStudents = []; 
let selectedParticipants = new Set(); 
let activeChats = [];

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
const addParticipantBtn = document.getElementById('add-participant-btn'); 
const addParticipantModal = document.getElementById('add-participant-modal');
const availableParticipantsDiv = document.getElementById('available-participants-for-add'); 
const confirmAddParticipantsBtn = document.getElementById('confirm-add-participants-btn');
const cancelAddParticipantsBtn = document.getElementById('cancel-add-participants-btn'); 

socket.on('connect', () => {
    console.log('Connected to chat server!', socket.id);
    socket.emit('userConnected', {
        mysqlUserId: currentUser.mysqlUserId,
        loginName: currentUser.loginName,
        name: currentUser.name,
        lastname: currentUser.lastname
    });
    socket.emit('requestChatsList', currentUser.mysqlUserId); 
    socket.emit('getUnreadMessages', currentUser.mysqlUserId); 
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
    activeChats = chats; 

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
                
                console.warn(`User details not found for ID: ${otherParticipantId}. Displaying generic name.`);
                displayName = `Unknown User`; 
            }
        }
        chatItem.textContent = displayName;
        chatItem.addEventListener('click', () => joinChat(chat._id, displayName));
        chatsList.appendChild(chatItem);
    });
});







socket.on('participantsAdded', (data) => {
    console.log('Participants added to chat:', data);
    socket.emit('getChatsList', currentUser.mysqlUserId); 

    if (data.chatId === currentChatId) {
        setTimeout(() => {
            const updatedChat = activeChats.find(chat => chat._id === currentChatId);
            if (updatedChat) {
                joinChat(updatedChat._id, updatedChat.name);
            }
        }, 100); 
    }
    alert(`Participants added to chat ${data.chatId}!`);
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
        if (plane) plane.classList.add('animate');
        const notificationCircle = document.getElementById('notification-circle');
        if (notificationCircle) notificationCircle.style.opacity = 1;
        const notificationsContainer = document.querySelector('.notifications');
        if (notificationsContainer) notificationsContainer.classList.add('no-hover');

         setTimeout(() => {
            if (plane) plane.classList.remove('animate');
        }, 500);

         setTimeout(() => {
            if (notificationsContainer) notificationsContainer.classList.remove('no-hover');
        }, 750);
    }

});

socket.on('refreshMyChatsList', () => {
    console.log('[Client] Received request to refresh chats list from server.');
    socket.emit('requestChatsList', currentUser.mysqlUserId);
});

socket.on('newNotification', (notification) => {
    if (notification.chatId !== currentChatId) {
    console.log('Notification received:', notification);

         const plane = document.querySelector('.plane-icon'); 
        if (plane) plane.classList.add('animate');
         const notificationCircle = document.getElementById('notification-circle');
        if (notificationCircle) notificationCircle.style.opacity = 1;
        const notificationsContainer = document.querySelector('.notifications');
         if (notificationsContainer) notificationsContainer.classList.add('no-hover');

        setTimeout(() => {
            if (plane) plane.classList.remove('animate');
        }, 500);

        setTimeout(() => {
             if (notificationsContainer) notificationsContainer.classList.remove('no-hover');
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
    const isSent = message.senderId === currentUser.mysqlUserId;
    messageElement.classList.add('message-item', isSent ? 'sent' : 'received');

    let senderDisplayName = isSent ? `${currentUser.name} ${currentUser.lastname} (You)` : message.senderId;

    if (!isSent) {
        const senderUser = availableStudents.find(s => s.mysqlUserId === message.senderId);
        if (senderUser) {
            senderDisplayName = `${senderUser.name} ${senderUser.lastname}`;
        }
    }

    const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageElement.innerHTML = `
        <strong>${senderDisplayName}</strong>
        <div>${message.message}</div>
        <span class="timestamp">${timestamp}</span>
    `;

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

     socket.emit('markMessagesAsRead', {
         chatId: chatId,
         userId: currentUser.mysqlUserId
     });


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

addParticipantBtn.addEventListener('click', () => {
    openAddParticipantModal();
});

confirmAddParticipantsBtn.addEventListener('click', () => {
    confirmAddParticipants();
});

cancelAddParticipantsBtn.addEventListener('click', () => {
    closeAddParticipantModal();
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


function openAddParticipantModal() {
    if (!currentChatId) {
        alert('Please select a chat first.');
        return;
    }
    addParticipantModal.style.display = 'block';
    selectedParticipants.clear(); 
    renderAvailableParticipantsForAdd();
}

function closeAddParticipantModal() {
    addParticipantModal.style.display = 'none';
    selectedParticipants.clear();
}

function renderAvailableParticipantsForAdd() {
    availableParticipantsDiv.innerHTML = '<h4>Select Participants to Add:</h4>';


    const currentChat = activeChats.find(chat => chat._id === currentChatId);

    if (!currentChat) {
        availableParticipantsDiv.innerHTML += '<p>Error: Could not find current chat participants.</p>';
        return;
    }

    const existingParticipantIds = new Set(currentChat.participants);

    const nonParticipants = availableStudents.filter(s => !existingParticipantIds.has(s.mysqlUserId));

    if (nonParticipants.length === 0) {
        availableParticipantsDiv.innerHTML += '<p>No new students available to add to this chat.</p>';
        return;
    }

    nonParticipants.forEach(student => {
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `add-student-${student.mysqlUserId}`;
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
        label.htmlFor = `add-student-${student.mysqlUserId}`;
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
        availableParticipantsDiv.appendChild(div);
    });
}

function confirmAddParticipants() {
    const participantsToAdd = Array.from(selectedParticipants);

    if (participantsToAdd.length === 0) {
        alert('Please select at least one participant to add.');
        return;
    }

    if (!currentChatId) {
        alert('No chat selected to add participants to.');
        return;
    }

    socket.emit('addParticipantsToChat', {
        chatId: currentChatId,
        newParticipantIds: participantsToAdd
    });

    closeAddParticipantModal();
}