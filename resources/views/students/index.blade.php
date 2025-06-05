
<x-layout :login-name="$loginName">
    <x-header :login-name="$loginName"></x-header>
    <x-side-panel :login-name="$loginName"> </x-side-panel>

    <div class="main-content">
        <div class="UpperMainCont">
            <h1 class="Labelh1">Students</h1>
            <button class="plus-button" onclick="openModal('add')">+</button>
        </div>

    <x-student-table>
        @foreach ($students as $student)
            <x-student-row :student="$student" />
        @endforeach
    </x-student-table>


 <div class="d-flex justify-content-center mt-4">
    {{ $students->links('pagination::bootstrap-5') }}
</div>

    </div>

    <x-modals.add-student />
    <x-modals.delete-confirmation />

<script>
        window.chatConfig = {
            csrfToken: "{{ $csrfToken }}",
            loginName: "{{ $loginName ?? '' }}", 
            studentId: "{{ $studentId ?? '' }}",
            studentName: "{{ $studentName ?? '' }}",
            studentLastname: "{{ $studentLastname ?? '' }}"
        };
    </script>

    @vite(['resources/css/app.css', 'resources/js/index.js'])


  <script>




    document.addEventListener('DOMContentLoaded', function() {


        @if ($errors->has('register'))
        openModal('add');
        @endif

    

        @if ($errors->has('first-name'))


        openModal('add');
        @endif
        @if ($errors->has('last-name'))

        openModal('add');

        @endif

        

    });

window.onclick = function(event) {
    const modal = document.querySelector(".modal");
    if(event.target === modal) {
        closeModal();
    }
}

window.onclick = function(event) {
    const modal = document.querySelector(".modal");
    if (modal && event.target === modal) {
        closeModal();
    }
};

if (document.querySelector('.hamburger-menu')) {
    document.querySelector('.hamburger-menu').addEventListener('click', function () {
        document.querySelector('.side-panel')?.classList.toggle('hidden');
        document.querySelector('.main-content')?.classList.toggle('shifted');
    });
}

if (document.querySelector('.plane-icon')) {
    document.querySelector('.plane-icon').addEventListener('dblclick', function () {
        this.classList.add('animate');
        const circle = document.getElementById('notification-circle');
        const notifications = document.querySelector('.notifications');
        if (circle) circle.style.opacity = 1;
        if (notifications) notifications.classList.add('no-hover');

        setTimeout(() => this.classList.remove('animate'), 500);
        setTimeout(() => notifications?.classList.remove('no-hover'), 750);
    });

    let clickTimer = null;
    document.querySelector('.plane-icon').addEventListener('click', function () {
        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
            return;
        }

        clickTimer = setTimeout(() => {
            const circle = document.getElementById('notification-circle');
            if (circle) circle.style.opacity = 1;
            window.location.href = "/messages";
            clickTimer = null;
        }, 300);
    });
}

if (document.getElementById('student-form')) {
    document.getElementById('student-form').addEventListener('submit', function (e) {
        if (!document.querySelector('[name="login"]')) {
            const firstName = document.getElementById('first-name')?.value.trim().toLowerCase();
            const lastName = document.getElementById('last-name')?.value.trim().toLowerCase();

            const loginInput = document.createElement('input');
            loginInput.type = 'hidden';
            loginInput.name = 'username';
            loginInput.value = `${firstName}.${lastName}`;
            this.appendChild(loginInput);

            const passwordInput = document.createElement('input');
            passwordInput.type = 'hidden';
            passwordInput.name = 'password';
            passwordInput.value = '12345678';
            this.appendChild(passwordInput);
        }
    });
}

let deleteStudentId = null;
let selectedIdsToDelete = [];

function openModal(mode = 'add', student = null) {
    const modal = document.getElementById("add-modal");
    const title = document.getElementById("modal-title");
    const form = document.getElementById("student-form");
    const method = document.getElementById("form-method");
    const submitBtn = document.getElementById("submit-btn");

    clearModalFields();

    

    document.getElementById("mode").value = mode;

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

    modal.style.display = "flex";
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
    document.getElementById('delete-confirmation-modal').style.display = 'flex';
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

    document.getElementById("delete-confirmation-modal").style.display = "flex";
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



      function openAddModal() {
        document.getElementById("add-modal").style.display = "flex";
    }

    function closeAddModal() {
        document.getElementById("add-modal").style.display = "none";
    }




    document.getElementById('student-form').addEventListener('submit', function (e) {
    // Prevent double appending if editing
    if (!document.querySelector('[name="login"]')) {
        const firstName = document.getElementById('first-name').value.trim().toLowerCase();
        const lastName = document.getElementById('last-name').value.trim().toLowerCase();

        const loginInput = document.createElement('input');
        loginInput.type = 'hidden';
        loginInput.name = 'username';
        loginInput.value = `${firstName}.${lastName}`;
        this.appendChild(loginInput);

        const passwordInput = document.createElement('input');
        passwordInput.type = 'hidden';
        passwordInput.name = 'password';
        passwordInput.value = '12345678';
        this.appendChild(passwordInput);
    }
});

document.querySelector('.hamburger-menu').addEventListener('click', function () {
    document.querySelector('.side-panel').classList.toggle('hidden');
    document.querySelector('.main-content').classList.toggle('shifted');
    });

</script>

@if ($errors->any() && old('mode') === 'edit')
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const studentData = {
    id: "{{ old('id') }}",
    group_text: "{{ old('group') }}",
    name: "{{ old('first-name') }}",
    lastname: "{{ old('last-name') }}",
    gender_text: "{{ old('gender') }}",
    birthday: "{{ old('birthday') }}"
        };
        openModal("edit", studentData); // this should reopen your edit modal
    });
</script>
@elseif ($errors->any())
<script>
    document.addEventListener('DOMContentLoaded', () => {
        openModal("add");
    });
</script>
@endif

</x-layout>
