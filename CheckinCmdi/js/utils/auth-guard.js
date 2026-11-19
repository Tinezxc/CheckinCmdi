
/* ==========================================================
   CMDI / HAVEN - GLOBAL AUTHENTICATION GUARD

   CLIENT:
   - client-dashboard.html
   - profile.html
   - accommodation.html

   STAFF:
   - staff-dashboard.html
   - staff-guests.html
   - staff-rooms.html
   - staff-checkin.html
   - staff-requests.html
   - staff-reports.html

   ADMIN:
   - admin-dashboard.html
   - admin-users.html
   - admin-data.html
   - admin-security.html
   - admin-audit.html
   - admin-health.html
   - admin-integrations.html

   FEATURES:
   - Supabase user verification
   - Role-based access control
   - Browser Back/Forward protection
   - BFCache authentication recheck
   - Secure logout and redirect
   ========================================================== */

(function () {
    'use strict';

    const ROLE_CACHE_KEY = 'haven_role_cache';

    const LOGIN_CHALLENGE_KEY = 'haven_login_challenge';
    const LOGIN_EMAIL_KEY = 'haven_login_email_masked';
    const LOGIN_NEXT_KEY = 'haven_login_next';

    const ROLE_GROUPS = {
        client: [
            'client'
        ],

        staff: [
            'staff',
            'front-desk',
            'housekeeping',
            'maintenance',
            'manager'
        ],

        admin: [
            'admin',
            'super-admin',
            'support-admin'
        ]
    };

    const DASHBOARDS = {
        client: 'client-dashboard.html',
        staff: 'staff-dashboard.html',
        admin: 'admin-dashboard.html'
    };

    let lastAllowedRoles = null;
    let checkingPromise = null;

    /* ==========================================================
       HELPERS
       ========================================================== */

    function normalizeRole(role) {
        return String(role || '')
            .toLowerCase()
            .trim();
    }

    function expandAllowedRoles(allowedRoles) {
        const expanded = [];

        allowedRoles.forEach(role => {
            const normalized = normalizeRole(role);

            if (ROLE_GROUPS[normalized]) {
                expanded.push(...ROLE_GROUPS[normalized]);
            } else {
                expanded.push(normalized);
            }
        });

        return [...new Set(expanded)];
    }

    function getDashboard(role) {
        const normalized = normalizeRole(role);

        if (ROLE_GROUPS.admin.includes(normalized)) {
            return DASHBOARDS.admin;
        }

        if (ROLE_GROUPS.staff.includes(normalized)) {
            return DASHBOARDS.staff;
        }

        return DASHBOARDS.client;
    }

    function hideProtectedPage() {
        document.documentElement.classList.add(
            'auth-checking'
        );
    }

    function showProtectedPage() {
        document.documentElement.classList.remove(
            'auth-checking'
        );
    }

    function redirectToLogin() {
        hideProtectedPage();

        window.location.replace(
            new URL('index.html', window.location.href).href
        );

        return null;
    }

    function redirectToCorrectDashboard(role) {
        hideProtectedPage();

        const destination = getDashboard(role);

        window.location.replace(
            new URL(destination, window.location.href).href
        );

        return null;
    }

    /* ==========================================================
       CORE AUTHENTICATION CHECK
       ========================================================== */

    async function validateAccess(allowedRoles) {

        // Prevent duplicate simultaneous checks.
        if (checkingPromise) {
            return checkingPromise;
        }

        checkingPromise = (async function () {

            try {
                const supabase = window.supabaseClient;

                if (!supabase) {
                    console.error(
                        'Supabase client is not initialized.'
                    );

                    return redirectToLogin();
                }

                // Verify the user with Supabase Auth.
                const {
                    data: userData,
                    error: userError
                } = await supabase.auth.getUser();

                if (userError || !userData?.user) {
                    console.warn(
                        'No valid authenticated user found.'
                    );

                    return redirectToLogin();
                }

                const user = userData.user;

                // Get the real account role from the database.
                const {
                    data: profile,
                    error: profileError
                } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError) {
                    console.error(
                        'Profile verification failed:',
                        profileError
                    );

                    return redirectToLogin();
                }

                // Never assume a missing profile is a client.
                if (!profile || !profile.role) {
                    console.error(
                        'No valid profile role was found.'
                    );

                    return redirectToLogin();
                }

                const userRole = normalizeRole(
                    profile.role
                );

                // Check allowed roles.
                const allowed = expandAllowedRoles(
                    allowedRoles
                );

                if (!allowed.includes(userRole)) {
                    console.warn(
                        'Access denied. User role:',
                        userRole
                    );

                    alert(
                        'Access Denied: You do not have permission to view this page.'
                    );

                    return redirectToCorrectDashboard(
                        userRole
                    );
                }

                // Cache role for existing dashboard logic.
                try {
                    localStorage.setItem(
                        ROLE_CACHE_KEY,
                        JSON.stringify({
                            uid: user.id,
                            role: userRole
                        })
                    );
                } catch (storageError) {
                    console.warn(
                        'Could not cache user role:',
                        storageError
                    );
                }

                // Restore page visibility after successful validation.
                showProtectedPage();

                // Return the current session.
                const {
                    data: sessionData,
                    error: sessionError
                } = await supabase.auth.getSession();

                if (sessionError || !sessionData?.session) {
                    return redirectToLogin();
                }

                return sessionData.session;

            } catch (error) {
                console.error(
                    'Authentication guard error:',
                    error
                );

                return redirectToLogin();

            } finally {
                checkingPromise = null;
            }

        })();

        return checkingPromise;
    }

    /* ==========================================================
       PAGE AUTHENTICATION
       Call this from every protected page.
       ========================================================== */

    async function requireAuth(
        allowedRoles = ['client', 'staff', 'admin']
    ) {
        lastAllowedRoles = allowedRoles;

        hideProtectedPage();

        return validateAccess(allowedRoles);
    }

    /* ==========================================================
       LOGOUT
       ========================================================== */

    async function logout() {

        const supabase = window.supabaseClient;

        if (!supabase) {
            return redirectToLogin();
        }

        hideProtectedPage();

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Logout failed:', error);

                showProtectedPage();

                alert(
                    'Unable to log out. Please try again.'
                );

                return false;
            }

            // Clear cached role and login challenge information.
            localStorage.removeItem(ROLE_CACHE_KEY);

            sessionStorage.removeItem(LOGIN_CHALLENGE_KEY);
            sessionStorage.removeItem(LOGIN_EMAIL_KEY);
            sessionStorage.removeItem(LOGIN_NEXT_KEY);

            // Return to login and remove current dashboard history.
            window.location.replace(
                new URL('index.html', window.location.href).href
            );

            return true;

        } catch (error) {
            console.error('Logout error:', error);

            showProtectedPage();

            return false;
        }
    }

    /* ==========================================================
       BROWSER BACK / FORWARD PROTECTION

       When the browser restores a dashboard from BFCache,
       verify the user's session again.
       ========================================================== */

    window.addEventListener('pagehide', function () {
        hideProtectedPage();
    });

    window.addEventListener('pageshow', function (event) {

        if (event.persisted) {

            hideProtectedPage();

            if (!lastAllowedRoles) {
                redirectToLogin();
                return;
            }

            validateAccess(lastAllowedRoles);
        }

    });

    /* ==========================================================
       GLOBAL AUTH GUARD API
       ========================================================== */

    window.AuthGuard = {

        requireAuth: requireAuth,

        logout: logout

    };

})();
