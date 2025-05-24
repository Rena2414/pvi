import './bootstrap';



window.onclick = function(event) {
    const modal = document.querySelector(".modal");
    if(event.target === modal) {
        closeModal();
    }
}


let deleteStudentId = null;
let selectedIdsToDelete = [];

function openModal(mode = 'add', student = null) {
    const modal = document.querySelector(".modal");
    const title = document.getElementById("modal-title");
    const form = document.getElementById("student-form");
    const method = document.getElementById("form-method");
    const submitBtn = document.getElementById("submit-btn");

    clearModalFields();

    if (mode === 'edit' && student) {
        title.textContent = "Edit Student";
        submitBtn.textContent = "Update";
        form.action = `/students/${student.id}`;
        method.value = 'PATCH';
        document.getElementById("student-id").value = student.id;
        document.getElementById("group").value = student.group_text;
        document.getElementById("first-name").value = student.name;
        document.getElementById("last-name").value = student.lastname;
        document.getElementById("gender").value = student.gender_text;
        document.getElementById("birthday").value = student.birthday;
    } else {
        title.textContent = "Add Student";
        submitBtn.textContent = "Create";
        form.action = "/students";
        method.value = 'POST';
    }

    modal.style.display = "block";
}

function closeModal() {
    document.querySelector(".modal").style.display = "none";
}

function clearModalFields() {
    document.getElementById("student-id").value = "";
    document.getElementById("group").value = "PZ-21";
    document.getElementById("first-name").value = "";
    document.getElementById("last-name").value = "";
    document.getElementById("gender").value = "M";
    document.getElementById("birthday").value = "";
}

function openDeleteModal(studentId, studentName) {
    deleteStudentId = studentId;
    document.getElementById('delete-modal-text').innerText = `Are you sure you want to delete ${studentName}?`;
    document.getElementById('delete-confirmation-modal').style.display = 'block';
}

function closeDeleteModal() {
    deleteStudentId = null;
    document.getElementById('delete-confirmation-modal').style.display = 'none';
}

function confirmDelete() {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    Promise.all(
        selectedIdsToDelete.map(id =>
            fetch(`/students/${id}`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ _method: 'DELETE' })
            }).then(response => {
                if (!response.ok) throw new Error(`Failed to delete student ID ${id}`);
            })
        )
    )
    .then(() => location.reload())
    .catch(error => console.error('Delete error:', error));
}

function handleDeleteClick(studentId, studentName) {
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    selectedIdsToDelete = [];

    if (checkedBoxes.length > 1) {
        checkedBoxes.forEach(cb => {
            const row = cb.closest('tr');
            const id = row.querySelector('td:last-child').textContent.trim();
            selectedIdsToDelete.push(id);
        });
        document.getElementById('delete-modal-text').textContent =
            `Are you sure you want to delete ${selectedIdsToDelete.length} selected students?`;
    } else {
        selectedIdsToDelete.push(studentId);
        document.getElementById('delete-modal-text').textContent =
            `Are you sure you want to delete ${studentName}?`;
    }

    document.getElementById("delete-confirmation-modal").style.display = "block";
}

function toggleSelectAll(masterCheckbox) {
    const checkboxes = document.querySelectorAll('.student-checkbox');
    checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
    handleCheckboxChange();
}

function handleCheckboxChange() {
    const checkboxes = document.querySelectorAll('.student-checkbox');
    const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);

    const selectAll = document.getElementById('select-all');
    if (checkedBoxes.length === checkboxes.length) {
        selectAll.checked = true;
        selectAll.indeterminate = false;
    } else if (checkedBoxes.length > 0) {
        selectAll.checked = false;
        selectAll.indeterminate = true;
    } else {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    }

    checkboxes.forEach(cb => {
        const row = cb.closest('tr');
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');
        if (editBtn) editBtn.disabled = true;
        if (deleteBtn) deleteBtn.disabled = true;
    });

    if (checkedBoxes.length === 1) {
        const row = checkedBoxes[0].closest('tr');
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');
        if (editBtn) editBtn.disabled = false;
        if (deleteBtn) deleteBtn.disabled = false;
    } else if (checkedBoxes.length > 1) {
        checkedBoxes.forEach(cb => {
            const row = cb.closest('tr');
            const deleteBtn = row.querySelector('.delete-btn');
            if (deleteBtn) deleteBtn.disabled = false;
        });
    }
}