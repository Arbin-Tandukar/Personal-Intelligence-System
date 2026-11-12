/* ============================================================
   App Core & Router — Personal Intelligence System
   ============================================================ */

// ── Global Helper Utilities ──────────────────────────────────────────────────

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-triangle';
    if (type === 'warning') iconClass = 'fa-exclamation-circle';

    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

function showModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function hideModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

function formatCurrency(amount, currency = null) {
    const curr = currency || window.pisUser?.currency || 'NPR';
    const num = Number(amount || 0);
    return `${curr} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

let confirmCallback = null;
function confirmDialog(message, onConfirm) {
    const msgEl = document.getElementById('confirm-message');
    if (msgEl) msgEl.textContent = message;
    confirmCallback = onConfirm;
    showModal('confirm-modal');
}

document.addEventListener('DOMContentLoaded', () => {
    const yesBtn = document.getElementById('confirm-yes-btn');
    if (yesBtn) {
        yesBtn.addEventListener('click', () => {
            hideModal('confirm-modal');
            if (confirmCallback) {
                confirmCallback();
                confirmCallback = null;
            }
        });
    }
});


// ── App Controller ───────────────────────────────────────────────────────────

class App {
    static currentRoute = 'dashboard';

    static routes = {
        'dashboard': { title: 'Dashboard', render: () => Dashboard.render() },
        'profile': { title: 'Profile', render: () => Profile.render() },
        'study': { title: 'Study Tracker', render: () => Study.render() },
        'fitness': { title: 'Fitness Tracker', render: () => Fitness.render() },
        'habits': { title: 'Habit Tracker', render: () => Habits.render() },
        'finance': { title: 'Finance Tracker', render: () => Finance.render() },
        'tasks': { title: 'Tasks & Quests', render: () => Tasks.render() },
        'journal': { title: 'Journal & Knowledge', render: () => Journal.render() },
        'analytics': { title: 'Analytics & Insights', render: () => Analytics.render() },
        'ai': { title: 'AI Assistant', render: () => AI.render() },
    };

    static async init() {
        this.bindEvents();
        this.loadSettings();

        // Check authentication
        if (Auth.isAuthenticated()) {
            await Auth.loadUser();
            const initialRoute = window.location.hash.replace('#', '') || 'dashboard';
            this.navigate(initialRoute);
        } else {
            Auth.showLogin();
        }
    }

    static bindEvents() {
        // Hash navigation
        window.addEventListener('hashchange', () => {
            const route = window.location.hash.replace('#', '') || 'dashboard';
            this.navigate(route);
        });

        // Mobile sidebar toggles
        const mobileBtn = document.getElementById('mobile-menu-btn');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        const toggleSidebar = () => {
            sidebar?.classList.toggle('open');
            overlay?.classList.toggle('active');
        };

        mobileBtn?.addEventListener('click', toggleSidebar);
        sidebarToggle?.addEventListener('click', toggleSidebar);
        overlay?.addEventListener('click', toggleSidebar);

        // Theme toggle
        const themeBtn = document.getElementById('theme-toggle');
        themeBtn?.addEventListener('click', () => this.toggleTheme());

        // Settings toggle
        const settingsBtn = document.getElementById('settings-toggle');
        settingsBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openSettings();
        });

        const saveSettingsBtn = document.getElementById('save-settings-btn');
        saveSettingsBtn?.addEventListener('click', () => this.saveSettings());

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }

    static navigate(route) {
        if (!this.routes[route]) {
            route = 'dashboard';
        }
        this.currentRoute = route;

        // Update active class in sidebar
        document.querySelectorAll('#nav-list .nav-item').forEach(item => {
            if (item.getAttribute('data-route') === route) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update header title
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = this.routes[route].title;

        // Close mobile sidebar if open
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('active');

        // Render page
        const contentEl = document.getElementById('app-content');
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>Loading ${this.routes[route].title}...</p>
                </div>
            `;
            try {
                this.routes[route].render();
            } catch (err) {
                console.error(`Error rendering route ${route}:`, err);
                contentEl.innerHTML = `<div class="card error-card"><p>Failed to load ${this.routes[route].title}: ${err.message}</p></div>`;
            }
        }
    }

    static updateUserUI(user) {
        window.pisUser = user;
        const nameEl = document.getElementById('user-display-name');
        const levelEl = document.getElementById('user-level-text');
        const xpBarEl = document.getElementById('user-xp-bar');
        const xpTextEl = document.getElementById('user-xp-text');

        if (nameEl) nameEl.textContent = user.username || 'User';
        if (levelEl) levelEl.textContent = `Level ${user.level || 1}`;

        const baseXP = ((user.level || 1) - 1) * 100;
        const inLevel = Math.max(0, (user.xp || 0) - baseXP);
        const percent = Math.min(100, inLevel);

        if (xpBarEl) xpBarEl.style.width = `${percent}%`;
        if (xpTextEl) xpTextEl.textContent = `${inLevel} / 100 XP`;
    }

    static toggleTheme() {
        const isLight = document.body.classList.toggle('light-mode');
        localStorage.setItem('pis_theme', isLight ? 'light' : 'dark');
        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    static loadSettings() {
        const savedTheme = localStorage.getItem('pis_theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            const icon = document.querySelector('#theme-toggle i');
            if (icon) icon.className = 'fas fa-sun';
        }
    }

    static async openSettings() {
        const themeSelect = document.getElementById('setting-theme');
        const currencySelect = document.getElementById('setting-currency');
        if (themeSelect) themeSelect.value = localStorage.getItem('pis_theme') || 'dark';
        if (currencySelect && window.pisUser) {
            currencySelect.value = window.pisUser.currency || 'NPR';
        }

        // Load AI status
        const statusEl = document.getElementById('ai-config-status');
        const modelSelect = document.getElementById('setting-ai-model');
        const keyInput = document.getElementById('setting-ai-key');
        if (statusEl) statusEl.innerHTML = '<span class="text-secondary">Checking AI status...</span>';

        try {
            const aiConf = await api.get('/ai/config');
            if (modelSelect && aiConf.model) modelSelect.value = aiConf.model;
            if (statusEl) {
                if (aiConf.has_key) {
                    statusEl.innerHTML = `<span class="text-success"><i class="fas fa-check-circle"></i> Active: Key configured (${aiConf.masked_key})</span>`;
                    if (keyInput) keyInput.placeholder = 'Key already set (paste new to change)';
                } else {
                    statusEl.innerHTML = `<span class="text-warning"><i class="fas fa-info-circle"></i> No API key configured (using local heuristics)</span>`;
                    if (keyInput) keyInput.placeholder = 'Paste Gemini API key...';
                }
            }
        } catch {
            if (statusEl) statusEl.innerHTML = '';
        }

        showModal('settings-modal');
    }

    static async saveSettings() {
        const themeSelect = document.getElementById('setting-theme');
        const currencySelect = document.getElementById('setting-currency');
        const aiKeyInput = document.getElementById('setting-ai-key');
        const aiModelSelect = document.getElementById('setting-ai-model');

        if (themeSelect) {
            const isLight = themeSelect.value === 'light';
            document.body.classList.toggle('light-mode', isLight);
            localStorage.setItem('pis_theme', themeSelect.value);
            const icon = document.querySelector('#theme-toggle i');
            if (icon) icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
        }

        if (currencySelect && window.pisUser && currencySelect.value !== window.pisUser.currency) {
            try {
                await api.put('/auth/me/currency', { currency: currencySelect.value });
                window.pisUser.currency = currencySelect.value;
                showToast(`Currency updated to ${currencySelect.value}`, 'success');
            } catch {
                window.pisUser.currency = currencySelect.value;
            }
        }

        // Save AI configuration if key entered or model changed
        const newKey = aiKeyInput?.value?.trim();
        const newModel = aiModelSelect?.value;
        if (newKey) {
            try {
                showToast('Validating AI API key with Gemini...', 'info');
                const aiRes = await api.post('/ai/config', { api_key: newKey, model: newModel });
                showToast(aiRes.message || 'Gemini AI configured successfully!', 'success');
                if (aiKeyInput) aiKeyInput.value = '';
            } catch (err) {
                showToast('Failed to save AI key: ' + err.message, 'error');
                return; // Keep modal open so user can fix
            }
        }

        hideModal('settings-modal');
        showToast('Settings saved successfully', 'success');
        this.navigate(this.currentRoute);
    }
}

// Service worker registration for mobile PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
            console.log('PIS Service Worker registered with scope:', reg.scope);
        }).catch((err) => {
            console.log('PIS Service Worker registration failed:', err);
        });
    });
}

// Deferred install prompt for Mobile Chrome/Edge
window.deferredPWAInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPWAInstallPrompt = e;
    console.log('PWA beforeinstallprompt captured.');
});

window.addEventListener('DOMContentLoaded', () => App.init());
