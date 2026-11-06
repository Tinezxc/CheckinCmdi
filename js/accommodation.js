/**
 * ACCOMMODATION PAGE
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

    // Safe text setter: skips elements that don't exist on the page
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    try {

        // 1. Check Session
        const { data: { session }, error: sessionError } =
            await window.supabaseClient.auth.getSession();

        if (sessionError || !session) {
            window.location.href = 'index.html';
            return;
        }

        // 2. Fetch Profile Data
        const { data: p, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error || !p) {
            console.error('Error fetching accommodation data:', error);
            return;
        }

        // 3. Update UI with Real Data
        const initials = (p.full_name || '')
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        // Sidebar
        document.querySelectorAll('[data-bind="initials"]')
            .forEach(el => el.textContent = initials);
        document.querySelectorAll('[data-bind="name"]')
            .forEach(el => el.textContent = p.full_name || 'Guest');
        document.querySelectorAll('[data-bind="regId"]')
            .forEach(el => el.textContent = p.reg_id || 'Pending');

        // Page Header (Dorm Info)
        const roomNum = p.room || 'Unassigned';

        setText(
            'dormTitle',
            roomNum !== 'Unassigned' ? `Dorm ${roomNum}` : 'No Room Assigned'
        );
        setText(
            'dormSub',
            p.room
                ? `Floor ${p.room.charAt(0)} · Shared dormitory`
                : 'Please contact front desk'
        );

        // Stay Details
        setText(
            'factCheckIn',
            p.check_in
                ? new Date(p.check_in).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })
                : '—'
        );
        setText('factCheckOut', 'TBD'); // You can add a check_out column later
        setText('factStatus', p.room ? 'Checked in' : 'Not checked in');

        // Dorm Details
        setText('dormFloor', p.room ? `Floor ${p.room.charAt(0)}` : '—');
        setText('dormCapacity', p.capacity || '5 Trainees'); // Will use database capacity soon

        // Status Pill
        const statusLabel = document.getElementById('statusLabel');
        if (statusLabel) {
            if (p.room) {
                statusLabel.textContent = 'Checked in';
                statusLabel.className = 'status ok';
            } else {
                statusLabel.textContent = 'Not checked in';
                statusLabel.className = 'status warn';
            }
        }

    } catch (err) {

        console.error('Accommodation Loading Error:', err);
        alert('Unable to load accommodation details. Please refresh the page.');

    } finally {

        // Always remove skeleton after loading
        if (shell) hideSkeleton(shell);
    }
});