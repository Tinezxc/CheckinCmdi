/* ==========================================================
   HAVEN — Login page (Supabase)
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const idInput = document.getElementById('registration-id');
    const pwInput = document.getElementById('password');
    const alertBox = document.getElementById('loginAlert');

    const DASHBOARDS = {
        client: 'client-dashboard.html',
        staff: 'staff-dashboard.html',
        admin: 'admin-dashboard.html'
    };

    // (Paste your existing validation code here)

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();

        if (!validateForm()) return;

        const label = loginBtn.querySelector('.btn-label');
        const spinner = loginBtn.querySelector('.btn-spinner');
        loginBtn.disabled = true;
        if (label) label.hidden = true;
        if (spinner) spinner.hidden = false;

        try {
            const loginId = idInput.value.trim().toLowerCase();

            // 1. Sign in with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: `${loginId}@haven.local`, 
                password: pwInput.value
            });

            if (authError) throw authError;

            // 2. Fetch the user's profile to get their role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (profileError) throw profileError;

            // 3. Redirect based on role
            const role = profile?.role || 'client';
            const destination = DASHBOARDS[role] || DASHBOARDS.client;
            
            window.location.href = destination;

        } catch (err) {
            console.error('Login error:', err);
            showAlert('Incorrect ID or password. Please try again.');
            shake();
        } finally {
            loginBtn.disabled = false;
            if (label) label.hidden = false;
            if (spinner) spinner.hidden = true;
        }
    });
});