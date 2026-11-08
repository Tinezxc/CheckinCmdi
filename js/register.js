/* ==========================================================
   HAVEN — Register page (Supabase)
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('registerForm');
    const checkinInput = document.getElementById('checkin');
    const registerBtn = document.getElementById('registerBtn');

    /* ==========================================
       1) CHECK-IN DATE — smart input behaviour
       ========================================== */
    function formatDisplay(dateStr) {
        if (!dateStr) return '';
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
        if (m) return `${m[2]}/${m[3]}/${m[1]}`;
        return dateStr;
    }

    if (checkinInput) {
        checkinInput.type = 'text';
        checkinInput.placeholder = 'MM/DD/YYYY';

        checkinInput.addEventListener('focus', () => {
            const current = checkinInput.value;
            if (current) {
                const parts = current.split('/');
                if (parts.length === 3) {
                    checkinInput.value = `${parts[2]}-${parts[0]}-${parts[1]}`;
                }
            }
            checkinInput.type = 'date';
            if (typeof checkinInput.showPicker === 'function') {
                try { checkinInput.showPicker(); } catch (e) { /* ignore */ }
            }
        });

        checkinInput.addEventListener('blur', () => {
            const v = checkinInput.value;
            checkinInput.type = 'text';
            checkinInput.value = formatDisplay(v);
        });
    }

    /* ==========================================
       2) CAPITALIZATION
       ========================================== */
    const capFields = ['fullname', 'institution', 'branch', 'unit', 'address'];

    function capitalizeFirst(str) {
        const s = str.replace(/^\s+/, '');
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }

    function capitalizeWords(str) {
        return str
            .replace(/^\s+/, '')
            .toLowerCase()
            .replace(/(^|[\s'-])([a-z])/g, (m, sep, ch) => sep + ch.toUpperCase());
    }

    function formatCase(fieldId, value) {
        return fieldId === 'fullname' ? capitalizeWords(value) : capitalizeFirst(value);
    }

    capFields.forEach((fieldId) => {
        const input = document.getElementById(fieldId);
        if (!input) return;

        input.addEventListener('input', () => {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            input.value = formatCase(fieldId, input.value);
            input.setSelectionRange(start, end);
        });

        input.addEventListener('blur', () => {
            input.value = formatCase(fieldId, input.value).trim();
        });
    });

    /* ==========================================
       3) PASSWORD STRENGTH
       ========================================== */
    function getPasswordError(pw) {
        if (pw.length < 8)            return 'Password must be at least 8 characters.';
        if (/\s/.test(pw))            return 'Password cannot contain spaces.';
        if (!/[a-z]/.test(pw))        return 'Add at least one lowercase letter.';
        if (!/[A-Z]/.test(pw))        return 'Add at least one uppercase letter.';
        if (!/\d/.test(pw))           return 'Add at least one number.';
        if (!/[^A-Za-z0-9]/.test(pw)) return 'Add at least one special character (e.g. ! @ # $).';
        if (/(.)\1\1/.test(pw))       return 'Avoid repeating the same character 3 times in a row.';
        if (/password|qwerty|123456|abc123|letmein|admin/i.test(pw))
                                      return 'Password is too common. Choose something less predictable.';
        return '';
    }

    function getStrengthLevel(pw) {
        if (!pw) return 0;
        let score = 0;
        if (pw.length >= 8)  score++;
        if (pw.length >= 12) score++;
        if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
        if (/\d/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (getPasswordError(pw)) return Math.max(1, Math.min(score, 2));
        return score >= 5 ? 4 : 3;
    }

    /* ==========================================
       4) FIELD VALIDATION
       ========================================== */
    const rules = {
        'trainee-id': {
            required: true,
            pattern: /^[A-Za-z0-9\-_]{3,}$/,
            messages: {
                required: 'Trainee / Guest ID is required.',
                pattern: 'Use at least 3 letters, numbers, hyphens or underscores.'
            }
        },
        'fullname': {
            required: true,
            minLength: 2,
            messages: {
                required: 'Full name is required.',
                minLength: 'Please enter your full name.'
            }
        },
        'email': {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            messages: {
                required: 'Email address is required.',
                pattern: 'Please enter a valid email address.'
            }
        },
        'institution': { required: true, messages: { required: 'Institution is required.' } },
        'branch':      { required: true, messages: { required: 'Branch is required.' } },
        'unit':        { required: true, messages: { required: 'Unit is required.' } },
        'contact': {
            required: true,
            pattern: /^[\d\s+\-()]{7,}$/,
            messages: {
                required: 'Contact number is required.',
                pattern: 'Please enter a valid phone number.'
            }
        },
        'address': { required: true, messages: { required: 'Address is required.' } },
        'sex': {
            required: true,
            validate: (v) => ['Male', 'Female'].includes(v) || 'Please select Male or Female.',
            messages: { required: 'Sex is required.' }
        },
        'checkin': {
            required: true,
            validate: (v) => {
                const d = new Date(v);
                return !isNaN(d.getTime());
            },
            messages: {
                required: 'Check-in date is required.',
                validate: 'Please enter a valid date.'
            }
        },
        'password': {
            required: true,
            validate: (v) => getPasswordError(v) || true,
            messages: { required: 'Password is required.' }
        },
        'confirm-password': {
            required: true,
            matchField: 'password',
            messages: {
                required: 'Please confirm your password.',
                matchField: 'Passwords do not match.'
            }
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
    function clearAllErrors() {
        document.querySelectorAll('.form-group').forEach((g) => g.classList.remove('error'));
        document.querySelectorAll('.error-msg').forEach((e) => (e.textContent = ''));
    }

    function validateField(fieldId) {
        const rule = rules[fieldId];
        const input = document.getElementById(fieldId);
        if (!rule || !input) return true;

        const isPassword = fieldId === 'password' || fieldId === 'confirm-password';
        const value = isPassword ? input.value : input.value.trim();

        if (rule.required && !value) {
            showError(fieldId, rule.messages.required);
            return false;
        }
        if (!value) { clearError(fieldId); return true; }

        if (rule.minLength && value.length < rule.minLength) {
            showError(fieldId, rule.messages.minLength);
            return false;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
            showError(fieldId, rule.messages.pattern);
            return false;
        }
        if (rule.validate) {
            const result = rule.validate(value);
            if (result !== true) {
                showError(fieldId, typeof result === 'string' ? result : rule.messages.validate);
                return false;
            }
        }
        if (rule.matchField) {
            const other = document.getElementById(rule.matchField);
            if (other && value !== other.value) {
                showError(fieldId, rule.messages.matchField);
                return false;
            }
        }

        clearError(fieldId);
        return true;
    }

    function validateForm() {
        capFields.forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = formatCase(id, el.value).trim();
        });

        clearAllErrors();
        let firstInvalid = null;
        Object.keys(rules).forEach((fieldId) => {
            if (!validateField(fieldId) && !firstInvalid) {
                firstInvalid = document.getElementById(fieldId);
            }
        });
        if (firstInvalid) firstInvalid.focus();
        return !firstInvalid;
    }

    /* ==========================================
       5) LIVE VALIDATION & PASSWORD HELPERS
       ========================================== */
    Object.keys(rules).forEach((fieldId) => {
        const input = document.getElementById(fieldId);
        if (!input) return;
        input.addEventListener('blur', () => validateField(fieldId));
        input.addEventListener('input', () => {
            const group = input.closest('.form-group');
            if (group && group.classList.contains('error')) validateField(fieldId);
        });
        // <select> fires "change" — make sure the error clears right after picking
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', () => validateField(fieldId));
        }
    });

    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');

    if (passwordInput && confirmInput) {
        passwordInput.addEventListener('input', () => {
            if (confirmInput.value) validateField('confirm-password');
        });
    }

    const meter = document.getElementById('pwMeter');
    const meterLabel = document.getElementById('pwStrength');
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    if (passwordInput && meter) {
        passwordInput.addEventListener('input', () => {
            const level = getStrengthLevel(passwordInput.value);
            meter.dataset.level = level;
            if (meterLabel) meterLabel.textContent = level ? strengthLabels[level] : '';
        });
    }

    const pwChecks = {
        len:      (pw) => pw.length >= 8,
        upper:    (pw) => /[A-Z]/.test(pw),
        lower:    (pw) => /[a-z]/.test(pw),
        number:   (pw) => /\d/.test(pw),
        special:  (pw) => /[^A-Za-z0-9\s]/.test(pw),
        nospace:  (pw) => !/\s/.test(pw),
        norepeat: (pw) => !/(.)\1\1/.test(pw),
        common:   (pw) => !/password|qwerty|123456|abc123|letmein|admin/i.test(pw)
    };

    function updateChecklist(pw) {
        document.querySelectorAll('.pw-checklist li').forEach((li) => {
            const test = pwChecks[li.dataset.rule];
            if (!test) return;
            li.classList.toggle('met', !!pw && test(pw));
            li.classList.toggle('unmet', !!pw && !test(pw));
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', () => updateChecklist(passwordInput.value));
    }

    const pwHelp = document.getElementById('pwHelp');
    if (passwordInput && pwHelp) {
        const openHelp = () => pwHelp.classList.add('open');
        passwordInput.addEventListener('focus', openHelp);
        passwordInput.addEventListener('input', openHelp);
        passwordInput.addEventListener('blur', () => {
            if (!passwordInput.value) pwHelp.classList.remove('open');
        });
    }

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

    /* ==========================================
       6) FORM SUBMIT — SUPABASE AUTH + REDIRECT TO OTP
       ========================================== */
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            const card = document.querySelector('.register-card');
            if (card) {
                card.classList.add('shake');
                setTimeout(() => card.classList.remove('shake'), 400);
            }
            return;
        }

        const label = registerBtn.querySelector('.btn-label');
        const spinner = registerBtn.querySelector('.btn-spinner');
        registerBtn.disabled = true;
        if (label) label.hidden = true;
        if (spinner) spinner.hidden = false;

        try {
            const f = document.getElementById('registerForm');
            const get = (id) => (f?.querySelector(`#${id}`)?.value || '').trim();
            const getPw = () => f?.querySelector('#password')?.value || '';

            const loginId = get('trainee-id');
            const email = get('email'); 
            
            const numMatch = /(\d+)$/.exec(loginId);
            const guestId = numMatch ? `TR-${numMatch[1].padStart(4, '0')}` : `TR-${Date.now()}`;

            let checkIn = get('checkin');
            const mdY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(checkIn);
            if (mdY) {
                checkIn = `${mdY[3]}-${mdY[1].padStart(2, '0')}-${mdY[2].padStart(2, '0')}`;
            }

            // Create the user in Supabase Auth
            const { data: authData, error: authError } =
                await window.supabaseClient.auth.signUp({
                    email: email,
                    password: getPw(),
                    options: {
                        data: {
                            role: 'client',
                            full_name: get('fullname'),
                            guest_id: guestId,
                            reg_id: loginId,
                            phone: get('contact'),
                            institution: get('institution'),
                            branch: get('branch'),
                            gender: get('sex'),
                            unit: get('unit'),
                            address: get('address'),
                            check_in: checkIn || null
                        }
                    }
                });

            if (authError) throw authError;

            // Save email to session storage for the OTP page
            sessionStorage.setItem('haven_otp_email', email);

            // Redirect to OTP verification page
            window.location.href = 'verify-otp.html';

        } catch (err) {
            console.error('Registration error:', err);
            alert(err.message || 'Could not register. Please try again.');
        } finally {
            registerBtn.disabled = false;
            if (label) label.hidden = false;
            if (spinner) spinner.hidden = true;
        }
    });

    /* ==========================================
       7) KEYBOARD SHORTCUTS
       ========================================== */
    form?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
            const inputs = [...form.querySelectorAll('input, select')];
            const idx = inputs.indexOf(e.target);
            if (idx > -1 && idx < inputs.length - 1) {
                inputs[idx + 1].focus();
            } else if (idx === inputs.length - 1) {
                form.requestSubmit();
            }
        }
        if (e.key === 'Escape' && e.target.tagName === 'INPUT') {
            e.target.value = '';
            clearError(e.target.id);
            e.target.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    /* ==========================================
       8) SHAKE ANIMATION
       ========================================== */
    if (!document.getElementById('registerShakeCSS')) {
        const style = document.createElement('style');
        style.id = 'registerShakeCSS';
        style.textContent = `
            @keyframes haven-shake {
                0%, 100% { transform: translateX(0); }
                20% { transform: translateX(-6px); }
                40% { transform: translateX(6px); }
                60% { transform: translateX(-4px); }
                80% { transform: translateX(4px); }
            }
            .register-card.shake { animation: haven-shake 0.4s ease; }
        `;
        document.head.appendChild(style);
    }
});