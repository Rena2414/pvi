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
    function openLoginModal() {
        document.getElementById("login-modal").style.display = "block";
    }

      function openRegisterModal() {
        document.getElementById("register-modal").style.display = "block";
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