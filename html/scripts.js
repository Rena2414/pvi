document.addEventListener("DOMContentLoaded", function () {
    const modal = document.querySelector(".modal");
    const plusButton = document.querySelector(".plus-button");
    const closeModalBtn = document.querySelector(".close-btn");
    const createBtn = document.querySelector(".create-btn");
    const studentsTable = document.querySelector("tbody");

    let isEditing = false; // Flag to track whether we are editing or adding
    let currentRow = null; // Track the row being edited

    // Function to add event listeners to all rows
    function addEventListenersToRows() {
        const rows = studentsTable.querySelectorAll("tr");
        rows.forEach(row => addRowEventListeners(row));
    }

    // Open Modal
    plusButton.addEventListener("click", function () {
        isEditing = false; // Reset to 'add' mode
        modal.querySelector("h2").textContent = "Add Student"; // Change header to "Add Student"
        modal.style.display = "flex"; // Show the modal
    });

    // Close Modal
    closeModalBtn.addEventListener("click", function () {
        modal.style.display = "none"; // Hide the modal
    });

    // Add or Edit Student
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

        if (isEditing) {
            // Edit existing student
            currentRow.innerHTML = `
                <td><input type="checkbox"></td>
                <td>${group}</td>
                <td>${firstName} ${lastName}</td>
                <td>${gender}</td>
                <td>${birthday}</td>
                <td><span class="status-circle green-status"></span></td>
                <td>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;
            addRowEventListeners(currentRow); // Reattach event listeners
        } else {
            // Add new student
            const newRow = document.createElement("tr");
            newRow.innerHTML = `
                <td><input type="checkbox"></td>
                <td>${group}</td>
                <td>${firstName} ${lastName}</td>
                <td>${gender}</td>
                <td>${birthday}</td>
                <td><span class="status-circle green-status"></span></td>
                <td>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;
            studentsTable.appendChild(newRow);
            addRowEventListeners(newRow); // Attach event listeners to new row
        }

        modal.style.display = "none"; // Close modal

        // Clear form fields after submission
        document.getElementById("first-name").value = "";
        document.getElementById("last-name").value = "";
        document.getElementById("birthday").value = "";
    });

    // Close modal when clicking outside
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Function to add event listeners for edit and delete buttons
    function addRowEventListeners(row) {
        const editBtn = row.querySelector(".edit-btn");
        const deleteBtn = row.querySelector(".delete-btn");

        editBtn.addEventListener("click", function () {
            isEditing = true; // Set to 'edit' mode
            currentRow = row; // Store the current row for editing
            modal.querySelector("h2").textContent = "Edit Student"; // Change header to "Edit Student"

            // Pre-populate modal fields with current row data
            document.getElementById("group").value = row.cells[1].textContent;
            const fullName = row.cells[2].textContent.split(" ");
            document.getElementById("first-name").value = fullName[0];
            document.getElementById("last-name").value = fullName[1];
            document.getElementById("gender").value = row.cells[3].textContent.toLowerCase();
            document.getElementById("birthday").value = row.cells[4].textContent;

            modal.style.display = "flex"; // Show the modal
        });

        deleteBtn.addEventListener("click", function () {
            row.remove(); // Remove the row
        });
    }

    // Add event listeners to all existing rows on page load
    addEventListenersToRows();
});
