document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const idInput = document.getElementById('registration-id');
    const pwInput = document.getElementById('password');
    const alertBox = document.getElementById('loginAlert');
    const card = document.getElementById('loginCard');

    const DASHBOARDS = {
        client: 'client-dashboard.html',
        staff: 'staff-dashboard.html',
        admin: 'admin-dashboard.html'
    };

    // Exact staff roles stored in profiles.role (see staff-roles.sql)
    const STAFF_ROLES = ['front-desk', 'housekeeping', 'maintenance', 'manager'];
    const ROLE_CACHE_KEY = 'haven_role_cache';     // lets staff pages open without a one-time reload
    const MAX_TRIES = 5;
    const LOCK_SECONDS = 30;
    let failedTries = 0;
    let lockedUntil = 0;

    /* ==========================================
       HELPERS: lock-out, friendly errors, routing
       ========================================== */
    function isLocked() { return Date.now() < lockedUntil; }

    function registerFailure() {
        failedTries += 1;
        if (failedTries >= MAX_TRIES) {
            lockedUntil = Date.now() + LOCK_SECONDS * 1000;
            failedTries = 0;
        }
    }

    function friendlyAuthError(err) {
        const msg = String((err && err.message) || '').toLowerCase();
        if (msg.includes('invalid login')) return 'Incorrect email or password.';
        if (msg.includes('banned') || msg.includes('suspended')) return 'This account has been suspended. Please contact an administrator.';
        if (msg.includes('not confirmed')) return 'Please verify your email first. Check your inbox for the 6-digit code.';
        if (msg.includes('rate') || msg.includes('too many')) return 'Too many attempts. Please wait a minute and try again.';
        if (msg.includes('network') || msg.includes('fetch')) return 'Could not reach the server. Check your connection and try again.';
        // Anything unexpected: say so (instead of blaming the password) and show the real reason
        return 'Could not sign in' + (err && err.message ? ' (' + err.message + ')' : '') + '. Please try again.';
    }

    // Only allow returning to one of our own staff pages (e.g. ?next=staff-rooms.html)
    function safeNextPage() {
        const next = new URLSearchParams(window.location.search).get('next') || '';
        return /^staff-[a-z]+\.html$/.test(next) ? next : null;
    }

    function cacheRole(userId, role) {
        try { localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ uid: userId, role: role })); } catch (e) { /* ignore */ }
    }

    function getDestination(role) {
        const r = String(role || 'client').toLowerCase().trim();
        if (STAFF_ROLES.includes(r)) return safeNextPage() || DASHBOARDS.staff;
        if (r === 'admin' || r === 'super-admin' || r === 'support-admin') return DASHBOARDS.admin;
        return DASHBOARDS.client;
    }

    /* ==========================================
       VALIDATION
       ========================================== */
    const rules = {
        'registration-id': {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            messages: { required: 'Email address is required.', pattern: 'Please enter a valid email address.' }
        },
        'password': {
            messages: { required: 'Password is required.' }
        }
    };

    function showError(fieldId, message) {
        const group = document.getElementById(fieldId)?.closest('.form-group');
        const err = document.querySelector(`[data-error-for="${fieldId}"]`);
        if (group) group.classList.add('error');
        if (err) err.textContent = message || '';
    }
    function clearError(fieldId) {
        const group = document.getElementById(fieldId)?.closest('.form-group');
        const err = document.querySelector(`[data-error-for="${fieldId}"]`);
        if (group) group.classList.remove('error');
        if (err) err.textContent = '';
    }
    function hideAlert() { if (alertBox) { alertBox.hidden = true; alertBox.textContent = ''; } }
    function showAlert(message) { if (alertBox) { alertBox.textContent = message; alertBox.hidden = false; } }

    function validateField(fieldId) {
        const rule = rules[fieldId];
        const input = document.getElementById(fieldId);
        if (!rule || !input) return true;
        const value = fieldId === 'password' ? input.value : input.value.trim();
        if (!value) { showError(fieldId, rule.messages.required); return false; }
        if (rule.pattern && !rule.pattern.test(value)) { showError(fieldId, rule.messages.pattern); return false; }
        clearError(fieldId);
        return true;
    }

    function validateForm() {
        let firstInvalid = null;
        Object.keys(rules).forEach((fieldId) => {
            if (!validateField(fieldId) && !firstInvalid) firstInvalid = document.getElementById(fieldId);
        });
        if (firstInvalid) firstInvalid.focus();
        return !firstInvalid;
    }

    Object.keys(rules).forEach((fieldId) => {
        const input = document.getElementById(fieldId);
        if (!input) return;
        input.addEventListener('blur', () => validateField(fieldId));
        input.addEventListener('input', () => {
            hideAlert();
            const group = input.closest('.form-group');
            if (group && group.classList.contains('error')) validateField(fieldId);
        });
    });

    document.querySelectorAll('.toggle-pw').forEach((btn) => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', () => {
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.classList.toggle('is-visible', show);
        });
    });

    function shake() {
        if (!card) return;
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
    }

    /* ==========================================
       SIGN IN LOGIC
       ========================================== */
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();

        if (isLocked()) {
            const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
            showAlert('Too many attempts. Please wait ' + secs + ' seconds and try again.');
            shake();
            return;
        }

        if (!validateForm()) { shake(); return; }

        const label = loginBtn.querySelector('.btn-label');
        const spinner = loginBtn.querySelector('.btn-spinner');
        const setLoading = (on) => {
            loginBtn.disabled = on;
            if (label) label.hidden = on;
            if (spinner) spinner.hidden = !on;
        };

        setLoading(true);
        try {
            const email = idInput.value.trim().toLowerCase();

            // 1. Sign in
            const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
                email: email, 
                password: pwInput.value
            });

            if (authError) { registerFailure(); throw authError; }

            // 2. Fetch Profile
            const { data: profile, error: profileError } = await window.supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (profileError || !profile) {
                throw { friendly: 'We could not load your account. Please try again or contact the front desk.' };
            }

            // 3. Route based on role (staff roles go to the staff console)
            const role = String(profile.role || 'client').toLowerCase().trim();
            if (STAFF_ROLES.includes(role)) cacheRole(authData.user.id, role);

            // Redirect to the dashboard (client-dashboard.js asks guests without a room to choose one)
            window.location.href = getDestination(role);

        } catch (err) {
            console.error('Login error:', err);
            showAlert(err.friendly || friendlyAuthError(err));
            shake();
        }

        setLoading(false);
    });

    /* ==========================================
       FORGOT PASSWORD LOGIC
       ========================================== */
    window.handleSubmit = async function(event) {
        event.preventDefault();
        const resetBtn = event.target.querySelector('button[type="submit"]');
        const originalBtnText = resetBtn.textContent;
        const emailInput = document.getElementById('reset-email');
        const email = emailInput.value.trim();

        if (!email) { alert("Please enter your email address."); return; }

        resetBtn.disabled = true;
        resetBtn.textContent = "Sending...";

        try {
            const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password.html`
            });

            if (error) throw error;
            alert("Password reset link sent! Check your email.");
            document.getElementById('forgotModal').classList.remove('active');
            emailInput.value = '';
        } catch (err) {
            console.error('Reset error:', err);
            alert(err.message || 'Error sending reset email.');
        } finally {
            resetBtn.disabled = false;
            resetBtn.textContent = originalBtnText;
        }
    };

    /* ==========================================
       SHAKE ANIMATION
       ========================================== */
    if (!document.getElementById('loginShakeCSS')) {
        const style = document.createElement('style');
        style.id = 'loginShakeCSS';
        style.textContent = `
            @keyframes haven-shake {
                0%, 100% { transform: translateX(0); }
                20% { transform: translateX(-6px); }
                40% { transform: translateX(6px); }
                60% { transform: translateX(-4px); }
                80% { transform: translateX(4px); }
            }
            .login-card.shake { animation: haven-shake 0.4s ease; }
        `;
        document.head.appendChild(style);
    }
});