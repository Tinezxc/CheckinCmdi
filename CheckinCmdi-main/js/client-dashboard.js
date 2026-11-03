(() => {
'use strict';

const GUESTS_KEY = 'haven.guests.v1';
const SESSION_KEY = 'haven.guest.session';

/* =========================================================
   DATA HELPERS
   ========================================================= */
function loadGuests() {
    try {
        const raw = JSON.parse(localStorage.getItem(GUESTS_KEY));
        return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
}

function normalizeId(s) {
    return String(s || '').trim().replace(/\s+/g, '').toUpperCase();
}

function findGuestByGuestId(input) {
    const q = normalizeId(input);
    if (!q) return null;
    const all = loadGuests();

    // 1. Exact Guest ID (TR-…)
    let hit = all.find(function (g) { return normalizeId(g.guestId) === q; });
    if (hit) return hit;

    // 2. Exact Registration ID (HV-…) — accept either
    hit = all.find(function (g) { return normalizeId(g.regId) === q; });
    if (hit) return hit;

    // 3. Numeric-only ("1001" for "TR-1001")
    hit = all.find(function (g) { return normalizeId(g.guestId).replace(/^[A-Z]+-?/, '') === q; });
    if (hit) return hit;
    hit = all.find(function (g) { return normalizeId(g.regId).replace(/^[A-Z]+-?/, '') === q; });
    if (hit) return hit;

    // 4. Name fallback (only if unique and >= 3 chars)
    if (q.length >= 3) {
        const byName = all.filter(function (g) { return normalizeId(g.name).indexOf(q) !== -1; });
        if (byName.length === 1) return byName[0];
    }

    return null;
}

function loadSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
    catch (e) { return null; }
}
function saveSession(obj) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(obj)); } catch (e) {}
}
function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

/* =========================================================
   DOM REFS
   ========================================================= */
const body = document.body;
const authGate = document.getElementById('authGate');
const authForm = document.getElementById('authForm');
const authGuestId = document.getElementById('authGuestId');
const authErr = document.getElementById('authErr');
const guestShell = document.getElementById('guestShell');
const logoutLink = document.getElementById('logoutLink');

/* =========================================================
   AUTH FLOW
   ========================================================= */
function showGate() {
    body.dataset.auth = 'guest-anon';
    if (guestShell) guestShell.hidden = true;
    if (authGate) authGate.hidden = false;
    setTimeout(function () { if (authGuestId) authGuestId.focus(); }, 50);
}

function showDashboard(guest) {
    body.dataset.auth = 'guest-auth';
    if (authGate) authGate.hidden = true;
    if (guestShell) guestShell.hidden = false;
    renderGuest(guest);
    bindUI();
}

function boot() {
    const session = loadSession();
    if (session && session.guestId) {
        const guest = findGuestByGuestId(session.guestId);
        if (guest) { showDashboard(guest); return; }
        clearSession();
    }
    showGate();
}

if (authForm) {
    authForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const id = authGuestId.value.trim();
        if (!id) {
            authErr.textContent = 'Please enter your Guest ID.';
            authGuestId.focus();
            return;
        }
        const guest = findGuestByGuestId(id);
        console.log('[login] typed:', id, '| stored:', loadGuests().map(function (g) {
            return { guestId: g.guestId, regId: g.regId, name: g.name };
        }));
        if (!guest) {
            const all = loadGuests();
            let hint = '';
            if (!all.length) {
                hint = ' No guest records found on this browser. Register one from the staff console first.';
            } else {
                const ids = all.slice(0, 3).map(function (g) { return g.guestId; }).join(', ');
                hint = ' Registered Guest IDs: ' + ids + (all.length > 3 ? ', …' : '') + '.';
            }
            authErr.textContent = 'No guest found with that ID.' + hint;
            authGuestId.focus();
            return;
        }
        authErr.textContent = '';
        authGuestId.value = '';
        saveSession({ guestId: guest.guestId, at: Date.now() });
        showDashboard(guest);
    });
}

if (logoutLink) {
    logoutLink.addEventListener('click', function (e) {
        e.preventDefault();
        clearSession();
        showGate();
    });
}

/* =========================================================
   RENDER HELPERS
   ========================================================= */
function initials(name) {
    return (name || '').split(' ').filter(Boolean).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();
}
function fmtDate(s) {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function nightsBetween(a, b) {
    return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}
function statusLabel(s) {
    return ({
        'checked-in': 'Checked in',
        'checked-out': 'Checked out',
        'overdue': 'Overdue',
        'arriving': 'Arriving',
        'reserved': 'Reserved'
    })[s] || s;
}

function setBind(key, value) {
    document.querySelectorAll('[data-bind="' + key + '"]').forEach(function (el) {
        el.textContent = value || '—';
    });
}

function renderGuest(g) {
    setBind('name', g.name);
    setBind('initials', initials(g.name));
    setBind('registrationId', g.regId);
    setBind('guestId', g.guestId);
    setBind('institution', g.institution);
    setBind('branch', g.branch || 'Main Campus');
    setBind('room', g.room);
    setBind('floor', g.floor ? 'Floor ' + g.floor : '—');
    setBind('checkIn', fmtDate(g.checkIn));
    setBind('checkOut', fmtDate(g.checkOut));
    setBind('capacity', g.capacity || 'Max 5 guests');
    setBind('ssid', 'Haven-Guest');
    setBind('wifiPassword', 'haven2026');

    const heroTitle = document.getElementById('heroTitle');
    const heroSub = document.getElementById('heroSub');
    if (heroTitle) heroTitle.textContent = 'Hi, ' + g.name.split(' ')[0];
    if (heroSub) {
        const days = nightsBetween(g.checkIn, g.checkOut);
        heroSub.textContent = days + ' night' + (days === 1 ? '' : 's') + ' · Room ' + g.room;
    }

    const now = new Date();
    const start = new Date(g.checkIn);
    const end = new Date(g.checkOut);
    const total = Math.max(1, end - start);
    const elapsed = Math.min(total, Math.max(0, now - start));
    const pct = Math.round((elapsed / total) * 100);

    const pill = document.getElementById('heroPill');
    if (pill) { pill.className = 'status-pill ' + g.status; pill.textContent = statusLabel(g.status); }
    const regPill = document.getElementById('regPill');
    if (regPill) { regPill.className = 'status-pill ' + g.status; regPill.textContent = statusLabel(g.status); }

    const remaining = document.getElementById('heroRemaining');
    if (remaining) {
        const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
        remaining.textContent = g.status === 'checked-out'
            ? 'Stay completed'
            : (daysLeft > 0 ? daysLeft + ' day' + (daysLeft === 1 ? '' : 's') + ' remaining' : 'Check-out is due');
    }

    const track = document.getElementById('progressTrack');
    const fill = document.getElementById('progressFill');
    if (track) track.setAttribute('aria-valuenow', String(pct));
    if (fill) fill.style.width = pct + '%';

    const amenities = document.getElementById('amenities');
    if (amenities) {
        amenities.innerHTML = ['Private bed', 'Shared bath', 'Study desk', 'Storage']
            .map(function (a) { return '<span class="amenity">' + a + '</span>'; }).join('');
    }

    const wifiPass = document.getElementById('wifiPass');
    const wifiToggle = document.getElementById('wifiToggle');
    if (wifiPass) wifiPass.textContent = '••••••••••';
    if (wifiToggle) { wifiToggle.setAttribute('aria-pressed', 'false'); wifiToggle.textContent = 'Show'; }

    renderNotifications(g);
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */
function renderNotifications(g) {
    const list = document.getElementById('notifList');
    const badge = document.getElementById('notifCount');
    if (!list) return;

    const items = (g.history || []).slice(0, 5).map(function (h) {
        return {
            title: h.note,
            meta: new Date(h.at).toLocaleString('en-US'),
            type: h.type
        };
    });

    if (!items.length) {
        list.innerHTML = '<li class="notif-empty">No activity yet. Your stay updates will appear here.</li>';
        if (badge) badge.hidden = true;
        return;
    }

    list.innerHTML = items.map(function (n) {
        return '<li class="notif-item">' +
            '<div class="notif-title">' + n.title + '</div>' +
            '<div class="notif-meta">' + n.meta + '</div>' +
            '</li>';
    }).join('');

    if (badge) { badge.hidden = false; badge.textContent = items.length; }
}

/* =========================================================
   UI BINDINGS
   ========================================================= */
let uiBound = false;
function bindUI() {
    if (uiBound) return;
    uiBound = true;

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            const open = sidebar.classList.toggle('open');
            overlay.classList.toggle('open', open);
            menuToggle.setAttribute('aria-expanded', String(open));
        });
    }
    if (overlay) {
        overlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
        });
    }

    const wifiToggle = document.getElementById('wifiToggle');
    const wifiPass = document.getElementById('wifiPass');
    if (wifiToggle) {
        wifiToggle.addEventListener('click', function () {
            const shown = wifiToggle.getAttribute('aria-pressed') === 'true';
            wifiToggle.setAttribute('aria-pressed', String(!shown));
            wifiToggle.textContent = shown ? 'Show' : 'Hide';
            wifiPass.textContent = shown ? '••••••••••' : 'haven2026';
        });
    }

    document.querySelectorAll('.copy-btn[data-copy-key]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const el = btn.closest('.detail-value');
            const target = el ? el.querySelector('[data-bind]') : null;
            const val = target ? target.textContent : (document.getElementById('wifiPass') ? document.getElementById('wifiPass').textContent : '');
            if (navigator.clipboard) navigator.clipboard.writeText(val).then(function () { toast('Copied', val); });
            else toast('Copy not supported', val);
        });
    });

    document.querySelectorAll('.action-tile').forEach(function (tile) {
        tile.addEventListener('click', function () {
            const labelEl = tile.querySelector('.action-label');
            const label = labelEl ? labelEl.textContent : 'Action';
            toast('Request sent', label + ' · Front desk will follow up.');
        });
    });

    const extendBtn = document.getElementById('extendBtn');
    if (extendBtn) extendBtn.addEventListener('click', function () {
        toast('Extension requested', 'Front desk will confirm your extended stay.');
    });
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', function () {
        toast('Check-out requested', 'Front desk will handle your checkout.');
    });

    const markAllRead = document.getElementById('markAllRead');
    if (markAllRead) markAllRead.addEventListener('click', function () {
        const badge = document.getElementById('notifCount');
        if (badge) badge.hidden = true;
        toast('All read', 'Notifications marked as read.');
    });
    const bellBtn = document.getElementById('bellBtn');
    if (bellBtn) bellBtn.addEventListener('click', function () {
        const card = document.getElementById('notifCard');
        if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); card.focus(); }
    });
}

/* =========================================================
   TOASTS
   ========================================================= */
function toast(title, msg) {
    const region = document.getElementById('toastRegion');
    if (!region) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<strong>' + title + '</strong><span>' + (msg || '') + '</span>';
    region.appendChild(t);
    setTimeout(function () { t.classList.add('leaving'); }, 2800);
    setTimeout(function () { t.remove(); }, 3100);
}

/* =========================================================
   STORAGE SYNC (staff edits reflect live)
   ========================================================= */
window.addEventListener('storage', function (e) {
    if (e.key !== GUESTS_KEY) return;
    const session = loadSession();
    if (!session) return;
    const guest = findGuestByGuestId(session.guestId);
    if (guest) renderGuest(guest);
    else { clearSession(); showGate(); }
});

/* =========================================================
   BOOT
   ========================================================= */
document.addEventListener('DOMContentLoaded', boot);

})();