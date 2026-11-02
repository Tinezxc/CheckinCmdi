/* Haven: accommodation page.
   State lives in localStorage (demo). Replace load()/save() with API calls later. */
(() => {
    'use strict';

    /* ---------- Config ---------- */
    const STORE_KEY = 'haven.accommodation.v1';
    const GUEST_NAME = localStorage.getItem('haven.guestName') || 'Maria Santos';
    const RATE_PER_NIGHT = 850;       // PHP, shared dormitory bed
    const TAX_RATE = 0.12;
    const MAX_EXTENSION_DAYS = 30;
    const WIFI = { ssid: 'Haven-Dorm-Guest', wifiPassword: 'Haven-2026-Stay' };
    const SERVICES = {
        'Housekeeping':      0,
        'Laundry':           150,
        'Maintenance':       0,
        'Extra bedding':     0,
        'Other':             0,
    };
    const DAY = 86400000;
    const DEMO_STAFF_REPLY_MS = 25000; // demo only: open requests get "completed" by the dorm team after this long. Set 0 to disable.

    /* ---------- Helpers ---------- */
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];

    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const fromISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    const diffDays = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY);
    const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const peso = (n) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
    const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
    const uid = () => Math.random().toString(36).slice(2, 9);

    function timeAgo(ms) {
        const mins = Math.round((Date.now() - ms) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.round(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.round(hrs / 24);
        return days < 8 ? `${days}d ago` : fmtDate(new Date(ms));
    }

    /* ---------- State ---------- */
    function defaultState() {
        const today = startOfDay(new Date());
        const now = Date.now();
        return {
            checkIn: toISO(addDays(today, -3)),
            checkOut: toISO(addDays(today, 4)),
            checkoutRequest: null,            // { date: 'YYYY-MM-DD' } or null
            notifications: [
                { id: uid(), key: 'welcome', title: 'Welcome to Haven', body: 'Dorm 201 is ready. Wi-Fi details and dorm rules are on this page.', target: 'wifi', time: now - 3 * DAY, read: false },
            ],
            requests: [
                { id: uid(), type: 'Laundry',      priority: 'Normal', notes: 'One bag, wash and fold', fee: 150, status: 'done', created: now - 3 * DAY },
                { id: uid(), type: 'Housekeeping', priority: 'Normal', notes: 'Weekly cleaning',        fee: 0,   status: 'done', created: now - 2 * DAY },
            ],
        };
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (raw) return JSON.parse(raw);
        } catch { /* fall through */ }
        return defaultState();
    }
    function save() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
    }

    let state = load();
    let filter = 'all';

    /* ---------- Derived values ---------- */
    function stay() {
        const today = startOfDay(new Date());
        const checkIn = fromISO(state.checkIn);
        const plannedOut = fromISO(state.checkOut);
        const out = state.checkoutRequest ? fromISO(state.checkoutRequest.date) : plannedOut;
        const nights = Math.max(diffDays(checkIn, out), 1);
        const overdueDays = !state.checkoutRequest && today > out ? diffDays(out, today) : 0;
        const pct = Math.min(100, Math.max(0, Math.round((diffDays(checkIn, today) / nights) * 100)));

        let label, tone, remaining;
        if (state.checkoutRequest) {
            label = 'Check-out requested'; tone = 'info';
            const left = diffDays(today, out);
            remaining = left > 0 ? `Leaving in ${plural(left, 'day')}` : left === 0 ? 'Leaving today' : 'Awaiting desk';
        } else if (today < checkIn) {
            label = 'Upcoming'; tone = 'info';
            remaining = `Starts in ${plural(diffDays(today, checkIn), 'day')}`;
        } else if (overdueDays > 0) {
            label = 'Overdue'; tone = 'warn';
            remaining = `Overdue by ${plural(overdueDays, 'day')}`;
        } else {
            label = 'Checked in'; tone = 'ok';
            const left = diffDays(today, out);
            remaining = left === 0 ? 'Check-out today' : `${plural(left, 'night')} left`;
        }
        return { today, checkIn, plannedOut, out, nights, overdueDays, pct, label, tone, remaining };
    }

    function charges(s) {
        const billable = s.nights + s.overdueDays;
        const accommodation = billable * RATE_PER_NIGHT;
        const services = state.requests.filter((r) => r.status !== 'cancelled').reduce((sum, r) => sum + (r.fee || 0), 0);
        const tax = (accommodation + services) * TAX_RATE;
        return { billable, accommodation, services, tax, total: accommodation + services + tax };
    }

    /* ---------- Rendering ---------- */
    function renderStay() {
        const s = stay();
        $$('[data-bind="fullname"]').forEach((el) => { el.textContent = GUEST_NAME; });
        $$('[data-avatar]').forEach((el) => { el.textContent = initials(GUEST_NAME); });
        $$('[data-bind="checkIn"]').forEach((el) => { el.textContent = fmtDate(s.checkIn); });
        $$('[data-bind="checkOut"]').forEach((el) => { el.textContent = fmtDate(s.out); });
        $('#stepOutDate').textContent = fmtDate(s.out);
        $('#factNights').textContent = plural(s.nights, 'night');
        $('#factRemaining').textContent = s.remaining;

        const status = $('#statusLabel');
        status.textContent = s.label;
        status.className = `status ${s.tone}`;

        const bar = $('#stayBar');
        bar.setAttribute('aria-valuenow', String(s.pct));
        $('#stayBarFill').style.width = s.pct + '%';

        const started = s.today >= s.checkIn;
        $('#stepIn').classList.toggle('done', started);
        $('#stepOut').classList.toggle('current', s.overdueDays > 0);
        $('#stepOut').classList.toggle('done', false);

        $('#checkoutBtn').textContent = state.checkoutRequest ? 'Cancel check-out request' : 'Request check-out';
    }

    function renderCharges() {
        const s = stay();
        const c = charges(s);
        $('#chargeStayLabel').textContent = `Accommodation (${plural(c.billable, 'night')} × ${peso(RATE_PER_NIGHT)})`;
        $('#chargeStay').textContent = peso(c.accommodation);
        $('#chargeServices').textContent = peso(c.services);
        $('#chargeTax').textContent = peso(c.tax);
        $('#chargeTotal').textContent = peso(c.total);
    }

    function renderRequests() {
        const list = $('#requestList');
        const isOpen = (r) => r.status === 'open';
        const counts = {
            all: state.requests.length,
            open: state.requests.filter(isOpen).length,
            closed: state.requests.filter((r) => !isOpen(r)).length,
        };
        $('#cntAll').textContent = counts.all;
        $('#cntOpen').textContent = counts.open;
        $('#cntClosed').textContent = counts.closed;

        $$('.filter').forEach((b) => {
            const on = b.dataset.filter === filter;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', String(on));
        });

        const visible = state.requests
            .filter((r) => filter === 'all' || (filter === 'open' ? isOpen(r) : !isOpen(r)))
            .sort((a, b) => b.created - a.created);

        list.replaceChildren();
        $('#requestsEmpty').hidden = visible.length > 0;
        $('#requestsEmpty').textContent = filter === 'all' ? 'No requests yet. Use "New request" to ask the dorm team for something.' : `No ${filter} requests.`;

        const tones = { open: ['info', 'Open'], done: ['ok', 'Completed'], cancelled: ['', 'Cancelled'] };
        for (const r of visible) {
            const li = document.createElement('li');

            const main = document.createElement('div');
            const title = document.createElement('div');
            title.className = 'req-title';
            title.textContent = r.type + (r.priority === 'Urgent' ? ' · Urgent' : '');
            const desc = document.createElement('div');
            desc.className = 'req-desc';
            desc.textContent = r.notes || 'No notes';
            const meta = document.createElement('div');
            meta.className = 'req-meta';
            meta.textContent = timeAgo(r.created) + (r.fee ? ` · ${peso(r.fee)}` : '');
            main.append(title, desc, meta);

            const side = document.createElement('div');
            side.className = 'req-side';
            const [tone, text] = tones[r.status] || ['', r.status];
            const pill = document.createElement('span');
            pill.className = `status ${tone}`.trim();
            pill.textContent = text;
            side.append(pill);
            if (r.status === 'open') {
                const cancel = document.createElement('button');
                cancel.type = 'button';
                cancel.className = 'link';
                cancel.textContent = 'Cancel';
                cancel.addEventListener('click', () => cancelRequest(r.id));
                side.append(cancel);
            }

            li.append(main, side);
            list.append(li);
        }
    }

    function renderAll() { renderStay(); renderCharges(); renderRequests(); renderBell(); }

    /* ---------- Toasts ---------- */
    function toast(message, type = '') {
        const box = $('#toasts');
        const t = document.createElement('div');
        t.className = `toast ${type}`.trim();
        t.textContent = message;
        box.append(t);
        setTimeout(() => t.remove(), 3500);
    }

    /* ---------- Modal ---------- */
    const modal = $('#modal');
    const modalForm = $('#modalForm');
    let modalHandler = null;
    let modalOpener = null;

    function openModal({ title, intro = '', body = '', confirm = 'Confirm', onConfirm, onOpen }) {
        modalOpener = document.activeElement;
        $('#modalTitle').textContent = title;
        const introEl = $('#modalIntro');
        introEl.textContent = intro;
        introEl.hidden = !intro;
        $('#modalBody').innerHTML = body;
        $('#modalConfirm').textContent = confirm;
        modalHandler = onConfirm;
        modal.showModal();
        onOpen?.(modalForm);
        $('#modalBody').querySelector('input, select, textarea')?.focus();
    }

    function fieldError(input, msg) {
        const field = input.closest('.field');
        field?.classList.add('error');
        const e = document.createElement('div');
        e.className = 'error-msg';
        e.textContent = msg;
        field?.append(e);
        input.setAttribute('aria-invalid', 'true');
    }

    modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        $$('.error-msg', modalForm).forEach((n) => n.remove());
        $$('.field.error', modalForm).forEach((n) => n.classList.remove('error'));
        $$('[aria-invalid]', modalForm).forEach((n) => n.removeAttribute('aria-invalid'));
        if (modalHandler?.(modalForm) !== false) modal.close();
    });
    $('#modalCancel').addEventListener('click', () => modal.close());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
    modal.addEventListener('close', () => { modalHandler = null; modalOpener?.focus?.(); });

    /* ---------- Actions ---------- */
    function newRequest() {
        const opts = Object.keys(SERVICES).map((t) =>
            `<option value="${t}">${t}${SERVICES[t] ? ` (${peso(SERVICES[t])})` : ''}</option>`).join('');
        openModal({
            title: 'New service request',
            intro: 'The dorm office will pick this up during office hours.',
            confirm: 'Submit request',
            body: `
                <div class="field"><label for="rqType">Service</label><select id="rqType" name="type">${opts}</select></div>
                <div class="field"><label for="rqPriority">Priority</label>
                    <select id="rqPriority" name="priority"><option>Normal</option><option>Urgent</option></select></div>
                <div class="field"><label for="rqNotes">Details</label>
                    <textarea id="rqNotes" name="notes" placeholder="What do you need?"></textarea></div>`,
            onConfirm: (f) => {
                const type = f.type.value;
                const notes = f.notes.value.trim();
                if (type === 'Other' && !notes) { fieldError(f.notes, 'Please describe what you need.'); return false; }
                state.requests.push({ id: uid(), type, priority: f.priority.value, notes, fee: SERVICES[type] || 0, status: 'open', created: Date.now() });
                save(); filter = 'open'; renderAll();
                toast(`${type} request sent.`);
                addNote({ title: 'Request sent', body: `Your ${type.toLowerCase()} request was received by the dorm office.`, target: 'requests' });
            },
        });
    }

    function cancelRequest(id) {
        const r = state.requests.find((x) => x.id === id);
        if (!r) return;
        openModal({
            title: 'Cancel this request?',
            intro: `${r.type} will be marked as cancelled and any fee removed.`,
            confirm: 'Cancel request',
            onConfirm: () => { r.status = 'cancelled'; save(); renderAll(); toast('Request cancelled.'); },
        });
    }

    function extendStay() {
        if (state.checkoutRequest) { toast('Cancel your check-out request before extending.', 'error'); return; }
        const s = stay();
        const min = toISO(addDays(s.plannedOut, 1));
        const max = toISO(addDays(s.plannedOut, MAX_EXTENSION_DAYS));
        openModal({
            title: 'Extend your stay',
            intro: `Currently checking out ${fmtDate(s.plannedOut)}. You can extend by up to ${MAX_EXTENSION_DAYS} days.`,
            confirm: 'Extend stay',
            body: `
                <div class="field"><label for="exDate">New check-out date</label>
                    <input id="exDate" name="date" type="date" min="${min}" max="${max}" value="${min}"></div>
                <p class="note" id="exPreview"></p>`,
            onOpen: (f) => {
                const preview = $('#exPreview');
                const update = () => {
                    if (!f.date.value) { preview.textContent = ''; return; }
                    const extra = diffDays(s.plannedOut, fromISO(f.date.value));
                    preview.textContent = extra > 0 ? `Adds ${plural(extra, 'night')}, about ${peso(extra * RATE_PER_NIGHT)} before tax.` : '';
                };
                f.date.addEventListener('input', update);
                update();
            },
            onConfirm: (f) => {
                const v = f.date.value;
                if (!v) { fieldError(f.date, 'Choose a date.'); return false; }
                if (v < min || v > max) { fieldError(f.date, `Pick a date between ${fmtDate(fromISO(min))} and ${fmtDate(fromISO(max))}.`); return false; }
                state.checkOut = v; save(); renderAll();
                toast(`Stay extended to ${fmtDate(fromISO(v))}.`);
                addNote({ title: 'Stay extended', body: `Your new check-out date is ${fmtDate(fromISO(v))}.`, target: 'stay' });
            },
        });
    }

    function checkoutAction() {
        if (state.checkoutRequest) {
            openModal({
                title: 'Cancel check-out request?',
                intro: `Your stay goes back to ending on ${fmtDate(fromISO(state.checkOut))}.`,
                confirm: 'Cancel request',
                onConfirm: () => { state.checkoutRequest = null; save(); renderAll(); toast('Check-out request cancelled.'); },
            });
            return;
        }
        const s = stay();
        const today = s.today;
        const min = toISO(today > s.checkIn ? today : s.checkIn);
        const max = toISO(s.plannedOut > today ? s.plannedOut : today);
        openModal({
            title: 'Request check-out',
            intro: 'Choose the day you will leave. Charges are recalculated for the nights you actually stay.',
            confirm: 'Request check-out',
            body: `<div class="field"><label for="coDate">Check-out date</label>
                   <input id="coDate" name="date" type="date" min="${min}" max="${max}" value="${max}"></div>`,
            onConfirm: (f) => {
                const v = f.date.value;
                if (!v) { fieldError(f.date, 'Choose a date.'); return false; }
                if (v < min || v > max) { fieldError(f.date, 'That date is outside your stay.'); return false; }
                state.checkoutRequest = { date: v }; save(); renderAll();
                toast('Check-out requested. The dorm office will confirm.');
                addNote({ title: 'Check-out requested', body: `You asked to check out on ${fmtDate(fromISO(v))}. Charges were updated.`, target: 'charges' });
            },
        });
    }

    function downloadStatement() {
        const s = stay();
        const c = charges(s);
        const pad = (a, b) => a.padEnd(34) + b.padStart(14);
        const lines = [
            'HAVEN · A PLACE TO BELONG',
            'Accommodation statement',
            '',
            `Guest:        ${GUEST_NAME} (HV-1001)`,
            'Dorm:         201, Floor 2 (shared dormitory)',
            `Check-in:     ${fmtDate(s.checkIn)}`,
            `Check-out:    ${fmtDate(s.out)}`,
            `Status:       ${s.label}`,
            `Issued:       ${fmtDate(new Date())}`,
            '',
            pad(`Accommodation (${c.billable} nights)`, peso(c.accommodation)),
            pad('Additional services', peso(c.services)),
            pad('Taxes and fees (12%)', peso(c.tax)),
            '-'.repeat(48),
            pad('TOTAL', peso(c.total)),
            '',
            'Services:',
            ...state.requests.filter((r) => r.status !== 'cancelled' && r.fee)
                .map((r) => pad(`  ${r.type} (${fmtDate(new Date(r.created))})`, peso(r.fee))),
        ];
        const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'haven-statement-HV-1001.txt';
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        toast('Statement downloaded.');
    }

    async function copyText(text) {
        try { await navigator.clipboard.writeText(text); }
        catch {
            const t = document.createElement('textarea');
            t.value = text; document.body.append(t); t.select();
            document.execCommand('copy'); t.remove();
        }
    }

    /* ---------- Wiring ---------- */
    $('#newRequestBtn').addEventListener('click', newRequest);
    $('#extendBtn').addEventListener('click', extendStay);
    $('#checkoutBtn').addEventListener('click', checkoutAction);
    $('#receiptBtn').addEventListener('click', downloadStatement);

    $$('.filter').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.filter; renderRequests(); }));

    const passEl = $('#wifiPass');
    const dots = passEl.textContent;
    $('#wifiToggle').addEventListener('click', (e) => {
        const showing = e.currentTarget.getAttribute('aria-pressed') !== 'true';
        passEl.textContent = showing ? WIFI.wifiPassword : dots;
        e.currentTarget.textContent = showing ? 'Hide' : 'Show';
        e.currentTarget.setAttribute('aria-pressed', String(showing));
    });
    $$('[data-copy-key]').forEach((b) => b.addEventListener('click', async () => {
        await copyText(WIFI[b.dataset.copyKey]);
        toast(b.dataset.copyKey === 'ssid' ? 'Network name copied.' : 'Password copied.');
    }));

    $('#resetDemo').addEventListener('click', () => {
        openModal({
            title: 'Reset demo data?',
            intro: 'This restores the sample stay and requests.',
            confirm: 'Reset',
            onConfirm: () => { state = defaultState(); filter = 'all'; save(); renderAll(); toast('Demo data reset.'); },
        });
    });

    // Mobile sidebar
    const toggle = $('#menuToggle'), sidebar = $('#sidebar'), overlay = $('#sidebarOverlay');
    const setSidebar = (open) => {
        sidebar.classList.toggle('open', open);
        overlay.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setSidebar(!sidebar.classList.contains('open')));
    overlay.addEventListener('click', () => setSidebar(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setSidebar(false); });

    /* ---------- Notifications ---------- */
    const TARGETS = {
        stay: '[aria-labelledby="stayTitle"]',
        requests: '[aria-labelledby="reqTitle"]',
        charges: '[aria-labelledby="chargeTitle"]',
        wifi: '[aria-labelledby="wifiTitle"]',
    };
    const bell = $('.topbar-actions .icon-btn');
    const bellDot = $('#bellDot');
    const panel = document.createElement('div');
    panel.className = 'notif-panel';
    panel.id = 'notifPanel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Notifications');
    bell.parentElement.append(panel);
    bell.setAttribute('aria-haspopup', 'dialog');
    bell.setAttribute('aria-controls', 'notifPanel');
    bell.setAttribute('aria-expanded', 'false');

    const notes = () => (state.notifications = state.notifications || []);

    function addNote({ key, title, body, target }) {
        const list = notes();
        if (key && list.some((n) => n.key === key)) return;
        list.unshift({ id: uid(), key, title, body, target, time: Date.now(), read: false });
        state.notifications = list.slice(0, 30);
        save();
        renderBell();
    }

    function renderBell() {
        const unread = notes().filter((n) => !n.read).length;
        bellDot.hidden = unread === 0;
        bell.setAttribute('aria-label', unread ? `Notifications, ${unread} unread` : 'Notifications');
        if (!panel.hidden) renderPanel();
    }

    function renderPanel() {
        const list = notes();
        const unread = list.filter((n) => !n.read).length;
        panel.replaceChildren();

        const head = document.createElement('div');
        head.className = 'notif-head';
        const h = document.createElement('strong');
        h.textContent = unread ? `Notifications (${unread})` : 'Notifications';
        const markAll = document.createElement('button');
        markAll.type = 'button'; markAll.className = 'link';
        markAll.textContent = 'Mark all read';
        markAll.disabled = unread === 0;
        markAll.addEventListener('click', () => { list.forEach((n) => { n.read = true; }); save(); renderBell(); });
        head.append(h, markAll);
        panel.append(head);

        if (!list.length) {
            const empty = document.createElement('p');
            empty.className = 'empty';
            empty.textContent = "You're all caught up.";
            panel.append(empty);
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'notif-list';
        for (const n of list) {
            const li = document.createElement('li');
            li.className = 'notif-item' + (n.read ? '' : ' unread');

            const open = document.createElement('button');
            open.type = 'button'; open.className = 'notif-open';
            const t = document.createElement('span'); t.className = 'notif-title'; t.textContent = n.title;
            const b = document.createElement('span'); b.className = 'notif-body'; b.textContent = n.body;
            const m = document.createElement('span'); m.className = 'notif-time'; m.textContent = timeAgo(n.time);
            open.append(t, b, m);
            open.addEventListener('click', () => {
                n.read = true; save(); closePanel(); renderBell();
                const el = TARGETS[n.target] && $(TARGETS[n.target]);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('flash');
                    setTimeout(() => el.classList.remove('flash'), 1600);
                }
            });

            const x = document.createElement('button');
            x.type = 'button'; x.className = 'notif-x';
            x.setAttribute('aria-label', `Dismiss: ${n.title}`);
            x.textContent = '×';
            x.addEventListener('click', () => { state.notifications = notes().filter((i) => i.id !== n.id); save(); renderBell(); });

            li.append(open, x);
            ul.append(li);
        }
        panel.append(ul);

        const foot = document.createElement('div');
        foot.className = 'notif-foot';
        const clear = document.createElement('button');
        clear.type = 'button'; clear.className = 'link';
        clear.textContent = 'Clear all';
        clear.addEventListener('click', () => { state.notifications = []; save(); renderBell(); });
        foot.append(clear);
        panel.append(foot);
    }

    function openPanel() { renderPanel(); panel.hidden = false; bell.setAttribute('aria-expanded', 'true'); }
    function closePanel() { panel.hidden = true; bell.setAttribute('aria-expanded', 'false'); }

    // The bell is a link to the dashboard in the HTML; turn it into a button so it can never navigate.
    bell.removeAttribute('href');
    bell.setAttribute('role', 'button');
    bell.setAttribute('tabindex', '0');
    bell.style.cursor = 'pointer';
    const toggleBell = (e) => { e.preventDefault(); e.stopPropagation(); panel.hidden ? openPanel() : closePanel(); };
    bell.addEventListener('click', toggleBell, true);
    bell.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') toggleBell(e); });
    document.addEventListener('click', (e) => {
        if (!panel.hidden && !panel.contains(e.target) && !bell.contains(e.target)) closePanel();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !panel.hidden) { closePanel(); bell.focus(); }
    });

    /* Demo staff replies and stay reminders */
    function tick() {
        let changed = false;
        if (DEMO_STAFF_REPLY_MS > 0) {
            for (const r of state.requests) {
                if (r.status === 'open' && Date.now() - r.created > DEMO_STAFF_REPLY_MS) {
                    r.status = 'done'; changed = true;
                    addNote({ title: 'Request completed', body: `Your ${r.type.toLowerCase()} request has been completed.`, target: 'requests' });
                }
            }
        }
        const s = stay();
        if (!state.checkoutRequest) {
            const left = diffDays(s.today, s.out);
            if (left === 1) addNote({ key: `soon-${state.checkOut}`, title: 'Check-out tomorrow', body: `Your stay ends ${fmtDate(s.out)}. Extend it or request check-out here.`, target: 'stay' });
            if (left === 0) addNote({ key: `today-${state.checkOut}`, title: 'Check-out today', body: 'Please vacate by the check-out time and return your keycard.', target: 'stay' });
            if (s.overdueDays > 0) addNote({ key: `overdue-${toISO(s.today)}`, title: 'Your stay is overdue', body: `Extra nights are being added to your charges. Extend your stay or request check-out.`, target: 'charges' });
        }
        if (changed) { save(); renderAll(); }
    }

    // Keep tabs in sync and refresh time-based state
    window.addEventListener('storage', (e) => { if (e.key === STORE_KEY) { state = load(); renderAll(); } });
    setInterval(tick, 5000);
    setInterval(renderAll, 60000);

    renderAll();
    tick();
})();