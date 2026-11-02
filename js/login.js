/* ==========================================================
   HAVEN — Login page (Supabase + Gmail)
   ========================================================== */
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

    /* ==========================================
       AFTER REGISTER — success notice + prefill
       ========================================== */
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') {
        const notice = document.getElementById('registeredNotice');
        if (notice) notice.hidden = false;

        const id = params.get('id');
        if (id && idInput) idInput.value = id;

        if (pwInput) pwInput.focus();
        history.replaceState(null, '', window.location.pathname);
    }

    /* ==========================================
       VALIDATION
       ========================================== */
    const rules = {
        'registration-id': {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Strict email format
            messages: {
                required: 'Email address is required.',
                pattern: 'Please enter a valid email address.'
            }
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
    function hideAlert() {
        if (alertBox) { alertBox.hidden = true; alertBox.textContent = ''; }
    }
    function showAlert(message) {
        if (!alertBox) return;
        alertBox.textContent = message;
        alertBox.hidden = false;
    }

    function validateField(fieldId) {
        const rule = rules[fieldId];
        const input = document.getElementById(fieldId);
        if (!rule || !input) return true;

        const value = fieldId === 'password' ? input.value : input.value.trim();

        if (!value) {
            showError(fieldId, rule.messages.required);
            return false;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
            showError(fieldId, rule.messages.pattern);
            return false;
        }
        clearError(fieldId);
        return true;
    }

    function validateForm() {
        let firstInvalid = null;
        Object.keys(rules).forEach((fieldId) => {
            if (!validateField(fieldId) && !firstInvalid) {
                firstInvalid = document.getElementById(fieldId);
            }
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

    /* ==========================================
       SHOW / HIDE PASSWORD
       ========================================== */
    document.querySelectorAll('.toggle-pw').forEach((btn) => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', () => {
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.classList.toggle('is-visible', show);
            btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
            btn.setAttribute('aria-pressed', String(show));
        });
    });

    const capsHint = document.querySelector('[data-error-for="password"]');
    pwInput?.addEventListener('keyup', (e) => {
        if (!e.getModifierState || !capsHint) return;
        const group = pwInput.closest('.form-group');
        if (e.getModifierState('CapsLock')) {
            if (!group.classList.contains('error')) capsHint.textContent = 'Caps Lock is on.';
        } else if (capsHint.textContent === 'Caps Lock is on.') {
            capsHint.textContent = '';
        }
    });

    /* ==========================================
       SIGN IN & ROLE ROUTING
       ========================================== */
    function shake() {
        if (!card) return;
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
    }

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();

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

            // 1. Sign in with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email, 
                password: pwInput.value
            });

            if (authError) {
                if (authError.message.includes('Email not confirmed')) {
                    throw new Error("Please check your email and click the verification link (or enter your OTP) before logging in.");
                }
                throw authError;
            }

            // 2. Fetch the user's profile to get their role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (profileError) {
                console.warn('Profile fetch error:', profileError);
                // If no profile exists yet, default to client
                window.location.href = DASHBOARDS.client;
                return;
            }

            // 3. Safely normalize the role and determine destination
            // Converts "Admin", "super-admin", "Front desk", etc., into predictable routes
            const rawRole = (profile?.role || 'client').toLowerCase().trim();
            
            let destination = DASHBOARDS.client; // Fallback

            if (rawRole.includes('admin')) {
                destination = DASHBOARDS.admin;
            } else if (rawRole.includes('staff') || rawRole.includes('front') || rawRole.includes('desk') || rawRole.includes('manager') || rawRole.includes('housekeeping') || rawRole.includes('maintenance')) {
                destination = DASHBOARDS.staff;
            } else {
                // "client", "guest", "trainee" all go here
                destination = DASHBOARDS.client;
            }
            
            window.location.href = destination;

        } catch (err) {
            console.error('Login error:', err);
            showAlert(err.message || 'Incorrect email or password. Please try again.');
            shake();
        }

        setLoading(false);
    });

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