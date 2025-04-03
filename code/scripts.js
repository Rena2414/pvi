let studentsToDelete = [];

//Function for the delete button
//If we pick one student than text would be that students name
//If there are more than 1 student, no names will be shown
function showDeleteModal() {
    const modal = document.getElementById("delete-confirmation-modal");
    const modalText = document.getElementById("delete-modal-text");

    if (studentsToDelete.length === 1) {
        const studentName = studentsToDelete[0].querySelector("td:nth-child(3)").textContent.trim();
        modalText.textContent = `Do you really want to delete ${studentName}?`;
    } else {
        modalText.textContent = "Do you really want to delete students?";
    }

    modal.style.display = "flex"; 
}

//function to close delete modal window
function closeDeleteModal() {
    document.getElementById("delete-confirmation-modal").style.display = "none";
    studentsToDelete = []; 
}

//function to confirm deletion of students
function confirmDelete() {
    studentsToDelete.forEach(row => row.remove());
    closeDeleteModal();
}

//close add/edit student modal
function closeModal() {
    document.querySelector(".modal").style.display = "none";
}

//open add/close student modal
function openModal() {
    document.querySelector(".modal").style.display = "block";
}


document.addEventListener("DOMContentLoaded", function () {
    const modal = document.querySelector(".modal");
    const openModalBtn = document.querySelector(".plus-button");
    const closeModalBtn = document.querySelector(".close-btn");
    const DelcloseModalBtn = document.querySelector(".Delclose-btn");
    const createBtn = document.querySelector(".create-btn");
    const studentsTable = document.querySelector("tbody");
    const selectAllCheckbox = document.querySelector("thead input[type='checkbox']"); 
    const checkboxes = document.querySelectorAll("tbody input[type='checkbox']");



    //select all checkbox logic
    const tableCheckboxes = document.querySelectorAll("table td input[type='checkbox']");

    function updateSelectAllCheckbox() {
        selectAllCheckbox.checked = [...tableCheckboxes].every(checkbox => checkbox.checked);
    }

    tableCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", updateSelectAllCheckbox);
    });

    //close delete modal window
    DelcloseModalBtn.addEventListener("click", function () {
        closeDeleteModal();
    });

    // Function to update studentsToDelete based on checked checkboxes
    function updateStudentsToDelete() {
        const checkedRows = document.querySelectorAll("tbody input[type='checkbox']:checked");
        if (checkedRows.length > 0) {
            studentsToDelete = Array.from(checkedRows).map(checkbox => checkbox.closest('tr'));
        } else {
            studentsToDelete = [];
        }
    }

    // Attach event listener to the tbody to handle dynamically added checkboxes
    document.querySelector('tbody').addEventListener('change', function(e) {
        if (e.target && e.target.type === 'checkbox') {
            updateStudentsToDelete();
     }
    });
 
    // Open Modal window for adding student
    openModalBtn.addEventListener("click", function () {
        modal.style.display = "flex"; 
    });

    // Close Modal window
    closeModalBtn.addEventListener("click", function () {
        modal.style.display = "none"; 
    });

    
    // Close modal when clicking outside
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
    
    //adding event listeners to all existing rows
    function addEditButtonEventListeners() {
        const rows = document.querySelectorAll("tbody tr"); 
    
        rows.forEach(function (row) {
            const editButton = row.querySelector(".edit-btn");
            if (editButton) {
                editButton.addEventListener("click", function () {
                    const firstName = row.querySelector("td:nth-child(3)").innerText.split(" ")[0]; 
                    const lastName = row.querySelector("td:nth-child(3)").innerText.split(" ")[1]; 
                    document.getElementById("first-name").value = firstName;
                    document.getElementById("last-name").value = lastName;
                    modal.style.display = "flex";
                    document.querySelector(".modal-header h2").innerText = "Edit Student";
                });
            }
        });
    }

    function addDeleteButtonEventListeners() {
        const rows = document.querySelectorAll("tbody tr"); 
    
        rows.forEach(function (row) {
            const deleteButton = row.querySelector(".delete-btn"); 
            if (deleteButton) {
                deleteButton.addEventListener("click", function () { 
                    if (selectAllCheckbox.checked) {
                        studentsToDelete = Array.from(document.querySelectorAll("tbody tr"));
                        showDeleteModal();
                    } else {
                        const checkedRows = document.querySelectorAll("tbody input[type='checkbox']:checked");
                        if (checkedRows.length > 0) {
                            studentsToDelete = Array.from(checkedRows).map(checkbox => checkbox.closest('tr'));
                            showDeleteModal();
                        }
                    }
                });
            }
        });
    }

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
                <button class="edit-btn" disabled></button>
                <button class="delete-btn" disabled></button>
            </td>
        `;

        studentsTable.appendChild(newRow);
        addRowEventListeners(newRow);
        addCheckboxEventListeners(); 


        modal.style.display = "none";
        document.getElementById("first-name").value = "";
        document.getElementById("last-name").value = "";
        document.getElementById("birthday").value = "";

    });

    // Check/uncheck checkboxes depending on selectAllcheckbox
    selectAllCheckbox.addEventListener("change", function () {
        const isChecked = selectAllCheckbox.checked;
        document.querySelectorAll("tbody input[type='checkbox']").forEach(checkbox => checkbox.checked = isChecked);
        toggleEditDeleteButtons(); 
    });

    // Uncheck select all checkbox if one checkbox gets unchecked
    function handleCheckboxChange() {
        if (this.checked === false) {
            selectAllCheckbox.checked = false; 
        }
        toggleEditDeleteButtons(); 
    }

    // Attach checkbox event listeners to all checkboxes
    function addCheckboxEventListeners() {
        document.querySelectorAll("tbody input[type='checkbox']").forEach(checkbox => {
            checkbox.removeEventListener("change", handleCheckboxChange); 
            checkbox.addEventListener("change", handleCheckboxChange); 
        });
    }

    
// Function to toggle edit and delete buttons based on checkbox state
function toggleEditDeleteButtons() {
    const selectedCheckboxes = document.querySelectorAll("tbody input[type='checkbox']:checked");
    const editButtons = document.querySelectorAll(".edit-btn");

    if (selectedCheckboxes.length > 1 || selectAllCheckbox.checked) {
        editButtons.forEach(button => button.disabled = true);
    } else {
        editButtons.forEach(button => button.disabled = false);
    }

    // For each row, enable/disable delete button based on checkbox state
    document.querySelectorAll("tbody tr").forEach((row) => {
        const checkbox = row.querySelector("input[type='checkbox']");
        const deleteBtn = row.querySelector(".delete-btn");
        const editBtn = row.querySelector(".edit-btn");
        if (checkbox.checked) {
            deleteBtn.disabled = false; 
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

    // Adding event listeners to new row
    function addRowEventListeners(row) {
        const editBtn = row.querySelector(".edit-btn");
        const deleteBtn = row.querySelector(".delete-btn");

        tableCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", updateSelectAllCheckbox);
        });

        editBtn.addEventListener("click", function () {
            const firstName = row.querySelector("td:nth-child(3)").innerText.split(" ")[0]; 
            const lastName = row.querySelector("td:nth-child(3)").innerText.split(" ")[1]; 
            document.getElementById("first-name").value = firstName;
            document.getElementById("last-name").value = lastName;
            modal.style.display = "flex"; 
            document.querySelector(".modal-header h2").innerText = "Edit Student"; 
        });


    deleteBtn.addEventListener("click", function () {
    if (selectAllCheckbox.checked) {
        studentsToDelete = Array.from(document.querySelectorAll("tbody tr"));
        showDeleteModal();
    } else {
        updateStudentsToDelete(); 
        if (studentsToDelete.length > 0) {
            showDeleteModal();
        } else {
            alert("No students selected for deletion.");
        }
    }
});
        document.querySelector(".delete-confirm-btn").addEventListener("click", confirmDelete);
        document.querySelector(".delete-cancel-btn").addEventListener("click", closeDeleteModal);
    }




    addCheckboxEventListeners();
    toggleEditDeleteButtons(); 
    addEditButtonEventListeners();
    addDeleteButtonEventListeners();
});

// Toggle side panel when hamburger menu is clicked
document.querySelector('.hamburger-menu').addEventListener('click', function () {
    document.querySelector('.side-panel').classList.toggle('hidden');
});

//Plane icon interaction function
document.querySelector('.plane-icon').addEventListener('dblclick', function() {
    this.classList.add('animate');
    document.getElementById('notification-circle').style.opacity = 1;
    document.querySelector('.notifications').classList.add('no-hover');

    setTimeout(() => {
        this.classList.remove('animate');
    }, 500);

    setTimeout(() => {
        document.querySelector('.notifications').classList.remove('no-hover');
    }, 750);
});


let clickTimer = null;

//function to distinguish between click and double click
document.querySelector(".plane-icon").addEventListener("click", function () {
    if (clickTimer) {
        clearTimeout(clickTimer); 
        clickTimer = null;
        return;
    }

    clickTimer = setTimeout(() => {
        document.getElementById('notification-circle').style.opacity = 1;
        window.location.href = "messages.html"; 
        clickTimer = null;
    }, 300); 
});

window.addEventListener('resize', function () {
    const minHeight = 600;
    if (window.innerHeight < minHeight) {
        document.body.style.height = `${minHeight}px`;
    } else {
        document.body.style.height = "auto";
    }
});