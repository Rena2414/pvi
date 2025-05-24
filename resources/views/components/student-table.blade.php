<div class="table-container">
    <table>
        <thead>
            <tr>
                <th> <input type="checkbox" id="select-all" onchange="toggleSelectAll(this)" aria-label="Select"> Select </th>
                <th>Group</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Birthday</th>
                <th>Status</th>
                <th>Options</th>
                <th style="display:none;">ID</th> 
            </tr>
        </thead>
        <tbody>
            {{ $slot }}
        </tbody>
    </table>
</div>

