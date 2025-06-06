
<x-layout :login-name="$loginName">
    @props(['loginName'])
    <x-header :login-name="$loginName"></x-header>
    <x-side-panel :login-name="$loginName"> </x-side-panel>
     <div class="main-content">
        <div class="UpperMainCont">
            <h1 class="Labelh1">Dashboard</h1>
        </div>
     </div>
    

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
</x-layout>
