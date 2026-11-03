/* Haven · guest-store.js */
(() => {
'use strict';

const KEY = 'haven.guests.v1';

const SEED = [
    { id: 1,  name: 'Sofia Reyes',    guestId: 'TR-1001', regId: 'HV-1001', institution: 'Polytechnic University', branch: 'Main Campus', room: '201', floor: 2, checkIn: '2026-10-02', checkOut: '2026-10-09', status: 'overdue',     email: 'sofia.reyes@example.com',    phone: '+63 912 345 6789', idNum: '2022-00123' },
    { id: 2,  name: 'Aiko Tanaka',    guestId: 'TR-1002', regId: 'HV-1002', institution: 'Osaka Institute',        branch: 'Main Campus', room: '202', floor: 2, checkIn: '2026-10-03', checkOut: '2026-10-10', status: 'checked-in', email: 'aiko.tanaka@example.com',    phone: '+81 90 1234 5678', idNum: '2023-00456' },
    { id: 3,  name: 'Diego Marquez',  guestId: 'TR-1003', regId: 'HV-1003', institution: 'State College',          branch: 'Main Campus', room: '303', floor: 3, checkIn: '2026-10-01', checkOut: '2026-10-08', status: 'overdue',     email: 'diego.marquez@example.com',  phone: '+63 917 888 2211', idNum: '2021-00789' },
    { id: 4,  name: 'Lena Okafor',    guestId: 'TR-1004', regId: 'HV-1004', institution: 'Polytechnic University', branch: 'Main Campus', room: '208', floor: 2, checkIn: '2026-10-04', checkOut: '2026-10-11', status: 'checked-in', email: 'lena.okafor@example.com',    phone: '+63 920 555 1212', idNum: '2022-00345' },
    { id: 5,  name: 'Ravi Batra',     guestId: 'TR-1005', regId: 'HV-1005', institution: 'Osaka Institute',        branch: 'Main Campus', room: '401', floor: 4, checkIn: '2026-10-10', checkOut: '2026-10-17', status: 'arriving',   email: 'ravi.batra@example.com',    phone: '+91 98 7654 3210', idNum: '2023-00910' },
    { id: 6,  name: 'Mei Chen',       guestId: 'TR-1006', regId: 'HV-1006', institution: 'State College',          branch: 'Main Campus', room: '405', floor: 4, checkIn: '2026-10-10', checkOut: '2026-10-15', status: 'arriving',   email: 'mei.chen@example.com',      phone: '+86 138 0011 2233', idNum: '2022-00555' },
    { id: 7,  name: 'Jamie Dela Cruz',guestId: 'TR-1007', regId: 'HV-1007', institution: 'Polytechnic University', branch: 'Main Campus', room: '304', floor: 3, checkIn: '2026-09-28', checkOut: '2026-10-05', status: 'checked-out', email: 'jamie.dc@example.com',      phone: '+63 918 444 3333', idNum: '2020-00111' },
    { id: 8,  name: 'Hana Kim',       guestId: 'TR-1008', regId: 'HV-1008', institution: 'Osaka Institute',        branch: 'Main Campus', room: '308', floor: 3, checkIn: '2026-09-30', checkOut: '2026-10-07', status: 'checked-out', email: 'hana.kim@example.com',      phone: '+82 10 2345 6789', idNum: '2021-00888' },
    { id: 9,  name: 'Omar Haddad',    guestId: 'TR-1009', regId: 'HV-1009', institution: 'State College',          branch: 'Main Campus', room: '104', floor: 1, checkIn: '2026-10-05', checkOut: '2026-10-12', status: 'checked-in', email: 'omar.haddad@example.com',    phone: '+971 50 111 2222', idNum: '2023-00678' },
    { id: 10, name: 'Priya Nair',     guestId: 'TR-1010', regId: 'HV-1010', institution: 'Polytechnic University', branch: 'Main Campus', room: '102', floor: 1, checkIn: '2026-10-06', checkOut: '2026-10-13', status: 'checked-in', email: 'priya.nair@example.com',    phone: '+91 99 1122 3344', idNum: '2022-00234' },
    { id: 11, name: 'Tomás Silva',    guestId: 'TR-1011', regId: 'HV-1011', institution: 'Osaka Institute',        branch: 'Main Campus', room: '206', floor: 2, checkIn: '2026-10-10', checkOut: '2026-10-14', status: 'arriving',   email: 'tomas.silva@example.com',   phone: '+55 11 91234 5678', idNum: '2024-00001' },
    { id: 12, name: 'Grace Abara',    guestId: 'TR-1012', regId: 'HV-1012', institution: 'State College',          branch: 'Main Campus', room: '403', floor: 4, checkIn: '2026-10-07', checkOut: '2026-10-14', status: 'checked-in', email: 'grace.abara@example.com',   phone: '+63 917 222 3333', idNum: '2021-00777' }
];

function seedHistory(g) {
    const h = [];
    if (['checked-in', 'overdue', 'checked-out'].indexOf(g.status) !== -1)
        h.push({ at: g.checkIn + 'T15:40:00', type: 'check-in', by: 'Marco Cruz', note: 'Checked in to room ' + g.room });
    if (g.status === 'checked-out')
        h.push({ at: g.checkOut + 'T11:00:00', type: 'check-out', by: 'Marco Cruz', note: 'Checked out' });
    if (g.status === 'overdue')
        h.push({ at: g.checkOut + 'T23:59:00', type: 'flag', by: 'System', note: 'Flagged overdue' });
    return h;
}

let guests;
try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    guests = Array.isArray(raw) && raw.length ? raw : null;
} catch (e) { guests = null; }
if (!guests) guests = SEED.map(function (g) { return Object.assign({}, g, { history: seedHistory(g) }); });

function persist() { try { localStorage.setItem(KEY, JSON.stringify(guests)); } catch (e) {} }
const listeners = new Set();
function emit() { persist(); listeners.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } }); }

const PHONE = /^\+?[\d\s\-()]{7,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GUEST_ID = /^[A-Za-z]{2,4}-\d{3,}$/;

function validate(g, opts) {
    opts = opts || {};
    const e = {};
    const ignoreId = opts.ignoreId;
    if (!g.name || !String(g.name).trim()) e.name = 'Full name is required.';
    if (!g.guestId || !String(g.guestId).trim()) e.guestId = 'Guest ID is required.';
    else if (!GUEST_ID.test(String(g.guestId).trim())) e.guestId = 'Guest ID must look like TR-1001.';
    else if (guests.some(function (x) { return x.id !== ignoreId && String(x.guestId).toLowerCase() === String(g.guestId).trim().toLowerCase(); }))
        e.guestId = 'This Guest ID already exists.';
    if (!g.phone || !String(g.phone).trim()) e.phone = 'Contact number is required.';
    else if (!PHONE.test(String(g.phone).trim())) e.phone = 'Enter a valid contact number.';
    if (g.email && String(g.email).trim() && !EMAIL.test(String(g.email).trim())) e.email = 'Enter a valid email.';
    if (!g.institution || !String(g.institution).trim()) e.institution = 'Institution is required.';
    if (!g.checkIn) e.checkIn = 'Check-in date is required.';
    if (!g.checkOut) e.checkOut = 'Expected check-out date is required.';
    else if (g.checkIn && g.checkOut < g.checkIn) e.checkOut = 'Check-out must be on or after check-in.';
    return e;
}

function nextGuestId() {
    const n = guests.reduce(function (m, g) { return Math.max(m, Number(String(g.guestId).replace(/\D/g, '')) || 0); }, 1000);
    return 'TR-' + (n + 1);
}
function nextRegId() {
    const n = guests.reduce(function (m, g) { return Math.max(m, Number(String(g.regId).replace(/\D/g, '')) || 0); }, 1000);
    return 'HV-' + (n + 1);
}

function add(data) {
    const errs = validate(data);
    if (Object.keys(errs).length) return { ok: false, errors: errs };
    const id = Math.max.apply(null, [0].concat(guests.map(function (g) { return g.id; }))) + 1;
    const room = data.room ? String(data.room).trim() : null;
    const rec = {
        id: id,
        name: data.name.trim(),
        guestId: data.guestId.trim().toUpperCase(),
        regId: (data.regId || '').trim().toUpperCase() || nextRegId(),
        institution: data.institution.trim(),
        branch: (data.branch || '').trim(),
        room: room || '—',
        floor: room ? (Number(room[0]) || 0) : 0,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        status: data.status || (room ? 'arriving' : 'reserved'),
        email: (data.email || '').trim(),
        phone: data.phone.trim(),
        idNum: (data.idNum || '').trim(),
        history: [{ at: new Date().toISOString(), type: 'created', by: 'Marco Cruz', note: 'Guest record created' }]
    };
    guests.unshift(rec); emit();
    return { ok: true, guest: rec };
}

function update(id, patch) {
    const g = guests.find(function (x) { return x.id === id; });
    if (!g) return { ok: false, errors: { _: 'Guest not found.' } };
    const merged = Object.assign({}, g, patch);
    const errs = validate(merged, { ignoreId: id });
    if (Object.keys(errs).length) return { ok: false, errors: errs };
    const roomChanged = patch.room !== undefined && String(patch.room) !== String(g.room);
    Object.assign(g, patch);
    if (patch.guestId) g.guestId = String(patch.guestId).trim().toUpperCase();
    if (patch.regId) g.regId = String(patch.regId).trim().toUpperCase();
    if (roomChanged) {
        g.room = patch.room ? String(patch.room) : '—';
        g.floor = /^\d/.test(g.room) ? (Number(g.room[0]) || 0) : 0;
        pushHistory(g, 'room-change', 'Room changed to ' + g.room);
    }
    emit();
    return { ok: true, guest: g };
}

function remove(id) {
    const g = guests.find(function (x) { return x.id === id; });
    if (!g) return { ok: false, error: 'Guest not found.' };
    if (['checked-in', 'overdue', 'arriving'].indexOf(g.status) !== -1)
        return { ok: false, error: 'This guest has an active accommodation record. Check them out first.' };
    guests = guests.filter(function (x) { return x.id !== id; }); emit();
    return { ok: true };
}

function checkIn(id, opts) {
    opts = opts || {};
    const g = guests.find(function (x) { return x.id === id; });
    if (!g) return { ok: false, error: 'Guest not found.' };
    if (g.status === 'checked-in') return { ok: false, error: 'Guest is already checked in.' };
    if (g.status === 'checked-out') return { ok: false, error: 'Guest has already checked out.' };
    g.status = 'checked-in';
    g.checkIn = new Date().toISOString().slice(0, 10);
    if (opts.room) { g.room = String(opts.room); g.floor = Number(String(opts.room)[0]) || g.floor; }
    pushHistory(g, 'check-in', 'Checked in to room ' + g.room, opts.by);
    emit(); return { ok: true, guest: g };
}

function checkOut(id, opts) {
    opts = opts || {};
    const g = guests.find(function (x) { return x.id === id; });
    if (!g) return { ok: false, error: 'Guest not found.' };
    if (g.status === 'checked-out') return { ok: false, error: 'Guest is already checked out.' };
    if (g.status === 'arriving' && !opts.force) return { ok: false, error: 'Guest has not checked in yet.' };
    g.status = 'checked-out';
    g.checkOut = new Date().toISOString().slice(0, 10);
    pushHistory(g, opts.force ? 'force-check-out' : 'check-out',
        opts.force ? 'Force check-out — ' + (opts.reason || 'no reason given') : 'Checked out', opts.by);
    emit(); return { ok: true, guest: g };
}

function extend(id, newDate, by) {
    const g = guests.find(function (x) { return x.id === id; });
    if (!g) return { ok: false, error: 'Guest not found.' };
    if (!newDate || newDate <= g.checkOut) return { ok: false, error: 'New check-out must be after current date.' };
    const old = g.checkOut; g.checkOut = newDate;
    pushHistory(g, 'extend', 'Stay extended ' + old + ' → ' + newDate, by);
    emit(); return { ok: true, guest: g };
}

function pushHistory(g, type, note, by) {
    if (!g.history) g.history = [];
    g.history.unshift({ at: new Date().toISOString(), type: type, by: by || 'Marco Cruz', note: note });
}

function all() { return guests.slice(); }
function find(id) { return guests.find(function (g) { return g.id === id; }); }
function findByGuestId(input) {
    const q = String(input || '').trim().replace(/\s+/g, '').toUpperCase();
    if (!q) return null;
    let hit = guests.find(function (g) { return String(g.guestId).toUpperCase() === q; });
    if (hit) return hit;
    hit = guests.find(function (g) { return String(g.regId).toUpperCase() === q; });
    if (hit) return hit;
    hit = guests.find(function (g) { return String(g.guestId).replace(/^[A-Z]+-?/i, '') === q; });
    if (hit) return hit;
    return null;
}
function onChange(fn) { listeners.add(fn); return function () { listeners.delete(fn); }; }

window.GuestStore = {
    all: all, find: find, findByGuestId: findByGuestId,
    add: add, update: update, remove: remove,
    checkIn: checkIn, checkOut: checkOut, extend: extend,
    validate: validate, nextGuestId: nextGuestId, nextRegId: nextRegId,
    onChange: onChange, pushHistory: pushHistory
};
})();