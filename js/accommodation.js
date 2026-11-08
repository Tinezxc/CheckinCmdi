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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
    });

    sidebar.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setOpen(false));
    });
}

/** Real floor / capacity of the guest's room (pending or approved). */
async function fetchMyRoom(db, p) {
    const roomNo = p.room || p.pending_room;
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

const fmtDate = (d) =>
    d && !isNaN(new Date(d).getTime())
        ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

function stayProgress(start, end) {
    const s = new Date(start).getTime();
    const e = end.getTime();
    if (isNaN(s) || isNaN(e) || e <= s) return 0;
    return Math.max(0, Math.min(100, Math.round(((Date.now() - s) / (e - s)) * 100)));
}

const REQUEST_LABELS = {
    extend: 'Extend stay',
    checkout: 'Check-out request',
    maintenance: 'Maintenance',
    housekeeping: 'Housekeeping',
    other: 'Other'
};
const STATUS_LABELS = {
    pending: 'Pending',
    in_progress: 'In progress',
    done: 'Done',
    rejected: 'Declined'
};

document.addEventListener('DOMContentLoaded', async () => {

    const db = window.supabaseClient;

    // Make the hamburger menu work right away
    setupSidebar();

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
        const { data: { session }, error: sessionError } = await db.auth.getSession();

        if (sessionError || !session) {
            window.location.href = 'index.html';
            return;
        }

        // 2. Fetch Profile Data
        const { data: p, error } = await db
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error || !p) {
            console.error('Error fetching accommodation data:', error);
            return;
        }

        const info = await fetchMyRoom(db, p);
        const approved = !!p.room;
        const pending = !approved && !!p.pending_room;

        // 3. Sidebar
        const initials = (p.full_name || '')
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        document.querySelectorAll('[data-bind="initials"]')
            .forEach(el => el.textContent = initials);
        document.querySelectorAll('[data-bind="name"]')
            .forEach(el => el.textContent = p.full_name || 'Guest');
        document.querySelectorAll('[data-bind="regId"]')
            .forEach(el => el.textContent = p.reg_id || 'Pending');

        // 4. Page header (dorm info)
        const floorLabel = info && info.floor ? `Floor ${info.floor}` : '—';

        if (approved) {
            setText('dormTitle', `Dorm ${p.room}`);
            setText('dormSub', `${floorLabel} · Shared dormitory`);
        } else if (pending) {
            setText('dormTitle', `Room ${p.pending_room} (Pending approval)`);
            setText('dormSub', 'Waiting for staff to approve your room request');
        } else {
            setText('dormTitle', 'No Room Selected');
            setText('dormSub', 'Choose a room from your dashboard to get started');
        }

        // 5. Stay details
        const checkIn = p.check_in || p.created_at;
        const storedCheckOut = p.check_out ? new Date(p.check_out) : null;
        const checkOut = storedCheckOut || new Date(new Date(checkIn).getTime() + 7 * 86400000);

        setText('factCheckIn', approved ? fmtDate(checkIn) : '—');
        setText('factCheckOut', approved ? fmtDate(checkOut) + (storedCheckOut ? '' : ' (est.)') : '—');
        setText('factStatus', approved ? 'Checked in' : pending ? 'Pending approval' : 'Not checked in');

        // Stay progress bar
        const pct = approved ? stayProgress(checkIn, checkOut) : 0;
        const bar = document.getElementById('stayBar');
        const fill = document.getElementById('stayBarFill');
        if (bar) bar.setAttribute('aria-valuenow', String(pct));
        if (fill) fill.style.width = pct + '%';

        // Status pill
        const statusLabel = document.getElementById('statusLabel');
        if (statusLabel) {
            if (approved) {
                statusLabel.textContent = 'Checked in';
                statusLabel.className = 'status ok';
            } else if (pending) {
                statusLabel.textContent = 'Pending approval';
                statusLabel.className = 'status warn';
            } else {
                statusLabel.textContent = 'Not checked in';
                statusLabel.className = 'status warn';
            }
        }

        // 6. Dorm details (real data from the rooms table)
        setText('dormFloor', floorLabel);
        setText('dormCapacity', info && info.capacity ? `${info.capacity} trainees` : '—');

        // 7. Wi-Fi (only handed out to approved guests)
        const wifiNote = document.getElementById('wifiNote');
        if (approved) {
            const { data: wifi, error: wifiError } = await db.rpc('get_wifi_info');
            if (!wifiError && wifi && wifi.length) {
                setText('wifiNetwork', wifi[0].network || '—');
                setText('wifiPassword', wifi[0].password || '—');
                if (wifiNote) wifiNote.hidden = true;
            } else if (wifiNote) {
                wifiNote.textContent = 'Wi-Fi details are not available yet. Please ask the front desk.';
            }
        }

        // 8. Service requests
        const requestList = document.getElementById('requestList');
        const extendBtn = document.getElementById('extendBtn');
        const checkoutBtn = document.getElementById('checkoutBtn');
        const newRequestBtn = document.getElementById('newRequestBtn');

        async function loadRequests() {
            if (!requestList) return;
            const { data: rows, error: reqError } = await db
                .from('service_requests')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            requestList.innerHTML = '';

            if (reqError || !rows || rows.length === 0) {
                const li = document.createElement('li');
                li.className = 'req-empty';
                li.textContent = reqError
                    ? 'Requests are not available yet.'
                    : 'No active requests.';
                requestList.appendChild(li);
                return;
            }

            rows.forEach((r) => {
                const li = document.createElement('li');
                li.className = 'req-item';

                const left = document.createElement('div');
                const title = document.createElement('div');
                title.className = 'req-item-title';
                title.textContent = REQUEST_LABELS[r.type] || r.type;
                left.appendChild(title);

                if (r.details) {
                    const text = document.createElement('div');
                    text.className = 'req-item-text';
                    text.textContent = r.details;
                    left.appendChild(text);
                }

                const date = document.createElement('div');
                date.className = 'req-item-date';
                date.textContent = fmtDate(r.created_at);
                left.appendChild(date);

                const badge = document.createElement('span');
                badge.className = 'req-badge ' + (r.status || 'pending');
                badge.textContent = STATUS_LABELS[r.status] || 'Pending';

                li.appendChild(left);
                li.appendChild(badge);
                requestList.appendChild(li);
            });
        }

        await loadRequests();

        // Dialog
        const dialog = document.getElementById('requestDialog');
        const form = document.getElementById('requestForm');
        const typeWrap = document.getElementById('requestTypeWrap');
        const typeSelect = document.getElementById('requestType');
        const detailsInput = document.getElementById('requestDetails');
        const errorEl = document.getElementById('requestError');
        const submitBtn = document.getElementById('requestSubmit');
        const cancelBtn = document.getElementById('requestCancel');
        const titleEl = document.getElementById('requestDialogTitle');

        let fixedType = null;      // set for "Extend stay" / "Request check-out"
        let detailsRequired = false;

        function openRequest({ type = null, title, placeholder, required = false }) {
            fixedType = type;
            detailsRequired = required;
            titleEl.textContent = title;
            detailsInput.placeholder = placeholder;
            detailsInput.value = '';
            errorEl.textContent = '';
            typeWrap.hidden = !!type;
            if (!type) typeSelect.value = 'maintenance';
            dialog.showModal();
            detailsInput.focus();
        }

        if (!approved) {
            // Requests are for approved guests only
            [extendBtn, checkoutBtn, newRequestBtn].forEach((b) => {
                if (!b) return;
                b.disabled = true;
                b.title = 'Available once your room is approved';
            });
        } else {
            extendBtn?.addEventListener('click', () => openRequest({
                type: 'extend',
                title: 'Extend your stay',
                placeholder: 'How many extra days, or what new check-out date would you like?',
                required: true
            }));
            checkoutBtn?.addEventListener('click', () => openRequest({
                type: 'checkout',
                title: 'Request check-out',
                placeholder: 'Preferred check-out date and time (optional)'
            }));
            newRequestBtn?.addEventListener('click', () => openRequest({
                title: 'New request',
                placeholder: 'Tell us what you need',
                required: true
            }));
        }

        cancelBtn?.addEventListener('click', () => dialog.close());

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const details = detailsInput.value.trim();
            const type = fixedType || typeSelect.value;

            if (detailsRequired && !details) {
                errorEl.textContent = 'Please add a few details.';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            const { error: insertError } = await db.from('service_requests').insert({
                user_id: session.user.id,
                type,
                details: details || null
            });

            submitBtn.disabled = false;
            submitBtn.textContent = 'Send request';

            if (insertError) {
                errorEl.textContent = 'Could not send the request: ' + insertError.message;
                return;
            }

            dialog.close();
            await loadRequests();
        });

    } catch (err) {

        console.error('Accommodation Loading Error:', err);
        alert('Unable to load accommodation details. Please refresh the page.');

    } finally {

        // Always remove skeleton after loading
        if (shell) hideSkeleton(shell);
    }
});