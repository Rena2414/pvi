document.addEventListener("DOMContentLoaded", function () {
    const modal = document.querySelector(".modal");
    const openModalBtn = document.querySelector(".plus-button");
    const closeModalBtn = document.querySelector(".close-btn");
    const createBtn = document.querySelector(".create-btn");
    const studentsTable = document.querySelector("tbody");
    const selectAllCheckbox = document.querySelector("thead input[type='checkbox']"); // Header checkbox
    const checkboxes = document.querySelectorAll("tbody input[type='checkbox']"); // All checkboxes in student rows

    // Open Modal for adding student
    openModalBtn.addEventListener("click", function () {
        modal.style.display = "flex"; // Show the modal
    });

    // Close Modal
    closeModalBtn.addEventListener("click", function () {
        modal.style.display = "none"; // Hide the modal
    });


    function addEditButtonEventListeners() {
        const rows = document.querySelectorAll("tbody tr"); // Select all rows in the table
    
        rows.forEach(function (row) {
            const editButton = row.querySelector(".edit-btn"); // Get the edit button in the row
            if (editButton) {
                editButton.addEventListener("click", function () {
                    const firstName = row.querySelector("td:nth-child(3)").innerText.split(" ")[0]; // Extract first name
                    const lastName = row.querySelector("td:nth-child(3)").innerText.split(" ")[1]; // Extract last name
                    document.getElementById("first-name").value = firstName;
                    document.getElementById("last-name").value = lastName;
                    modal.style.display = "flex"; // Open modal with pre-filled data
                    document.querySelector(".modal-header h2").innerText = "Edit Student"; // Change modal header
                });
            }
        });
    }

    addEditButtonEventListeners();


    // Add Student to Table
    createBtn.addEventListener("click", function () {
        const group = document.getElementById("group").value;
        const firstName = document.getElementById("first-name").value.trim();
        const lastName = document.getElementById("last-name").value.trim();
        const gender = document.getElementById("gender").value;
        const birthday = document.getElementById("birthday").value;

        // Validation
        if (!firstName || !lastName || !birthday) {
            alert("Please fill in all fields");
            return;
        }

        // Create new row
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="checkbox"></td>
            <td>${group}</td>
            <td>${firstName} ${lastName}</td>
            <td>${gender}</td>
            <td>${birthday}</td>
            <td><span class="status-circle green-status"></span></td>
            <td>
                <button class="edit-btn" disabled>Edit</button>
                <button class="delete-btn" disabled>Delete</button>
            </td>
        `;

        studentsTable.appendChild(newRow);
        modal.style.display = "none"; // Close modal

        // Clear form fields
        document.getElementById("first-name").value = "";
        document.getElementById("last-name").value = "";
        document.getElementById("birthday").value = "";

        // Attach event listeners to new row
        addRowEventListeners(newRow);
        addCheckboxEventListeners(); // Reattach event listeners for checkboxes
    });

    // Handle "select all" checkbox
    selectAllCheckbox.addEventListener("change", function () {
        const isChecked = selectAllCheckbox.checked;
        document.querySelectorAll("tbody input[type='checkbox']").forEach(checkbox => checkbox.checked = isChecked);
        toggleEditDeleteButtons(); // Update buttons when "select all" is toggled
    });

    // Handle individual checkboxes
    function handleCheckboxChange() {
        if (this.checked === false) {
            selectAllCheckbox.checked = false; // Uncheck "select all" if any checkbox is unchecked
        }
        toggleEditDeleteButtons(); // Update buttons based on checkbox state
    }

    // Attach checkbox event listeners to all checkboxes
    function addCheckboxEventListeners() {
        document.querySelectorAll("tbody input[type='checkbox']").forEach(checkbox => {
            checkbox.removeEventListener("change", handleCheckboxChange); // Remove old event listeners
            checkbox.addEventListener("change", handleCheckboxChange); // Add new event listener
        });
    }

    
// Function to toggle "edit" and "delete" buttons based on checkbox state
function toggleEditDeleteButtons() {
    const selectedCheckboxes = document.querySelectorAll("tbody input[type='checkbox']:checked");
    const editButtons = document.querySelectorAll(".edit-btn");

    if (selectedCheckboxes.length > 1 || selectAllCheckbox.checked) {
        editButtons.forEach(button => button.disabled = true); // Disable edit for all
    } else {
        editButtons.forEach(button => button.disabled = false); // Enable edit for all
    }

    // For each row, enable/disable delete button based on checkbox state
    document.querySelectorAll("tbody tr").forEach((row) => {
        const checkbox = row.querySelector("input[type='checkbox']");
        const deleteBtn = row.querySelector(".delete-btn");
        const editBtn = row.querySelector(".edit-btn");
        // Enable delete button if the checkbox is checked in that row
        if (checkbox.checked) {
            deleteBtn.disabled = false; // Enable delete button for that row
            if (!selectAllCheckbox.checked && selectedCheckboxes.length < 2){
                editBtn.disabled = false;
            }
            
        } else {
            if (!selectAllCheckbox.checked && selectedCheckboxes.length < 2){
                editBtn.disabled = true;
            }
            deleteBtn.disabled = true;
        }
    });
}

    // Delete selected student rows
    document.querySelector(".delete-btn").addEventListener("click", function () {
        document.querySelectorAll("tbody input[type='checkbox']:checked").forEach(checkbox => {
            checkbox.closest('tr').remove();
        });
        toggleEditDeleteButtons(); // Update button states after deletion
    });

    // Edit student function (to be implemented)
    function addRowEventListeners(row) {
        const editBtn = row.querySelector(".edit-btn");
        const deleteBtn = row.querySelector(".delete-btn");

        editBtn.addEventListener("click", function () {
            const firstName = row.querySelector("td:nth-child(3)").innerText.split(" ")[0]; // Extract first name
            const lastName = row.querySelector("td:nth-child(3)").innerText.split(" ")[1]; // Extract last name
            document.getElementById("first-name").value = firstName;
            document.getElementById("last-name").value = lastName;
            modal.style.display = "flex"; // Open modal with pre-filled data
            document.querySelector(".modal-header h2").innerText = "Edit Student"; // Change modal header
        });

        deleteBtn.addEventListener("click", function () {
            /*if(selectAllCheckbox.checked){
                document.querySelectorAll("tbody tr").forEach(function (row) {
                    row.remove(); // Remove each row from the table
                });
            }else{
                    row.remove(); // Remove row from table
            }*/
            document.querySelectorAll("tbody input[type='checkbox']:checked").forEach(function (checkbox) {
                const row = checkbox.closest('tr'); // Find the row that contains the checked checkbox
                row.remove(); // Remove the row from the table
            });

        });
    }

    // Close modal when clicking outside
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Initial call to add checkbox event listeners
    addCheckboxEventListeners();
    toggleEditDeleteButtons(); // Initial button state setup
});

// Toggle side panel when hamburger menu is clicked
document.querySelector('.hamburger-menu').addEventListener('click', function () {
    document.querySelector('.side-panel').classList.toggle('hidden');
});
