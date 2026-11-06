/**
 * CLIENT DASHBOARD
 * Loads the skeleton helpers safely: if the module can't be found,
 * the dashboard still renders (just without the skeleton effect).
 */

async function loadSkeletonHelpers() {
    const paths = [
        './utils/skeleton-loading.js',   // if the file is inside a utils/ folder
        './skeleton-loading.js'          // if it sits next to this file
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

document.addEventListener('DOMContentLoaded', async () => {

    const guestShell = document.getElementById('guestShell');

    // Make dashboard visible right away
    if (guestShell) {
        guestShell.hidden = false;
    }

    const { showSkeleton, hideSkeleton } = await loadSkeletonHelpers();

    if (guestShell) {
        showSkeleton(guestShell, {
            count: 5,
            type: 'list'
        });
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
        const { data: profile, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error || !profile) {
            throw error || new Error('Profile not found.');
        }

        // 3. Setup Basic Data
        const initials = (profile.full_name || '')
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        document.querySelectorAll('[data-bind="initials"]')
            .forEach(el => el.textContent = initials);

        document.querySelectorAll('[data-bind="name"]')
            .forEach(el => el.textContent = profile.full_name || 'Guest');

        document.querySelectorAll('[data-bind="registrationId"]')
            .forEach(el => el.textContent = profile.reg_id || 'Pending');

        document.querySelectorAll('[data-bind="guestId"]')
            .forEach(el => el.textContent = profile.guest_id || 'Pending');

        document.querySelectorAll('[data-bind="institution"]')
            .forEach(el => el.textContent = profile.institution || '—');

        document.querySelectorAll('[data-bind="branch"]')
            .forEach(el => el.textContent = profile.branch || '—');


        // 4. UI Elements
        const progressBar = document.getElementById('progressFill');
        const progressTrack = document.getElementById('progressTrack');
        const progressText = document.getElementById('heroRemaining');
        const statusPill = document.getElementById('heroPill');
        const regPill = document.getElementById('regPill');
        const heroTitle = document.getElementById('heroTitle');
        const heroSub = document.getElementById('heroSub');
        const chooseRoomContainer =
            document.getElementById('chooseRoomContainer');


        // 5. Dashboard Status Logic

        // STATE 1: No Room Selected (0%)
        if (!profile.room && !profile.pending_room) {

            if (progressTrack) {
                progressTrack.setAttribute('aria-valuenow', '0');
            }

            if (progressBar) progressBar.style.width = '0%';

            if (progressText) progressText.textContent = '0% Complete';

            if (statusPill) {
                statusPill.textContent = 'No Room Selected';
                statusPill.className = 'status-pill pending';
            }

            if (regPill) {
                regPill.textContent = 'Incomplete';
                regPill.className = 'status-pill pending';
            }

            if (heroTitle) {
                heroTitle.textContent =
                    'Welcome, ' +
                    (profile.full_name
                        ? profile.full_name.split(' ')[0]
                        : 'Guest');
            }

            if (heroSub) {
                heroSub.textContent =
                    'Please choose a room to start your stay.';
            }

            if (chooseRoomContainer) {
                chooseRoomContainer.style.display = 'block';
            }

            document.querySelectorAll('[data-bind="room"]')
                .forEach(el => el.textContent = '—');

            document.querySelectorAll('[data-bind="floor"]')
                .forEach(el => el.textContent = '—');

            document.querySelectorAll('[data-bind="capacity"]')
                .forEach(el => el.textContent = '—');

            document.querySelectorAll('[data-bind="checkIn"]')
                .forEach(el => el.textContent = '—');

            document.querySelectorAll('[data-bind="checkOut"]')
                .forEach(el => el.textContent = '—');


        // STATE 2: Pending Approval (25%)
        } else if (profile.pending_room && !profile.room) {

            if (progressTrack) {
                progressTrack.setAttribute('aria-valuenow', '25');
            }

            if (progressBar) progressBar.style.width = '25%';

            if (progressText) {
                progressText.textContent =
                    '25% - Waiting for Approval';
            }

            if (statusPill) {
                statusPill.textContent = 'Pending Approval';
                statusPill.className = 'status-pill pending';
            }

            if (regPill) {
                regPill.textContent = 'Reviewing';
                regPill.className = 'status-pill pending';
            }

            if (heroTitle) {
                heroTitle.textContent =
                    'Hi, ' +
                    (profile.full_name
                        ? profile.full_name.split(' ')[0]
                        : 'Guest');
            }

            if (heroSub) {
                heroSub.textContent =
                    'Your request for Room ' +
                    profile.pending_room +
                    ' is being reviewed.';
            }

            if (chooseRoomContainer) {
                chooseRoomContainer.style.display = 'none';
            }

            document.querySelectorAll('[data-bind="room"]')
                .forEach(el =>
                    el.textContent = profile.pending_room + ' (Pending)'
                );

            document.querySelectorAll('[data-bind="floor"]')
                .forEach(el => el.textContent = '—');

            document.querySelectorAll('[data-bind="capacity"]')
                .forEach(el => el.textContent = '—');

            document.querySelectorAll('[data-bind="checkIn"]')
                .forEach(el => el.textContent = '—');

            document.querySelectorAll('[data-bind="checkOut"]')
                .forEach(el => el.textContent = '—');


        // STATE 3: Approved / Checked In (100%)
        } else {

            if (progressTrack) {
                progressTrack.setAttribute('aria-valuenow', '100');
            }

            if (progressBar) progressBar.style.width = '100%';

            if (progressText) {
                progressText.textContent = 'Approved - Checked In';
            }

            if (statusPill) {
                statusPill.textContent = 'Checked in';
                statusPill.className = 'status-pill checked-in';
            }

            if (regPill) {
                regPill.textContent = 'Active';
                regPill.className = 'status-pill checked-in';
            }

            if (heroTitle) {
                heroTitle.textContent =
                    'Hi, ' +
                    (profile.full_name
                        ? profile.full_name.split(' ')[0]
                        : 'Guest');
            }

            if (heroSub) {
                heroSub.textContent =
                    'Welcome to your Haven dashboard.';
            }

            if (chooseRoomContainer) {
                chooseRoomContainer.style.display = 'none';
            }

            document.querySelectorAll('[data-bind="room"]')
                .forEach(el => el.textContent = profile.room);

            document.querySelectorAll('[data-bind="floor"]')
                .forEach(el =>
                    el.textContent = 'Floor ' + profile.room.charAt(0)
                );

            document.querySelectorAll('[data-bind="capacity"]')
                .forEach(el =>
                    el.textContent = profile.capacity
                        ? `Max ${profile.capacity} guests`
                        : 'Max 5 guests'
                );

            const checkInDate = profile.check_in || profile.created_at;

            const checkOutDate = new Date(
                new Date(checkInDate).getTime() + 7 * 86400000
            );

            document.querySelectorAll('[data-bind="checkIn"]')
                .forEach(el => el.textContent = fmtDate(checkInDate));

            document.querySelectorAll('[data-bind="checkOut"]')
                .forEach(el => el.textContent = fmtDate(checkOutDate));
        }


        // 6. Setup Mobile Sidebar
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (menuToggle && sidebar && overlay) {

            menuToggle.addEventListener('click', () => {
                const open = sidebar.classList.toggle('open');
                overlay.classList.toggle('open', open);
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('open');
            });
        }

    } catch (error) {

        console.error('Client Dashboard Loading Error:', error);

        alert('Unable to load dashboard. Please refresh the page.');

    } finally {

        // 7. Always remove skeleton after loading
        if (guestShell) {
            hideSkeleton(guestShell);
        }
    }

});


// Date Formatter
function fmtDate(s) {

    if (!s) return '—';

    const d = new Date(s);

    return isNaN(d.getTime())
        ? s
        : d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
}