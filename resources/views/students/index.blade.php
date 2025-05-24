
<x-layout :login-name="$loginName">
    <x-header :login-name="$loginName"></x-header>
    <x-side-panel :login-name="$loginName"> </x-side-panel>

    <div class="main-content">
        <div class="UpperMainCont">
            <h1 class="Labelh1">Students</h1>
            <button class="plus-button" onclick="openAddModal()">+</button>
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


  

</x-layout>
