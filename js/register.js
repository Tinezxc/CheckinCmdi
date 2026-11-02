/* ==========================================================
   HAVEN — Register page (Supabase)
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');

    // --- Your existing validation logic stays exactly the same ---
    function getPasswordError(pw) { /* ... */ }
    function validateForm() { /* ... */ }
    // ... keep all your checks: rules, showError, clearError, etc.
    
    // (Paste your existing validation code here, up to the submit listener)

    /* ==========================================
       FORM SUBMIT — SUPABASE AUTH
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
            const numMatch = /(\d+)$/.exec(loginId);
            const guestId = numMatch ? `TR-${numMatch[1].padStart(4, '0')}` : `TR-${Date.now()}`;

            // Parse date
            let checkIn = get('checkin');
            const mdY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(checkIn);
            if (mdY) {
                checkIn = `${mdY[3]}-${mdY[1].padStart(2, '0')}-${mdY[2].padStart(2, '0')}`;
            }

            // 1. Create the user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: `${loginId.toLowerCase()}@haven.local`, // Fake email for demo
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
                        room: get('unit'),
                        check_in: checkIn || null
                    }
                }
            });

            if (authError) throw authError;

            alert('Account created successfully! You can now log in.');
            window.location.href = 'index.html';

        } catch (err) {
            console.error('Registration error:', err);
            alert(err.message || 'Could not register. Please try again.');
        } finally {
            registerBtn.disabled = false;
            if (label) label.hidden = false;
            if (spinner) spinner.hidden = true;
        }
    });
});