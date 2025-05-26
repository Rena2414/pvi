<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Students site</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Students site</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

    @vite('resources/css/app.css', 'resources/js/app.js')
</head>
<body>
       <x-header :login-name="$loginName"> </x-header>
    <x-side-panel :login-name="$loginName"> </x-side-panel>

    <div class="main-content">
        <div class="UpperMainCont">
            <h1 class="Labelh1">Welcome!</h1>
        </div>
     </div>


    <script>

    document.addEventListener('DOMContentLoaded', function() {
        @if ($errors->has('login'))
            document.getElementById("login-modal").style.display = "flex";
        @endif

        @if ($errors->has('register'))
            document.getElementById("register-modal").style.display = "flex";
        @endif

        @if ($errors->has('username'))

        document.getElementById("register-modal").style.display = "flex";

        @endif



        document.getElementById('student-form').addEventListener('submit', function(event) {
    // Clear previous errors
    document.getElementById('first-name-error').textContent = '';
    document.getElementById('last-name-error').textContent = '';
    document.getElementById('password-error').textContent = '';
    document.getElementById('login-error').textContent = '';


    
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const loginCheck = document.getElementById('reg-username').value.trim();
    const passCheck = document.getElementById('reg-password').value.trim();

    const namePattern = /^[A-Z][a-z]*$/;
    const usernamePattern = /^[a-zA-Z0-9_\.]{4,}$/; // Alphanumeric or underscore, min 4 chars
    const passwordPattern = /^.{8,}$/

    let isValid = true;

    if (!namePattern.test(firstName)) {
        const firstNameError = document.getElementById('first-name-error');
        firstNameError.textContent = 'First name must start with a capital letter and contain only letters.';
        firstNameError.style.display = 'block'; // <-- this line is key
        
        isValid = false;
    }

    if (!namePattern.test(lastName)) {
        const lastNameError = document.getElementById('last-name-error');
        lastNameError.textContent = 'Last name must start with a capital letter and contain only letters.';
        lastNameError.style.display = 'block'
        isValid = false;
    }

    if (!usernamePattern.test(loginCheck)) {
            const error = document.getElementById('login-error');
            error.textContent = 'Username must be at least 4 characters and contain only letters, numbers, or underscores.';
            error.style.display = 'block';
            isValid = false;
        }

        // Password
        if (!passwordPattern.test(passCheck)) {
            const error = document.getElementById('password-error');
            error.textContent = 'Password must be at least 8 characters long.';
            error.style.display = 'block';
            isValid = false;
        }

    if (!isValid) {
        event.preventDefault(); // prevent form submission
    }
    });
    });

    function openLoginModal() {
        document.getElementById("login-modal").style.display = "flex";
    }

      function openRegisterModal() {
        document.getElementById("register-modal").style.display = "flex";
        document.getElementById('first-name-error').textContent = '';
        document.getElementById('last-name-error').textContent = '';
        document.getElementById('password-error').textContent = '';
        document.getElementById('login-error').textContent = '';
    }

    function closeLoginModal() {
        document.getElementById("login-modal").style.display = "none";
    }

      function closeRegisterModal() {
        document.getElementById("register-modal").style.display = "none";
        document.getElementById('student-form').reset();
    }


    // Toggle side panel when hamburger menu is clicked
    document.querySelector('.hamburger-menu').addEventListener('click', function () {
    document.querySelector('.side-panel').classList.toggle('hidden');
    document.querySelector('.main-content').classList.toggle('shifted');
    });

    
    </script>
</body>
</html>