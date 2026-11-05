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

            if (authError) throw authError;

            // 2. Fetch Profile
            const { data: profile, error: profileError } = await window.supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (profileError) throw profileError;

            // 3. Route based on Role
            const rawRole = (profile?.role || 'client').toLowerCase().trim();
            let destination = DASHBOARDS.client;

            if (rawRole.includes('admin')) {
                destination = DASHBOARDS.admin;
            } else if (rawRole.includes('staff') || rawRole.includes('front') || rawRole.includes('desk') || rawRole.includes('manager')) {
                destination = DASHBOARDS.staff;
            }
            
            // Redirect to Dashboard (Gatekeeper sa client-dashboard.js ang bahala kung walang room)
            window.location.href = destination;

        } catch (err) {
            console.error('Login error:', err);
            showAlert(err.message || 'Incorrect email or password.');
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