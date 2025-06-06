import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3000';

const socket = io(SOCKET_SERVER_URL);
let currentChatId = null;
let allUsers = new Map(); 
let activeChats = [];  
let selectedParticipants = new Set(); 


let receivedAllUsersData = false; 
let pendingChatsData = [];        



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
const closeAddParticipantsBtn = document.getElementById('close-add-participants-btn');


document.getElementById('add-participant-btn').style.display = 'none';
document.getElementById('current-chat-name').textContent = 'Select a Chat';


const currentUser = {
    mysqlUserId: window.chatConfig.studentId,
    loginName: window.chatConfig.loginName,
    name: window.chatConfig.studentName,
    lastname: window.chatConfig.studentLastname
};



function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function closeAddParticipantModal() {
    addParticipantModal.style.display = 'none';
    selectedParticipants.clear();
}

function openCreateChatModal() {
    createChatModal.style.display = 'block';
    selectedParticipants.clear();
    newChatNameInput.value = '';
    renderAvailableStudents(); 
}

function closeCreateChatModal() {
    createChatModal.style.display = 'none';
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


function processInitialData() {
    if (receivedAllUsersData && pendingChatsData.length > 0) {
        console.log("[chat.js] Both allUsers and chatsList received. Processing initial data.");

        renderChatsList(pendingChatsData); 
        initializeChatOnPageLoad();

        pendingChatsData = [];

    } else {
        console.log("[chat.js] Waiting for all initial data. receivedAllUsersData:", receivedAllUsersData, "pendingChatsData length:", pendingChatsData.length);
    }
}


function initializeChatOnPageLoad() {
    const initialChatId = getQueryParam('chatId');
    if (initialChatId) {
        console.log(`[Chat.js] Attempting to open chat from URL: ${initialChatId}`);
        const chatToOpen = activeChats.find(chat => chat._id === initialChatId);
        if (chatToOpen) {
            let chatWindowDisplayName = chatToOpen.name;
            if (chatToOpen.type === 'private' && chatToOpen.otherParticipantMySqlId) {
                const otherUser = allUsers.get(chatToOpen.otherParticipantMySqlId);
                if (otherUser) {
                    chatWindowDisplayName = `${otherUser.name} ${otherUser.lastname}`;
                }
            }
            joinChat(initialChatId, chatWindowDisplayName);
        } else {
            console.warn(`[Chat.js] Chat with ID ${initialChatId} not found in active chats.`);
        }
    }
}


socket.on('connect', () => {
    console.log('Connected to chat server!', socket.id);
    socket.emit('userConnected', {
        mysqlUserId: currentUser.mysqlUserId,
        loginName: currentUser.loginName,
        name: currentUser.name,
        lastname: currentUser.lastname
    });
    socket.emit('requestAllUsers');
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

socket.on('allUsersList', (users) => {
    allUsers.clear(); 
    users.forEach(user => {
        allUsers.set(user.mysqlUserId, user); 
    });
    console.log('[chat.js] Updated allUsers map:', allUsers);
    receivedAllUsersData = true; 
    renderAvailableStudents();
    processInitialData(); 
});


socket.on('chatsList', (chats) => {
    console.log('[chat.js] Received chats list:', chats);
    pendingChatsData = chats; 
    processInitialData(); 
});


socket.on('participantsAdded', (data) => {
    console.log('Participants added to chat:', data);
    socket.emit('requestChatsList', currentUser.mysqlUserId); 

    if (data.chatId === currentChatId) {
        setTimeout(() => {
            const updatedChat = activeChats.find(chat => chat._id === currentChatId);
            if (updatedChat) {
                let chatWindowDisplayName = updatedChat.name;
                if (updatedChat.type === 'private' && updatedChat.otherParticipantMySqlId) {
                    const otherUser = allUsers.get(updatedChat.otherParticipantMySqlId);
                    if (otherUser) {
                        chatWindowDisplayName = `${otherUser.name} ${otherUser.lastname}`;
                    }
                }
                joinChat(updatedChat._id, chatWindowDisplayName);
            }
        }, 100);
    }
    alert(`Participants added to chat ${data.chatId}!`);
});

socket.on('chatCreated', (newChat) => {
    console.log('New chat created:', newChat);
    socket.emit('requestChatsList', currentUser.mysqlUserId); 
    closeCreateChatModal();
    
    let displayName = newChat.name;
    if (newChat.type === 'private' && newChat.participants.length === 2) {
        const otherParticipantId = newChat.participants.find(p => p !== currentUser.mysqlUserId);
        const otherUser = allUsers.get(otherParticipantId); 
        if (otherUser) {
            displayName = `${otherUser.name} ${otherUser.lastname}`;
        } else {
            displayName = `Private Chat with ID: ${otherParticipantId}`; 
        }
    }
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
    if (allUsers.has(data.mysqlUserId)) {
        const user = allUsers.get(data.mysqlUserId);
        user.status = data.status; 
        allUsers.set(data.mysqlUserId, user); 
    }
    renderAvailableStudents(); 
    renderChatsList(activeChats); 
    if (currentChatId) {
        const currentChat = activeChats.find(chat => chat._id === currentChatId);
        if (currentChat) {
            joinChat(currentChatId, currentChatName.textContent);
        }
    }
});


function renderChatsList(chatsToRender) {
    chatsList.innerHTML = '';
    activeChats = chatsToRender; 

    chatsToRender.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.dataset.chatId = chat._id;

        let displayHtml = '';
        let chatWindowDisplayName = chat.name || 'Unnamed Chat'; 

        if (chat.type === 'private' && chat.otherParticipantMySqlId) {
            const otherUser = allUsers.get(chat.otherParticipantMySqlId);

            if (otherUser) {
                const isOnline = otherUser.status === 'online';
                const color = isOnline ? 'green' : 'gray';
                const fontWeight = isOnline ? 'bold' : 'normal';
                displayHtml = `<span style="color: ${color}; font-weight: ${fontWeight};">
                                    ${chat.name}
                                </span>`;
                chatWindowDisplayName = `${otherUser.name} ${otherUser.lastname}`; 
            } else {
                console.warn(`User details (for status display) not found in allUsers for ID: ${chat.otherParticipantMySqlId}.`);
                displayHtml = `<span style="color: gray;">${chat.name || 'Unknown User'}</span>`;
                chatWindowDisplayName = chat.name || 'Unknown User';
            }
        } else {
            displayHtml = chat.name || 'Unnamed Group Chat';
            chatWindowDisplayName = chat.name || 'Unnamed Group Chat';
        }

        chatItem.innerHTML = displayHtml;
        chatItem.addEventListener('click', () => joinChat(chat._id, chatWindowDisplayName));
        chatsList.appendChild(chatItem);
    });
    if (currentChatId) {
        const newChatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
        if (newChatItem) newChatItem.classList.add('active-chat');
    }
}


function displayMessage(message) {
    const messageElement = document.createElement('div');
    const isSent = message.senderId === currentUser.mysqlUserId;
    messageElement.classList.add('message-item', isSent ? 'sent' : 'received');

    let senderDisplayName = isSent ? `${currentUser.name} ${currentUser.lastname} (You)` : message.senderId;

    if (!isSent) {
        const senderUser = allUsers.get(message.senderId); 
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

    document.getElementById('add-participant-btn').style.display = 'inline-block';

    const participantsContainer = document.getElementById('chat-participants');
    participantsContainer.innerHTML = ''; 

    const createNameSpan = (name, color, isYou = false) => {
        const span = document.createElement('span');
        span.textContent = isYou ? `${name} (You)` : name;
        span.style.color = color;
        span.style.marginRight = '10px';
        return span;
    };

    participantsContainer.appendChild(createNameSpan(
        `${currentUser.name} ${currentUser.lastname}`,
        'green',
        true
    ));

    const currentChat = activeChats.find(chat => chat._id === currentChatId);
    if (currentChat) {
        currentChat.participants
            .filter(pid => pid !== currentUser.mysqlUserId)
            .forEach(pid => {
                const user = allUsers.get(pid); 
                const name = user ? `${user.name} ${user.lastname}` : 'Unknown';
                const color = user?.status === 'online' ? 'green' : 'gray';
                participantsContainer.appendChild(createNameSpan(name, color));
            });
    }

    const newChatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
    if (newChatItem) newChatItem.classList.add('active-chat');
    document.getElementById('current-chat-name').textContent = chatName;
}

function renderAvailableStudents() {
    availableStudentsDiv.innerHTML = '<h4>Select Participants:</h4>';
    const studentsToDisplay = Array.from(allUsers.values()).filter(s => s.mysqlUserId !== currentUser.mysqlUserId);

    if (studentsToDisplay.length === 0) {
        availableStudentsDiv.innerHTML += '<p>No other students available.</p>';
        return;
    }

    studentsToDisplay.forEach(student => {
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
        if (student.status === 'online') {
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


function renderAvailableParticipantsForAdd() {
    availableParticipantsDiv.innerHTML = '<h4>Select Participants to Add:</h4>';

    const currentChat = activeChats.find(chat => chat._id === currentChatId);

    if (!currentChat) {
        availableParticipantsDiv.innerHTML += '<p>Error: Could not find current chat participants.</p>';
        return;
    }

    const existingParticipantIds = new Set(currentChat.participants);

    const nonParticipants = Array.from(allUsers.values()).filter(s => !existingParticipantIds.has(s.mysqlUserId));

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
        if (student.status === 'online') {
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
    // Always include the current user in the participants array for the server
    participantsArray.push(currentUser.mysqlUserId); 

    if (participantsArray.length === 0 || (participantsArray.length === 1 && participantsArray[0] === currentUser.mysqlUserId)) {
        alert('Please select at least one other participant.');
        return;
    }

    const chatType = participantsArray.length === 2 ? 'private' : 'group'; 

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

closeAddParticipantsBtn.addEventListener('click', () => {
    closeAddParticipantModal();
});

document.addEventListener('DOMContentLoaded', () => {
});