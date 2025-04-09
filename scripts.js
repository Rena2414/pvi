if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.log("Service Worker registered"))
      .catch((err) => console.error("Service Worker registration failed", err));
  }


let studentsToDelete = [];

let currentId = 4;

/*
function getMaxStudentId() {
    const idCells = document.querySelectorAll("tbody tr td:first-child");
    let maxId = 0;
    idCells.forEach(cell => {
        const id = parseInt(cell.innerText);
        if (!isNaN(id) && id > maxId) {
            maxId = id;
        }
    });
    return maxId;
}
    */
// Function to clear previous errors
function clearErrors() {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.style.borderColor = ""; 
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains("error-message")) {
            errorDiv.textContent = ""; 
            errorDiv.style.display = "none"; 
        }
    });
}


 //function to clear modal fields
 function clearModalFields() {
    document.getElementById("group").value = "PZ-21"; 
    document.getElementById("first-name").value = "";
    document.getElementById("last-name").value = "";
    document.getElementById("gender").value = "M";
    document.getElementById("birthday").value = "";
}

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
    clearErrors(); 
    document.querySelector(".modal").style.display = "none";
}

//open add/close student modal
function openModal() {
    clearErrors();
    clearModalFields();
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
    let editingRow = null;


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
    /*function addEditButtonEventListeners() {
        const rows = document.querySelectorAll("tbody tr"); 
    
        rows.forEach(function (row) {
            const editButton = row.querySelector(".edit-btn");
            if (editButton) {
                editButton.addEventListener("click", function () {
                    const group = row.querySelector("td:nth-child(2)").innerText;
                    const fullName = row.querySelector("td:nth-child(3)").innerText.trim().split(" ");
                    const gender = row.querySelector("td:nth-child(4)").innerText;
                    let birthday = row.querySelector("td:nth-child(5)").innerText;
    
                    // Convert "DD-MM-YYYY" to "YYYY-MM-DD" for input[type="date"]
                    const [day, month, year] = birthday.split("-");
                    birthday = `${year}-${month}-${day}`;
    
                    // Fill the modal inputs
                    document.getElementById("group").value = group;
                    document.getElementById("first-name").value = fullName[0];
                    document.getElementById("last-name").value = fullName[1] || "";
                    document.getElementById("gender").value = gender;
                    document.getElementById("birthday").value = birthday;
    
                    // Open modal in edit mode
                    document.querySelector(".modal-header h2").innerText = "Edit Student";
                    modal.style.display = "flex";
                });
            }
        });
    }*/



        function addEditButtonEventListeners() {
            const rows = document.querySelectorAll("tbody tr");
            clearErrors(); 
            rows.forEach(function (row) {
                const editButton = row.querySelector(".edit-btn");
                if (editButton) {
                    editButton.addEventListener("click", function () {
                        const group = row.querySelector("td:nth-child(2)").innerText;
                        const fullName = row.querySelector("td:nth-child(3)").innerText.trim().split(" ");
                        const gender = row.querySelector("td:nth-child(4)").innerText;
                        let birthday = row.querySelector("td:nth-child(5)").innerText;
                        const studentId = row.querySelector("td:nth-child(8)").innerText;

                        const [day, month, year] = birthday.split("-");
                        birthday = `${year}-${month}-${day}`;
        

                        document.getElementById("group").value = group;
                        document.getElementById("first-name").value = fullName[0];
                        document.getElementById("last-name").value = fullName[1] || "";
                        document.getElementById("gender").value = gender;
                        document.getElementById("birthday").value = birthday;
                        document.getElementById("student-id").value = studentId;
                        editingRow = row;
        
                        document.querySelector(".modal-header h2").innerText = "Edit Student";
                        document.querySelector(".create-btn").innerText = "Save";  // Change button text
                        modal.style.display = "flex";
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

  // Function to show error message and highlight invalid fields
function showError(inputElement, message) {
    const errorDiv = inputElement.nextElementSibling; 
    if (errorDiv && errorDiv.classList.contains("error-message")) {
        inputElement.style.borderColor = "red"; 
        errorDiv.textContent = message; 
        errorDiv.style.color = "red"; 
        errorDiv.style.display = "block"; 
    }
}

/*

// Add Student to Table
createBtn.addEventListener("click", function () {
    let isValid = true;
    let isFilledIn = true;
    clearErrors(); // Clear any previous errors

    const group = document.getElementById("group").value;
    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const gender = document.getElementById("gender").value;
    const birthday = document.getElementById("birthday").value;

    const [year, month, day] = birthday.split("-");
    const formattedBirthday = `${day}-${month}-${year}`;

    // Validate each field
    if (!firstName) {
        showError(document.getElementById("first-name"), "First name is required.");
        isValid = false;
        isFilledIn = false;
    } else if (!/^[A-Z]/.test(firstName)) { // Check if first name starts with a capital letter
        showError(document.getElementById("first-name"), "First name must start with a capital letter.");
        isValid = false;
    }

    if (!lastName) {
        showError(document.getElementById("last-name"), "Last name is required.");
        isValid = false;
        isFilledIn = false;
    }else if (!/^[A-Z]/.test(lastName)) { // Check if last name starts with a capital letter
        showError(document.getElementById("last-name"), "Last name must start with a capital letter.");
        isValid = false;
    }

    if (!birthday) {
        showError(document.getElementById("birthday"), "Birthday is required.");
        isValid = false;
        isFilledIn = false;
    }

    if(! isFilledIn){
        alert("Please fill in all required fields.");
        return; // Do not proceed with row creation
    }

    // If any field is invalid, prevent further execution and show error messages
    if (!isValid) {
        return; // Do not proceed with row creation
    }

    if (editingRow) {
        editingRow.querySelector("td:nth-child(2)").innerText = group;
        editingRow.querySelector("td:nth-child(3)").innerText = `${firstName} ${lastName}`;
        editingRow.querySelector("td:nth-child(4)").innerText = gender;
        editingRow.querySelector("td:nth-child(5)").innerText = formattedBirthday;

        // Optionally, update the status circle or other data here
        // editingRow.querySelector("td:nth-child(6)").innerHTML = `<span class="status-circle green-status"></span>`;

        editingRow = null;  // Reset editingRow to null after updating
    } else {
        // If not editing, create a new row (same logic as before)
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="checkbox"></td>
            <td>${group}</td>
            <td>${firstName} ${lastName}</td>
            <td>${gender}</td>
            <td>${formattedBirthday}</td>
            <td><span class="status-circle green-status"></span></td>
            <td>
                <button class="edit-btn" disabled></button>
                <button class="delete-btn" disabled></button>
            </td>
            <td style="display:none;">${currentId}</td>
        `;
        studentsTable.appendChild(newRow);
        addRowEventListeners(newRow);
        addCheckboxEventListeners();
    }



    studentsTable.appendChild(newRow);
    addRowEventListeners(newRow);
    addCheckboxEventListeners(); 

    modal.style.display = "none";
    clearModalFields(); // Clear modal fields after successful submission
});
*/ 

createBtn.addEventListener("click", function () {
    let isValid = true;
    let isFilledIn = true;
    clearErrors(); 

    const group = document.getElementById("group").value;
    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const gender = document.getElementById("gender").value;
    const birthday = document.getElementById("birthday").value;
    const studentId = document.getElementById("student-id").value;

    const [year, month, day] = birthday.split("-");
    const formattedBirthday = `${day}-${month}-${year}`;

    // Validate each field
    if (!firstName) {
        showError(document.getElementById("first-name"), "First name is required.");
        isValid = false;
        isFilledIn = false;
    } else if (!/^[A-Z]/.test(firstName)) { 
        showError(document.getElementById("first-name"), "First name must start with a capital letter.");
        isValid = false;
    }

    if (!lastName) {
        showError(document.getElementById("last-name"), "Last name is required.");
        isValid = false;
        isFilledIn = false;
    } else if (!/^[A-Z]/.test(lastName)) { 
        showError(document.getElementById("last-name"), "Last name must start with a capital letter.");
        isValid = false;
    }

    if (!birthday) {
        showError(document.getElementById("birthday"), "Birthday is required.");
        isValid = false;
        isFilledIn = false;
    }

    if (!isFilledIn) {
        alert("Please fill in all required fields.");
        return; 
    }

   
    if (!isValid) {
        return; 
    }

    
    if (editingRow) {
        const group = document.getElementById("group").value;
        const firstName = document.getElementById("first-name").value.trim();
        const lastName = document.getElementById("last-name").value.trim();
        const gender = document.getElementById("gender").value;
        const birthday = document.getElementById("birthday").value;
    
        const [year, month, day] = birthday.split("-");
        const formattedBirthday = `${day}-${month}-${year}`;
    
       
        editingRow.querySelector("td:nth-child(2)").innerText = group;
        editingRow.querySelector("td:nth-child(3)").innerText = `${firstName} ${lastName}`;
        editingRow.querySelector("td:nth-child(4)").innerText = gender;
        editingRow.querySelector("td:nth-child(5)").innerText = formattedBirthday;
    
      
        const editedStudent = {
            id: studentId,
            group: group,
            firstName: firstName,
            lastName: lastName,
            gender: gender,
            birthday: formattedBirthday
        };
    
       
        console.log("Edited Student: ", JSON.stringify(editedStudent));
    
        
        editingRow = null;
    } else {
        currentId = currentId + 1;
        
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="checkbox"></td>
            <td>${group}</td>
            <td>${firstName} ${lastName}</td>
            <td>${gender}</td>
            <td>${formattedBirthday}</td>
            <td><span class="status-circle green-status"></span></td>
            <td>
                <button class="edit-btn" disabled></button>
                <button class="delete-btn" disabled></button>
            </td>
            <td style="display:none;">${currentId}</td>
        `;
        const newStudent = {
            id: currentId, 
            group: group,
            firstName: firstName,
            lastName: lastName,
            gender: gender,
            birthday: formattedBirthday
        };

        console.log("New Student: ", JSON.stringify(newStudent));


        studentsTable.appendChild(newRow);
        addRowEventListeners(newRow);
        addCheckboxEventListeners();
    }

    modal.style.display = "none";
    clearModalFields(); 
    document.querySelector(".modal-header h2").innerText = "Add Student"; 
    document.querySelector(".create-btn").innerText = "Create";  
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
                const group = row.querySelector("td:nth-child(2)").innerText;
                const fullName = row.querySelector("td:nth-child(3)").innerText.trim().split(" ");
                const gender = row.querySelector("td:nth-child(4)").innerText;
                let birthday = row.querySelector("td:nth-child(5)").innerText.trim();

                // Check if it matches DD-MM-YYYY
                const dateParts = birthday.match(/^(\d{2})-(\d{2})-(\d{4})$/);
                if (dateParts) {
                    const [_, day, month, year] = dateParts;
                    birthday = `${year}-${month}-${day}`;
                } else {
                console.warn("Unexpected birthday format:", birthday);
                birthday = ""; // fallback
                }
                // Fill the modal inputs
                document.getElementById("group").value = group;
                document.getElementById("first-name").value = fullName[0];
                document.getElementById("last-name").value = fullName[1] || "";
                document.getElementById("gender").value = gender;
                document.getElementById("birthday").value = birthday;


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
    document.querySelector('.main-content').classList.toggle('shifted');
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
    const screenWidth = window.innerWidth;
    if (window.innerHeight < minHeight) {
        document.body.style.height = `${minHeight}px`;
    } else {
        document.body.style.height = "auto";
    }

      // Get the table columns (Gender and Status columns are 4th and 6th)
      const genderColumn = document.querySelectorAll('th:nth-child(4), td:nth-child(4)');
      const statusColumn = document.querySelectorAll('th:nth-child(6), td:nth-child(6)');
  
      // Apply styles based on screen width
      if (screenWidth <= 768) {
          // Hide the 4th (Gender) and 6th (Status) columns when screen is smaller than 768px
          genderColumn.forEach(col => col.style.display = 'none');
          statusColumn.forEach(col => col.style.display = 'none');
      } else {
          // Show columns if screen is larger than 768px
          genderColumn.forEach(col => col.style.display = '');
          statusColumn.forEach(col => col.style.display = '');
      }
});