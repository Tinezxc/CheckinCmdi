/* ==========================================================
   CMDI / HAVEN - STAFF DASHBOARD
   Real, read-only dashboard data from get_staff_dashboard_data()

   Notes:
   - RBAC is the only source of the current staff role.
   - No browser-side role switching or simulated approvals.
   - Check-out/overdue metrics remain unavailable because the
     current schema does not include a checkout date field.
   - All database reads go through the protected staff RPC.
   ========================================================== */
(() => {
    'use strict';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const db = () => window.supabaseClient || null;
    const PAGE_SIZE = 12;
    const REFRESH_MS = 45000;

    const STATUS_LABEL = {
        pending: 'Pending',
        accepted: 'Accepted',
        confirmed: 'Confirmed',
        completed: 'Completed',
        declined: 'Declined',
        cancelled: 'Cancelled',
        expired: 'Expired',
        'checked-in': 'Checked in',
        'room-assigned': 'Room assigned',
        'checked-out': 'Checked out',
        'vacant-clean': 'Vacant clean',
        'vacant-dirty': 'Vacant dirty',
        occupied: 'Occupied',
        cleaning: 'Cleaning',
        maintenance: 'Maintenance',
        reserved: 'Reserved',
        overdue: 'Overdue'
    };

    const ROOM_STATUSES = new Set([
        'occupied', 'vacant-clean', 'vacant-dirty',
        'cleaning', 'maintenance', 'reserved', 'overdue'
    ]);

    const state = {
        tab: 'arrivals',
        sortKey: null,
        sortDir: 1,
        page: 1,
        query: '',
        touched: Date.now(),
        loading: false,
        currentRoom: null,
        currentReview: null,
        reviewDecision: null,
        summary: {},
        visibility: {},
        approvalQueueError: null,
        lastSuccessfulFetch: 0
    };

    let staff = { id: null, name: 'Staff', role: null };
    let rooms = {};
    let queue = { arrivals: [], departures: [], inhouse: [] };
    let requests = [];
    let groups = [];
    let refreshTimer = null;

    function esc(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    function initials(name) {
        return String(name || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase() || 'ST';
    }

    function formatDate(value) {
        if (!value) return '—';
        const date = new Date(value + (String(value).length === 10 ? 'T00:00:00' : ''));
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    }

    function formatDateTime(value) {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    }

    function timeAgo(value) {
        if (!value) return '—';
        const ms = Date.now() - new Date(value).getTime();
        if (!Number.isFinite(ms)) return '—';
        const minutes = Math.max(0, Math.floor(ms / 60000));
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hr ago`;
        return `${Math.floor(hours / 24)} d ago`;
    }

    function toast(title, message = '', type = 'info') {
        if (window.HavenStaff?.toast) {
            window.HavenStaff.toast(type, title, message);
            return;
        }
        if (typeof window.showToast === 'function') {
            window.showToast(type, title, message);
            return;
        }
        console[type === 'error' ? 'error' : 'log'](title, message);
    }

    function statusLabel(status) {
        const key = String(status || '').toLowerCase();
        return STATUS_LABEL[key] || (key ? key.replaceAll('-', ' ') : 'Unknown');
    }

    function touch() {
        state.touched = Date.now();
        tick();
    }

    function showLoading() {
        const body = $('#queueBody');
        if (body) body.innerHTML = '<tr><td colspan="6" class="muted">Loading dashboard data…</td></tr>';
        const board = $('#roomBoard');
        if (board) board.innerHTML = '<div class="empty-state"><p class="empty-title">Loading rooms…</p></div>';
    }

    function showPageError(message) {
        const body = $('#queueBody');
        if (body) body.replaceChildren();
        const empty = $('#queueEmpty');
        if (empty) {
            empty.hidden = false;
            $('.empty-title', empty).textContent = 'Dashboard data unavailable';
            $('.empty-sub', empty).textContent = message;
        }
        if ($('#roomBoard')) {
            $('#roomBoard').innerHTML =
                '<div class="empty-state"><p class="empty-title">Could not load room data</p><p class="empty-sub">' + esc(message) + '</p></div>';
        }
        if ($('#lastUpdated')) $('#lastUpdated').textContent = 'Not connected';
    }

    /* ==========================================================
       LOAD DATABASE SNAPSHOT
       ========================================================== */
    async function loadDashboard({ silent = false } = {}) {
        const client = db();
        if (!client) {
            showPageError('Supabase client is missing. Check js/supabase-client.js.');
            return;
        }
        if (state.loading) return;
        state.loading = true;
        if (!silent) showLoading();

        try {
            const { data, error } = await client.rpc('get_staff_dashboard_data');
            if (error) throw error;
            if (!data || typeof data !== 'object') {
                throw new Error('The staff dashboard RPC returned no data.');
            }

            staff = data.staff || staff;
            if (staff.full_name) setStaff(staff.full_name);
            state.summary = data.summary && typeof data.summary === 'object' ? data.summary : {};
            state.visibility = data.visibility && typeof data.visibility === 'object'
                ? data.visibility
                : { guest_details: false, room_requests: false, group_bookings: false, guest_requests: false, assigned_guests: false, service_scope: 'none' };

            rooms = {};
            (Array.isArray(data.rooms) ? data.rooms : []).forEach(room => {
                const number = String(room.room_number ?? '');
                if (!number) return;
                rooms[number] = {
                    id: room.id,
                    number,
                    floor: Number(room.floor || 0),
                    type: room.type || 'Standard Shared Room',
                    capacity: Number(room.capacity || 0),
                    occupants: Number(room.assigned_count ?? room.occupants_count ?? 0),
                    status: ROOM_STATUSES.has(String(room.status)) ? String(room.status) : 'vacant-dirty',
                    history: []
                };
            });

            // Manager may monitor the review queue; Front Desk may approve/reject.
            let reviewRows = [];
            state.approvalQueueError = null;
            if (['manager', 'front-desk'].includes(String(staff.role || '').toLowerCase())) {
                const { data: reviewData, error: reviewError } = await client.rpc('get_staff_room_booking_review_queue');
                if (reviewError) {
                    state.approvalQueueError = reviewError.message || 'Could not load the booking review queue.';
                } else {
                    reviewRows = Array.isArray(reviewData) ? reviewData : [];
                }
            }

            const roomRequests = reviewRows.map(item => ({
                reviewId: item.review_id,
                requestType: item.request_type,
                guest: item.guest || 'Guest',
                guestId: item.guest_id || '—',
                profileId: item.profile_id || null,
                groupBookingId: item.group_booking_id || null,
                groupSize: Number(item.group_size || 1),
                members: Array.isArray(item.members) ? item.members : [],
                gender: item.gender || null,
                room: String(item.room_number || '—'),
                time: item.check_in ? formatDate(item.check_in) : formatDateTime(item.requested_at),
                rawTime: item.check_in || item.requested_at || '',
                requestedAt: item.requested_at || null,
                status: item.status || 'pending'
            }));

            const assignedGuests = (state.visibility.assigned_guests && Array.isArray(data.assigned_guests)
                ? data.assigned_guests
                : []).map(item => ({
                    guest: item.guest || 'Guest details restricted',
                    guestId: item.guest_id || '—',
                    profileId: item.profile_id || null,
                    room: String(item.room_number || '—'),
                    time: item.check_in ? formatDate(item.check_in) : '—',
                    rawTime: item.check_in || '',
                    status: 'room-assigned'
                }));

            queue = {
                arrivals: roomRequests,
                departures: [],
                inhouse: assignedGuests
            };

            groups = state.visibility.group_bookings && Array.isArray(data.group_bookings)
                ? data.group_bookings
                : [];

            const generalRequests = (state.visibility.guest_requests && Array.isArray(data.requests) ? data.requests : []).map(item => ({
                id: String(item.id),
                source: item.source || 'requests',
                title: item.title || item.type || 'Guest request',
                details: item.details || '',
                room: item.room_number || '—',
                guest: item.guest || 'Guest',
                status: item.status || 'pending',
                created_at: item.created_at
            }));

            const serviceRequests = (Array.isArray(data.service_requests) ? data.service_requests : []).map(item => ({
                id: String(item.id),
                source: item.source || 'service_requests',
                title: item.title || item.type || 'Service request',
                details: item.details || '',
                room: item.room_number || '—',
                guest: item.guest || 'Guest details restricted',
                status: item.status || 'pending',
                created_at: item.created_at
            }));

            requests = [...generalRequests, ...serviceRequests]
                .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

            renderAll();
            state.lastSuccessfulFetch = Date.now();
            touch();
            if (state.approvalQueueError) {
                console.error('Booking review queue unavailable:', state.approvalQueueError);
                toast('Booking queue unavailable', state.approvalQueueError, 'error');
            }
        } catch (error) {
            console.error('Staff dashboard load failed:', error);
            if (!silent) showPageError(error.message || 'Unable to load staff dashboard data.');
            toast('Dashboard data unavailable', error.message || 'Check the staff dashboard RPC and access permissions.', 'error');
        } finally {
            state.loading = false;
        }
    }

    function setStaff(name) {
        const text = name || 'Staff';
        const avatar = initials(text);
        $$('.staff-avatar, .mobile-topbar .topbar-avatar, .topbar-actions .topbar-avatar').forEach(node => {
            node.textContent = avatar;
        });
        const nameNode = $('.staff-name');
        if (nameNode) nameNode.textContent = text;
    }

    /* ==========================================================
       QUEUE
       ========================================================== */
    function rowsForTab(tab, query = '') {
        const q = query.trim().toLowerCase();
        let rows = [...(queue[tab] || [])].filter(item => {
            const haystack = `${item.guest} ${item.guestId} ${item.room}`.toLowerCase();
            return !q || haystack.includes(q);
        });

        if (state.sortKey) {
            const key = state.sortKey;
            rows.sort((a, b) => {
                const A = key === 'time' ? String(a.rawTime || '') : String(a[key] || '').toLowerCase();
                const B = key === 'time' ? String(b.rawTime || '') : String(b[key] || '').toLowerCase();
                return (A > B ? 1 : A < B ? -1 : 0) * state.sortDir;
            });
        }
        return rows;
    }

    function canApproveBookings() {
        return String(staff.role || '').toLowerCase() === 'front-desk'
            && !!window.RBAC?.can?.('bookings.approve');
    }

    function renderQueue() {
        const all = rowsForTab(state.tab, state.query);
        const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
        state.page = Math.min(state.page, pages);
        const start = (state.page - 1) * PAGE_SIZE;
        const rows = all.slice(start, start + PAGE_SIZE);
        const body = $('#queueBody');
        const canApprove = state.tab === 'arrivals' && canApproveBookings();

        body.innerHTML = rows.map(item => {
            const room = esc(item.room);
            const guest = esc(item.guest);
            const guestId = esc(item.guestId);
            const time = esc(item.time);
            const label = statusLabel(item.status);
            const statusClass = String(item.status || 'pending').replace(/[^a-z-]/g, '');
            const groupTag = item.requestType === 'group'
                ? `<small class="queue-group-tag">Group · ${Number(item.groupSize || 1)} members</small>`
                : '';
            const actions = canApprove && item.status === 'pending'
                ? `<div class="booking-actions">
                    <button type="button" class="btn btn-approve" data-review-action="approve" data-review-id="${esc(item.reviewId)}">Approve</button>
                    <button type="button" class="btn btn-reject" data-review-action="reject" data-review-id="${esc(item.reviewId)}">Reject</button>
                   </div>`
                : `<button type="button" class="btn btn-sm" data-act="view" data-room="${room}">View</button>`;
            return `<tr tabindex="0" data-room="${room}" data-profile="${esc(item.profileId || '')}" data-review-id="${esc(item.reviewId || '')}">
                <td><div class="guest-cell"><span class="guest-avatar">${initials(item.guest)}</span><span class="guest-name">${guest}</span></div></td>
                <td class="muted">${guestId}</td>
                <td><strong>${room}</strong>${groupTag}</td>
                <td class="muted">${time}</td>
                <td><span class="status-pill ${statusClass}"><span class="dot"></span>${esc(label)}</span></td>
                <td class="col-actions">${actions}</td>
            </tr>`;
        }).join('');

        const empty = $('#queueEmpty');
        empty.hidden = rows.length > 0;
        if (!rows.length) {
            $('.empty-title', empty).textContent = state.query
                ? `No guests match "${state.query}"`
                : state.tab === 'arrivals'
                    ? (state.approvalQueueError ? 'Booking review queue unavailable' : 'No pending room requests')
                    : state.tab === 'inhouse'
                        ? (state.visibility.assigned_guests === false ? 'Guest assignment details are restricted' : 'No assigned guests')
                        : 'Departure tracking is not configured';
            $('.empty-sub', empty).textContent = state.tab === 'departures'
                ? 'The current profiles table has no check-out date or expected departure column, so departures and overdue stays cannot be calculated yet.'
                : state.tab === 'arrivals'
                    ? (state.approvalQueueError
                        ? state.approvalQueueError
                        : (canApproveBookings()
                            ? 'Individual requests and complete group requests will appear here for Front Desk review.'
                            : 'Front Desk can approve or reject pending room requests. Manager can monitor this queue.'))
                    : state.tab === 'inhouse' && state.visibility.assigned_guests === false
                        ? 'Individual guest assignment details are limited to Front Desk and Manager roles.'
                        : 'Clients with a room or assigned-room value appear here. This is a room allocation list, not confirmation of physical check-in.';
        }

        $('#queueInfo').textContent = all.length
            ? `Showing ${start + 1}–${start + rows.length} of ${all.length}`
            : 'Showing 0 of 0';

        const chev = direction => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="${direction}"></polyline></svg>`;
        const pagination = $('.pagination');
        pagination.innerHTML = `<button class="page-btn" data-page="${Math.max(1, state.page - 1)}" aria-label="Previous page" ${state.page <= 1 ? 'disabled' : ''}>${chev('15 18 9 12 15 6')}</button>
            <button class="page-btn active" disabled>${state.page} / ${pages}</button>
            <button class="page-btn" data-page="${Math.min(pages, state.page + 1)}" aria-label="Next page" ${state.page >= pages ? 'disabled' : ''}>${chev('9 18 15 12 9 6')}</button>`;

        $$('.tab').forEach(tabButton => {
            const active = tabButton.dataset.tab === state.tab;
            tabButton.classList.toggle('active', active);
            tabButton.setAttribute('aria-selected', active ? 'true' : 'false');
            $('.tab-count', tabButton).textContent = (queue[tabButton.dataset.tab] || []).length;
        });

        const hint = $('#bookingReviewHint');
        if (hint) {
            hint.textContent = canApproveBookings()
                ? 'You are signed in as Front Desk. Approve or reject each individual request or complete group booking after reviewing room capacity and eligibility.'
                : 'Front Desk approves or rejects pending room requests. Manager can monitor this queue; other roles do not receive guest booking details.';
        }
    }

    /* ==========================================================
       KPI STRIP
       ========================================================== */
    function renderKpis() {
        const metrics = state.summary || {};
        const roomList = Object.values(rooms);
        const totalBedsFallback = roomList.reduce((sum, room) => sum + room.capacity, 0);
        const allocatedBedsFallback = roomList.reduce((sum, room) => sum + Math.min(room.occupants, room.capacity || room.occupants), 0);
        const totalBeds = Number.isFinite(Number(metrics.total_beds)) ? Number(metrics.total_beds) : totalBedsFallback;
        const allocatedBeds = Number.isFinite(Number(metrics.allocated_beds)) ? Number(metrics.allocated_beds) : allocatedBedsFallback;
        const allocationPercent = Number.isFinite(Number(metrics.allocation_percent))
            ? Number(metrics.allocation_percent)
            : (totalBeds > 0 ? Math.round(allocatedBeds / totalBeds * 100) : 0);
        const openRequests = requests.filter(item => !['completed', 'cancelled', 'closed', 'resolved', 'rejected'].includes(String(item.status).toLowerCase()));

        const allCard = $('.kpi-card[data-filter="all"]');
        const arrivalsCard = $('.kpi-card[data-filter="arrivals"]');
        const departuresCard = $('.kpi-card[data-filter="departures"]');
        const overdueCard = $('.kpi-card[data-filter="overdue"]');
        const requestsCard = $('.kpi-card[data-filter="requests"]');

        if (allCard) {
            $('.kpi-value', allCard).innerHTML = `${allocationPercent}<span class="kpi-suffix">%</span>`;
            $('.kpi-sub', allCard).textContent = `${allocatedBeds} allocated of ${totalBeds} beds`;
        }
        if (arrivalsCard) {
            $('.kpi-value', arrivalsCard).textContent = state.approvalQueueError ? '—' : queue.arrivals.length;
            $('.kpi-sub', arrivalsCard).textContent = 'Pending room booking reviews';
        }
        if (departuresCard) {
            $('.kpi-value', departuresCard).textContent = '—';
            $('.kpi-sub', departuresCard).textContent = 'Checkout date not stored';
        }
        if (overdueCard) {
            $('.kpi-value', overdueCard).textContent = '—';
            $('.kpi-sub', overdueCard).textContent = 'Cannot calculate without checkout date';
        }
        if (requestsCard) {
            $('.kpi-value', requestsCard).textContent = openRequests.length;
            $('.kpi-sub', requestsCard).textContent = 'Open requests visible to your role';
        }

        const overdueBadge = $('#overdueTitle .count-badge');
        if (overdueBadge) overdueBadge.textContent = 'N/A';
        const requestBadge = $('#reqTitle .count-badge');
        if (requestBadge) requestBadge.textContent = `${openRequests.length} open`;
        const navBadge = $('#navReqBadge');
        if (navBadge) {
            navBadge.textContent = openRequests.length;
            navBadge.hidden = openRequests.length === 0;
        }
        $$('.kpi-card').forEach(card => card.classList.remove('active'));
        if (state.kpi) $(`.kpi-card[data-filter="${state.kpi}"]`)?.classList.add('active');
    }

    /* ==========================================================
       OVERDUE / SERVICE REQUESTS / GROUP BOOKINGS
       ========================================================== */
    function renderOverdue() {
        $('#overdueList').innerHTML =
            '<li class="empty-state"><p class="empty-title">Checkout tracking unavailable</p><p class="empty-sub">The current profiles table has no checkout date or expected departure column. No overdue status will be invented.</p></li>';
    }

    function renderRequests() {
        const list = $('#reqQueue');
        const visible = requests.slice(0, 20);
        if (!visible.length) {
            list.innerHTML = '<li class="empty-state"><p class="empty-title">No guest or service requests</p><p class="empty-sub">Requests from the database will appear here.</p></li>';
            return;
        }

        list.innerHTML = visible.map(item => {
            const status = String(item.status || 'pending').toLowerCase();
            const statusClass = status === 'urgent' ? 'urgent' : ['completed', 'resolved', 'closed'].includes(status) ? 'checked-in' : 'pending';
            return `<li class="req-item">
                <div class="req-head">
                    <div>
                        <div class="req-title">${esc(item.title)}</div>
                        <div class="req-meta">Room ${esc(item.room)} · ${esc(item.guest)} · ${esc(timeAgo(item.created_at))}</div>
                    </div>
                    <span class="status-pill ${statusClass}"><span class="dot"></span>${esc(statusLabel(status))}</span>
                </div>
                ${item.details ? `<p class="req-meta req-details">${esc(item.details)}</p>` : ''}
                <div class="req-meta req-source">${item.source === 'service_requests' ? 'Service request' : 'Guest request'}</div>
            </li>`;
        }).join('');
    }

    function renderGroups() {
        const list = $('#groupBookingList');
        if (!list) return;
        const countBadge = $('#groupBookingsCount');
        if (countBadge) countBadge.textContent = `${groups.length} active`;

        if (!groups.length) {
            list.innerHTML = '<li class="empty-state"><p class="empty-title">No active group bookings</p><p class="empty-sub">Group bookings appear here after a client creates an invitation or confirms all members.</p></li>';
            return;
        }

        list.innerHTML = groups.map(group => {
            const members = Array.isArray(group.members) ? group.members : [];
            const accepted = members.filter(member => ['accepted', 'confirmed', 'completed'].includes(String(member.status).toLowerCase())).length;
            const status = String(group.status || 'inviting').toLowerCase();
            return `<li class="group-booking-item">
                <div class="group-booking-top">
                    <div>
                        <strong>${esc(group.group_name || 'CMDI Group')}</strong>
                        <span>Room ${esc(group.room_number || '—')} · Floor ${esc(group.floor ?? '—')}</span>
                    </div>
                    <span class="status-pill ${status === 'confirmed' ? 'checked-in' : 'pending'}"><span class="dot"></span>${esc(statusLabel(status))}</span>
                </div>
                <div class="group-booking-meta">${Number(group.group_size || members.length)} members · ${accepted} accepted</div>
                <ul class="group-member-mini">${members.map(member => `<li><span>${esc(member.name || 'CMDI Member')}</span><small>${esc(statusLabel(member.status))}</small></li>`).join('')}</ul>
                ${group.hold_expires_at && ['inviting', 'ready'].includes(status) ? `<small class="group-hold-note">Temporary hold expires ${esc(formatDateTime(group.hold_expires_at))}</small>` : ''}
            </li>`;
        }).join('');
    }

    /* ==========================================================
       ROOM BOARD AND DETAILS DRAWER
       ========================================================== */
    function renderRooms() {
        const all = Object.values(rooms);
        const board = $('#roomBoard');
        if (!all.length) {
            board.innerHTML = '<div class="empty-state"><p class="empty-title">No rooms to show</p><p class="empty-sub">The rooms table currently has no records.</p></div>';
            return;
        }

        const floors = [...new Set(all.map(room => room.floor))].sort((a, b) => a - b);
        let html = '';
        floors.forEach(floor => {
            html += `<div class="room-floor"><h4>Floor ${floor}</h4><div class="room-grid">`;
            all.filter(room => room.floor === floor).forEach(room => {
                const status = ROOM_STATUSES.has(room.status) ? room.status : 'vacant-dirty';
                html += `<button type="button" class="room-cell st-${status}" data-room="${esc(room.number)}" aria-label="Room ${esc(room.number)}, ${esc(statusLabel(status))}">${esc(room.number)}<small>${esc(statusLabel(status))} · ${room.occupants}/${room.capacity} beds allocated</small></button>`;
            });
            html += '</div></div>';
        });
        board.innerHTML = html;
    }

    function openLayer(...elements) {
        elements.forEach(element => { element.hidden = false; });
        requestAnimationFrame(() => elements.forEach(element => element.classList.add('open')));
    }

    function closeLayer(...elements) {
        elements.forEach(element => element.classList.remove('open'));
        setTimeout(() => elements.forEach(element => {
            if (!element.classList.contains('open')) element.hidden = true;
        }), 200);
    }

    function openDrawer(roomNumber) {
        const room = rooms[String(roomNumber)];
        if (!room) return;
        state.currentRoom = String(roomNumber);

        const assignedGuests = queue.inhouse.filter(item => item.room === String(roomNumber));
        const pendingGuests = queue.arrivals.filter(item => item.room === String(roomNumber));
        const displayGuests = assignedGuests.length ? assignedGuests : pendingGuests;

        $('#roomDrawerTitle').textContent = `Room ${room.number}`;
        $('#roomDrawerSub').textContent = `Floor ${room.floor} · ${room.type}`;
        $('#drawerGuestName').textContent = !state.visibility.guest_details
            ? 'Guest details restricted'
            : displayGuests.length ? displayGuests.map(item => item.guest).join(', ') : 'No assigned guest';
        $('#drawerGuestMeta').textContent = !state.visibility.guest_details
            ? 'Individual guest details are not available for your role.'
            : assignedGuests.length
                ? `${assignedGuests.length} assigned guest(s)`
                : pendingGuests.length
                ? `${pendingGuests.length} pending room request(s)`
                : statusLabel(room.status);
        $('.roommate-avatar', $('#roomDrawer')).textContent = displayGuests.length ? initials(displayGuests[0].guest) : '–';
        $('#drawerStatus').textContent = statusLabel(room.status);
        $('#drawerCapacity').textContent = `${room.occupants} / ${room.capacity} beds allocated`;
        $('.drawer-history').innerHTML = '<li>Historical room events are not stored in the current dashboard schema.</li>';

        const forceButton = $('#roomDrawer .drawer-footer .btn-primary');
        forceButton.disabled = true;
        forceButton.textContent = 'Check-out tracking unavailable';
        forceButton.title = 'The current schema has no checkout date or secure checkout function.';

        $('#roomDrawer .drawer-footer .btn-outline').disabled = true;
        openLayer($('#roomDrawerOverlay'), $('#roomDrawer'));
        $('#roomDrawerClose').focus();
    }

    function closeDrawer() {
        closeLayer($('#roomDrawerOverlay'), $('#roomDrawer'));
        state.currentRoom = null;
    }

    function renderActivity() {
        $('#activityList').innerHTML =
            '<li class="empty-state" style="grid-column:1/-1;"><p class="empty-title">Activity log is not connected yet</p><p class="empty-sub">The audit_log table schema has not been confirmed for dashboard display. Staff actions will not be simulated here.</p></li>';
    }

    function renderAll() {
        renderQueue();
        renderKpis();
        renderOverdue();
        renderRequests();
        renderGroups();
        renderRooms();
        renderActivity();
    }

    /* ==========================================================
       FRONT DESK BOOKING REVIEW ACTIONS
       ========================================================== */
    function openBookingReview(reviewId, decision) {
        if (!canApproveBookings()) {
            toast('Access restricted', 'Only Front Desk can approve or reject room bookings.', 'error');
            return;
        }
        const item = queue.arrivals.find(row => String(row.reviewId) === String(reviewId));
        if (!item || item.status !== 'pending') {
            toast('Request unavailable', 'This booking is no longer pending. Refresh the dashboard.', 'error');
            return;
        }

        state.currentReview = item;
        state.reviewDecision = decision;
        const isGroup = item.requestType === 'group';
        const title = decision === 'approve' ? 'Approve room booking?' : 'Reject room booking?';
        const memberNames = (item.members || [])
            .map(member => String(member.name || '').trim())
            .filter(Boolean);
        const details = [
            isGroup
                ? `Group booking for Room ${item.room} (${item.groupSize} members, led by ${item.guest})`
                : `${item.guest} requested Room ${item.room}`,
            item.gender ? `Gender: ${item.gender}` : '',
            item.time && item.time !== '—' ? `Preferred check-in: ${item.time}` : '',
            isGroup && memberNames.length ? `Members: ${memberNames.join(', ')}` : ''
        ].filter(Boolean);
        const subject = details.join('\n');

        $('#bookingReviewTitle').textContent = title;
        $('#bookingReviewText').textContent = subject;
        $('#bookingReviewReasonWrap').hidden = decision !== 'reject';
        $('#bookingReviewReason').value = '';
        $('#bookingReviewReasonError').textContent = '';
        $('#bookingReviewWarning').textContent = decision === 'approve'
            ? 'Approval will assign this room to the guest or every member of the group. Room capacity and gender eligibility will be checked again by Supabase.'
            : 'Rejection will release the pending room request. A reason is required and the action will be recorded in the audit log.';
        const submit = $('#bookingReviewSubmit');
        submit.textContent = decision === 'approve' ? 'Approve booking' : 'Reject booking';
        submit.dataset.decision = decision;
        submit.disabled = false;
        openLayer($('#bookingReviewOverlay'));
        if (decision === 'reject') $('#bookingReviewReason').focus();
        else submit.focus();
    }

    function closeBookingReview() {
        closeLayer($('#bookingReviewOverlay'));
        state.currentReview = null;
        state.reviewDecision = null;
    }

    async function submitBookingReview() {
        const item = state.currentReview;
        const decision = state.reviewDecision;
        if (!item || !decision || !canApproveBookings()) return;

        const reason = $('#bookingReviewReason').value.trim();
        if (decision === 'reject' && reason.length < 5) {
            $('#bookingReviewReasonError').textContent = 'Please enter a reason with at least 5 characters.';
            $('#bookingReviewReason').focus();
            return;
        }

        const submit = $('#bookingReviewSubmit');
        submit.disabled = true;
        submit.textContent = decision === 'approve' ? 'Approving…' : 'Rejecting…';

        try {
            const client = db();
            if (!client) throw new Error('Supabase client is unavailable.');
            const { data, error } = await client.rpc('review_staff_room_booking', {
                p_review_id: item.reviewId,
                p_decision: decision,
                p_reason: decision === 'reject' ? reason : null
            });
            if (error) throw error;
            if (data && data.ok === false) throw new Error(data.message || data.error || 'The booking review failed.');

            closeBookingReview();
            toast(
                decision === 'approve' ? 'Booking approved' : 'Booking rejected',
                decision === 'approve'
                    ? `Room ${item.room} ${item.requestType === 'group' ? `was assigned to ${item.groupSize} group members` : 'was assigned to the guest'}.`
                    : `Room ${item.room} request was rejected and released.`,
                decision === 'approve' ? 'success' : 'info'
            );
            await loadDashboard();
        } catch (error) {
            console.error('Booking review failed:', error);
            toast('Booking review failed', error.message || 'Please refresh and try again.', 'error');
            submit.disabled = false;
            submit.textContent = decision === 'approve' ? 'Approve booking' : 'Reject booking';
        }
    }

    /* ==========================================================
       CSV EXPORT
       ========================================================== */
    function exportQueue() {
        const rows = rowsForTab(state.tab, state.query);
        if (!rows.length) {
            toast('Nothing to export', 'The current queue is empty.', 'error');
            return;
        }
        const headers = ['Guest', 'Guest ID', 'Room', 'Date', 'Status'];
        const data = [headers, ...rows.map(item => [item.guest, item.guestId, item.room, item.time, statusLabel(item.status)])];
        const csv = data.map(columns => columns.map(value => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `cmdi-${state.tab}-queue.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast('Exported', `${rows.length} records exported.`);
    }

    /* ==========================================================
       EVENTS
       ========================================================== */
    function bindEvents() {
        const menuBtn = $('#menuToggle');
        const sidebar = $('#sidebar');
        const sidebarOverlay = $('#sidebarOverlay');
        const setMenu = open => {
            sidebar.classList.toggle('open', open);
            sidebarOverlay.classList.toggle('open', open);
            menuBtn.setAttribute('aria-expanded', String(open));
        };

        menuBtn.addEventListener('click', () => setMenu(!sidebar.classList.contains('open')));
        sidebarOverlay.addEventListener('click', () => setMenu(false));

        $('.tabs').addEventListener('click', event => {
            const tabButton = event.target.closest('.tab');
            if (!tabButton) return;
            state.tab = tabButton.dataset.tab;
            state.page = 1;
            state.kpi = null;
            renderQueue();
            renderKpis();
        });

        $('.queue-table thead').addEventListener('click', event => {
            const th = event.target.closest('th.sortable');
            if (!th) return;
            state.sortDir = state.sortKey === th.dataset.sort ? -state.sortDir : 1;
            state.sortKey = th.dataset.sort;
            state.page = 1;
            renderQueue();
        });

        $('.pagination').addEventListener('click', event => {
            const button = event.target.closest('[data-page]');
            if (!button || button.disabled) return;
            state.page = Number(button.dataset.page);
            renderQueue();
        });

        $('#globalSearch').addEventListener('input', event => {
            state.query = event.target.value;
            state.page = 1;
            renderQueue();
        });

        $$('.kpi-card').forEach(card => card.addEventListener('click', () => {
            const filter = card.dataset.filter;
            if (filter === 'all') state.tab = 'inhouse';
            if (filter === 'arrivals') state.tab = 'arrivals';
            if (filter === 'departures') state.tab = 'departures';
            if (filter === 'overdue') {
                $('#overdueTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            if (filter === 'requests') {
                $('#reqTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            state.page = 1;
            renderQueue();
            renderKpis();
        }));

        $('#queueBody').addEventListener('click', event => {
            const reviewButton = event.target.closest('button[data-review-action]');
            if (reviewButton) {
                event.preventDefault();
                event.stopPropagation();
                openBookingReview(reviewButton.dataset.reviewId, reviewButton.dataset.reviewAction);
                return;
            }
            const button = event.target.closest('button[data-act="view"]');
            const row = event.target.closest('tr[data-room]');
            const roomNumber = button?.dataset.room || row?.dataset.room;
            if (roomNumber) openDrawer(roomNumber);
        });

        $('#queueBody').addEventListener('keydown', event => {
            if (event.key === 'Enter' && event.target.matches('tr[data-room]')) {
                openDrawer(event.target.dataset.room);
            }
        });

        $('#roomBoard').addEventListener('click', event => {
            const cell = event.target.closest('.room-cell');
            if (cell) openDrawer(cell.dataset.room);
        });

        $('#roomDrawerClose').addEventListener('click', closeDrawer);
        $('#roomDrawerOverlay').addEventListener('click', closeDrawer);
        $('#roomDrawer .drawer-footer .btn-outline').addEventListener('click', () => {
            toast('Room changes unavailable', 'Use the Rooms module after its secure room-change workflow is configured.', 'info');
        });
        $('#roomDrawer .drawer-footer .btn-primary').addEventListener('click', () => {
            toast('Check-out unavailable', 'The current database schema does not yet include checkout tracking or a secure checkout function.', 'error');
        });

        $('#exportCsvBtn').addEventListener('click', exportQueue);

        $('#refreshDashboardBtn')?.addEventListener('click', () => {
            const button = $('#refreshDashboardBtn');
            if (state.loading) return;
            button.disabled = true;
            button.classList.add('is-loading');
            loadDashboard().finally(() => {
                button.disabled = false;
                button.classList.remove('is-loading');
            });
        });

        $('#bookingReviewClose').addEventListener('click', closeBookingReview);
        $('#bookingReviewCancel').addEventListener('click', closeBookingReview);
        $('#bookingReviewOverlay').addEventListener('click', event => {
            if (event.target === $('#bookingReviewOverlay')) closeBookingReview();
        });
        $('#bookingReviewSubmit').addEventListener('click', submitBookingReview);
        $('#bookingReviewReason').addEventListener('input', () => {
            $('#bookingReviewReasonError').textContent = '';
        });

        $('#newCheckinBtn').addEventListener('click', () => {
            if (!window.RBAC?.can?.('checkin.do')) {
                toast('Access restricted', 'Your assigned role cannot process check-ins.', 'error');
                return;
            }
            window.location.href = 'staff-checkin.html';
        });

        // The RBAC module owns the immutable assigned-role identity and page permissions.
        document.addEventListener('click', event => {
            const disabledLink = event.target.closest('a[aria-disabled="true"]');
            if (disabledLink) {
                event.preventDefault();
                toast('Access restricted', 'Your verified staff role does not have permission to open this page.', 'error');
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                if (!$('#roomDrawer').hidden) closeDrawer();
                setMenu(false);
            }
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
            if (event.key === '/') {
                event.preventDefault();
                $('#globalSearch').focus();
            }
            if (event.key.toLowerCase() === 'n') $('#newCheckinBtn').click();
        });
    }

    function tick() {
        const seconds = Math.max(0, Math.floor((Date.now() - state.touched) / 1000));
        const label = seconds < 5 ? 'just now' : seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`;
        const lastUpdated = $('#lastUpdated');
        if (lastUpdated) lastUpdated.textContent = `Last updated ${label}`;
    }

    async function init() {
        bindEvents();

        if (window.RBAC?.ready) await window.RBAC.ready;
        if (!window.RBAC || typeof window.RBAC.realRole !== 'function' || !window.RBAC.realRole()) {
            showPageError('This page requires an active CMDI staff account with a verified role.');
            return;
        }
        if (!window.RBAC.init({ active: 'dashboard' })) return;

        await loadDashboard();
        if (refreshTimer) clearInterval(refreshTimer);
        refreshTimer = setInterval(() => loadDashboard({ silent: true }), REFRESH_MS);
        setInterval(tick, 5000);
        const refreshIfStale = () => {
            if (document.visibilityState === 'hidden' || state.loading) return;
            if (!state.lastSuccessfulFetch || Date.now() - state.lastSuccessfulFetch >= REFRESH_MS) {
                loadDashboard({ silent: true });
            }
        };
        window.addEventListener('focus', refreshIfStale);
        document.addEventListener('visibilitychange', refreshIfStale);
        window.addEventListener('beforeunload', () => {
            if (refreshTimer) clearInterval(refreshTimer);
        });
    }

    init().catch(error => {
        console.error('Staff dashboard initialization failed:', error);
        showPageError(error.message || 'The staff dashboard could not be initialized.');
    });
})();
