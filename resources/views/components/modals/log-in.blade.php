<div class="modal" id="login-modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Log In</h2>
            <button class="close-btn" onclick="closeLoginModal()">×</button>
        </div>

        <form id="login-form" method="POST" action="/login">
            @csrf
            <div class="modal-body">
                <div>
                    <label for="login-username">Username</label>
                    <input type="text" id="login-username" name="username" required>
                </div>

                <div>
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" name="password" required>
                </div>
                @if ($errors->has('login'))
                <div class="error-message">
                {{ $errors->first('login') }}
                </div>
                @endif
            </div>


            <div class="modal-footer">
                <button type="button" class="cancel-btn" onclick="closeLoginModal()">Cancel</button>
                <button type="submit" class="log-in-btn-modal">Log In</button>
                
                <div class="text-center mt-2">
                    <button type="button" class="register-btn" onclick="openRegisterModal()">Don't have an account? Register</button>
                </div>
            </div>
        </form>

    </div>
</div>


