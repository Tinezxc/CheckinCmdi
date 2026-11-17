
/* ==========================================================
   CMDI / HAVEN - COMBINED OTP VERIFICATION

   REGISTRATION:
   Google Form
   -> Registration Link
   -> Lookup
   -> Send OTP
   -> Verify OTP
   -> Create Password
   -> Login Page

   LOGIN:
   Email + Password
   -> Login OTP
   -> Verify Login OTP
   -> Authenticated Session
   -> Correct Dashboard
   ========================================================== */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', init);

    /* ==========================================================
       CONFIGURATION
       ========================================================== */

    const REGISTRATION_FUNCTION = 'dynamic-responder';
    const LOGIN_FUNCTION = 'dynamic-responder';

    const TOKEN_KEY = 'haven_reg_token';
    const NEED_PASSWORD_KEY = 'haven_need_password';
    const LEGACY_EMAIL_KEY = 'haven_otp_email';

    const LOGIN_CHALLENGE_KEY = 'haven_login_challenge';
    const LOGIN_EMAIL_KEY = 'haven_login_email_masked';
    const LOGIN_NEXT_KEY = 'haven_login_next';

    const ROLE_CACHE_KEY = 'haven_role_cache';

    const STAFF_ROLES = [
        'front-desk',
        'housekeeping',
        'maintenance',
        'manager'
    ];

    const STEPS = [
        'stepChecking',
        'stepInvalid',
        'stepSend',
        'stepInput',
        'stepPassword',
        'stepSuccess'
    ];

    const state = {
        mode: null,
        token: null,
        challengeId: null,
        legacyEmail: null,
        busy: false,
        verified: false,
        redirectTo: null,
        cooldownTimer: null
    };

    let db = null;

    /* ==========================================================
       HELPERS
       ========================================================== */

    function $(id) {
        return document.getElementById(id);
    }

    function otpBoxes() {
        return Array.from(document.querySelectorAll('.otp-box'));
    }

    function setText(id, value) {
        const element = $(id);

        if (element) {
            element.textContent = value == null ? '' : String(value);
        }
    }

    function showStep(id) {
        STEPS.forEach(stepId => {
            const element = $(stepId);

            if (element) {
                element.classList.toggle('hidden', stepId !== id);
            }
        });
    }

    function setButtonLoading(button, loading, label) {
        if (!button) return;

        if (loading) {
            if (!button.dataset.originalLabel) {
                button.dataset.originalLabel = button.textContent;
            }

            button.textContent = label || 'Please wait...';
        } else if (button.dataset.originalLabel) {
            button.textContent = button.dataset.originalLabel;
            delete button.dataset.originalLabel;
        }

        button.disabled = loading;
    }

    function setBoxesDisabled(disabled) {
        otpBoxes().forEach(box => {
            box.disabled = disabled;
        });
    }

    function clearBoxes() {
        otpBoxes().forEach(box => {
            box.value = '';
            box.classList.remove('filled');
            box.disabled = false;
        });

        const first = otpBoxes()[0];

        if (first) {
            first.focus();
        }
    }

    function getCode() {
        return otpBoxes().map(box => box.value).join('');
    }

    function focusFirstEmpty() {
        const first = otpBoxes().find(box => !box.value);

        if (first) {
            first.focus();
        }
    }

    function clearErrors() {
        setText('sendError', '');
        setText('otpError', '');
        setText('passwordError', '');
    }

    function showError(id, message) {
        setText(id, message);
    }

    function shakeBoxes() {
        const wrapper = document.querySelector('.otp-inputs');

        if (!wrapper) return;

        wrapper.classList.remove('shake');

        void wrapper.offsetWidth;

        wrapper.classList.add('shake');

        setTimeout(() => {
            wrapper.classList.remove('shake');
        }, 450);
    }

    /* ==========================================================
       ERROR MESSAGES
       ========================================================== */

    const LINK_ERRORS = {
        invalid: [
            'Invalid registration link',
            'This registration link is not valid.'
        ],

        expired: [
            'Registration link expired',
            'This link has expired. Please request a new registration link.'
        ],

        used: [
            'Registration already completed',
            'This registration link has already been used. Please go to Login.'
        ],

        locked: [
            'Verification temporarily locked',
            'Too many incorrect OTP attempts. Please contact CMDI staff.'
        ],

        network: [
            'Unable to reach the server',
            'Please check your internet connection and refresh this page.'
        ]
    };

    const ACTION_ERRORS = {
        email_rate_limited:
            'Too many OTP emails requested. Please wait a few minutes.',

        too_many_sends:
            'You have requested too many codes. Please contact CMDI staff.',

        send_failed:
            'We could not send your verification code. Please try again.',

        invite_only_blocked:
            'Registration cannot be started. Please contact CMDI staff.',

        bad_code_format:
            'Please enter all 6 digits.',

        otp_invalid:
            'Incorrect or expired verification code. Please try again.',

        profile_failed:
            'Your email was verified, but your profile could not be completed.',

        cooldown:
            'Please wait before requesting another code.',

        invalid_challenge:
            'Your login verification is no longer valid. Please log in again.',

        challenge_expired:
            'Your login OTP has expired. Please log in again.',

        locked:
            'Too many incorrect attempts. Please try again later.',

        network:
            'Could not reach the server. Please check your connection.'
    };

    function showLinkProblem(code) {
        const problem = LINK_ERRORS[code] || LINK_ERRORS.invalid;

        setText('invalidTitle', problem[0]);
        setText('invalidText', problem[1]);

        if (code !== 'network') {
            sessionStorage.removeItem(TOKEN_KEY);
        }

        showStep('stepInvalid');
    }

    /* ==========================================================
       EDGE FUNCTION REQUESTS

       REGISTRATION uses the registration Edge Function.
       LOGIN uses the dynamic-responder Edge Function.
       ========================================================== */

    async function invokeFunction(functionName, payload) {
        try {
            const { data, error } = await db.functions.invoke(
                functionName,
                {
                    body: payload
                }
            );

            if (error) {
                console.error(
                    'Edge Function error:',
                    functionName,
                    error
                );

                return {
                    ok: false,
                    code: 'network'
                };
            }

            return data || {
                ok: false,
                code: 'network'
            };

        } catch (error) {
            console.error('Function request exception:', error);

            return {
                ok: false,
                code: 'network'
            };
        }
    }

    async function callRegistration(action, extra = {}) {
        return invokeFunction(
            REGISTRATION_FUNCTION,
            Object.assign(
                {
                    action: action,
                    token: state.token
                },
                extra
            )
        );
    }

    async function callLogin(action, extra = {}) {
        return invokeFunction(
            LOGIN_FUNCTION,
            Object.assign(
                {
                    action: action,
                    challenge_id: state.challengeId
                },
                extra
            )
        );
    }

    /* ==========================================================
       REGISTRATION TOKEN
       ========================================================== */

    function readRegistrationToken() {
        const url = new URL(window.location.href);

        const tokenFromUrl = url.searchParams.get('token');

        if (tokenFromUrl) {
            sessionStorage.setItem(TOKEN_KEY, tokenFromUrl);

            // Remove token from visible browser URL.
            url.searchParams.delete('token');

            window.history.replaceState(
                {},
                '',
                url.pathname + url.search + url.hash
            );
        }

        return tokenFromUrl ||
            sessionStorage.getItem(TOKEN_KEY);
    }

    /* ==========================================================
       REGISTRATION FLOW
       ========================================================== */

    async function startRegistrationFlow(token) {
        state.mode = 'registration';
        state.token = token;

        showStep('stepChecking');
        clearErrors();

        try {
            // A previously verified registration may be resumed
            // after refreshing the password setup page.
            const { data: sessionData, error: sessionError } =
                await db.auth.getSession();

            if (
                !sessionError &&
                sessionData?.session &&
                sessionStorage.getItem(NEED_PASSWORD_KEY) === '1'
            ) {
                showStep('stepPassword');
                $('newPassword')?.focus();
                return;
            }

            // Validate the one-time registration link.
            const result = await callRegistration('lookup');

            if (!result || !result.ok) {
                showLinkProblem(result?.code || 'invalid');
                return;
            }

            // Show only the masked email returned by the backend.
            setText(
                'maskedEmail',
                result.masked_email || 'your registered email'
            );

            setText(
                'displayEmail',
                result.masked_email || 'your registered email'
            );

            setText(
                'greetName',
                result.first_name || 'there'
            );

            // The code may have been sent before the page was refreshed.
            if (result.code_sent) {
                showStep('stepInput');

                setText(
                    'otpTitle',
                    'Verify your email'
                );

                setText(
                    'otpInfo',
                    'Enter the 6-digit code sent to your registered email.'
                );

                clearBoxes();

                startCooldown(result.retry_after || 0);

            } else {
                showStep('stepSend');
            }

        } catch (error) {
            console.error('Registration initialization error:', error);
            showLinkProblem('network');
        }
    }

    /* ==========================================================
       LOGIN FLOW
       ========================================================== */

    function startLoginFlow() {
        state.mode = 'login';

        state.challengeId = sessionStorage.getItem(
            LOGIN_CHALLENGE_KEY
        );

        const email = sessionStorage.getItem(
            LOGIN_EMAIL_KEY
        ) || 'your registered email';

        if (!state.challengeId) {
            setText(
                'invalidTitle',
                'Login verification expired'
            );

            setText(
                'invalidText',
                'No active login verification was found. Please log in again.'
            );

            showStep('stepInvalid');
            return;
        }

        setText('otpTitle', 'Verify your login');

        setText(
            'otpInfo',
            'Enter the 6-digit code sent to your email.'
        );

        setText('displayEmail', email);

        showStep('stepInput');

        clearBoxes();

        // Initial Login OTP is already sent by start_login.
        startCooldown(60);
    }

    /* ==========================================================
       RESEND COOLDOWN
       ========================================================== */

    function startCooldown(seconds) {
        if (state.cooldownTimer) {
            clearInterval(state.cooldownTimer);
        }

        let remaining = Math.max(
            0,
            Math.ceil(Number(seconds) || 0)
        );

        const button = $('resendBtn');

        function update() {
            if (!button) return;

            if (remaining > 0) {
                button.disabled = true;

                setText(
                    'resendInfo',
                    'Resend available in ' + remaining + 's'
                );

            } else {
                button.disabled = false;

                setText(
                    'resendInfo',
                    "Didn't get the code?"
                );

                clearInterval(state.cooldownTimer);
                state.cooldownTimer = null;
            }
        }

        update();

        if (remaining > 0) {
            state.cooldownTimer = setInterval(() => {
                remaining--;
                update();
            }, 1000);
        }
    }

    /* ==========================================================
       SEND / RESEND OTP
       ========================================================== */

    async function sendCode() {
        if (state.busy) return;

        clearErrors();

        const isResend =
            !$('stepInput').classList.contains('hidden');

        const button = isResend
            ? $('resendBtn')
            : $('sendOtpBtn');

        setButtonLoading(button, true, 'Sending code...');

        state.busy = true;

        try {
            const result = state.mode === 'login'
                ? await callLogin('resend_login_otp')
                : await callRegistration('send_otp');

            if (!result || !result.ok) {

                if (
                    state.mode === 'registration' &&
                    ['invalid', 'expired', 'used', 'locked'].includes(result?.code)
                ) {
                    showLinkProblem(result.code);
                    return;
                }

                if (
                    state.mode === 'login' &&
                    ['invalid_challenge', 'challenge_expired', 'locked'].includes(result?.code)
                ) {
                    sessionStorage.removeItem(LOGIN_CHALLENGE_KEY);

                    setText(
                        'invalidTitle',
                        'Login verification expired'
                    );

                    setText(
                        'invalidText',
                        'Please log in again to request a new verification code.'
                    );

                    showStep('stepInvalid');
                    return;
                }

                if (result?.code === 'cooldown') {
                    startCooldown(result.retry_after || 30);
                }

                showError(
                    isResend ? 'otpError' : 'sendError',
                    ACTION_ERRORS[result?.code] ||
                    result?.error ||
                    'Could not send the verification code.'
                );

                return;
            }

            showStep('stepInput');

            setText(
                'otpTitle',
                state.mode === 'login'
                    ? 'Verify your login'
                    : 'Verify your email'
            );

            setText(
                'otpInfo',
                'Code sent. Check your inbox and spam folder.'
            );

            clearBoxes();

            startCooldown(result.retry_after || 60);

        } catch (error) {
            console.error('Send OTP error:', error);

            showError(
                isResend ? 'otpError' : 'sendError',
                error.message || ACTION_ERRORS.network
            );

        } finally {
            state.busy = false;
            setButtonLoading(button, false);
        }
    }

    /* ==========================================================
       OTP INPUT
       Auto-next, backspace, paste support.
       ========================================================== */

    function fillDigits(value, startIndex) {
        const list = otpBoxes();

        const digits = String(value)
            .replace(/\D/g, '')
            .slice(0, list.length - startIndex);

        if (!digits) return;

        digits.split('').forEach((digit, offset) => {
            const target = list[startIndex + offset];

            if (target) {
                target.value = digit;
                target.classList.add('filled');
            }
        });

        if (getCode().length === 6) {
            submitCode();
        } else {
            focusFirstEmpty();
        }
    }

    function submitCode() {
        const form = $('otpForm');

        if (form) {
            form.dispatchEvent(
                new Event('submit', {
                    bubbles: true,
                    cancelable: true
                })
            );
        }
    }

    function setupBoxes() {
        const list = otpBoxes();

        list.forEach((box, index) => {
            box.setAttribute('inputmode', 'numeric');
            box.setAttribute('maxlength', '1');

            box.addEventListener('focus', () => {
                box.select();
            });

            box.addEventListener('input', () => {
                if (state.busy || state.verified) return;

                const digits = box.value.replace(/\D/g, '');

                if (!digits) {
                    box.value = '';
                    box.classList.remove('filled');
                    return;
                }

                if (digits.length > 1) {
                    box.value = '';
                    fillDigits(digits, index);
                    return;
                }

                box.value = digits;
                box.classList.add('filled');

                if (index < list.length - 1) {
                    list[index + 1].focus();
                }

                if (getCode().length === 6) {
                    submitCode();
                }
            });

            box.addEventListener('keydown', event => {
                if (state.busy || state.verified) return;

                if (
                    event.key === 'Backspace' &&
                    !box.value &&
                    index > 0
                ) {
                    list[index - 1].value = '';
                    list[index - 1].classList.remove('filled');
                    list[index - 1].focus();
                }

                if (
                    event.key === 'ArrowLeft' &&
                    index > 0
                ) {
                    list[index - 1].focus();
                }

                if (
                    event.key === 'ArrowRight' &&
                    index < list.length - 1
                ) {
                    list[index + 1].focus();
                }

                if (event.key === 'Enter') {
                    event.preventDefault();
                    submitCode();
                }
            });

            box.addEventListener('paste', event => {
                if (state.busy || state.verified) return;

                event.preventDefault();

                const pasted = event.clipboardData
                    .getData('text')
                    .replace(/\D/g, '');

                if (pasted) {
                    fillDigits(pasted, index);
                }
            });
        });
    }

    /* ==========================================================
       LOGIN DESTINATION
       ========================================================== */

    function getLoginDestination(role) {
        const normalizedRole = String(role || 'client')
            .toLowerCase()
            .trim();

        const next = sessionStorage.getItem(
            LOGIN_NEXT_KEY
        ) || '';

        const safeNext = /^staff-[a-z]+\.html$/.test(next)
            ? next
            : null;

        if (STAFF_ROLES.includes(normalizedRole)) {
            return safeNext || 'staff-dashboard.html';
        }

        if (
            ['admin', 'super-admin', 'support-admin'].includes(normalizedRole)
        ) {
            return 'admin-dashboard.html';
        }

        return 'client-dashboard.html';
    }

    /* ==========================================================
       VERIFY LOGIN OTP
       ========================================================== */

    async function verifyLoginCode(code) {
        const result = await callLogin(
            'verify_login_otp',
            { code: code }
        );

        if (!result || !result.ok) {

            if (
                ['invalid_challenge', 'challenge_expired', 'locked'].includes(result?.code)
            ) {
                sessionStorage.removeItem(LOGIN_CHALLENGE_KEY);

                setText(
                    'invalidTitle',
                    'Login verification expired'
                );

                setText(
                    'invalidText',
                    'Please return to Login and sign in again.'
                );

                showStep('stepInvalid');
                return false;
            }

            showError(
                'otpError',
                ACTION_ERRORS[result?.code] ||
                result?.error ||
                'Incorrect or expired OTP.'
            );

            return false;
        }

        if (!result.access_token || !result.refresh_token) {
            showError(
                'otpError',
                'The server did not return an authenticated session.'
            );

            return false;
        }

        // Save the verified Supabase session.
        const { error: sessionError } = await db.auth.setSession({
            access_token: result.access_token,
            refresh_token: result.refresh_token
        });

        if (sessionError) {
            console.error('Login session error:', sessionError);

            showError(
                'otpError',
                'Your OTP was verified, but we could not save your session.'
            );

            return false;
        }

        // Confirm authenticated user.
        const { data: userData, error: userError } =
            await db.auth.getUser();

        if (userError || !userData?.user) {
            await db.auth.signOut();

            showError(
                'otpError',
                'Could not confirm your account. Please log in again.'
            );

            return false;
        }

        const userId = userData.user.id;

        // Get actual account role.
        const { data: profile, error: profileError } = await db
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle();

        if (profileError || !profile) {
            console.error('Profile lookup error:', profileError);

            await db.auth.signOut();

            showError(
                'otpError',
                'We could not load your account role. Please contact CMDI staff.'
            );

            return false;
        }

        const role = String(profile.role || 'client')
            .toLowerCase()
            .trim();

        try {
            localStorage.setItem(
                ROLE_CACHE_KEY,
                JSON.stringify({
                    uid: userId,
                    role: role
                })
            );
        } catch (error) {
            console.warn('Could not cache role:', error);
        }

        const destination = getLoginDestination(role);

        sessionStorage.removeItem(LOGIN_CHALLENGE_KEY);
        sessionStorage.removeItem(LOGIN_EMAIL_KEY);
        sessionStorage.removeItem(LOGIN_NEXT_KEY);

        state.verified = true;
        state.redirectTo = destination;

        setText('successTitle', 'Login verified');

        setText(
            'successText',
            'Your account is verified. Opening your dashboard...'
        );

        if ($('continueBtn')) {
            $('continueBtn').textContent = 'Continue to Dashboard';
        }

        showStep('stepSuccess');

        setTimeout(() => {
            window.location.replace(destination);
        }, 1400);

        return true;
    }

    /* ==========================================================
       VERIFY REGISTRATION OTP
       ========================================================== */

    async function verifyRegistrationCode(code) {
        const result = await callRegistration(
            'verify_otp',
            { code: code }
        );

        if (!result || !result.ok) {

            if (
                ['invalid', 'expired', 'used', 'locked'].includes(result?.code)
            ) {
                showLinkProblem(result.code);
                return false;
            }

            showError(
                'otpError',
                ACTION_ERRORS[result?.code] ||
                result?.error ||
                'The registration OTP could not be verified.'
            );

            return false;
        }

        if (!result.access_token || !result.refresh_token) {
            showError(
                'otpError',
                'The server did not return an account session. Please contact CMDI staff.'
            );

            return false;
        }

        // Save the verified registration session.
        const { error: sessionError } = await db.auth.setSession({
            access_token: result.access_token,
            refresh_token: result.refresh_token
        });

        if (sessionError) {
            console.error('Registration session error:', sessionError);

            showError(
                'otpError',
                'Your email was verified, but we could not start account setup.'
            );

            return false;
        }

        sessionStorage.setItem(NEED_PASSWORD_KEY, '1');

        state.verified = true;

        showStep('stepPassword');

        $('newPassword')?.focus();

        return true;
    }

    /* ==========================================================
       VERIFY LEGACY SIGN-UP OTP
       ========================================================== */

    async function verifyLegacyCode(code) {
        try {
            const { error } = await db.auth.verifyOtp({
                email: state.legacyEmail,
                token: code,
                type: 'signup'
            });

            if (error) throw error;

            sessionStorage.removeItem(LEGACY_EMAIL_KEY);

            state.verified = true;
            state.redirectTo = 'index.html';

            setText('successTitle', 'Email verified');

            setText(
                'successText',
                'Your email has been verified. You can now log in.'
            );

            showStep('stepSuccess');

            return true;

        } catch (error) {
            console.error('Legacy OTP error:', error);

            showError(
                'otpError',
                'Invalid or expired verification code.'
            );

            return false;
        }
    }

    /* ==========================================================
       MAIN VERIFY HANDLER
       ========================================================== */

    async function verifyCode() {
        if (state.busy || state.verified) return;

        const code = getCode();

        if (!/^\d{6}$/.test(code)) {
            showError('otpError', 'Please enter all 6 digits.');
            return;
        }

        state.busy = true;
        setBoxesDisabled(true);
        clearErrors();

        let success = false;

        try {
            if (state.mode === 'login') {
                success = await verifyLoginCode(code);

            } else if (state.mode === 'legacy') {
                success = await verifyLegacyCode(code);

            } else if (state.mode === 'registration') {
                success = await verifyRegistrationCode(code);
            }

        } catch (error) {
            console.error('OTP verification error:', error);

            showError(
                'otpError',
                error.message || 'Could not verify the OTP.'
            );

        } finally {
            state.busy = false;

            if (!success && !state.verified) {
                if (
                    $('stepInvalid') &&
                    !$('stepInvalid').classList.contains('hidden')
                ) {
                    setBoxesDisabled(true);
                } else {
                    clearBoxes();
                    setBoxesDisabled(false);
                    shakeBoxes();
                }
            }
        }
    }

    /* ==========================================================
       CREATE PASSWORD AFTER REGISTRATION
       ========================================================== */

    function validatePassword(password) {
        if (password.length < 8) {
            return 'Password must be at least 8 characters.';
        }

        if (/\s/.test(password)) {
            return 'Password cannot contain spaces.';
        }

        if (!/[a-z]/.test(password)) {
            return 'Add at least one lowercase letter.';
        }

        if (!/[A-Z]/.test(password)) {
            return 'Add at least one uppercase letter.';
        }

        if (!/\d/.test(password)) {
            return 'Add at least one number.';
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            return 'Add at least one special character.';
        }

        return '';
    }

    async function savePassword(event) {
        event.preventDefault();

        if (state.busy) return;

        clearErrors();

        const password = $('newPassword').value;
        const confirmPassword = $('confirmPassword').value;

        const passwordError = validatePassword(password);

        if (passwordError) {
            showError('passwordError', passwordError);
            return;
        }

        if (password !== confirmPassword) {
            showError(
                'passwordError',
                'Passwords do not match.'
            );

            return;
        }

        const button = $('savePasswordBtn');

        state.busy = true;

        setButtonLoading(
            button,
            true,
            'Saving password...'
        );

        try {
            const { error: updateError } =
                await db.auth.updateUser({
                    password: password
                });

            if (updateError) throw updateError;

            // Registration is complete.
            // Sign out so the client must use normal Login + Login OTP.
            const { error: signOutError } = await db.auth.signOut();

            if (signOutError) {
                console.warn(
                    'Could not sign out after registration:',
                    signOutError
                );
            }

            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(NEED_PASSWORD_KEY);
            sessionStorage.removeItem(LEGACY_EMAIL_KEY);

            state.verified = true;
            state.redirectTo = 'index.html';

            setText(
                'successTitle',
                'Registration complete'
            );

            setText(
                'successText',
                'Your password has been created. Please log in using your email and new password.'
            );

            if ($('continueBtn')) {
                $('continueBtn').textContent = 'Go to Login';
            }

            showStep('stepSuccess');

            setTimeout(() => {
                window.location.replace('index.html');
            }, 1800);

        } catch (error) {
            console.error('Password setup error:', error);

            showError(
                'passwordError',
                error.message || 'Could not save your password.'
            );

        } finally {
            state.busy = false;

            setButtonLoading(
                button,
                false
            );
        }
    }

    /* ==========================================================
       CONTINUE BUTTON
       ========================================================== */

    function continueAfterSuccess() {
        window.location.href = state.redirectTo || 'index.html';
    }

    /* ==========================================================
       LEGACY REGISTRATION
       ========================================================== */

    function startLegacyFlow(email) {
        state.mode = 'legacy';
        state.legacyEmail = email;

        setText('otpTitle', 'Verify your email');
        setText('otpInfo', 'Enter the 6-digit code sent to your email.');
        setText('displayEmail', email);

        $('resendRow')?.classList.add('hidden');

        showStep('stepInput');
        clearBoxes();
    }

    /* ==========================================================
       INITIALIZE
       ========================================================== */

    async function init() {
        db = window.supabaseClient;

        if (!db) {
            showLinkProblem('network');
            return;
        }

        if (otpBoxes().length !== 6) {
            console.error('OTP page must contain exactly six OTP input boxes.');
            showLinkProblem('network');
            return;
        }

        setupBoxes();

        $('otpForm')?.addEventListener('submit', event => {
            event.preventDefault();
            verifyCode();
        });

        $('sendOtpBtn')?.addEventListener('click', sendCode);

        $('resendBtn')?.addEventListener('click', sendCode);

        $('passwordForm')?.addEventListener('submit', savePassword);

        $('continueBtn')?.addEventListener(
            'click',
            continueAfterSuccess
        );

        // PRIORITY 1: Registration link with ?token=...
        const registrationToken = readRegistrationToken();

        if (registrationToken) {
            await startRegistrationFlow(registrationToken);
            return;
        }

        // PRIORITY 2: Login OTP.
        const flow = new URLSearchParams(
            window.location.search
        ).get('flow');

        if (flow === 'login') {
            startLoginFlow();
            return;
        }

        // PRIORITY 3: Existing sign-up flow.
        const legacyEmail = sessionStorage.getItem(
            LEGACY_EMAIL_KEY
        );

        if (legacyEmail) {
            startLegacyFlow(legacyEmail);
            return;
        }

        // No registration token or login challenge.
        showLinkProblem('missing');
    }

})();
