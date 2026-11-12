/* ============================================================
   Authentication UI & Logic — Personal Intelligence System
   ============================================================ */

class Auth {
    static isAuthenticated() {
        return !!api.getToken();
    }

    static showLogin() {
        this.renderForm('login');
        showModal('auth-modal');
    }

    static showRegister() {
        this.renderForm('register');
        showModal('auth-modal');
    }

    static renderForm(mode = 'login') {
        const titleEl = document.getElementById('auth-modal-title');
        const bodyEl = document.getElementById('auth-modal-body');
        if (!bodyEl) return;

        if (mode === 'login') {
            if (titleEl) titleEl.textContent = 'Welcome to PIS';
            bodyEl.innerHTML = `
                <form id="auth-form" class="auth-form" onsubmit="Auth.handleLogin(event)">
                    <div class="form-group">
                        <label for="auth-username">Username</label>
                        <input type="text" id="auth-username" class="form-input" required autocomplete="username" placeholder="Enter your username">
                    </div>
                    <div class="form-group">
                        <label for="auth-password">Password</label>
                        <input type="password" id="auth-password" class="form-input" required autocomplete="current-password" placeholder="Enter your password">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" id="auth-submit-btn">
                        <span>Log In</span>
                    </button>
                    <div class="auth-switch">
                        Don't have an account? <a href="#" onclick="Auth.renderForm('register'); return false;">Register here</a>
                    </div>
                </form>
            `;
        } else {
            if (titleEl) titleEl.textContent = 'Create PIS Account';
            bodyEl.innerHTML = `
                <form id="auth-form" class="auth-form" onsubmit="Auth.handleRegister(event)">
                    <div class="form-group">
                        <label for="auth-reg-username">Username</label>
                        <input type="text" id="auth-reg-username" class="form-input" required minlength="3" autocomplete="username" placeholder="Choose a username">
                    </div>
                    <div class="form-group">
                        <label for="auth-reg-email">Email</label>
                        <input type="email" id="auth-reg-email" class="form-input" required autocomplete="email" placeholder="name@example.com">
                    </div>
                    <div class="form-group">
                        <label for="auth-reg-password">Password</label>
                        <input type="password" id="auth-reg-password" class="form-input" required minlength="6" autocomplete="new-password" placeholder="Min 6 characters">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" id="auth-submit-btn">
                        <span>Create Account</span>
                    </button>
                    <div class="auth-switch">
                        Already have an account? <a href="#" onclick="Auth.renderForm('login'); return false;">Log In</a>
                    </div>
                </form>
            `;
        }
    }

    static async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('auth-username')?.value.trim();
        const password = document.getElementById('auth-password')?.value;
        const btn = document.getElementById('auth-submit-btn');

        if (!username || !password) {
            showToast('Please provide both username and password', 'warning');
            return;
        }

        if (btn) btn.disabled = true;

        try {
            const data = await api.post('/auth/login', { username, password });
            api.setToken(data.access_token);
            hideModal('auth-modal');
            showToast(`Welcome back, ${username}!`, 'success');
            await this.loadUser();
            App.navigate(App.currentRoute || 'dashboard');
        } catch (err) {
            showToast(err.message || 'Login failed', 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    static async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('auth-reg-username')?.value.trim();
        const email = document.getElementById('auth-reg-email')?.value.trim();
        const password = document.getElementById('auth-reg-password')?.value;
        const btn = document.getElementById('auth-submit-btn');

        if (!username || !email || !password) {
            showToast('Please fill all fields', 'warning');
            return;
        }

        if (btn) btn.disabled = true;

        try {
            await api.post('/auth/register', { username, email, password });
            showToast('Account created successfully! Logging you in...', 'success');
            // Auto login
            const loginData = await api.post('/auth/login', { username, password });
            api.setToken(loginData.access_token);
            hideModal('auth-modal');
            await this.loadUser();
            App.navigate('dashboard');
        } catch (err) {
            showToast(err.message || 'Registration failed', 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    static async loadUser() {
        try {
            const user = await api.get('/auth/me');
            App.updateUserUI(user);
            return user;
        } catch (err) {
            console.warn('Failed to load user info:', err);
            this.logout();
        }
    }

    static logout() {
        api.clearToken();
        window.pisUser = null;
        showToast('You have been logged out', 'info');
        this.showLogin();
    }
}
