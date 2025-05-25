<div class="modal" id="register-modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modal-title">Register</h2>
            <button class="close-btn" onclick="closeRegisterModal()">×</button>
        </div>

        <form id="student-form" method="POST" action="{{ route('students.store') }}">
            @csrf
            <input type="hidden" name="_method" value="POST" id="form-method">

            <div class="register-inut">
                <input type="hidden" id="student-id" name="id">

                <!-- Username -->
                <div>
                    <label for="login-username">Username</label>
                    <input type="text" id="login-username" name="username" required>
                </div>

                <!-- Password -->
                <div>
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" name="password" required>
                </div>

                <div class="two-inputs">
                     <!-- First Name -->
                    <div>
                        <label for="first-name">First Name</label>
                        <input type="text" id="first-name" name="first-name" required>
                    </div>

                <!-- Last Name -->
                    <div>
                        <label for="last-name">Last Name</label>
                        <input type="text" id="last-name" name="last-name" required>
                    </div>
                </div>

               <div class="two-inputs">
                     <!-- Gender -->
                <div>
                    <label for="gender">Gender</label>
                    <select id="gender" name="gender" required>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>
                </div>

                <!-- Birthday -->
                    <div>
                        <label for="birthday">Birthday</label>
                        <input type="date" id="birthday" name="birthday" required>
                    </div>
                </div>

    

                

                

                <!-- Group -->
                <div>
                    <label for="group">Group</label>
                    <select id="group" name="group" required>
                        <option value="PZ-21">PZ-21</option>
                        <option value="PZ-22">PZ-22</option>
                        <option value="PZ-23">PZ-23</option>
                        <option value="PZ-24">PZ-24</option>
                        <option value="PZ-25">PZ-25</option>
                        <option value="PZ-26">PZ-26</option>
                    </select>
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="cancel-btn" onclick="closeRegisterModal()">Cancel</button>
                <button type="submit" class="create-btn" id="submit-btn">Register</button>
            </div>
        </form>
    </div>
</div>
