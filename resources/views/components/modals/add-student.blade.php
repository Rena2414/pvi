<div class="modal" id="add-modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modal-title">Add Student</h2> 
            <button class="close-btn" onclick="closeAddModal()">×</button>
        </div>
        <form id="student-form" method="POST">
            @csrf
            <input type="hidden" name="_method" value="POST" id="form-method">
            <input type="hidden" name="mode" id="mode" value="">
            <div class="modal-body">
                <input type="hidden" id="student-id" name="id">
                
                <div>
                    <label for="group">Group</label>
                    <select id="group" name="group">
                        <option value="PZ-21">PZ-21</option>
                        <option value="PZ-22">PZ-22</option>
                        <option value="PZ-23">PZ-23</option>
                        <option value="PZ-24">PZ-24</option>
                        <option value="PZ-25">PZ-25</option>
                        <option value="PZ-26">PZ-26</option>
                    </select>
                </div>

                <div>
                    <label for="first-name">First Name</label>
                    <input type="text" id="first-name" name="first-name">
                </div>
                @error('first-name')
                    <div class="error-message">{{ $message }}</div>
                @enderror
                <div>
                    <label for="last-name">Last Name</label>
                    <input type="text" id="last-name" name="last-name">
                </div>
                @error('last-name')
                    <div class="error-message">{{ $message }}</div>
                @enderror
                <div class="error-message" id="last-name-error" style="color:red; font-size:0.9em;"></div>
                <div>
                    <label for="gender">Gender</label>
                    <select id="gender" name="gender">
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>
                </div>

                <div>
                    <label for="birthday">Birthday</label>
                    <input type="date" id="birthday" name="birthday">
                </div>

                @if ($errors->has('register'))
                    <div class="error-message">
                        {{ $errors->first('register') }}
                    </div>
                @endif
            </div>

            <div class="modal-footer">
                <button type="button" class="cancel-btn" onclick="closeAddModal()">Cancel</button>
                <button type="submit" class="create-btn" id="submit-btn">Create</button>
            </div>
        </form>
    </div>
</div>
