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

            <button id="add-participant-btn">Add Participant</button>

<div id="add-participant-modal" class="modal">
    <div class="modal-content">
        <span class="close-button" onclick="closeAddParticipantModal()">&times;</span>
        <h2>Add Participants to Chat</h2>
        <div id="available-participants-for-add">
            </div>
        <button id="confirm-add-participants-btn">Add Participants</button>
        <button id="cancel-add-participants-btn">Cancel</button>
    </div>
</div>

            <div class="chat-window">
                <h3 id="current-chat-name">Select a Chat</h3>
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

    @vite(['resources/css/app.css', 'resources/js/app.js'])

</x-layout>