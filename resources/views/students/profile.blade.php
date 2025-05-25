
<x-layout :login-name="$loginName">
    @props(['loginName'])
    <x-header :login-name="$loginName"></x-header>
    <x-side-panel :login-name="$loginName"> </x-side-panel>
    <div class="main-content">
        <div class="UpperMainCont">
            <h1 class="Labelh1">Profile</h1>
        </div>
     </div>
</x-layout>
