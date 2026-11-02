/* Haven staff console: dashboard behaviour (mock data, no backend).
   Floors: 2 (rooms 101-111, 201-211). Queue shows 12 rows per page. */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const PAGE_SIZE = 12;

/* ---------------- Data ---------------- */
const STATUS_LABEL = { 'pending': 'Pending', 'checked-in': 'Checked In', 'checked-out': 'Checked Out', 'overdue': 'Overdue' };
const ROOM_LABEL = { 'occupied': 'Occupied', 'vacant-clean': 'Vacant clean', 'vacant-dirty': 'Vacant dirty', 'cleaning': 'Cleaning', 'maintenance': 'Maintenance', 'reserved': 'Reserved' };

const rooms = {};
const layout = {
    1: ['vacant-clean', 'occupied', 'vacant-dirty', 'cleaning', 'reserved', 'maintenance', 'occupied', 'occupied', 'vacant-clean', 'occupied', 'vacant-dirty'],
    2: ['occupied', 'reserved', 'occupied', 'occupied', 'cleaning', 'vacant-dirty', 'occupied', 'occupied', 'reserved', 'vacant-clean', 'reserved']
};
Object.entries(layout).forEach(([f, list]) => list.forEach((status, i) => {
    const number = +f * 100 + i + 1;
    rooms[number] = { number, floor: +f, status, history: [] };
}));

const FIRST = ['Maya', 'Leo', 'Nina', 'Omar', 'Zoe', 'Ken', 'Ana', 'Ivan', 'Priya', 'Tom', 'Lia', 'Sam', 'Hugo', 'Yuki', 'Elena'];
const LAST = ['Santos', 'Garcia', 'Nguyen', 'Silva', 'Kowalski', 'Haddad', 'Lopez', 'Park', 'Rossi', 'Dubois', 'Ibrahim', 'Cole', 'Meyer'];
const TIMES = ['09:00 AM', '09:30 AM', '10:00 AM', '12:00 PM', '12:30 PM', '01:00 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '06:00 PM'];
let idSeq = 1008;
const nextId = () => 'TR-' + (++idSeq);
const person = i => FIRST[i % FIRST.length] + ' ' + LAST[(i * 5 + 2) % LAST.length];
const mk = (guest, guestId, room, time, status) => ({ guest, guestId, room, time, status });

const queue = {
    arrivals: [
        mk('Aiko Tanaka', 'TR-1002', 202, '10:30 AM', 'pending'),
        mk('Diego Marquez', 'TR-1003', 203, '11:00 AM', 'pending'),
        mk('Lena Okafor', 'TR-1004', 208, '11:45 AM', 'checked-in'),
        mk('Ravi Batra', 'TR-1005', 209, '01:15 PM', 'pending'),
        mk('Mei Chen', 'TR-1006', 211, '02:00 PM', 'pending')
    ],
    departures: [
        mk('Sofia Reyes', 'TR-1001', 201, '11:00 AM', 'overdue'),
        mk('Jamie Dela Cruz', 'TR-1007', 107, '11:00 AM', 'pending'),
        mk('Hana Kim', 'TR-1008', 207, '11:30 AM', 'checked-out')
    ],
    inhouse: []
};
[[105, 'pending'], [109, 'checked-in'], [210, 'pending'], [101, 'checked-in'], [211, 'pending'], [202, 'checked-in'], [109, 'pending']]
    .forEach(([room, status], i) => queue.arrivals.push(mk(person(i), nextId(), room, TIMES[i], status)));
[[102, 'pending'], [108, 'checked-out'], [204, 'pending'], [110, 'checked-out'], [203, 'pending']]
    .forEach(([room, status], i) => queue.departures.push(mk(person(i + 20), nextId(), room, TIMES[i + 3], status)));
const OCC = [102, 107, 108, 110, 201, 203, 204, 207, 208];
for (let i = 0; i < 43; i++) queue.inhouse.push(mk(person(i + 40), nextId(), OCC[i % OCC.length], TIMES[i % TIMES.length], 'checked-in'));

const overdue = [
    { name: 'Sofia Reyes', room: 201, expected: 'Oct 9, 2026', days: 1 },
    { name: 'Diego Marquez', room: 203, expected: 'Oct 8, 2026', days: 2 }
];

const STAFF = ['Unassigned', 'Joy Lim (Housekeeping)', 'Ravi Batra (Maintenance)', 'Marco Cruz (Front desk)'];
const requests = [
    { id: 1, title: 'Housekeeping', room: 201, guest: 'Sofia Reyes', ago: '5 min ago', priority: 'urgent', assignee: STAFF[1] },
    { id: 2, title: 'Maintenance', room: 203, guest: 'Diego Marquez', ago: '20 min ago', priority: 'normal', assignee: STAFF[0] },
    { id: 3, title: 'Extra bedding', room: 202, guest: 'Aiko Tanaka', ago: '1 hr ago', priority: 'normal', assignee: STAFF[1] },
    { id: 4, title: 'Locker issue', room: 208, guest: 'Lena Okafor', ago: '2 hr ago', priority: 'normal', assignee: STAFF[0] },
    { id: 5, title: 'Late check-out', room: 207, guest: 'Hana Kim', ago: '3 hr ago', priority: 'urgent', assignee: STAFF[2] }
];

const now0 = Date.now();
const activity = [
    { who: 'Marco Cruz', html: 'checked in <strong>Sofia Reyes</strong> to room <strong>201</strong>.', at: now0 - 5 * 60e3 },
    { who: 'Joy Lim', html: 'marked room <strong>105</strong> as <em>vacant dirty</em>.', at: now0 - 12 * 60e3, cls: 'amber' },
    { who: 'Ravi Batra', html: 'assigned a housekeeping request to <strong>Joy Lim</strong>.', at: now0 - 23 * 60e3, cls: 'blue' },
    { who: 'Marco Cruz', html: 'registered a new guest <strong>Aiko Tanaka</strong>.', at: now0 - 60 * 60e3 }
];

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
    activity.unshift({ who: 'Marco Cruz', html, at: Date.now(), cls });
    activity.length = Math.min(activity.length, 8);
    renderActivity();
}
const rel = ms => { const m = Math.floor(ms / 60e3); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.floor(m / 60) + ' hr ago'; };
const toMin = t => { const m = /(\d+):(\d+)\s*(AM|PM)/.exec(t); return (+m[1] % 12 + (m[3] === 'PM' ? 12 : 0)) * 60 + +m[2]; };
const guestInRoom = no => [...queue.departures, ...queue.arrivals, ...queue.inhouse].find(g => g.room === no && (g.status === 'checked-in' || g.status === 'overdue' || (queue.departures.includes(g) && g.status === 'pending')));

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
            '<td class="muted">' + g.guestId + '</td><td><strong>' + g.room + '</strong></td><td class="muted">' + g.time + '</td>' +
            '<td><span class="status-pill ' + g.status + '"><span class="dot"></span>' + STATUS_LABEL[g.status] + '</span></td>' +
            '<td class="col-actions"><button class="btn btn-sm" data-act="' + a.act + '" data-id="' + g.guestId + '">' + a.label + '</button></td></tr>';
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
        '<span class="overdue-meta">Room ' + o.room + ' · Expected ' + o.expected + '</span>' +
        '<span class="overdue-days">' + o.days + ' day' + (o.days > 1 ? 's' : '') + ' overdue</span></div>' +
        '<div class="overdue-actions"><button class="btn btn-sm btn-outline" data-action="contact" data-guest="' + esc(o.name) + '"' + dis + '>Contact</button>' +
        '<button class="btn btn-sm btn-outline" data-action="extend" data-guest="' + esc(o.name) + '"' + dis + '>Extend</button>' +
        '<button class="btn btn-sm btn-danger" data-action="force" data-guest="' + esc(o.name) + '" data-room="' + o.room + '"' + dis + '>Force check-out</button></div></li>'
    ).join('');
}

/* ---------------- Service requests ---------------- */
function renderRequests() {
    $('#reqQueue').innerHTML = requests.map(r =>
        '<li class="req-item"><div class="req-head"><div><div class="req-title">' + esc(r.title) + '</div>' +
        '<div class="req-meta">Room ' + r.room + ' · ' + esc(r.guest) + ' · ' + r.ago + '</div></div>' +
        '<span class="status-pill ' + (r.priority === 'urgent' ? 'urgent' : 'pending') + '"><span class="dot"></span>' + (r.priority === 'urgent' ? 'Urgent' : 'Normal') + '</span></div>' +
        '<div class="req-row"><label for="assign-' + r.id + '">Assign to</label><select class="req-select" id="assign-' + r.id + '" data-id="' + r.id + '"' + (canAct() ? '' : ' disabled') + '>' +
        STAFF.map(s => '<option' + (s === r.assignee ? ' selected' : '') + '>' + s + '</option>').join('') + '</select></div></li>'
    ).join('');
}

/* ---------------- Room board ---------------- */
function renderRooms() {
    let html = '';
    [1, 2].forEach(f => {
        html += '<div class="room-floor"><h4>Floor ' + f + '</h4><div class="room-grid">';
        Object.values(rooms).filter(r => r.floor === f).forEach(r => {
            html += '<button class="room-cell st-' + r.status + '" data-room="' + r.number + '" aria-label="Room ' + r.number + ', ' + ROOM_LABEL[r.status] + '">' + r.number + '<small>' + ROOM_LABEL[r.status] + '</small></button>';
        });
        html += '</div></div>';
    });
    $('#roomBoard').innerHTML = html;
}

/* ---------------- Activity ---------------- */
function renderActivity() {
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
    $('#roomDrawerSub').textContent = 'Floor ' + r.floor + ' · Standard Shared';
    $('#drawerGuestName').textContent = g ? g.guest : 'No current guest';
    $('#drawerGuestMeta').textContent = g ? 'Guest ID ' + g.guestId + ' · In-house' : ROOM_LABEL[r.status];
    $('.roommate-avatar', $('#roomDrawer')).textContent = g ? initials(g.guest) : '–';
    $('#drawerStatus').textContent = ROOM_LABEL[r.status];
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
    const r = requests.find(x => x.id === +s.dataset.id); r.assignee = s.value;
    if (s.value !== STAFF[0]) { logActivity('assigned <strong>' + esc(r.title) + '</strong> (room ' + r.room + ') to <strong>' + esc(s.value.split(' (')[0]) + '</strong>.', 'blue'); toast('Request assigned', r.title + ' → ' + s.value); }
    touch();
});

$('#exportCsvBtn').addEventListener('click', () => {
    const rows = rowsForTab(state.tab, state.query);
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
})();