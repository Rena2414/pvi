<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Students site</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

    @vite('resources/css/app.css', 'resources/js/app.js')
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js" integrity="sha384-jUL7QIR3vbyuW+hI45pI63zV9R4z/T+fQ0n9O3+gXJm+1Q8J4D3k6+n5K/A72F6+gE5" crossorigin="anonymous"></script>
</head>

<body>

<main class="pageContent">
    {{ $slot }}
</main>



<script>

    document.querySelector('.hamburger-menu').addEventListener('click', function () {
    document.querySelector('.side-panel').classList.toggle('hidden');
    document.querySelector('.main-content').classList.toggle('shifted');
    });



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
        window.location.href = "/messages"; 
        clickTimer = null;
    }, 300); 
});
</script>
</body>

</html>