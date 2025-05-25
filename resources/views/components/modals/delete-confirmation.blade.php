<div id="delete-confirmation-modal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <button class="close-btn" onclick="closeDeleteModal()">
                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
                </svg>
            </button>
            <h3 id="delete-modal-title">Confirm Deletion</h3>
        </div>
        <p id="delete-modal-text"></p>
        <div class="modal-footer">
            <button class="delete-cancel-btn" onclick="closeDeleteModal()">Cancel</button>
            <button class="delete-confirm-btn" onclick="confirmDelete()">OK</button>
        </div>
    </div>
</div>
