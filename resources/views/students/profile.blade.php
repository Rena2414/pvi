
<x-layout :login-name="$loginName">
    @props(['loginName', 'student'])
    <x-header :login-name="$loginName"></x-header>
    <x-side-panel :login-name="$loginName"> </x-side-panel>
    <div class="main-content">
        <div class="UpperMainCont">
            <h1 class="Labelh1">Profile</h1>
        </div>

        @if($student)
            <div class="profile-info">
                <p><strong>Login:</strong> {{ $student->login }}</p>
                <p><strong>Name:</strong> {{ $student->name }}</p>
                <p><strong>Last Name:</strong> {{ $student->lastname }}</p>
                <p><strong>Gender:</strong> {{ $student->gender == 0 ? 'Male' : 'Female' }}</p>
                <p><strong>Birthday:</strong> {{ $student->birthday }}</p>

                @php
                    $groupMap = [
                        1 => 'PZ-21',
                        2 => 'PZ-22',
                        3 => 'PZ-23',
                        4 => 'PZ-24',
                        5 => 'PZ-25',
                        6 => 'PZ-26',
                        7 => 'PZ-27',
                    ];
                @endphp
                <p><strong>Group:</strong> {{ $groupMap[$student->group] ?? 'Unknown' }}</p>
            </div>
        @else
            <p>No student data found. Please log in.</p>
        @endif
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
