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

    <div class="btn-group">
        @php
    $modalData = [
        'id' => $student->id,
        'group_text' => $groupMap[$student->group] ?? 'PZ-21',
        'name' => $student->name,
        'lastname' => $student->lastname,
        'gender_text' => $student->gender == 0 ? 'M' : 'F',
        'birthday' => $student->birthday,
    ];
        @endphp
        <button class="edit-btn" disabled
        onclick='openModal("edit", {!! json_encode($modalData) !!})'>
            <div class="edit-btn-icon">
                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M5 8a4 4 0 1 1 7.796 1.263l-2.533 2.534A4 4 0 0 1 5 8Zm4.06 5H7a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h2.172a2.999 2.999 0 0 1-.114-1.588l.674-3.372a3 3 0 0 1 .82-1.533L9.06 13Zm9.032-5a2.907 2.907 0 0 0-2.056.852L9.967 14.92a1 1 0 0 0-.273.51l-.675 3.373a1 1 0 0 0 1.177 1.177l3.372-.675a1 1 0 0 0 .511-.273l6.07-6.07a2.91 2.91 0 0 0-.944-4.742A2.907 2.907 0 0 0 18.092 8Z" clip-rule="evenodd"/>
                </svg>
            </div>
        </button>
        <button class="delete-btn" disabled aria-label="Delete" 
        onclick="handleDeleteClick({{ $student->id }}, '{{ $student->name }}')">
            <div class="delete-btn-icon">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z" clip-rule="evenodd"/>
                </svg>
            </div>
        </button>
    </div>
    </td>
    <td style="display:none;">{{ $student->id }}</td>
</tr>


