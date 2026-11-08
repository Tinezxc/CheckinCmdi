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

/** Real floor / capacity of the guest's room (pending or approved).
 *  Uses the get_my_room() database function; falls back gracefully. */
async function fetchMyRoom(db, profile) {
    const roomNo = profile.room || profile.pending_room;
    if (!roomNo) return null;

    const fallback = {
        room_number: String(roomNo),
        floor: Number(String(roomNo).charAt(0)) || null,
        capacity: null,
        occupants: null
    };

    try {
        const { data, error } = await db.rpc('get_my_room');
        if (error || !data || !data.length) return fallback;
        return data[0];
    } catch (e) {
        return fallback;
    }
}

function bindAll(name, text) {
    document.querySelectorAll(`[data-bind="${name}"]`)
        .forEach(el => el.textContent = text);
}

function firstName(profile) {
    return profile.full_name ? profile.full_name.split(' ')[0] : 'Guest';
}

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

/** Mobile sidebar (hamburger menu) */
function setupSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!menuToggle || !sidebar) return;

    const setOpen = (open) => {
        sidebar.classList.toggle('open', open);
        if (overlay) overlay.classList.toggle('open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
    };

    menuToggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')));
    if (overlay) overlay.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

document.addEventListener('DOMContentLoaded', async () => {

    const db = window.supabaseClient;
    const guestShell = document.getElementById('guestShell');

    setupSidebar();

    // Make dashboard visible right away
    if (guestShell) guestShell.hidden = false;

    const { showSkeleton, hideSkeleton } = await loadSkeletonHelpers();

    if (guestShell) {
        showSkeleton(guestShell, { count: 5, type: 'list' });
    }

    try {

        // 1. Check Session
        const { data: { session }, error: sessionError } = await db.auth.getSession();

        if (sessionError || !session) {
            window.location.href = 'index.html';
            return;
        }

        // 2. Fetch Profile Data
        const { data: profile, error } = await db
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error || !profile) {
            throw error || new Error('Profile not found.');
        }

        const info = await fetchMyRoom(db, profile);

        // 3. Basic Data
        const initials = (profile.full_name || '')
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        bindAll('initials', initials);
        bindAll('name', profile.full_name || 'Guest');
        bindAll('registrationId', profile.reg_id || 'Pending');
        bindAll('guestId', profile.guest_id || 'Pending');
        bindAll('institution', profile.institution || '—');
        bindAll('branch', profile.branch || '—');

        // 4. UI Elements
        const progressBar = document.getElementById('progressFill');
        const progressTrack = document.getElementById('progressTrack');
        const progressText = document.getElementById('heroRemaining');
        const statusPill = document.getElementById('heroPill');
        const regPill = document.getElementById('regPill');
        const heroTitle = document.getElementById('heroTitle');
        const heroSub = document.getElementById('heroSub');
        const chooseRoomContainer = document.getElementById('chooseRoomContainer');
        const pendingContainer = document.getElementById('pendingContainer');

        const setProgress = (pct, text) => {
            if (progressTrack) progressTrack.setAttribute('aria-valuenow', String(pct));
            if (progressBar) progressBar.style.width = pct + '%';
            if (progressText) progressText.textContent = text;
        };
        const setPills = (label, regLabel, cls) => {
            if (statusPill) { statusPill.textContent = label; statusPill.className = 'status-pill ' + cls; }
            if (regPill) { regPill.textContent = regLabel; regPill.className = 'status-pill ' + cls; }
        };
        const floorText = info && info.floor ? 'Floor ' + info.floor : '—';
        const capacityText = info && info.capacity ? `Max ${info.capacity} guests` : '—';

        // 5. Dashboard Status Logic

        // STATE 1: No Room Selected (0%)
        if (!profile.room && !profile.pending_room) {

            setProgress(0, '0% Complete');
            setPills('No Room Selected', 'Incomplete', 'pending');

            if (heroTitle) heroTitle.textContent = 'Welcome, ' + firstName(profile);
            if (heroSub) heroSub.textContent = 'Please choose a room to start your stay.';

            if (chooseRoomContainer) chooseRoomContainer.style.display = 'block';
            if (pendingContainer) pendingContainer.style.display = 'none';

            ['room', 'floor', 'capacity', 'checkIn', 'checkOut'].forEach(n => bindAll(n, '—'));


        // STATE 2: Pending Approval (25%)
        } else if (profile.pending_room && !profile.room) {

            setProgress(25, '25% - Waiting for Approval');
            setPills('Pending Approval', 'Reviewing', 'pending');

            if (heroTitle) heroTitle.textContent = 'Hi, ' + firstName(profile);
            if (heroSub) heroSub.textContent = 'Your request for Room ' + profile.pending_room + ' is being reviewed.';

            if (chooseRoomContainer) chooseRoomContainer.style.display = 'none';
            if (pendingContainer) pendingContainer.style.display = 'block';

            bindAll('pendingRoom', profile.pending_room);
            bindAll('room', profile.pending_room + ' (Pending)');
            bindAll('floor', floorText);
            bindAll('capacity', capacityText);
            ['checkIn', 'checkOut'].forEach(n => bindAll(n, '—'));

            // Change room / cancel request
            const changeBtn = document.getElementById('changeRoomBtn');
            const cancelBtn = document.getElementById('cancelRequestBtn');

            if (changeBtn) {
                changeBtn.addEventListener('click', () => {
                    window.location.href = 'choose-room.html';
                });
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', async () => {
                    if (!confirm('Cancel your request for Room ' + profile.pending_room + '?')) return;
                    cancelBtn.disabled = true;
                    const { error: cancelError } = await db
                        .from('profiles')
                        .update({ pending_room: null })
                        .eq('id', session.user.id);
                    if (cancelError) {
                        alert('Could not cancel the request: ' + cancelError.message);
                        cancelBtn.disabled = false;
                        return;
                    }
                    window.location.reload();
                });
            }

            // Auto-refresh when staff approve / reject (checks every 15 seconds)
            const watcher = setInterval(async () => {
                const { data: latest } = await db
                    .from('profiles')
                    .select('room, pending_room')
                    .eq('id', session.user.id)
                    .single();
                if (latest && (latest.room || latest.pending_room !== profile.pending_room)) {
                    clearInterval(watcher);
                    window.location.reload();
                }
            }, 15000);


        // STATE 3: Approved / Checked In (100%)
        } else {

            setProgress(100, 'Approved - Checked In');
            setPills('Checked in', 'Active', 'checked-in');

            if (heroTitle) heroTitle.textContent = 'Hi, ' + firstName(profile);
            if (heroSub) heroSub.textContent = 'Welcome to your Haven dashboard.';

            if (chooseRoomContainer) chooseRoomContainer.style.display = 'none';
            if (pendingContainer) pendingContainer.style.display = 'none';

            bindAll('room', profile.room);
            bindAll('floor', floorText);
            bindAll('capacity', capacityText);

            const checkInDate = profile.check_in || profile.created_at;
            const storedCheckOut = profile.check_out ? new Date(profile.check_out) : null;
            const checkOutDate = storedCheckOut ||
                new Date(new Date(checkInDate).getTime() + 7 * 86400000);

            bindAll('checkIn', fmtDate(checkInDate));
            bindAll('checkOut', fmtDate(checkOutDate) + (storedCheckOut ? '' : ' (est.)'));
        }

    } catch (error) {

        console.error('Client Dashboard Loading Error:', error);
        alert('Unable to load dashboard. Please refresh the page.');

    } finally {

        // 6. Always remove skeleton after loading
        if (guestShell) hideSkeleton(guestShell);
    }

});