import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3000';

const socket = io(SOCKET_SERVER_URL);
let currentChatId = null;
let allUsers = new Map(); // Stores all users for quick ID lookups
let activeChats = [];     // Still needed for currently loaded chats
let selectedParticipants = new Set(); // For creating new chats

// --- NEW: Flags and data storage for initial loading race condition ---
let receivedAllUsersData = false; // Flag to track if allUsersList has been received
let pendingChatsData = [];        // To store chats received before allUsers are ready


// --- UI Element References (no changes here, just for context)
const chatsList = document.getElementById('chats-list');
const messagesHistory = document.getElementById('messages-history');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const currentChatName = document.getElementById('current-chat-name');
const createNewChatBtn = document.getElementById('create-new-chat-btn');
const createChatModal = document.getElementById('create-chat-modal');
const availableStudentsDiv = document.getElementById('available-students'); // Used for new chat modal
const newChatNameInput = document.getElementById('new-chat-name-input');
const confirmCreateChatBtn = document.getElementById('confirm-create-chat-btn');
const cancelCreateChatBtn = document.getElementById('cancel-create-chat-btn');
const addParticipantBtn = document.getElementById('add-participant-btn');
const addParticipantModal = document.getElementById('add-participant-modal');
const availableParticipantsDiv = document.getElementById('available-participants-for-add');
const confirmAddParticipantsBtn = document.getElementById('confirm-add-participants-btn');
const cancelAddParticipantsBtn = document.getElementById('cancel-add-participants-btn');
const closeAddParticipantsBtn = document.getElementById('close-add-participants-btn');

// Initial UI setup
document.getElementById('add-participant-btn').style.display = 'none';
document.getElementById('current-chat-name').textContent = 'Select a Chat';


const currentUser = {
    mysqlUserId: window.chatConfig.studentId,
    loginName: window.chatConfig.loginName,
    name: window.chatConfig.studentName,
    lastname: window.chatConfig.studentLastname
};

// --- Helper Functions ---

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
    renderAvailableStudents(); // Renders students for new chat creation
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
    renderAvailableParticipantsForAdd(); // Renders students for adding to existing chat
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


// --- Core Data Processing Function (Put it here!) ---
function processInitialData() {
    // This function runs every time either 'allUsersList' or 'chatsList' is received.
    // It proceeds only when both dependencies are met.
    if (receivedAllUsersData && pendingChatsData.length > 0) {
        console.log("[chat.js] Both allUsers and chatsList received. Processing initial data.");

        // 1. Render the chat list, which depends on 'allUsers' for status colors
        renderChatsList(pendingChatsData); // Use the stored chats data

        // 2. Initialize (open) a specific chat if a chatId is present in the URL
        initializeChatOnPageLoad();

        // Clear the pending chats data after processing
        pendingChatsData = [];

        // Optional: Reset flags if this logic should only run once on initial load.
        // For initial load, resetting is fine.
        // receivedAllUsersData = false;
    } else {
        console.log("[chat.js] Waiting for all initial data. receivedAllUsersData:", receivedAllUsersData, "pendingChatsData length:", pendingChatsData.length);
    }
}


function initializeChatOnPageLoad() {
    const initialChatId = getQueryParam('chatId');
    if (initialChatId) {
        console.log(`[Chat.js] Attempting to open chat from URL: ${initialChatId}`);
        // Find the chat from activeChats (which is populated by renderChatsList)
        const chatToOpen = activeChats.find(chat => chat._id === initialChatId);
        if (chatToOpen) {
            let chatWindowDisplayName = chatToOpen.name;
            if (chatToOpen.type === 'private' && chatToOpen.otherParticipantMySqlId) {
                const otherUser = allUsers.get(chatToOpen.otherParticipantMySqlId); // Corrected typo here
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


// --- Socket Event Handlers ---

socket.on('connect', () => {
    console.log('Connected to chat server!', socket.id);
    socket.emit('userConnected', {
        mysqlUserId: currentUser.mysqlUserId,
        loginName: currentUser.loginName,
        name: currentUser.name,
        lastname: currentUser.lastname
    });
    // Request all users data first
    socket.emit('requestAllUsers');
    // Request chats list after users are potentially loaded, to handle race condition.
    // It's also fine to request it immediately, as processInitialData will manage it.
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

// IMPORTANT: This handler now populates the `allUsers` Map
socket.on('allUsersList', (users) => {
    allUsers.clear(); // Clear previous data
    users.forEach(user => {
        allUsers.set(user.mysqlUserId, user); // Store users in the Map
    });
    console.log('[chat.js] Updated allUsers map:', allUsers);
    receivedAllUsersData = true; // Set flag
    renderAvailableStudents(); // Re-render modals that depend on user data
    processInitialData(); // Attempt to process initial data
});


socket.on('chatsList', (chats) => {
    console.log('[chat.js] Received chats list:', chats);
    pendingChatsData = chats; // Store the received chats
    processInitialData(); // Attempt to process initial data
});


socket.on('participantsAdded', (data) => {
    console.log('Participants added to chat:', data);
    // Request a refresh of the chats list to update the current chat's participants
    socket.emit('requestChatsList', currentUser.mysqlUserId); 

    // If the currently open chat is the one that was updated, re-join it to refresh its display
    if (data.chatId === currentChatId) {
        // Give a tiny moment for the server to process the chat list update
        // A more robust solution might be a server event that directly updates current chat participants
        setTimeout(() => {
            const updatedChat = activeChats.find(chat => chat._id === currentChatId);
            if (updatedChat) {
                // Re-join using the updated activeChat data for correct name/participants
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
    // Re-request the full chat list to ensure new chat is correctly integrated
    socket.emit('requestChatsList', currentUser.mysqlUserId); 
    closeCreateChatModal();
    
    // Attempt to join the new chat immediately after it's confirmed created
    // The chat list refresh will eventually show it, but this is for immediate UX
    let displayName = newChat.name;
    if (newChat.type === 'private' && newChat.participants.length === 2) {
        const otherParticipantId = newChat.participants.find(p => p !== currentUser.mysqlUserId);
        const otherUser = allUsers.get(otherParticipantId); // Use allUsers map
        if (otherUser) {
            displayName = `${otherUser.name} ${otherUser.lastname}`;
        } else {
            displayName = `Private Chat with ID: ${otherParticipantId}`; // Fallback
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
    // This handler will likely trigger the getUnreadMessages, which is fine.
    // If you want a visual notification for a chat not currently open:
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
    // Update the status in the allUsers Map
    if (allUsers.has(data.mysqlUserId)) {
        const user = allUsers.get(data.mysqlUserId);
        user.status = data.status; // Update status
        allUsers.set(data.mysqlUserId, user); // Re-set the updated user object
    }
    // Re-render anything that depends on user status:
    renderAvailableStudents(); // For modals
    renderChatsList(activeChats); // To update colors in the chat list
    // If the current chat's participants list needs updating:
    if (currentChatId) {
        const currentChat = activeChats.find(chat => chat._id === currentChatId);
        if (currentChat) {
            joinChat(currentChatId, currentChatName.textContent); // Re-run joinChat to update participant list
        }
    }
});

// REMOVED: This specific 'allStudents' handler is now replaced by 'allUsersList'
// socket.on('allStudents', (students) => {
//     availableStudents = students.filter(s => s.mysqlUserId !== currentUser.mysqlUserId);
//     renderAvailableStudents();
// });


// --- Rendering Functions ---

function renderChatsList(chatsToRender) {
    chatsList.innerHTML = '';
    activeChats = chatsToRender; // Update activeChats array for general use

    chatsToRender.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.dataset.chatId = chat._id;

        let displayHtml = '';
        let chatWindowDisplayName = chat.name || 'Unnamed Chat'; // Default to server-provided name

        if (chat.type === 'private' && chat.otherParticipantMySqlId) {
            const otherUser = allUsers.get(chat.otherParticipantMySqlId);

            if (otherUser) {
                const isOnline = otherUser.status === 'online';
                const color = isOnline ? 'green' : 'gray';
                const fontWeight = isOnline ? 'bold' : 'normal';

                // Use the server-provided chat.name (which should now be "Name Lastname" from server.js)
                // If server still sends login names, uncomment the heuristic:
                // let chatName = chat.name;
                // if (chat.name && chat.name.includes('&')) { // Heuristic check if server sent login names
                //     chatName = `${otherUser.name} ${otherUser.lastname}`;
                // }
                // displayHtml = `<span style="color: ${color}; font-weight: ${fontWeight};">${chatName}</span>`;

                // Assuming server.js now provides 'chat.name' correctly for private chats
                displayHtml = `<span style="color: ${color}; font-weight: ${fontWeight};">
                                    ${chat.name}
                                </span>`;
                chatWindowDisplayName = `${otherUser.name} ${otherUser.lastname}`; // Ensure chat window title is correct
            } else {
                console.warn(`User details (for status display) not found in allUsers for ID: ${chat.otherParticipantMySqlId}.`);
                displayHtml = `<span style="color: gray;">${chat.name || 'Unknown User'}</span>`;
                chatWindowDisplayName = chat.name || 'Unknown User';
            }
        } else {
            // For group chats
            displayHtml = chat.name || 'Unnamed Group Chat';
            chatWindowDisplayName = chat.name || 'Unnamed Group Chat';
        }

        chatItem.innerHTML = displayHtml;
        chatItem.addEventListener('click', () => joinChat(chat._id, chatWindowDisplayName));
        chatsList.appendChild(chatItem);
    });
    // Re-apply active chat highlight if a chat is currently open
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
        const senderUser = allUsers.get(message.senderId); // Use allUsers Map here
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
    // Remove highlight from previously active chat
    if (currentChatId) {
        const prevChatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
        if (prevChatItem) prevChatItem.classList.remove('active-chat');
    }

    // Update current chat state
    currentChatId = chatId;
    currentChatName.textContent = chatName;

    socket.emit('joinChat', chatId);
    socket.emit('markMessagesAsRead', {
        chatId: chatId,
        userId: currentUser.mysqlUserId
    });

    // Show the add participant button
    document.getElementById('add-participant-btn').style.display = 'inline-block';

    // Prepare and display participant names
    const participantsContainer = document.getElementById('chat-participants');
    participantsContainer.innerHTML = ''; // Clear previous content

    const createNameSpan = (name, color, isYou = false) => {
        const span = document.createElement('span');
        span.textContent = isYou ? `${name} (You)` : name;
        span.style.color = color;
        span.style.marginRight = '10px';
        return span;
    };

    // Add current user (You)
    participantsContainer.appendChild(createNameSpan(
        `${currentUser.name} ${currentUser.lastname}`,
        'green',
        true
    ));

    // Get the current chat's participants from the activeChats array
    const currentChat = activeChats.find(chat => chat._id === currentChatId);
    if (currentChat) {
        currentChat.participants
            .filter(pid => pid !== currentUser.mysqlUserId)
            .forEach(pid => {
                const user = allUsers.get(pid); // Use allUsers map for participant lookup
                const name = user ? `${user.name} ${user.lastname}` : 'Unknown';
                const color = user?.status === 'online' ? 'green' : 'gray';
                participantsContainer.appendChild(createNameSpan(name, color));
            });
    }


    // Highlight newly active chat
    const newChatItem = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`);
    if (newChatItem) newChatItem.classList.add('active-chat');

    // Update chat name again (for consistency, though already set at the top)
    document.getElementById('current-chat-name').textContent = chatName;
}

// Function to render students for chat creation/adding participants (uses allUsers map)
function renderAvailableStudents() {
    availableStudentsDiv.innerHTML = '<h4>Select Participants:</h4>';
    // Filter out the current user and convert Map values to an array
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

    // Filter available users to only show those not already in the current chat
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


// --- Event Listeners ---
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

    const chatType = participantsArray.length === 2 ? 'private' : 'group'; // Corrected logic: 2 participants means private

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

// --- DOM Content Loaded Listener ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial display of available students will happen when allUsersList is received
    // and processInitialData is called.
    // The initialChatId will also be handled by initializeChatOnPageLoad inside processInitialData.
});