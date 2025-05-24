<div class="header">
    <div class="hamburger-menu">☰
        <a href="/" class="logo">CMS</a>
    </div>
    <div class="user-info">
        <div class="notifications">
            <div class="notificationsIcon">
                <span class="plane-icon"></span>
                <div id="notification-circle" class="notification-circle"></div>
            </div>
            <div class="dropdown">
                <x-message user="Maksbid" text="Ну велике завдання" avatar="avatar2" />
                <x-message user="k_olefir" text="💀💀💀" avatar="avatar3" />
                <x-message user="gardar" text="*Чому я gardar*" avatar="avatar4" />
            </div>
        </div>
        <div class="profile">
            <span class="avatar"></span>
           <p>{{ $loginName ?? '' }}</p>

            @if (!empty($loginName))
                <div class="dropdown2">
                <div>Profile</div>
                <form method="POST" action="{{ route('logout') }}">
                     @csrf
                <button type="submit" class="logout-button">Log Out</button>
                </form>
            </div>
            @else
                 <button class="log-in-btn" onclick="openLoginModal()">Log In</button>
                 <x-modals.log-in> </x-modals.log-in>
                 <x-modals.register-modal> </x-modals.register-modal>
            </div>
            @endif
        </div>
    </div>
</div>
