<x-layout :login-name="$loginName">
    {{-- ... (Your HTML content) ... --}}

    <x-header :login-name="$loginName"></x-header>
    <x-side-panel :login-name="$loginName"> </x-side-panel>

    <div class="main-content">
        <div class="UpperMainCont">
            <h1 class="Labelh1">Messages</h1>
        </div>

        {{-- Main Chat Container --}}
        <div class="chat-container">
            <div class="chat-list">
                <h3>Your Chats</h3>
                <button id="create-new-chat-btn">Create New Chat</button>
                <div id="chats-list">
                    {{-- Chats will be dynamically loaded here --}}
                </div>
            </div>

            <div class="chat-window">
                <h3 id="current-chat-name">Select a Chat</h3>
                <div class="messages-history" id="messages-history">
                    {{-- Messages will be dynamically loaded here --}}
                </div>
                <div class="message-input">
                    <input type="text" id="message-input" placeholder="Type your message...">
                    <button id="send-message-btn">Send</button>
                </div>
            </div>

            {{-- New Chat Modal (simple example) --}}
            <div id="create-chat-modal" style="display: none; border: 1px solid #ccc; padding: 20px; background: white; position: absolute; z-index: 100;">
                <h4>Create New Chat</h4>
                <div id="available-students">
                    {{-- Students for selection will be loaded here --}}
                    <p>Loading students...</p>
                </div>
                <input type="text" id="new-chat-name-input" placeholder="Group chat name (optional)">
                <button id="confirm-create-chat-btn">Create Chat</button>
                <button id="cancel-create-chat-btn">Cancel</button>
            </div>
        </div>
    </div>

    {{-- SCRIPTS SECTION --}}

    {{-- 1. Pass PHP session data to JavaScript (MUST stay here in Blade) --}}
    <script>
        // Pass Laravel variables to JavaScript
        window.chatConfig = {
            csrfToken: "{{ $csrfToken }}",
            loginName: "{{ $loginName ?? '' }}", // Use ?? '' to handle potential nulls
            studentId: "{{ $studentId ?? '' }}",
            studentName: "{{ $studentName ?? '' }}",
            studentLastname: "{{ $studentLastname ?? '' }}"
        };
    </script>

    {{-- 2. Use the @vite directive for your main JS and CSS (will include chat.js via app.js) --}}
    @vite(['resources/css/app.css', 'resources/js/app.js'])

</x-layout>