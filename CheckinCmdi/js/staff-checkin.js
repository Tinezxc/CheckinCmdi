/* ==========================================================
   HAVEN — Check-in / out page
   Works with js/rbac.js for role-based access.
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       RBAC BOOTSTRAP
       - Guard: Housekeeping cannot view this page (renders "No access")
       - Sidebar + identity + role switcher applied
       ========================================== */
    if (!window.RBAC) {
        console.warn('[Haven] rbac.js not loaded — falling back to permissive mode.');
    }
    const allowed = window.RBAC ? RBAC.init({ active: 'checkin' }) : true;
    if (!allowed) return;

    const CURRENT_ROLE = window.RBAC ? RBAC.getRole() : 'front-desk';
    const isHousekeeping = CURRENT_ROLE === 'housekeeping';
    const canAct = !isHousekeeping;

    /* ==========================================
       MOCK DATA
       ========================================== */
    const ARRIVALS = [
        { id: 1, name: 'Aiko Tanaka',     guestId: 'TR-1002', regId: 'HV-1002', institution: 'Osaka Institute',        room: '202', expected: '10:30 AM', status: 'arriving', idNum: '2023-00456', idType: 'Student ID', maxGuests: 5 },
        { id: 2, name: 'Diego Marquez',   guestId: 'TR-1003', regId: 'HV-1003', institution: 'State College',          room: '303', expected: '11:00 AM', status: 'arriving', idNum: '2021-00789', idType: 'Student ID', maxGuests: 5 },
        { id: 3, name: 'Lena Okafor',     guestId: 'TR-1004', regId: 'HV-1004', institution: 'Polytechnic University', room: '208', expected: '11:45 AM', status: 'arriving', idNum: '2022-00345', idType: 'Student ID', maxGuests: 5 },
        { id: 4, name: 'Ravi Batra',      guestId: 'TR-1005', regId: 'HV-1005', institution: 'Osaka Institute',        room: '401', expected: '01:15 PM', status: 'arriving', idNum: '2023-00910', idType: 'Employee ID', maxGuests: 5 },
        { id: 5, name: 'Mei Chen',        guestId: 'TR-1006', regId: 'HV-1006', institution: 'State College',          room: '405', expected: '02:00 PM', status: 'arriving', idNum: '2022-00555', idType: 'Student ID', maxGuests: 5 },
        { id: 6, name: 'Omar Haddad',     guestId: 'TR-1009', regId: 'HV-1009', institution: 'State College',          room: '104', expected: '03:00 PM', status: 'arriving', idNum: '2023-00678', idType: 'Student ID', maxGuests: 5 },
        { id: 7, name: 'Priya Nair',      guestId: 'TR-1010', regId: 'HV-1010', institution: 'Polytechnic University', room: '102', expected: '04:30 PM', status: 'arriving', idNum: '2022-00234', idType: 'Student ID', maxGuests: 5 },
        { id: 8, name: 'Tomás Silva',     guestId: 'TR-1011', regId: 'HV-1011', institution: 'Osaka Institute',        room: '206', expected: '05:15 PM', status: 'arriving', idNum: '2024-00001', idType: 'Student ID', maxGuests: 5 }
    ];

    const DEPARTURES = [
        { id: 1, name: 'Jamie Dela Cruz', guestId: 'TR-1007', regId: 'HV-1007', room: '304', status: 'checked-in', dueTime: '11:00 AM' },
        { id: 2, name: 'Hana Kim',        guestId: 'TR-1008', regId: 'HV-1008', room: '308', status: 'checked-in', dueTime: '11:30 AM' },
        { id: 3, name: 'Omar Haddad',     guestId: 'TR-1009', regId: 'HV-1009', room: '104', status: 'checked-in', dueTime: '12:00 PM' },
        { id: 4, name: 'Priya Nair',      guestId: 'TR-1010', regId: 'HV-1010', room: '102', status: 'checked-in', dueTime: '12:30 PM' },
        { id: 5, name: 'Aiko Tanaka',     guestId: 'TR-1002', regId: 'HV-1002', room: '202', status: 'checked-in', dueTime: '01:00 PM' },
        { id: 6, name: 'Grace Abara',     guestId: 'TR-1012', regId: 'HV-1012', room: '403', status: 'checked-in', dueTime: '02:00 PM' }
    ];

    const OVERDUE = [
        { id: 1, name: 'Sofia Reyes',   guestId: 'TR-1001', regId: 'HV-1001', room: '201', expected: 'Oct 9, 2026',  daysOverdue: 2, status: 'overdue' },
        { id: 2, name: 'Diego Marquez', guestId: 'TR-1003', regId: 'HV-1003', room: '303', expected: 'Oct 8, 2026',  daysOverdue: 3, status: 'overdue' }
    ];

    const ROOMS = [
        { num: '202', floor: 2, status: 'ready' },
        { num: '203', floor: 2, status: 'ready' },
        { num: '208', floor: 2, status: 'ready' },
        { num: '301', floor: 3, status: 'ready' },
        { num: '303', floor: 3, status: 'dirty', warn: 'Needs cleaning' },
        { num: '304', floor: 3, status: 'ready' },
        { num: '305', floor: 3, status: 'blocked', warn: 'Reserved for another guest' },
        { num: '401', floor: 4, status: 'ready' },
        { num: '405', floor: 4, status: 'ready' },
        { num: '104', floor: 1, status: 'dirty', warn: 'Needs cleaning' },
        { num: '102', floor: 1, status: 'ready' },
        { num: '206', floor: 2, status: 'blocked', warn: 'Under maintenance' }
    ];

    /* ==========================================
       STATE
       ========================================== */
    const state = {
        activeTab: 'checkin',
        search: '',
        wizardStep: 1,
        wizardGuest: null,
        wizardData: {
            idType: '', idNum: '', verified: false,
            checkinDate: '', checkoutDate: '',
            numGuests: 1, room: '', accurate: false
        },
        checkoutGuest: null,
        auditLog: []
    };

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

    function initials(name) {
        return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    }

    function maskId(id) {
        return '•••• ••' + String(id).slice(-3);
    }

    function nowTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /* ==========================================
       HOUSEKEEPING MODE
       - Hide search, force Overdue tab
       - Show role hint card
       ========================================== */
    if (isHousekeeping) {
        // Hide check-in / check-out tabs (already handled by data-requires, but be safe)
        document.querySelectorAll('[data-tab="checkin"], [data-tab="checkout"]').forEach((t) => {
            t.setAttribute('hidden', '');
        });

        // Force Overdue tab active
        $$('.tab').forEach((t) => {
            const isOverdue = t.dataset.tab === 'overdue';
            t.classList.toggle('active', isOverdue);
            t.setAttribute('aria-selected', String(isOverdue));
        });
        $$('.tab-panel').forEach((p) => {
            p.classList.toggle('active', p.dataset.panel === 'overdue');
        });

        // Hide search
        const searchWrap = $('#listSearchWrap');
        if (searchWrap) searchWrap.style.display = 'none';

        // Show role hint card
        const hint = $('#roleHintCard');
        if (hint) hint.hidden = false;

        // Hide page-header action buttons for HK
        document.querySelectorAll('#pageActions, #newWalkinBtn, #printSlipBtn').forEach((b) => {
            b?.setAttribute('hidden', '');
        });
    }

    /* ==========================================
       MOBILE SIDEBAR
       ========================================== */
    const toggle = $('#menuToggle');
    const sidebar = $('#sidebar');
    const overlay = $('#sidebarOverlay');
    const closeSidebar = () => {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
    };
    toggle?.addEventListener('click', () => {
        const open = sidebar.classList.toggle('open');
        overlay.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
    });
    overlay?.addEventListener('click', closeSidebar);

    /* ==========================================
       TABS
       ========================================== */
    $$('.tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            state.activeTab = tab.dataset.tab;
            $$('.tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === state.activeTab));
            $('#listSearchWrap').hidden = state.activeTab !== 'checkin' || isHousekeeping;
        });
    });

    /* ==========================================
       RENDER: ARRIVALS
       ========================================== */
    function renderArrivals() {
        const list = $('#arrivalsList');
        const empty = $('#arrivalsEmpty');
        if (!list) return;

        const filtered = ARRIVALS.filter((g) => {
            if (!state.search) return true;
            const q = state.search.toLowerCase();
            return g.name.toLowerCase().includes(q)
                || g.guestId.toLowerCase().includes(q)
                || g.regId.toLowerCase().includes(q)
                || g.room.toLowerCase().includes(q)
                || g.institution.toLowerCase().includes(q);
        });

        const tabCountCheckin = $('#tabCountCheckin');
        if (tabCountCheckin) tabCountCheckin.textContent = filtered.length;
        const opsArrivals = $('#opsArrivals');
        if (opsArrivals) opsArrivals.textContent = filtered.length;

        if (!filtered.length) {
            list.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        list.innerHTML = filtered.map((g) => `
            <li class="queue-item" data-id="${g.id}">
                <div class="guest-block">
                    <div class="guest-avatar">${initials(g.name)}</div>
                    <div class="guest-info">
                        <span class="guest-name">${g.name}</span>
                        <span class="guest-meta">${g.institution}</span>
                    </div>
                </div>
                <div class="cell cell-hide-md">
                    <strong>${g.guestId}</strong><br>Reg. ${g.regId}
                </div>
                <div class="cell cell-hide-sm">
                    <strong>Room ${g.room}</strong>
                </div>
                <div class="cell cell-hide-sm">
                    <strong>${g.expected}</strong>
                </div>
                <div class="cell">
                    <span class="status-pill ${g.status}"><span class="dot"></span> Arriving</span>
                </div>
                <div class="queue-action">
                    <button class="btn btn-primary btn-sm js-requires-action"
                            data-start-checkin="${g.id}"
                            data-requires="front-desk,manager">
                        Start check-in
                    </button>
                </div>
            </li>
        `).join('');

        // Apply element gating for the newly rendered rows
        if (window.RBAC) RBAC.applyElementGating();

        $$('[data-start-checkin]', list).forEach((btn) => {
            btn.addEventListener('click', () => {
                if (!canAct) {
                    toast('error', 'Read-only', 'Housekeeping cannot perform check-in.');
                    return;
                }
                const id = Number(btn.dataset.startCheckin);
                openWizard(ARRIVALS.find((g) => g.id === id));
            });
        });

        $$('.queue-item', list).forEach((row) => {
            row.tabIndex = 0;
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!canAct) return;
                    const id = Number(row.dataset.id);
                    openWizard(ARRIVALS.find((g) => g.id === id));
                }
            });
        });
    }

    /* ==========================================
       RENDER: DEPARTURES
       ========================================== */
    function renderDepartures() {
        const list = $('#departuresList');
        const empty = $('#departuresEmpty');
        if (!list) return;

        const tabCountCheckout = $('#tabCountCheckout');
        if (tabCountCheckout) tabCountCheckout.textContent = DEPARTURES.length;
        const opsDepartures = $('#opsDepartures');
        if (opsDepartures) opsDepartures.textContent = DEPARTURES.length;

        if (!DEPARTURES.length) {
            list.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        list.innerHTML = DEPARTURES.map((g) => `
            <li class="queue-item">
                <div class="guest-block">
                    <div class="guest-avatar">${initials(g.name)}</div>
                    <div class="guest-info">
                        <span class="guest-name">${g.name}</span>
                        <span class="guest-meta">${g.guestId} · Reg. ${g.regId}</span>
                    </div>
                </div>
                <div class="cell cell-hide-md">
                    <strong>Room ${g.room}</strong>
                </div>
                <div class="cell cell-hide-sm">
                    Due <strong>${g.dueTime}</strong>
                </div>
                <div class="cell">
                    <span class="status-pill checked-in"><span class="dot"></span> In-house</span>
                </div>
                <div class="queue-action">
                    <button class="btn btn-primary btn-sm js-requires-action"
                            data-start-checkout="${g.id}"
                            data-requires="front-desk,manager">
                        Check out
                    </button>
                </div>
            </li>
        `).join('');

        if (window.RBAC) RBAC.applyElementGating();

        $$('[data-start-checkout]', list).forEach((btn) => {
            btn.addEventListener('click', () => {
                if (!canAct) {
                    toast('error', 'Read-only', 'Housekeeping cannot perform check-out.');
                    return;
                }
                openCheckout(DEPARTURES.find((g) => g.id === Number(btn.dataset.startCheckout)));
            });
        });
    }

    /* ==========================================
       RENDER: OVERDUE
       ========================================== */
    function renderOverdue() {
        const list = $('#overdueList');
        const empty = $('#overdueEmpty');
        if (!list) return;

        const tabCountOverdue = $('#tabCountOverdue');
        if (tabCountOverdue) tabCountOverdue.textContent = OVERDUE.length;

        if (!OVERDUE.length) {
            list.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        list.innerHTML = OVERDUE.map((g) => `
            <li class="queue-item">
                <div class="guest-block">
                    <div class="guest-avatar">${initials(g.name)}</div>
                    <div class="guest-info">
                        <span class="guest-name">${g.name}</span>
                        <span class="guest-meta">Expected ${g.expected}</span>
                    </div>
                </div>
                <div class="cell cell-hide-md">
                    <strong>Room ${g.room}</strong>
                </div>
                <div class="cell cell-hide-sm">
                    <strong>${g.daysOverdue} day${g.daysOverdue === 1 ? '' : 's'} overdue</strong>
                </div>
                <div class="cell">
                    <span class="status-pill overdue"><span class="dot"></span> Overdue</span>
                </div>
                <div class="queue-action">
                    <button class="btn btn-outline btn-sm js-requires-action"
                            data-contact="${g.id}"
                            data-requires="front-desk,manager">
                        Contact
                    </button>
                    <button class="btn btn-outline btn-sm js-requires-action"
                            data-extend="${g.id}"
                            data-requires="front-desk,manager">
                        Extend
                    </button>
                    <button class="btn btn-danger btn-sm js-requires-action"
                            data-force="${g.id}"
                            data-requires="manager">
                        Force out
                    </button>
                </div>
            </li>
        `).join('');

        if (window.RBAC) RBAC.applyElementGating();

        // Contact
        $$('[data-contact]', list).forEach((b) => b.addEventListener('click', () => {
            if (!canAct) return toast('error', 'Read-only', 'Housekeeping cannot act.');
            toast('success', 'Contact', 'Front desk notified to contact guest.');
        }));

        // Extend
        $$('[data-extend]', list).forEach((b) => b.addEventListener('click', () => {
            if (!canAct) return toast('error', 'Read-only', 'Housekeeping cannot act.');
            openExtend(OVERDUE.find((g) => g.id === Number(b.dataset.extend)));
        }));

        // Force check-out → goes through RBAC
        $$('[data-force]', list).forEach((b) => b.addEventListener('click', async (e) => {
            e.preventDefault();
            const g = OVERDUE.find((x) => x.id === Number(b.dataset.force));
            if (!g) return;
            if (!window.RBAC) return;
            const ok = await RBAC.confirmAction({
                title: 'Force check-out',
                message: `This will force <strong>${g.name}</strong> out of room <strong>${g.room}</strong>. This action cannot be undone.`,
                keyword: 'FORCE',
                requireRole: 'checkin.force'
            });
            if (!ok) return;

            // Remove from list and re-render
            const idx = OVERDUE.findIndex((x) => x.id === g.id);
            if (idx > -1) OVERDUE.splice(idx, 1);
            logAudit('Force check-out', `${g.name} · Room ${g.room}`);
            toast('success', 'Force check-out', `${g.name} has been checked out of room ${g.room}.`);
            renderOverdue();
            updateOpsSummary();
        }));
    }

    /* ==========================================
       OPS SUMMARY
       ========================================== */
    function updateOpsSummary() {
        const opsArrivals = $('#opsArrivals');
        const opsDepartures = $('#opsDepartures');
        if (opsArrivals) opsArrivals.textContent = ARRIVALS.length;
        if (opsDepartures) opsDepartures.textContent = DEPARTURES.length;
    }

    /* ==========================================
       AUDIT LOG (mock)
       ========================================== */
    function logAudit(action, detail) {
        state.auditLog.unshift({
            action,
            detail,
            actor: window.RBAC ? RBAC.getProfile().name : 'Unknown',
            role: CURRENT_ROLE,
            time: nowTime()
        });
        // eslint-disable-next-line no-console
        console.log('[AUDIT]', state.auditLog[0]);
    }

    /* ==========================================
       SEARCH
       ========================================== */
    $('#listSearch')?.addEventListener('input', (e) => {
        state.search = e.target.value.trim();
        renderArrivals();
    });

    /* ==========================================
       WIZARD
       ========================================== */
    const wizardOverlay = $('#wizardOverlay');
    const wizardDrawer = $('#wizardDrawer');

    function openWizard(guest) {
        if (!guest || !canAct) return;
        state.wizardGuest = guest;
        state.wizardStep = 1;
        state.wizardData = {
            idType: guest.idType || 'Student ID',
            idNum: guest.idNum,
            verified: false,
            checkinDate: new Date().toISOString().slice(0, 10),
            checkoutDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
            numGuests: 1,
            room: '',
            accurate: false
        };

        $('#wizardSub').textContent = `${guest.name} · ${guest.guestId} · ${guest.regId}`;
        $('#idType').value = state.wizardData.idType;
        const idInput = $('#idNumber');
        if (idInput) {
            idInput.dataset.full = state.wizardData.idNum;
            idInput.value = maskId(state.wizardData.idNum);
        }
        $('#checkinDate').value = state.wizardData.checkinDate;
        $('#checkoutDate').value = state.wizardData.checkoutDate;
        $('#numGuests').value = state.wizardData.numGuests;
        $('#idVerified').checked = false;
        $('#confirmAccurate').checked = false;
        ['#idVerifiedErr', '#checkoutDateErr', '#numGuestsErr', '#roomPickerErr', '#confirmAccurateErr']
            .forEach((sel) => { const el = $(sel); if (el) el.textContent = ''; });

        renderRoomPicker();
        goToStep(1);
        openDrawer(wizardDrawer, wizardOverlay);
        $('#wizardTitle').focus?.();
    }

    function renderRoomPicker() {
        const picker = $('#roomPicker');
        if (!picker) return;
        picker.innerHTML = ROOMS.map((r) => `
            <button type="button"
                class="room-option ${r.status}"
                data-room="${r.num}"
                ${r.status === 'blocked' ? 'aria-disabled="true"' : ''}>
                <span class="room-num">${r.num}</span>
                <span class="room-meta">Floor ${r.floor}</span>
                ${r.warn ? `<span class="room-warn">${r.warn}</span>` : ''}
            </button>
        `).join('');

        $$('.room-option', picker).forEach((opt) => {
            opt.addEventListener('click', () => {
                if (opt.classList.contains('blocked')) {
                    toast('error', 'Room unavailable', 'This room cannot be assigned right now.');
                    return;
                }
                $$('.room-option', picker).forEach((o) => o.classList.remove('selected'));
                opt.classList.add('selected');
                state.wizardData.room = opt.dataset.room;
                if (opt.classList.contains('dirty')) {
                    toast('error', 'Room needs cleaning', `Room ${opt.dataset.room} is dirty — housekeeping will prioritize.`);
                }
            });
        });
    }

    function goToStep(step) {
        state.wizardStep = step;
        $$('.stepper-item').forEach((it) => {
            const n = Number(it.dataset.step);
            it.classList.toggle('active', n === step);
            it.classList.toggle('done', n < step);
        });
        $$('.wizard-step').forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === step));

        const back = $('#wizardBack');
        const next = $('#wizardNext');
        const complete = $('#wizardComplete');
        if (back) back.hidden = step === 1;
        if (next) next.hidden = step === 4;
        if (complete) {
            complete.hidden = step !== 4;
            complete.disabled = false;
            const spinner = complete.querySelector('.btn-spinner');
            if (spinner) spinner.hidden = true;
        }

        if (step === 4) buildReview();
    }

    function buildReview() {
        const g = state.wizardGuest;
        if (!g) return;
        $('#reviewGuest').textContent = g.name;
        $('#reviewGuestId').textContent = g.guestId;
        $('#reviewRegId').textContent = g.regId;
        $('#reviewInstitution').textContent = g.institution;
        $('#reviewStay').textContent = `${fmt(state.wizardData.checkinDate)} – ${fmt(state.wizardData.checkoutDate)}`;
        $('#reviewGuests').textContent = state.wizardData.numGuests;
        $('#reviewRoom').textContent = state.wizardData.room || '—';
        $('#reviewVerified').textContent = state.wizardData.verified ? 'Yes' : 'No';
    }

    function fmt(d) {
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function validateStep(step) {
        let ok = true;
        if (step === 1) {
            const v = $('#idVerified').checked;
            if (!v) {
                $('#idVerifiedErr').textContent = 'Please confirm you have verified the guest\'s identity.';
                $('#idVerified').focus();
                ok = false;
            }
        }
        if (step === 2) {
            const ci = new Date($('#checkinDate').value);
            const co = new Date($('#checkoutDate').value);
            if (!(co > ci)) {
                $('#checkoutDateErr').textContent = 'Check-out must be after check-in.';
                ok = false;
            }
            const n = Number($('#numGuests').value);
            if (n < 1 || n > 5) {
                $('#numGuestsErr').textContent = 'Number of guests must be between 1 and 5.';
                ok = false;
            }
        }
        if (step === 3) {
            if (!state.wizardData.room) {
                $('#roomPickerErr').textContent = 'Please assign a room.';
                ok = false;
            }
        }
        if (step === 4) {
            if (!$('#confirmAccurate').checked) {
                $('#confirmAccurateErr').textContent = 'Please confirm the details are accurate.';
                ok = false;
            }
        }
        return ok;
    }

    $('#wizardNext')?.addEventListener('click', () => {
        if (!canAct) return;
        if (!validateStep(state.wizardStep)) return;
        if (state.wizardStep === 1) {
            state.wizardData.idType = $('#idType').value;
            state.wizardData.verified = $('#idVerified').checked;
        }
        if (state.wizardStep === 2) {
            state.wizardData.checkinDate = $('#checkinDate').value;
            state.wizardData.checkoutDate = $('#checkoutDate').value;
            state.wizardData.numGuests = Number($('#numGuests').value);
        }
        if (state.wizardStep < 4) goToStep(state.wizardStep + 1);
    });

    $('#wizardBack')?.addEventListener('click', () => {
        if (state.wizardStep > 1) goToStep(state.wizardStep - 1);
    });

    $('#wizardCancel')?.addEventListener('click', closeWizard);
    $('#wizardClose')?.addEventListener('click', closeWizard);
    wizardOverlay?.addEventListener('click', closeWizard);

    function closeWizard() {
        closeDrawer(wizardDrawer, wizardOverlay);
    }

    $('#wizardComplete')?.addEventListener('click', () => {
        if (!canAct) return;
        if (!validateStep(4)) return;
        const btn = $('#wizardComplete');
        btn.disabled = true;
        const spinner = btn.querySelector('.btn-spinner');
        if (spinner) spinner.hidden = false;

        setTimeout(() => {
            const g = state.wizardGuest;
            const room = state.wizardData.room;

            logAudit('Check-in', `${g.name} → Room ${room}`);
            toast('success', 'Check-in complete',
                `${g.name} is now in room ${room}. Guest notification sent.`,
                10000, {
                    label: 'Undo',
                    onClick: () => toast('success', 'Undone', `Check-in for ${g.name} has been reverted.`)
                });

            const idx = ARRIVALS.findIndex((a) => a.id === g.id);
            if (idx > -1) ARRIVALS.splice(idx, 1);

            renderArrivals();
            renderDepartures();
            updateOpsSummary();
            closeWizard();
        }, 700);
    });

    /* ==========================================
       CHECK-OUT
       ========================================== */
    const checkoutOverlay = $('#checkoutOverlay');
    const checkoutDrawer = $('#checkoutDrawer');

    function openCheckout(guest) {
        if (!guest || !canAct) return;
        state.checkoutGuest = guest;
        $('#checkoutSub').textContent = `${guest.name} · Room ${guest.room}`;
        $$('[data-checkout]').forEach((cb) => (cb.checked = false));
        $('#checkoutNotes').value = '';
        $('#checkoutChecklistErr').textContent = '';
        openDrawer(checkoutDrawer, checkoutOverlay);
    }

    $('#checkoutCancel')?.addEventListener('click', () => closeDrawer(checkoutDrawer, checkoutOverlay));
    $('#checkoutClose')?.addEventListener('click', () => closeDrawer(checkoutDrawer, checkoutOverlay));
    checkoutOverlay?.addEventListener('click', () => closeDrawer(checkoutDrawer, checkoutOverlay));

    $('#checkoutComplete')?.addEventListener('click', () => {
        if (!canAct) return;
        const checks = $$('[data-checkout]').map((c) => c.checked);
        if (!checks.every(Boolean)) {
            $('#checkoutChecklistErr').textContent = 'Please complete all checklist items.';
            return;
        }
        const btn = $('#checkoutComplete');
        btn.disabled = true;
        const spinner = btn.querySelector('.btn-spinner');
        if (spinner) spinner.hidden = false;

        setTimeout(() => {
            const g = state.checkoutGuest;
            logAudit('Check-out', `${g.name} from Room ${g.room}`);
            toast('success', 'Check-out complete',
                `Room ${g.room} marked vacant dirty. Housekeeping task created.`,
                10000, {
                    label: 'Undo',
                    onClick: () => toast('success', 'Undone', `Check-out for ${g.name} has been reverted.`)
                });

            const idx = DEPARTURES.findIndex((d) => d.id === g.id);
            if (idx > -1) DEPARTURES.splice(idx, 1);
            renderDepartures();
            updateOpsSummary();

            btn.disabled = false;
            if (spinner) spinner.hidden = true;
            closeDrawer(checkoutDrawer, checkoutOverlay);
        }, 700);
    });

    /* ==========================================
       FORCE / EXTEND
       ========================================== */
    const confirmOverlay = $('#confirmOverlay');
    const extendOverlay = $('#extendOverlay');
    let extendGuest = null;

    $('#confirmClose')?.addEventListener('click', () => closeModal(confirmOverlay));
    $('#confirmCancel')?.addEventListener('click', () => closeModal(confirmOverlay));
    confirmOverlay?.addEventListener('click', (e) => { if (e.target === confirmOverlay) closeModal(confirmOverlay); });

    function openExtend(guest) {
        extendGuest = guest;
        const d = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
        $('#extendDate').value = d;
        $('#extendDateErr').textContent = '';
        openModal(extendOverlay);
    }

    $('#extendClose')?.addEventListener('click', () => closeModal(extendOverlay));
    $('#extendCancel')?.addEventListener('click', () => closeModal(extendOverlay));
    extendOverlay?.addEventListener('click', (e) => { if (e.target === extendOverlay) closeModal(extendOverlay); });

    $('#extendSubmit')?.addEventListener('click', () => {
        const d = $('#extendDate').value;
        if (!d) {
            $('#extendDateErr').textContent = 'Please choose a new check-out date.';
            return;
        }
        logAudit('Extend stay', `${extendGuest.name} to ${fmt(d)}`);
        toast('success', 'Stay extended', `${extendGuest.name} extended to ${fmt(d)}.`);
        closeModal(extendOverlay);
    });

    function closeModal(el) {
        el.classList.remove('open');
        setTimeout(() => { el.hidden = true; }, 200);
    }

    /* ==========================================
       DRAWER HELPERS
       ========================================== */
    function openDrawer(drawer, overlayEl) {
        drawer.hidden = false;
        overlayEl.hidden = false;
        requestAnimationFrame(() => {
            drawer.classList.add('open');
            overlayEl.classList.add('open');
        });
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer(drawer, overlayEl) {
        drawer.classList.remove('open');
        overlayEl.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => { drawer.hidden = true; overlayEl.hidden = true; }, 250);
    }
    function openModal(el) {
        el.hidden = false;
        requestAnimationFrame(() => el.classList.add('open'));
        document.body.style.overflow = 'hidden';
    }

    /* ==========================================
       PRINT / NEW WALK-IN
       ========================================== */
    $('#printSlipBtn')?.addEventListener('click', () => {
        if ($('#printSlipBtn').getAttribute('aria-disabled') === 'true') {
            toast('error', 'Select a guest first', 'Pick a guest from the queue to print their slip.');
            return;
        }
        window.print();
    });

    $('#newWalkinBtn')?.addEventListener('click', () => {
        if (!canAct) return toast('error', 'Read-only', 'Housekeeping cannot create walk-ins.');
        toast('success', 'New walk-in', 'Opening walk-in registration form…');
    });

    /* ==========================================
       KEYBOARD
       ========================================== */
    document.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
        if (typing && e.key !== 'Escape') return;

        if (e.key === '/') {
            e.preventDefault();
            $('#listSearch')?.focus();
        }
        if (e.key === 'Escape') {
            closeSidebar();
            closeWizard();
            closeDrawer(checkoutDrawer, checkoutOverlay);
            closeModal(confirmOverlay);
            closeModal(extendOverlay);
        }
    });

    /* ==========================================
       TOASTS
       ========================================== */
    const toastContainer = $('#toastContainer');
    function toast(type, title, message, timeout = 3500, action = null) {
        if (typeof window.showToast === 'function') {
            window.showToast(type, title, message, timeout, action);
            return;
        }
        if (!toastContainer) return;
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `
            <span class="toast-icon" aria-hidden="true">
                ${type === 'success'
                    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e5a3a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9b1c1c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`}
            </span>
            <div class="toast-text"><strong>${title}</strong>${message}</div>
            ${action ? `<button class="toast-action" type="button">${action.label}</button>` : ''}
        `;
        toastContainer.appendChild(el);
        if (action) {
            el.querySelector('.toast-action').addEventListener('click', () => {
                action.onClick();
                el.classList.remove('leaving');
                el.classList.add('leaving');
                setTimeout(() => el.remove(), 250);
            });
        }
        setTimeout(() => {
            el.classList.add('leaving');
            setTimeout(() => el.remove(), 250);
        }, timeout);
    }
    window.showToast = toast;

    /* ==========================================
       LAST UPDATED TICKER
       ========================================== */
    const lastUpdated = $('#lastUpdated');
    let secs = 0;
    setInterval(() => {
        secs++;
        if (!lastUpdated) return;
        lastUpdated.textContent = secs < 60
            ? `Last updated ${secs}s ago`
            : `Last updated ${Math.floor(secs / 60)}m ago`;
    }, 1000);

    /* ==========================================
       INITIAL RENDER
       ========================================== */
    renderArrivals();
    renderDepartures();
    renderOverdue();
    updateOpsSummary();
});