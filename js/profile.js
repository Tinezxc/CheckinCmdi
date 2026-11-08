/**
 * PROFILE PAGE
 * Skeleton helpers are loaded safely: if the module can't be found,
 * the page still renders (just without the skeleton effect).
 */

async function loadSkeletonHelpers() {
    const paths = [
        './utils/skeleton-loading.js',   // js/utils/skeleton-loading.js
        './skeleton-loading.js'          // js/skeleton-loading.js
    ];

    for (const path of paths) {
        try {
            const mod = await import(path);
            return {
                showSkeleton: mod.showSkeleton,
                hideSkeleton: mod.hideSkeleton
            };
        } catch (err) {
            console.warn('Skeleton module not found at', path);
        }
    }

    // Fallback: no-ops so the page never breaks
    return { showSkeleton() {}, hideSkeleton() {} };
}

/**
 * MOBILE SIDEBAR (hamburger menu)
 * Runs immediately, before any data loads, so the menu always works.
 */
function setupSidebar() {
    const menuToggle = document.getElementById('menuToggle') ||
        document.querySelector('.menu-toggle, .hamburger, [data-menu-toggle]');
    const sidebar = document.getElementById('sidebar') ||
        document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay') ||
        document.querySelector('.sidebar-overlay');

    if (!menuToggle || !sidebar) {
        console.warn('Sidebar toggle not set up: menu button or sidebar not found.');
        return;
    }

    // Prevent binding twice if this runs again
    if (menuToggle.dataset.sidebarBound === 'true') return;
    menuToggle.dataset.sidebarBound = 'true';

    const setOpen = (open) => {
        sidebar.classList.toggle('open', open);
        if (overlay) overlay.classList.toggle('open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
    };

    menuToggle.addEventListener('click', () => {
        setOpen(!sidebar.classList.contains('open'));
    });

    if (overlay) {
        overlay.addEventListener('click', () => setOpen(false));
    }

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
    });

    // Close the menu after tapping a link inside it
    sidebar.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setOpen(false));
    });
}

document.addEventListener('DOMContentLoaded', async () => {

    // Make the hamburger menu work right away
    setupSidebar();

    // The element that gets the skeleton. Uses #guestShell if the page has it,
    // otherwise falls back to the <main> element.
    const shell =
        document.getElementById('guestShell') ||
        document.querySelector('main');

    if (shell) shell.hidden = false;

    const { showSkeleton, hideSkeleton } = await loadSkeletonHelpers();

    if (shell) {
        showSkeleton(shell, { count: 5, type: 'list' });
    }

    try {

        // 1. Check Session
        const { data: { session }, error: sessionError } =
            await window.supabaseClient.auth.getSession();

        if (sessionError || !session) {
            window.location.href = 'index.html';
            return;
        }

        // 2. Fetch Profile Data
        const { data: p, error: profileError } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError || !p) {
            console.error('Error fetching profile:', profileError);
            alert('Could not load profile data.');
            return;
        }

        // 3. Hydrate UI
        const ini = (p.full_name || '')
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        ['mobileAvatar', 'chipAvatar', 'topAvatar', 'avatarLarge'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.textContent = ini || '—';
        });

        const chipName = document.getElementById('chipName');
        if (chipName) chipName.textContent = p.full_name || 'Guest';

        const chipRole = document.getElementById('chipRole');
        if (chipRole) {
            chipRole.textContent = p.guest_id ? `Guest · ${p.guest_id}` : 'Guest';
        }

        const profileTitle = document.getElementById('profileTitle');
        if (profileTitle) profileTitle.textContent = p.full_name || 'Guest';

        const guestIdChip = document.getElementById('guestIdChip');
        if (guestIdChip) {
            guestIdChip.textContent = `Guest ID · ${p.reg_id || 'Pending'}`;
        }

        const setField = (name, value) => {
            const el = document.querySelector(`.field-value[data-name="${name}"]`);
            if (!el) return;
            el.textContent = value || '—';
            el.classList.toggle('muted', !value);
        };

        setField('fullname', p.full_name);
        setField('email', session.user.email);
        setField('phone', p.phone);
        setField('sex', p.gender);
        setField('institution', p.institution);
        setField('guestId', p.guest_id);

        const setSummary = (name, value) => {
            const el = document.querySelector(`[data-summary="${name}"]`);
            if (el) {
                el.textContent = value || '—';
                el.classList.toggle('muted', !value);
            }
        };

        setSummary('institution', p.institution);
        setSummary('branch', p.branch);
        setSummary('room', p.room || (p.pending_room ? `${p.pending_room} (Pending)` : 'Unassigned'));
        setSummary(
            'checkIn',
            p.check_in
                ? new Date(p.check_in).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })
                : '—'
        );
        setSummary('regId', p.reg_id);

        // Status pill reflects the real state (not always "Checked in")
        const statusPill = document.getElementById('statusPill');
        if (statusPill) {
            let cls = 'neutral', label = 'No room selected';
            if (p.room) { cls = 'checked-in'; label = 'Checked in'; }
            else if (p.pending_room) { cls = 'overdue'; label = 'Pending approval'; }
            statusPill.className = 'status-pill ' + cls;
            statusPill.innerHTML = '<span class="dot"></span> ' + label;
        }

        // 4. Setup QR Code
        const qrBtn = document.getElementById('qrBtn');
        if (qrBtn) {
            if (p.guest_id) {
                // Show button if guest_id exists
                qrBtn.hidden = false;

                // Add click event to open the modal
                qrBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.openQR) {
                        window.openQR(p.guest_id, p.full_name);
                    } else {
                        console.error('QR Script not loaded!');
                    }
                });
            } else {
                qrBtn.hidden = true;
            }
        }

        // 5. Change Password Logic
        const passwordForm = document.getElementById('changePasswordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const pwErr = document.getElementById('pwErr');
                const confirmErr = document.getElementById('confirmErr');
                const saveBtn = document.getElementById('savePasswordBtn');

                pwErr.textContent = '';
                confirmErr.textContent = '';

                if (newPassword.length < 8) {
                    pwErr.textContent = 'Password must be at least 8 characters.';
                    return;
                }
                if (newPassword !== confirmPassword) {
                    confirmErr.textContent = 'Passwords do not match.';
                    return;
                }

                saveBtn.disabled = true;
                saveBtn.textContent = 'Updating...';

                const { error } = await window.supabaseClient.auth.updateUser({
                    password: newPassword
                });

                if (error) {
                    alert('Error updating password: ' + error.message);
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Update Password';
                } else {
                    alert('Success! Your password has been updated.');
                    passwordForm.reset();
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Update Password';
                }
            });
        }

    } catch (err) {

        console.error('Profile Loading Error:', err);
        alert('Unable to load profile. Please refresh the page.');

    } finally {

        // Always remove skeleton after loading
        if (shell) hideSkeleton(shell);
    }
});