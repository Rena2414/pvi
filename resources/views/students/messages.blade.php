
<x-layout :login-name="$loginName">
    @props(['loginName'])
    <x-header :login-name="$loginName"></x-header>
    <x-side-panel :login-name="$loginName"> </x-side-panel>
</x-layout>
