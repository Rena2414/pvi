<x-layout :login-name="$loginName">

    <x-header :login-name="$loginName"></x-header>
    <x-side-panel :login-name="$loginName"> </x-side-panel>

    <div class="main-content">
        <div class="UpperMainCont">
            <h1 class="Labelh1">Messages</h1>
        </div>

        <div class="chat-container">

            <div class="chat-list">
                <h3>Your Chats</h3>
                <button id="create-new-chat-btn">Create New Chat</button>
                <div id="chats-list">

                </div>
            </div>



<div id="add-participant-modal" class="modal">
    <div class="modal-content">
        <span class="close-button" id="close-add-participants-btn">&times;</span>
        <h2>Add Participants to Chat</h2>
        <div id="available-participants-for-add">
            </div>
        <button id="confirm-add-participants-btn">Add Participants</button>
        <button id="cancel-add-participants-btn">Cancel</button>
    </div>
</div>

            <div class="chat-window">
                <div class="chat-header">
                    <div class="chat-title">
                        <h3 id="current-chat-name">Select a Chat</h3>
                        <div id="chat-participants" class="chat-participants"></div>
                    </div>
                    <button id="add-participant-btn">
                        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M9 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4H7Zm8-1a1 1 0 0 1 1-1h1v-1a1 1 0 1 1 2 0v1h1a1 1 0 1 1 0 2h-1v1a1 1 0 1 1-2 0v-1h-1a1 1 0 0 1-1-1Z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
                <div class="messages-history" id="messages-history">

                </div>
                <div class="message-input">
                    <input type="text" id="message-input" placeholder="Type your message...">
                    <button id="send-message-btn">Send</button>
                </div>
            </div>

            <div id="create-chat-modal" style="display: none; border: 1px solid #ccc; padding: 20px; background: white; position: absolute; z-index: 100;">
                <h4>Create New Chat</h4>
                <div id="available-students">

                    <p>Loading students...</p>
                </div>
                <input type="text" id="new-chat-name-input" placeholder="Group chat name (optional)">
                <button id="confirm-create-chat-btn">Create Chat</button>
                <button id="cancel-create-chat-btn">Cancel</button>
            </div>
        </div>
    </div>


    <script>
        window.chatConfig = {
            csrfToken: "{{ $csrfToken }}",
            loginName: "{{ $loginName ?? '' }}", 
            studentId: "{{ $studentId ?? '' }}",
            studentName: "{{ $studentName ?? '' }}",
            studentLastname: "{{ $studentLastname ?? '' }}"
        };
    </script>

    @vite(['resources/css/app.css', 'resources/css/chatImport.css', 'resources/js/app.js'])

</x-layout>