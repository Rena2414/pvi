@props(['loginName'])
{{ $loginName ?? '' }}
<nav class="side-panel">
    <ul>

        @if(!empty($loginName))
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/students">Students</a></li>
            <li><a href="/tasks">Tasks</a></li>
        @else
            <li><a>Dashboard</a></li>
            <li><a>Students</a></li>
            <li><a>Tasks</a></li>
        @endif
    </ul>
</nav>
