/* Haven staff console: dashboard behaviour.
   Starts EMPTY: no sample guests, rooms, requests or activity.
   Fill the data containers below (rooms, queue, overdue, requests, activity)
   at runtime and call renderAll() to show them. */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => String(n).split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '–';
const PAGE_SIZE = 12;

/* ---------------- Labels ---------------- */
const STATUS_LABEL = { 'pending': 'Pending', 'checked-in': 'Checked In', 'checked-out': 'Checked Out', 'overdue': 'Overdue' };
const ROOM_LABEL = { 'occupied': 'Occupied', 'vacant-clean': 'Vacant clean', 'vacant-dirty': 'Vacant dirty', 'cleaning': 'Cleaning', 'maintenance': 'Maintenance', 'reserved': 'Reserved' };

/* ---------------- Data (empty) ---------------- */
const rooms = {};                                            // { [number]: { number, floor, status, capacity?, history: [] } }
const queue = { arrivals: [], departures: [], inhouse: [] }; // { guest, guestId, room, time, status }
const overdue = [];                                          // { name, room, expected, days }
const STAFF = ['Unassigned'];                                // names for the "Assign to" dropdown
const requests = [];                                         // { id, title, room, guest, ago, priority, assignee }
const activity = [];                                         // { who, html, at, cls }

const staff = { name: 'Staff' };
const state = { tab: 'arrivals', sortKey: null, sortDir: 1, page: 1, query: '', role: 'front-desk', kpi: null, touched: Date.now() };
const ROLE_LABEL = { 'front-desk': 'Front desk', 'housekeeping': 'Housekeeping', 'manager': 'Manager' };
const canAct = () => state.role !== 'housekeeping';

/* ---------------- Helpers ---------------- */
function toast(title, text, type) {
    const box = $('#toastContainer');
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' error' : '');
    el.innerHTML = '<div class="toast-text"><strong>' + esc(title) + '</strong>' + (text ? esc(text) : '') + '</div>';
    box.appendChild(el);
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 160); }, 3500);
}
function touch() { state.touched = Date.now(); tick(); }
function logActivity(html, cls) {
    activity.unshift({ who: staff.name, html, at: Date.now(), cls });
    activity.length = Math.min(activity.length, 8);
    renderActivity();
}
const rel = ms => { const m = Math.floor(ms / 60e3); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.floor(m / 60) + ' hr ago'; };
const toMin = t => { const m = /(\d+):(\d+)\s*(AM|PM)/.exec(t); return m ? (+m[1] % 12 + (m[3] === 'PM' ? 12 : 0)) * 60 + +m[2] : 0; };
const guestInRoom = no => [...queue.departures, ...queue.arrivals, ...queue.inhouse].find(g => g.room === no && (g.status === 'checked-in' || g.status === 'overdue' || (queue.departures.includes(g) && g.status === 'pending')));
const emptyBlock = (title, sub) => '<div class="empty-state"><p class="empty-title">' + esc(title) + '</p><p class="empty-sub">' + esc(sub) + '</p></div>';

function setStaff(name) {
    staff.name = name;
    const ini = initials(name);
    $$('.staff-avatar, .mobile-topbar .topbar-avatar, .topbar-actions .topbar-avatar').forEach(el => { el.textContent = ini; });
    $('.staff-name').textContent = name;
}
/* Shows the signed-in staff member's real name (stays "Staff" if it can't be loaded) */
async function loadStaff() {
    const db = window.supabaseClient;
    if (!db) return;
    try {
        const { data: { session } } = await db.auth.getSession();
        if (!session) return;
        const { data: p } = await db.from('profiles').select('full_name').eq('id', session.user.id).single();
        if (p && p.full_name) setStaff(p.full_name);
    } catch (e) { /* keep the placeholder */ }
}

/* ---------------- Queue ---------------- */
function rowsForTab(tab, q) {
    q = q.trim().toLowerCase();
    let list = queue[tab].filter(g => !q || (g.guest + ' ' + g.guestId + ' ' + g.room).toLowerCase().includes(q));
    if (state.sortKey) {
        const k = state.sortKey;
        list = [...list].sort((a, b) => {
            const A = k === 'time' ? toMin(a.time) : a[k], B = k === 'time' ? toMin(b.time) : b[k];
            return (A > B ? 1 : A < B ? -1 : 0) * state.sortDir;
        });
    }
    return list;
}
function actionFor(g) {
    if (!canAct()) return { act: 'view', label: 'View' };
    if (state.tab === 'arrivals' && g.status === 'pending') return { act: 'checkin', label: 'Check in' };
    if (state.tab === 'departures' && g.status === 'overdue') return { act: 'resolve', label: 'Resolve' };
    if (state.tab === 'departures' && g.status === 'pending') return { act: 'checkout', label: 'Check out' };
    return { act: 'view', label: 'View' };
}
function renderQueue() {
    const all = rowsForTab(state.tab, state.query);
    const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * PAGE_SIZE;
    const rows = all.slice(start, start + PAGE_SIZE);

    $('#queueBody').innerHTML = rows.map(g => {
        const a = actionFor(g);
        return '<tr tabindex="0" data-room="' + g.room + '"><td><div class="guest-cell"><span class="guest-avatar">' + initials(g.guest) + '</span><span class="guest-name">' + esc(g.guest) + '</span></div></td>' +
            '<td class="muted">' + esc(g.guestId) + '</td><td><strong>' + g.room + '</strong></td><td class="muted">' + esc(g.time) + '</td>' +
            '<td><span class="status-pill ' + g.status + '"><span class="dot"></span>' + STATUS_LABEL[g.status] + '</span></td>' +
            '<td class="col-actions"><button class="btn btn-sm" data-act="' + a.act + '" data-id="' + esc(g.guestId) + '">' + a.label + '</button></td></tr>';
    }).join('');

    const empty = $('#queueEmpty');
    empty.hidden = rows.length > 0;
    $('.empty-title', empty).textContent = state.query ? 'No guests match "' + state.query + '"' : 'No ' + ({ arrivals: 'arrivals', departures: 'departures', inhouse: 'in-house guests' })[state.tab] + ' today';
    $('#queueInfo').textContent = all.length ? 'Showing ' + (start + 1) + '–' + (start + rows.length) + ' of ' + all.length : 'Showing 0 of 0';

    const chev = d => '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="' + d + '"></polyline></svg>';
    let html = '<button class="page-btn" data-page="' + (state.page - 1) + '" aria-label="Previous page"' + (state.page === 1 ? ' disabled' : '') + '>' + chev('15 18 9 12 15 6') + '</button>';
    for (let p = 1; p <= pages; p++) html += '<button class="page-btn' + (p === state.page ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
    html += '<button class="page-btn" data-page="' + (state.page + 1) + '" aria-label="Next page"' + (state.page === pages ? ' disabled' : '') + '>' + chev('9 18 15 12 9 6') + '</button>';
    $('.pagination').innerHTML = html;

    $$('.tab').forEach(t => {
        const on = t.dataset.tab === state.tab;
        t.classList.toggle('active', on); t.setAttribute('aria-selected', on);
        $('.tab-count', t).textContent = queue[t.dataset.tab].length;
    });
    $$('.queue-table th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === state.sortKey) th.classList.add(state.sortDir === 1 ? 'sort-asc' : 'sort-desc');
    });
}

/* ---------------- KPIs ---------------- */
function renderKpis() {
    const k = f => $('.kpi-card[data-filter="' + f + '"]');
    const done = queue.departures.filter(g => g.status === 'checked-out').length;

    const beds = Object.values(rooms).reduce((n, r) => n + (r.capacity || 0), 0);
    const occupied = queue.inhouse.length;
    k('all').querySelector('.kpi-value').innerHTML = (beds ? Math.round(occupied / beds * 100) : 0) + '<span class="kpi-suffix">%</span>';
    k('all').querySelector('.kpi-sub').textContent = occupied + ' of ' + beds + ' beds';

    k('arrivals').querySelector('.kpi-value').textContent = queue.arrivals.length;
    k('arrivals').querySelector('.kpi-sub').textContent = queue.arrivals.filter(g => g.status === 'checked-in').length + ' already checked in';
    k('departures').querySelector('.kpi-value').textContent = queue.departures.length;
    k('departures').querySelector('.kpi-sub').textContent = (queue.departures.length - done) + ' pending · ' + done + ' done';
    k('overdue').querySelector('.kpi-value').textContent = overdue.length;
    k('overdue').querySelector('.kpi-sub').textContent = overdue.length ? 'Requires attention' : 'All clear';
    k('requests').querySelector('.kpi-value').textContent = requests.length;
    k('requests').querySelector('.kpi-sub').textContent = requests.filter(r => r.priority === 'urgent').length + ' urgent';
    $('#overdueTitle .count-badge').textContent = overdue.length;
    $('#reqTitle .count-badge').textContent = requests.length + ' open';
    $('#navReqBadge').textContent = requests.length;
    $('#navReqBadge').hidden = !requests.length;
    $$('.kpi-card').forEach(c => c.classList.toggle('active', c.dataset.filter === state.kpi));
}

/* ---------------- Overdue ---------------- */
function renderOverdue() {
    const list = $('#overdueList');
    if (!overdue.length) { list.innerHTML = '<li class="empty-state"><p class="empty-title">No overdue check-outs</p><p class="empty-sub">Everything is on schedule.</p></li>'; return; }
    const dis = canAct() ? '' : ' disabled';
    list.innerHTML = overdue.map(o =>
        '<li class="overdue-item"><div class="overdue-main"><span class="overdue-name">' + esc(o.name) + '</span>' +
        '<span class="overdue-meta">Room ' + o.room + ' · Expected ' + esc(o.expected) + '</span>' +
        '<span class="overdue-days">' + o.days + ' day' + (o.days > 1 ? 's' : '') + ' overdue</span></div>' +
        '<div class="overdue-actions"><button class="btn btn-sm btn-outline" data-action="contact" data-guest="' + esc(o.name) + '"' + dis + '>Contact</button>' +
        '<button class="btn btn-sm btn-outline" data-action="extend" data-guest="' + esc(o.name) + '"' + dis + '>Extend</button>' +
        '<button class="btn btn-sm btn-danger" data-action="force" data-guest="' + esc(o.name) + '" data-room="' + o.room + '"' + dis + '>Force check-out</button></div></li>'
    ).join('');
}

/* ---------------- Service requests ---------------- */
function renderRequests() {
    if (!requests.length) {
        $('#reqQueue').innerHTML = '<li class="empty-state"><p class="empty-title">No open requests</p><p class="empty-sub">Guest requests will appear here.</p></li>';
        return;
    }
    $('#reqQueue').innerHTML = requests.map(r =>
        '<li class="req-item"><div class="req-head"><div><div class="req-title">' + esc(r.title) + '</div>' +
        '<div class="req-meta">Room ' + r.room + ' · ' + esc(r.guest) + ' · ' + esc(r.ago) + '</div></div>' +
        '<span class="status-pill ' + (r.priority === 'urgent' ? 'urgent' : 'pending') + '"><span class="dot"></span>' + (r.priority === 'urgent' ? 'Urgent' : 'Normal') + '</span></div>' +
        '<div class="req-row"><label for="assign-' + r.id + '">Assign to</label><select class="req-select" id="assign-' + r.id + '" data-id="' + r.id + '"' + (canAct() ? '' : ' disabled') + '>' +
        STAFF.map(s => '<option' + (s === r.assignee ? ' selected' : '') + '>' + esc(s) + '</option>').join('') + '</select></div></li>'
    ).join('');
}

/* ---------------- Room board ---------------- */
function renderRooms() {
    const all = Object.values(rooms);
    if (!all.length) {
        $('#roomBoard').innerHTML = emptyBlock('No rooms to show', 'Rooms will appear here once they are added.');
        return;
    }
    const floors = [...new Set(all.map(r => r.floor))].sort((a, b) => a - b);
    let html = '';
    floors.forEach(f => {
        html += '<div class="room-floor"><h4>Floor ' + f + '</h4><div class="room-grid">';
        all.filter(r => r.floor === f).forEach(r => {
            html += '<button class="room-cell st-' + r.status + '" data-room="' + r.number + '" aria-label="Room ' + r.number + ', ' + ROOM_LABEL[r.status] + '">' + r.number + '<small>' + ROOM_LABEL[r.status] + '</small></button>';
        });
        html += '</div></div>';
    });
    $('#roomBoard').innerHTML = html;
}

/* ---------------- Activity ---------------- */
function renderActivity() {
    if (!activity.length) {
        $('#activityList').innerHTML = '<li class="empty-state" style="grid-column: 1 / -1;"><p class="empty-title">No recent activity</p><p class="empty-sub">Check-ins, check-outs and updates will show up here.</p></li>';
        return;
    }
    $('#activityList').innerHTML = activity.map(a =>
        '<li class="activity-item"><div class="activity-avatar ' + (a.cls || '') + '">' + initials(a.who) + '</div><div class="activity-body"><p><strong>' + esc(a.who) + '</strong> ' + a.html + '</p><span class="activity-time">' + rel(Date.now() - a.at) + '</span></div></li>'
    ).join('');
}

function renderAll() { renderQueue(); renderKpis(); renderOverdue(); renderRequests(); renderRooms(); renderActivity(); touch(); }

/* ---------------- Overlays: drawer + confirm ---------------- */
function openLayer(...els) { els.forEach(e => { e.hidden = false; }); requestAnimationFrame(() => els.forEach(e => e.classList.add('open'))); }
function closeLayer(...els) { els.forEach(e => e.classList.remove('open')); setTimeout(() => els.forEach(e => { if (!e.classList.contains('open')) e.hidden = true; }), 200); }

let drawerRoom = null;
function openDrawer(no) {
    const r = rooms[no]; if (!r) return;
    drawerRoom = no;
    const g = guestInRoom(no);
    $('#roomDrawerTitle').textContent = 'Room ' + no;
    $('#roomDrawerSub').textContent = 'Floor ' + r.floor;
    $('#drawerGuestName').textContent = g ? g.guest : 'No current guest';
    $('#drawerGuestMeta').textContent = g ? 'Guest ID ' + g.guestId + ' · In-house' : ROOM_LABEL[r.status];
    $('.roommate-avatar', $('#roomDrawer')).textContent = g ? initials(g.guest) : '–';
    $('#drawerStatus').textContent = ROOM_LABEL[r.status];
    $('#drawerCapacity').textContent = r.capacity ? r.capacity + ' guests' : '—';
    const hist = r.history.concat(['Status: ' + ROOM_LABEL[r.status]]);
    $('.drawer-history').innerHTML = hist.slice(-5).reverse().map(h => '<li>' + esc(h) + '</li>').join('');
    $('#roomDrawer .drawer-footer .btn-primary').disabled = !(g && canAct());
    openLayer($('#roomDrawerOverlay'), $('#roomDrawer'));
    $('#roomDrawerClose').focus();
}
const closeDrawer = () => closeLayer($('#roomDrawerOverlay'), $('#roomDrawer'));

let confirmCtx = null;
function openForce(name, room) {
    confirmCtx = { name, room };
    $('#confirmText').innerHTML = 'This will force <strong>' + esc(name) + '</strong> out of room <strong>' + room + '</strong>. This action cannot be undone.';
    $('#confirmReason').value = ''; setReasonError('');
    openLayer($('#confirmOverlay'));
    $('#confirmReason').focus();
}
function setReasonError(msg) { $('#confirmReasonErr').textContent = msg; $('#confirmReason').closest('.form-group').classList.toggle('error', !!msg); }
const closeConfirm = () => { confirmCtx = null; closeLayer($('#confirmOverlay')); };

function checkOut(name, room, forced) {
    [...queue.departures, ...queue.inhouse].filter(g => g.guest === name && g.room === room).forEach(g => { g.status = 'checked-out'; });
    const i = overdue.findIndex(o => o.name === name); if (i > -1) overdue.splice(i, 1);
    if (rooms[room]) { rooms[room].status = 'vacant-dirty'; rooms[room].history.push((forced ? 'Forced check-out: ' : 'Checked out: ') + name); }
    logActivity((forced ? 'force checked out ' : 'checked out ') + '<strong>' + esc(name) + '</strong> from room <strong>' + room + '</strong>.');
    toast(forced ? 'Force check-out complete' : 'Checked out', name + ' · room ' + room);
    renderAll();
}

/* ---------------- Events ---------------- */
$('#confirmSubmit').addEventListener('click', () => {
    const reason = $('#confirmReason').value.trim();
    if (reason.length < 5) { setReasonError('Please enter a reason (min 5 characters).'); return; }
    const { name, room } = confirmCtx;
    closeConfirm(); closeDrawer();
    checkOut(name, room, true);
});
$('#confirmReason').addEventListener('input', () => setReasonError(''));
$('#confirmCancel').addEventListener('click', closeConfirm);
$('#confirmClose').addEventListener('click', closeConfirm);
$('#confirmOverlay').addEventListener('click', e => { if (e.target.id === 'confirmOverlay') closeConfirm(); });
$('#roomDrawerClose').addEventListener('click', closeDrawer);
$('#roomDrawerOverlay').addEventListener('click', closeDrawer);
$('#roomDrawer .drawer-footer .btn-outline').addEventListener('click', () => toast('Change room', 'Room changes are done from the Rooms page.'));
$('#roomDrawer .drawer-footer .btn-primary').addEventListener('click', () => { const g = guestInRoom(drawerRoom); if (g) openForce(g.guest, g.room); });

$('#queueBody').addEventListener('click', e => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) { const tr = e.target.closest('tr'); if (tr) openDrawer(+tr.dataset.room); return; }
    const g = Object.values(queue).flat().find(x => x.guestId === btn.dataset.id);
    if (!g) return;
    if (btn.dataset.act === 'view') openDrawer(g.room);
    else if (btn.dataset.act === 'resolve') openForce(g.guest, g.room);
    else if (btn.dataset.act === 'checkout') checkOut(g.guest, g.room, false);
    else if (btn.dataset.act === 'checkin') {
        g.status = 'checked-in';
        if (rooms[g.room]) { rooms[g.room].status = 'occupied'; rooms[g.room].history.push('Checked in: ' + g.guest); }
        logActivity('checked in <strong>' + esc(g.guest) + '</strong> to room <strong>' + g.room + '</strong>.');
        toast('Checked in', g.guest + ' · room ' + g.room);
        renderAll();
    }
});
$('#queueBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'TR') openDrawer(+e.target.dataset.room); });

$('.tabs').addEventListener('click', e => { const t = e.target.closest('.tab'); if (t) { state.tab = t.dataset.tab; state.page = 1; state.kpi = null; renderQueue(); renderKpis(); } });
$('.queue-table thead').addEventListener('click', e => {
    const th = e.target.closest('th.sortable'); if (!th) return;
    state.sortDir = state.sortKey === th.dataset.sort ? -state.sortDir : 1;
    state.sortKey = th.dataset.sort; state.page = 1; renderQueue();
});
$('.pagination').addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (b && !b.disabled) { state.page = +b.dataset.page; renderQueue(); } });

$('#globalSearch').addEventListener('input', e => {
    state.query = e.target.value; state.page = 1;
    if (state.query && !rowsForTab(state.tab, state.query).length) {
        const hit = ['arrivals', 'departures', 'inhouse'].find(t => rowsForTab(t, state.query).length);
        if (hit) state.tab = hit;
    }
    renderQueue();
});

$$('.kpi-card').forEach(c => c.addEventListener('click', () => {
    const f = c.dataset.filter;
    state.kpi = state.kpi === f ? null : f;
    if (f === 'all') { state.tab = 'inhouse'; state.page = 1; }
    if (f === 'arrivals' || f === 'departures') { state.tab = f; state.page = 1; }
    renderQueue(); renderKpis();
    if (f === 'overdue') $('#overdueTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (f === 'requests') $('#reqTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
}));

$('#roomBoard').addEventListener('click', e => { const c = e.target.closest('.room-cell'); if (c) openDrawer(+c.dataset.room); });

$('#overdueList').addEventListener('click', e => {
    const b = e.target.closest('button[data-action]'); if (!b) return;
    const name = b.dataset.guest, o = overdue.find(x => x.name === name); if (!o) return;
    if (b.dataset.action === 'contact') toast('Contact request sent', 'Front desk will call ' + name + ' in room ' + o.room + '.');
    if (b.dataset.action === 'force') openForce(name, o.room);
    if (b.dataset.action === 'extend') {
        overdue.splice(overdue.indexOf(o), 1);
        const d = queue.departures.find(g => g.guest === name); if (d) d.status = 'pending';
        logActivity('extended the stay of <strong>' + esc(name) + '</strong> in room <strong>' + o.room + '</strong>.');
        toast('Stay extended', name + ' · room ' + o.room);
        renderAll();
    }
});

$('#reqQueue').addEventListener('change', e => {
    const s = e.target.closest('.req-select'); if (!s) return;
    const r = requests.find(x => x.id === +s.dataset.id); if (!r) return;
    r.assignee = s.value;
    if (s.value !== STAFF[0]) { logActivity('assigned <strong>' + esc(r.title) + '</strong> (room ' + r.room + ') to <strong>' + esc(s.value.split(' (')[0]) + '</strong>.', 'blue'); toast('Request assigned', r.title + ' → ' + s.value); }
    touch();
});

$('#exportCsvBtn').addEventListener('click', () => {
    const rows = rowsForTab(state.tab, state.query);
    if (!rows.length) { toast('Nothing to export', 'The current list is empty.', 'error'); return; }
    const csv = ['Guest,Guest ID,Room,Time,Status'].concat(rows.map(g => [g.guest, g.guestId, g.room, g.time, STATUS_LABEL[g.status]].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'queue-' + state.tab + '.csv'; a.click(); URL.revokeObjectURL(a.href);
    toast('Exported', rows.length + ' rows saved as CSV.');
});

/* Notifications */
const notifMenu = $('#notifMenu');
$('#notifBtn').addEventListener('click', e => { e.stopPropagation(); notifMenu.hidden = !notifMenu.hidden; });
document.addEventListener('click', e => { if (!notifMenu.hidden && !e.target.closest('.topbar-icon-wrap')) notifMenu.hidden = true; });
$('.notif-menu-header .link-muted').addEventListener('click', () => {
    $$('.notif-menu-list li').forEach(li => { li.classList.remove('unread'); const d = $('.notif-dot', li); if (d) d.classList.add('empty'); });
    $('.icon-badge').hidden = true; $('#notifBtn').setAttribute('aria-label', 'Notifications, none unread');
});

/* Mobile sidebar */
const sidebar = $('#sidebar'), sOverlay = $('#sidebarOverlay'), menuBtn = $('#menuToggle');
function setMenu(open) { sidebar.classList.toggle('open', open); sOverlay.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); }
menuBtn.addEventListener('click', () => setMenu(!sidebar.classList.contains('open')));
sOverlay.addEventListener('click', () => setMenu(false));

/* Roles */
function applyRole(role) {
    state.role = role; document.body.dataset.role = role;
    $('#staffRoleLabel').textContent = $('#roleBreadcrumb').textContent = ROLE_LABEL[role];
    $$('[data-role-required]').forEach(a => a.setAttribute('aria-disabled', role === 'manager' ? 'false' : 'true'));
    renderQueue(); renderOverdue(); renderRequests();
}
$('#roleSelect').addEventListener('change', e => { applyRole(e.target.value); toast('Role changed', 'Now viewing as ' + ROLE_LABEL[e.target.value] + '.'); });
document.addEventListener('click', e => { const a = e.target.closest('a[aria-disabled="true"]'); if (a) { e.preventDefault(); toast('Manager only', 'Switch to the Manager role to open this page.', 'error'); } });

/* Shortcuts */
$('#newCheckinBtn').addEventListener('click', () => { window.location.href = 'staff-checkin.html'; });
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (!$('#confirmOverlay').hidden) closeConfirm(); else if (!$('#roomDrawer').hidden) closeDrawer(); notifMenu.hidden = true; setMenu(false); return; }
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    if (e.key === '/') { e.preventDefault(); $('#globalSearch').focus(); }
    if (e.key.toLowerCase() === 'n') $('#newCheckinBtn').click();
});

/* "Last updated" + relative times */
function tick() {
    const s = Math.floor((Date.now() - state.touched) / 1000);
    $('#lastUpdated').textContent = 'Last updated ' + (s < 5 ? 'just now' : s < 60 ? s + 's ago' : Math.floor(s / 60) + 'm ago');
}
setInterval(() => { tick(); renderActivity(); }, 15000);
setInterval(tick, 5000);

applyRole('front-desk');
renderAll();
loadStaff();
})();


// Global function para sa pag-approve ng room (Pwede mong tawagin sa Console)
window.approveGuestRoom = async function(guestId, roomNumber) {
    const { data: profile, error: fetchErr } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', guestId)
        .single();

    if (fetchErr || !profile) {
        console.error("Guest not found");
        return;
    }

    // I-update ang profile: gawing official room, at burahin ang pending_room
    const { error: updateErr } = await window.supabaseClient
        .from('profiles')
        .update({ 
            room: roomNumber, 
            pending_room: null 
        })
        .eq('id', guestId);

    // I-update ang room status to occupied
    await window.supabaseClient
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('room_number', roomNumber);

    if (updateErr) {
        console.error("Error approving:", updateErr);
    } else {
        console.log(`Approved! Guest is now in Room ${roomNumber}`);
    }
};

// Function para sa pag-approve
window.approveGuestRoom = async function(guestId, roomNumber) {
    // 1. I-update ang Profile (gawing official room, alisin ang pending)
    const { error: updateErr } = await window.supabaseClient
        .from('profiles')
        .update({ 
            room: roomNumber, 
            pending_room: null 
        })
        .eq('id', guestId);

    if (updateErr) return console.error("Error:", updateErr);

    // 2. I-update ang Room status
    await window.supabaseClient
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('room_number', roomNumber);

    alert(`Successfully approved Room ${roomNumber}!`);
    window.location.reload(); // I-refresh para mawala yung notification
};

// Auto-fetch notifications for staff
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    // Makinig sa mga bagong notifications
    window.supabaseClient
        .channel('staff-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
            const note = payload.new;
            // Ipakita sa console at sa isang alert
            console.log("NEW REQUEST:", note.message);
            
            // Para makita agad ng staff, mag-a-alert tayo na may request.
            const confirmApprove = confirm(`NEW REQUEST:\n${note.message}\n\nClick OK to approve.`);
            if (confirmApprove) {
                // Kunin yung guest id mula sa user_id ng notification (na siyang guest id natin)
                const guestId = note.user_id;
                // Kunin yung room number mula sa message (basic parsing)
                const roomMatch = note.message.match(/Room (\d+)/);
                if (roomMatch) {
                    window.approveGuestRoom(guestId, roomMatch[1]);
                }
            }
        })
        .subscribe();
});