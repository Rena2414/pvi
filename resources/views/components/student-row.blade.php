<tr>
    <td> <input type="checkbox" class="student-checkbox" onchange="handleCheckboxChange()" aria-label="Select"></td>
   
    <td>{{ 'PZ-2' . $student->group }}</td>
    <td>{{ $student->name }} {{ $student->lastname }}</td>
    <td>
        @if ($student->gender === 0)
            M
        @elseif ($student->gender === 1)
            F
        @else
            O
        @endif
    </td>
    <td>{{ \Carbon\Carbon::parse($student->birthday)->format('d-m-Y') }}</td>
    <td>
        <span class="status-circle {{ $student->status ? 'green-status' : 'grey-status' }}"></span>
    </td>
    <td>
        @php
    $groupMap = [
    1 => 'PZ-21',
    2 => 'PZ-22',
    3 => 'PZ-23',
    4 => 'PZ-24',
    5 => 'PZ-25',
    6 => 'PZ-26',
    ];
    @endphp

        <button class="edit-btn" disabled onclick="openModal('edit', {
            id: {{ $student->id }},
            group_text: '{{ $groupMap[$student->group] ?? "PZ-21" }}',
            name: '{{ $student->name }}',
            lastname: '{{ $student->lastname }}',
            gender_text: '{{ $student->gender == 0 ? 'M' : 'F' }}',
            birthday: '{{ $student->birthday }}'
        })">✏️</button>
        <button class="delete-btn" disabled aria-label="Delete"
    onclick="handleDeleteClick({{ $student->id }}, '{{ $student->name }}')">
        </button>
    </td>
    <td style="display:none;">{{ $student->id }}</td>
</tr>


