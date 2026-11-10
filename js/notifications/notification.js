/* Haven staff console: notification bell (Guests page).
   - Bell opens a panel with All / Unread tabs, mark-all-read, dismiss, clear all.
   - Clicking a guest notification opens that guest's drawer.
   - Every toast the page shows is also logged here, so actions leave a trail.
   - Items are filtered by the signed-in role and kept in localStorage.
   - Other scripts can add items with: HavenNotify.push({ type, title, message, guestId, guestName, roles }) */
(() => {
'use strict';

const KEY = 'haven.guests.notifications.v1';
const MAX = 40;
const ALL_ROLES = ['front-desk', 'housekeeping', 'manager'];
const FD_MGR = ['front-desk', 'manager'];

const svg = p => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
const ICON = {
    overdue: svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
    request: svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
    arrival: svg('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>'),
    system:  svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),
    success: svg('<polyline points="20 6 9 17 4 12"/>'),
    error:   svg('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>')
};
const X_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const role = () => document.body.dataset.role || 'front-desk';
const rel = ms => {
    const m = Math.floor(ms / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return m + ' min ago';
    const h = Math.floor(m / 60);
    return h < 24 ? h + ' hr ago' : Math.floor(h / 24) + ' d ago';
};

/* ---------- Data ---------- */
function seed() {
    const t = Date.now(), min = 60000;
    return [
        { id: 's1', type: 'overdue', title: 'Overdue check-out', message: 'Sofia Reyes · room 201 · 1 day overdue.', guestId: 1, guestName: 'Sofia Reyes', roles: FD_MGR, at: t - 10 * min, read: false },
        { id: 's2', type: 'overdue', title: 'Overdue check-out', message: 'Diego Marquez · room 303 · 2 days overdue.', guestId: 3, guestName: 'Diego Marquez', roles: FD_MGR, at: t - 25 * min, read: false },
        { id: 's3', type: 'request', title: 'Urgent service request', message: 'Housekeeping requested for room 201.', guestId: 1, guestName: 'Sofia Reyes', roles: ALL_ROLES, at: t - 50 * min, read: false },
        { id: 's4', type: 'arrival', title: 'Arrival today', message: 'Ravi Batra arrives today · room 401.', guestId: 5, guestName: 'Ravi Batra', roles: FD_MGR, at: t - 3 * 60 * min, read: true },
        { id: 's5', type: 'system', title: 'Arrivals report ready', message: 'The report for Oct 10 is ready to download.', roles: ['manager'], at: t - 5 * 60 * min, read: true },
        { id: 's6', type: 'success', title: 'Room flagged for cleaning', message: 'Hana Kim checked out · room 308 needs cleaning.', guestId: 8, guestName: 'Hana Kim', roles: ALL_ROLES, at: t - 26 * 60 * min, read: true }
    ];
}
let items;
try { items = JSON.parse(localStorage.getItem(KEY)); } catch (e) { items = null; }
if (!Array.isArray(items)) items = seed();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* storage unavailable */ } };
const visible = () => items.filter(n => !n.roles || n.roles.includes(role()));

/* ---------- Panel ---------- */
const panel = document.createElement('div');
panel.className = 'np-panel';
panel.id = 'notifPanel';
panel.setAttribute('role', 'dialog');
panel.setAttribute('aria-label', 'Notifications');
panel.tabIndex = -1;
panel.hidden = true;
panel.innerHTML =
    '<div class="np-head"><div><strong>Notifications</strong><span class="np-sub"></span></div>' +
    '<button type="button" class="np-link" data-n="readall">Mark all read</button></div>' +
    '<div class="np-tabs" role="tablist">' +
    '<button type="button" class="np-tab active" role="tab" aria-selected="true" data-tab="all">All <span class="np-count"></span></button>' +
    '<button type="button" class="np-tab" role="tab" aria-selected="false" data-tab="unread">Unread <span class="np-count"></span></button></div>' +
    '<ul class="np-list"></ul>' +
    '<div class="np-foot"><button type="button" class="np-link" data-n="clear">Clear all</button></div>';
document.body.appendChild(panel);

const $ = s => panel.querySelector(s);
const triggers = () => [...document.querySelectorAll('[data-notif-trigger]')];
let tab = 'all', openFrom = null;

function render() {
    const list = visible().sort((a, b) => b.at - a.at);
    const unread = list.filter(n => !n.read);
    const shown = tab === 'unread' ? unread : list;

    $('.np-sub').textContent = unread.length ? unread.length + ' unread' : 'All caught up';
    const counts = panel.querySelectorAll('.np-count');
    counts[0].textContent = list.length;
    counts[1].textContent = unread.length;
    $('[data-n="readall"]').disabled = !unread.length;
    $('[data-n="clear"]').disabled = !list.length;

    $('.np-list').innerHTML = shown.length ? shown.map(n =>
        '<li class="np-item n-' + esc(n.type) + (n.read ? '' : ' unread') + '" data-id="' + esc(n.id) + '" tabindex="0">' +
        '<span class="np-ico">' + (ICON[n.type] || ICON.system) + '</span>' +
        '<div class="np-main"><p class="np-title">' + esc(n.title) + '</p>' +
        (n.message ? '<p class="np-msg">' + esc(n.message) + '</p>' : '') +
        '<span class="np-time">' + rel(Date.now() - n.at) + (n.guestId ? ' · View guest' : '') + '</span></div>' +
        '<button type="button" class="np-x" data-x aria-label="Dismiss notification">' + X_ICON + '</button></li>'
    ).join('') :
        '<li class="np-empty"><strong>' + (tab === 'unread' ? 'No unread notifications' : 'No notifications') + '</strong><span>New alerts will show up here.</span></li>';

    triggers().forEach(t => {
        const b = t.querySelector('[data-notif-badge]');
        if (b) { b.hidden = !unread.length; b.textContent = unread.length > 9 ? '9+' : unread.length; }
        t.setAttribute('aria-label', unread.length ? 'Notifications, ' + unread.length + ' unread' : 'Notifications');
    });
}

function place(trigger) {
    const r = trigger.getBoundingClientRect();
    panel.style.top = Math.round(r.bottom + 8) + 'px';
    if (window.innerWidth < 640) { panel.style.left = '12px'; panel.style.right = '12px'; }
    else { panel.style.left = 'auto'; panel.style.right = Math.max(12, Math.round(window.innerWidth - r.right)) + 'px'; }
}
function open(trigger) {
    openFrom = trigger || triggers().find(t => t.offsetParent !== null) || null;
    if (!openFrom) return;
    render(); place(openFrom);
    panel.hidden = false;
    triggers().forEach(t => t.setAttribute('aria-expanded', t === openFrom));
    panel.focus();
}
function close(restore) {
    if (panel.hidden) return;
    panel.hidden = true;
    triggers().forEach(t => t.setAttribute('aria-expanded', 'false'));
    if (restore && openFrom) openFrom.focus();
}

function setRead(n, read) { n.read = read; save(); render(); }
function openGuest(n) {
    if (!n.guestId) return;
    const input = document.getElementById('filterSearch');
    const find = () => document.querySelector('tr[data-id="' + n.guestId + '"]');
    close(false);
    if (!find()) {                                   // make sure the row is in the current table
        const all = document.querySelector('.saved-tab[data-view="all"]'); if (all) all.click();
        if (input && !find()) { input.value = n.guestName || ''; input.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    const row = find();
    if (row) row.click();
    if (input && input.value) { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); }
}

/* ---------- Events ---------- */
panel.addEventListener('click', e => {
    const tabBtn = e.target.closest('.np-tab');
    if (tabBtn) {
        tab = tabBtn.dataset.tab;
        panel.querySelectorAll('.np-tab').forEach(t => { const on = t === tabBtn; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
        render(); return;
    }
    const act = e.target.closest('[data-n]');
    if (act && act.dataset.n === 'readall') { visible().forEach(n => { n.read = true; }); save(); render(); return; }
    if (act && act.dataset.n === 'clear') { const ids = new Set(visible().map(n => n.id)); items = items.filter(n => !ids.has(n.id)); save(); render(); return; }
    const li = e.target.closest('.np-item'); if (!li) return;
    const n = items.find(x => String(x.id) === li.dataset.id); if (!n) return;
    if (e.target.closest('[data-x]')) { items = items.filter(x => x !== n); save(); render(); return; }
    n.read = true; save(); render(); openGuest(n);
});
panel.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList.contains('np-item')) e.target.click();
});

document.addEventListener('click', e => {
    const t = e.target.closest('[data-notif-trigger]');
    if (t) { e.stopPropagation(); if (!panel.hidden && openFrom === t) close(true); else open(t); return; }
    if (!panel.hidden && !panel.contains(e.target)) close(false);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') close(true); });
window.addEventListener('resize', () => { if (!panel.hidden) close(false); });

/* ---------- Public API + hooks ---------- */
function push(n) {
    items.unshift(Object.assign({ id: 'n' + Date.now() + Math.random().toString(36).slice(2, 6), type: 'system', roles: ALL_ROLES, at: Date.now(), read: false }, n));
    items.length = Math.min(items.length, MAX);
    save(); render();
    if (panel.hidden) triggers().forEach(t => { t.classList.remove('ring'); void t.offsetWidth; t.classList.add('ring'); });
}
window.HavenNotify = { push, open, close, markAllRead: () => { visible().forEach(n => { n.read = true; }); save(); render(); } };

document.addEventListener('DOMContentLoaded', () => {
    render();
    const box = document.getElementById('toastContainer');
    if (box) new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(node => {
        if (!node.classList || !node.classList.contains('toast')) return;
        const strong = node.querySelector('strong');
        const title = strong ? strong.textContent.trim() : 'Notification';
        if (title === 'Role switched') return;
        const body = node.querySelector('.toast-text');
        const message = body ? body.textContent.replace(title, '').trim() : '';
        push({ type: node.classList.contains('error') ? 'error' : 'success', title, message });
    }))).observe(box, { childList: true });
    new MutationObserver(render).observe(document.body, { attributes: true, attributeFilter: ['data-role'] });
    setInterval(() => { if (!panel.hidden) render(); }, 30000);
});
})();