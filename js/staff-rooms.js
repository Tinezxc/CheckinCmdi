document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       MOCK DATA — 24 ROOMS
       ========================================== */
    // Statuses: occupied, vacant-clean, vacant-dirty, cleaning, maintenance, reserved, overdue
    const ROOMS = [
        // Floor 1
        { num: '101', floor: 1, type: 'Standard Shared', capacity: 5, status: 'vacant-clean', guest: null, checkin: null, checkout: null, nextArrival: null, beds: '2 Bunk beds' },
        { num: '102', floor: 1, type: 'Standard Shared', capacity: 5, status: 'occupied',     guest: 'Priya Nair',      guestId: 'TR-1010', checkin: '2026-10-06', checkout: '2026-10-13', nextArrival: null, beds: '2 Bunk beds' },
        { num: '103', floor: 1, type: 'Standard Shared', capacity: 5, status: 'vacant-dirty', guest: null, checkin: null, checkout: null, nextArrival: null, beds: '2 Bunk beds' },
        { num: '104', floor: 1, type: 'Standard Shared', capacity: 5, status: 'cleaning',     guest: null, checkin: null, checkout: null, nextArrival: null, beds: '2 Bunk beds' },
        { num: '105', floor: 1, type: 'Single',           capacity: 3, status: 'reserved',     guest: null, checkin: null, checkout: null, nextArrival: null, beds: '1 Single bed' },
        { num: '106', floor: 1, type: 'Single',           capacity: 3, status: 'maintenance',  guest: null, checkin: null, checkout: null, nextArrival: null, beds: '1 Single bed' },

        // Floor 2
        { num: '201', floor: 2, type: 'Standard Shared', capacity: 5, status: 'overdue',     guest: 'Sofia Reyes',   guestId: 'TR-1001', checkin: '2026-10-02', checkout: '2026-10-09', daysOverdue: 2, nextArrival: { guest: 'Aiko Tanaka', time: '10:30 AM' }, beds: '2 Bunk beds' },
        { num: '202', floor: 2, type: 'Standard Shared', capacity: 5, status: 'reserved',    guest: null, checkin: null, checkout: null, nextArrival: { guest: 'Aiko Tanaka', time: '10:30 AM' }, beds: '2 Bunk beds' },
        { num: '203', floor: 2, type: 'Standard Shared', capacity: 5, status: 'vacant-clean',guest: null, checkin: null, checkout: null, nextArrival: null, beds: '2 Bunk beds' },
        { num: '204', floor: 2, type: 'Standard Shared', capacity: 5, status: 'occupied',    guest: 'Mei Chen',      guestId: 'TR-1006', checkin: '2026-10-06', checkout: '2026-10-13', nextArrival: null, beds: '2 Bunk beds' },
        { num: '205', floor: 2, type: 'Standard Shared', capacity: 5, status: 'cleaning',    guest: null, checkin: null, checkout: null, nextArrival: null, beds: '2 Bunk beds' },
        { num: '206', floor: 2, type: 'Standard Shared', capacity: 5, status: 'vacant-dirty',guest: null, checkin: null, checkout: null, nextArrival: null, beds: '2 Bunk beds' },
        { num: '207', floor: 2, type: 'Standard Shared', capacity: 5, status: 'occupied',    guest: 'Omar Haddad',   guestId: 'TR-1009', checkin: '2026-10-05', checkout: '2026-10-12', nextArrival: null, beds: '2 Bunk beds' },
        { num: '208', floor: 2, type: 'Deluxe Shared',   capacity: 5, status: 'occupied',    guest: 'Lena Okafor',   guestId: 'TR-1004', checkin: '2026-10-04', checkout: '2026-10-11', nextArrival: null, beds: '2 Bunk beds' },

        // Floor 3
        { num: '301', floor: 3, type: 'Standard Shared', capacity: 5, status: 'vacant-clean',guest: null, checkin: null, checkout: null, nextArrival: null, beds: '2 Bunk beds' },
        { num: '302', floor: 3, type: 'Standard Shared', capacity: 5, status: 'occupied',    guest: 'Grace Abara',   guestId: 'TR-1012', checkin: '2026-10-07', checkout: '2026-10-14', nextArrival: null, beds: '2 Bunk beds' },
        { num: '303', floor: 3, type: 'Standard Shared', capacity: 5, status: 'overdue',     guest: 'Diego Marquez', guestId: 'TR-1003', checkin: '2026-10-01', checkout: '2026-10-08', daysOverdue: 3, nextArrival: null, beds: '2 Bunk beds' },
        { num: '304', floor: 3, type: 'Standard Shared', capacity: 5, status: 'occupied',    guest: 'Jamie Dela Cruz', guestId: 'TR-1007', checkin: '2026-09-28', checkout: '2026-10-05', nextArrival: null, beds: '2 Bunk beds' },
        { num: '305', floor: 3, type: 'Standard Shared', capacity: 5, status: 'maintenance', guest: null, checkin: null, checkout: null, nextArrival: null, beds: '2 Bunk beds' },
        { num: '306', floor: 3, type: 'Standard Shared', capacity: 5, status: 'vacant-dirty',guest: null, checkin: null, checkout: null, nextArrival: null, beds: '2 Bunk beds' },
        { num: '307', floor: 3, type: 'Standard Shared', capacity: 5, status: 'occupied',    guest: 'Tomás Silva',   guestId: 'TR-1011', checkin: '2026-10-10', checkout: '2026-10-14', nextArrival: null, beds: '2 Bunk beds' },
        { num: '308', floor: 3, type: 'Deluxe Shared',   capacity: 5, status: 'occupied',    guest: 'Hana Kim',      guestId: 'TR-1008', checkin: '2026-09-30', checkout: '2026-10-07', nextArrival: null, beds: '2 Bunk beds' }
    ];

    const ROLE_LABELS = { 'front-desk': 'Front desk', 'housekeeping': 'Housekeeping', 'manager': 'Manager' };

    const STATUS_LABELS = {
        'occupied': 'Occupied',
        'vacant-clean': 'Vacant clean',
        'vacant-dirty': 'Vacant dirty',
        'cleaning': 'Cleaning',
        'maintenance': 'Maintenance',
        'reserved': 'Reserved',
        'overdue': 'Overdue'
    };

    const STATUS_ICONS = {
        'occupied': '●',
        'vacant-clean': '✓',
        'vacant-dirty': '⚠',
        'cleaning': '✦',
        'maintenance': '⚙',
        'reserved': '◆',
        'overdue': '⏰'
    };

    /* ==========================================
       STATE
       ========================================== */
    const state = {
        role: 'front-desk',
        view: 'board',
        statusFilter: 'all',
        floor: 'all',
        capacity: 'all',
        type: 'all',
        search: '',
        sortKey: 'num',
        sortDir: 'asc',
        selected: new Set(),
        activeRoom: null,
        auditLog: []
    };

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

    function initials(name) {
        return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    }

    function nowTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function fmt(d) {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    /* ==========================================
       ROLE SWITCHER
       ========================================== */
    function applyRole(role) {
        state.role = role;
        document.body.dataset.role = role;
        $('#staffRoleLabel').textContent = ROLE_LABELS[role];
        $('#roleBreadcrumb').textContent = ROLE_LABELS[role];

        // Manager-only buttons
        $$('[data-role-required="manager"]').forEach((el) => {
            if (role === 'manager') {
                el.removeAttribute('aria-disabled');
                el.removeAttribute('title');
            } else {
                el.setAttribute('aria-disabled', 'true');
                el.setAttribute('title', 'Manager access only');
            }
        });

        // Quick action buttons — housekeeping can only update cleaning status
        $$('.quick-btn[data-role]').forEach((btn) => {
            const allowed = btn.dataset.role.split(' ');
            const can = allowed.includes(role);
            if (can) {
                btn.removeAttribute('aria-disabled');
                btn.removeAttribute('title');
            } else {
                btn.setAttribute('aria-disabled', 'true');
                btn.setAttribute('title', `${allowed.map((r) => ROLE_LABELS[r]).join(' or ')} only`);
            }
        });

        renderBoard();
        renderList();
        toast('success', 'Role switched', `Now viewing as ${ROLE_LABELS[role]}.`);
    }

    $('#roleSelect')?.addEventListener('change', (e) => applyRole(e.target.value));

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
       VIEW TOGGLE
       ========================================== */
    $$('.view-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            state.view = btn.dataset.view;
            $$('.view-btn').forEach((b) => {
                const active = b === btn;
                b.classList.toggle('active', active);
                b.setAttribute('aria-selected', String(active));
            });
            $$('.view-panel').forEach((p) => p.classList.toggle('active', p.dataset.view === state.view));
        });
    });

    /* ==========================================
       FILTERS
       ========================================== */
    function applyFilters(rooms) {
        return rooms.filter((r) => {
            if (state.statusFilter !== 'all' && r.status !== state.statusFilter) return false;
            if (state.floor !== 'all' && String(r.floor) !== state.floor) return false;
            if (state.capacity !== 'all' && String(r.capacity) !== state.capacity) return false;
            if (state.type !== 'all' && r.type !== state.type) return false;
            if (state.search) {
                const q = state.search.toLowerCase();
                if (!r.num.toLowerCase().includes(q) && !(r.guest && r.guest.toLowerCase().includes(q))) return false;
            }
            return true;
        });
    }

    function sortRooms(rooms) {
        const key = state.sortKey;
        return [...rooms].sort((a, b) => {
            let av = a[key] ?? '';
            let bv = b[key] ?? '';
            if (key === 'guest') { av = a.guest || ''; bv = b.guest || ''; }
            if (key === 'nextArrival') { av = a.nextArrival?.guest || ''; bv = b.nextArrival?.guest || ''; }
            av = String(av).toLowerCase();
            bv = String(bv).toLowerCase();
            if (av < bv) return state.sortDir === 'asc' ? -1 : 1;
            if (av > bv) return state.sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /* ==========================================
       RENDER: STATUS CHIPS
       ========================================== */
    function renderStatusCounts() {
        const counts = {
            all: ROOMS.length,
            occupied: 0, 'vacant-clean': 0, 'vacant-dirty': 0,
            cleaning: 0, maintenance: 0, reserved: 0, overdue: 0
        };
        ROOMS.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
        $('#cAll').textContent = counts.all;
        $('#cOccupied').textContent = counts.occupied;
        $('#cVacantClean').textContent = counts['vacant-clean'];
        $('#cVacantDirty').textContent = counts['vacant-dirty'];
        $('#cCleaning').textContent = counts.cleaning;
        $('#cMaintenance').textContent = counts.maintenance;
        $('#cReserved').textContent = counts.reserved;
        $('#cOverdue').textContent = counts.overdue;
        $('#roomCount').textContent = `${counts.all} total`;
    }

    $$('.status-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            state.statusFilter = chip.dataset.status;
            $$('.status-chip').forEach((c) => c.classList.toggle('active', c === chip));
            renderBoard();
            renderList();
        });
    });

    /* ==========================================
       RENDER: BOARD
       ========================================== */
    function renderBoard() {
        const board = $('#roomBoard');
        const empty = $('#boardEmpty');
        const filtered = sortRooms(applyFilters(ROOMS));

        if (!filtered.length) {
            board.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        // Group by floor
        const byFloor = {};
        filtered.forEach((r) => {
            (byFloor[r.floor] = byFloor[r.floor] || []).push(r);
        });

        board.innerHTML = Object.entries(byFloor).sort(([a], [b]) => a - b).map(([floor, rooms]) => `
            <div class="board-floor">
                <div class="board-floor-header">
                    <span class="board-floor-title">Floor ${floor}</span>
                    <span class="board-floor-count">${rooms.length} room${rooms.length === 1 ? '' : 's'}</span>
                </div>
                <div class="board-grid">
                    ${rooms.map(renderTile).join('')}
                </div>
            </div>
        `).join('');

        // Bind click
        $$('.room-tile', board).forEach((tile) => {
            tile.addEventListener('click', () => openDrawer(tile.dataset.room));
            tile.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); openDrawer(tile.dataset.room); }
                // Arrow key navigation within grid
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const all = $$('.room-tile', board);
                    const idx = all.indexOf(tile);
                    const cols = Math.round(board.querySelector('.board-grid')?.clientWidth / (tile.offsetWidth + 12)) || 1;
                    let nextIdx = idx;
                    if (e.key === 'ArrowRight') nextIdx = idx + 1;
                    if (e.key === 'ArrowLeft')  nextIdx = idx - 1;
                    if (e.key === 'ArrowDown')  nextIdx = idx + cols;
                    if (e.key === 'ArrowUp')    nextIdx = idx - cols;
                    if (all[nextIdx]) all[nextIdx].focus();
                }
            });
        });
    }

    function renderTile(r) {
        const label = STATUS_LABELS[r.status];
        const icon = STATUS_ICONS[r.status];
        const hasFlag = r.nextArrival && (r.status === 'overdue' || r.status === 'reserved');

        return `
            <button class="room-tile st-${r.status}" data-room="${r.num}" tabindex="0" aria-label="Room ${r.num}, ${label}${r.guest ? `, guest ${r.guest}` : ''}">
                <div class="room-tile-top">
                    <span class="room-tile-num">${r.num}</span>
                    <span class="status-pill ${r.status}">${icon} ${label}</span>
                </div>
                <span class="room-tile-meta">${r.type} · Max ${r.capacity}</span>
                ${r.guest ? `<span class="room-tile-guest">${r.guest}</span>` : ''}
                ${r.status === 'overdue' ? `<span class="room-tile-guest" style="color:var(--status-amber-fg);font-size:0.75rem">${r.daysOverdue} day${r.daysOverdue === 1 ? '' : 's'} overdue</span>` : ''}
                ${hasFlag ? `<span class="next-arrival-flag">⏰ Next arrival today · ${r.nextArrival.time}</span>` : ''}
            </button>
        `;
    }

    /* ==========================================
       RENDER: LIST
       ========================================== */
    function renderList() {
        const body = $('#roomsBody');
        const empty = $('#listEmpty');
        const filtered = sortRooms(applyFilters(ROOMS));

        if (!filtered.length) {
            body.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        body.innerHTML = filtered.map((r) => {
            const isSelected = state.selected.has(r.num);
            const label = STATUS_LABELS[r.status];
            const icon = STATUS_ICONS[r.status];
            return `
                <tr tabindex="0" data-room="${r.num}" class="${isSelected ? 'selected' : ''}">
                    <td>
                        <label class="checkbox" onclick="event.stopPropagation()">
                            <input type="checkbox" class="row-check" data-room="${r.num}" ${isSelected ? 'checked' : ''} aria-label="Select room ${r.num}">
                            <span></span>
                        </label>
                    </td>
                    <td><strong>${r.num}</strong></td>
                    <td class="hide-sm muted">Floor ${r.floor}</td>
                    <td class="hide-md muted">${r.type}</td>
                    <td class="hide-md muted">Max ${r.capacity}</td>
                    <td><span class="status-pill ${r.status}">${icon} ${label}</span></td>
                    <td class="hide-md">${r.guest || '<span class="muted">—</span>'}</td>
                    <td class="hide-sm muted">${fmt(r.checkout)}</td>
                    <td class="hide-md muted">${r.nextArrival ? `${r.nextArrival.guest} · ${r.nextArrival.time}` : '—'}</td>
                </tr>
            `;
        }).join('');

        // Bind row click
        $$('tr[data-room]', body).forEach((row) => {
            row.addEventListener('click', () => openDrawer(row.dataset.room));
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); openDrawer(row.dataset.room); }
                if (e.key === 'ArrowDown') { e.preventDefault(); row.nextElementSibling?.focus(); }
                if (e.key === 'ArrowUp')   { e.preventDefault(); row.previousElementSibling?.focus(); }
            });
        });

        // Checkboxes
        $$('.row-check', body).forEach((cb) => {
            cb.addEventListener('change', () => {
                const num = cb.dataset.room;
                if (cb.checked) state.selected.add(num);
                else state.selected.delete(num);
                cb.closest('tr').classList.toggle('selected', cb.checked);
                updateBulkBar();
            });
        });

        updateBulkBar();
    }

    /* ==========================================
       SORTING
       ========================================== */
    $$('.rooms-table th.sortable').forEach((th) => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
            else { state.sortKey = key; state.sortDir = 'asc'; }
            $$('.rooms-table th.sortable').forEach((h) => h.classList.remove('sort-asc', 'sort-desc'));
            th.classList.add(`sort-${state.sortDir}`);
            renderList();
        });
    });

    /* ==========================================
       SEARCH + FILTER CHIPS
       ========================================== */
    $('#filterSearch')?.addEventListener('input', (e) => {
        state.search = e.target.value.trim();
        $('#clearFilters').hidden = !hasActiveFilters();
        renderBoard();
        renderList();
    });

    function hasActiveFilters() {
        return state.search || state.statusFilter !== 'all' || state.floor !== 'all' ||
               state.capacity !== 'all' || state.type !== 'all';
    }

    $$('.chip-select').forEach((wrap) => {
        const chip = wrap.querySelector('.chip');
        const menu = wrap.querySelector('.chip-menu');
        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasOpen = !menu.hidden;
            $$('.chip-menu').forEach((m) => m.hidden = true);
            menu.hidden = wasOpen;
            chip.setAttribute('aria-expanded', String(!wasOpen));
        });
        menu.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', () => {
                state[btn.dataset.filter] = btn.dataset.value;
                menu.hidden = true;
                chip.classList.toggle('active', btn.dataset.value !== 'all');
                $('#clearFilters').hidden = !hasActiveFilters();
                renderBoard();
                renderList();
            });
        });
    });

    document.addEventListener('click', () => {
        $$('.chip-menu').forEach((m) => m.hidden = true);
    });

    $('#clearFilters')?.addEventListener('click', clearAllFilters);
    $('#boardClearBtn')?.addEventListener('click', clearAllFilters);
    $('#listClearBtn')?.addEventListener('click', clearAllFilters);

    function clearAllFilters() {
        state.search = '';
        state.statusFilter = 'all';
        state.floor = 'all';
        state.capacity = 'all';
        state.type = 'all';
        $('#filterSearch').value = '';
        $$('.chip').forEach((c) => c.classList.remove('active'));
        $$('.status-chip').forEach((c) => c.classList.toggle('active', c.dataset.status === 'all'));
        $('#clearFilters').hidden = true;
        renderBoard();
        renderList();
    }

    /* ==========================================
       BULK
       ========================================== */
    const bulkBar = $('#bulkBar');
    function updateBulkBar() {
        const n = state.selected.size;
        if (n > 0) {
            bulkBar.hidden = false;
            $('#bulkCount').textContent = n;
            $('#bulkPlural').textContent = n === 1 ? '' : 's';
        } else {
            bulkBar.hidden = true;
        }
    }

    $('#bulkClear')?.addEventListener('click', () => {
        state.selected.clear();
        $$('.row-check').forEach((cb) => (cb.checked = false));
        $$('.rooms-table tbody tr').forEach((tr) => tr.classList.remove('selected'));
        updateBulkBar();
    });

    $('#bulkClean')?.addEventListener('click', () => {
        if (state.role === 'front-desk' && state.role !== 'manager' && state.role !== 'housekeeping') {
            // front-desk can also mark clean in this mock
        }
        let n = 0;
        ROOMS.forEach((r) => {
            if (state.selected.has(r.num) && (r.status === 'vacant-dirty' || r.status === 'cleaning')) {
                r.status = 'vacant-clean';
                n++;
            }
        });
        toast('success', 'Rooms updated', `${n} room(s) marked clean.`);
        $('#bulkClear').click();
        renderBoard();
        renderList();
        renderStatusCounts();
    });

    $('#bulkAssign')?.addEventListener('click', () => {
        toast('success', 'Housekeeper assigned', `${state.selected.size} room(s) assigned to Joy Lim.`);
        $('#bulkClear').click();
    });

    /* ==========================================
       DRAWER
       ========================================== */
    const drawer = $('#roomDrawer');
    const drawerOverlay = $('#roomDrawerOverlay');

    function openDrawer(num) {
        const r = ROOMS.find((x) => x.num === num);
        if (!r) return;
        state.activeRoom = r;

        $('#roomDrawerTitle').textContent = `Room ${r.num}`;
        $('#roomDrawerSub').textContent = `Floor ${r.floor} · ${r.type} · Max ${r.capacity} guests`;
        $('#roomDrawerStatus').className = `status-pill ${r.status}`;
        $('#roomDrawerStatus').innerHTML = `${STATUS_ICONS[r.status]} ${STATUS_LABELS[r.status]}`;

        $('#dFloor').textContent = `Floor ${r.floor}`;
        $('#dType').textContent = r.type;
        $('#dCap').textContent = `Max ${r.capacity} guests`;

        if (r.guest) {
            $('#drawerStaySection').style.display = '';
            $('#dGuestAvatar').textContent = initials(r.guest);
            $('#dGuestName').textContent = r.guest;
            $('#dGuestMeta').textContent = `Guest ID ${r.guestId} · In-house`;
            $('#dCheckin').textContent = fmt(r.checkin);
            $('#dCheckout').textContent = fmt(r.checkout);
            $('#dGuests').textContent = `3 of ${r.capacity}`;
        } else {
            $('#drawerStaySection').style.display = 'none';
        }

        // Reset tabs
        $$('.drawer-tab').forEach((t, i) => {
            t.classList.toggle('active', i === 0);
            t.setAttribute('aria-selected', String(i === 0));
        });
        $$('.drawer-panel').forEach((p, i) => p.classList.toggle('active', i === 0));

        drawer.hidden = false;
        drawerOverlay.hidden = false;
        requestAnimationFrame(() => {
            drawer.classList.add('open');
            drawerOverlay.classList.add('open');
        });
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        drawerOverlay.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => {
            drawer.hidden = true;
            drawerOverlay.hidden = true;
        }, 250);
    }

    $('#roomDrawerClose')?.addEventListener('click', closeDrawer);
    drawerOverlay?.addEventListener('click', closeDrawer);

    // Drawer tabs
    $$('.drawer-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.dtab;
            $$('.drawer-tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            $$('.drawer-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === target));
        });
    });

    // Quick actions
    $$('.quick-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn.getAttribute('aria-disabled') === 'true') {
                toast('error', 'Not allowed', btn.title || 'Insufficient permissions.');
                return;
            }
            const action = btn.dataset.action;
            const r = state.activeRoom;
            if (!r) return;

            if (action === 'mark-clean') {
                if (r.status === 'vacant-dirty' || r.status === 'cleaning') {
                    r.status = 'vacant-clean';
                    logAction('Marco Cruz', 'marked room vacant clean', r.num);
                    toast('success', 'Marked clean', `Room ${r.num} is now vacant clean.`);
                    renderBoard();
                    renderList();
                    renderStatusCounts();
                    closeDrawer();
                } else {
                    toast('error', 'Invalid transition', `Room ${r.num} cannot be marked clean from its current status.`);
                }
            } else if (action === 'request-cleaning') {
                if (r.status === 'occupied' || r.status === 'vacant-dirty') {
                    r.status = 'cleaning';
                    logAction('Marco Cruz', 'requested cleaning for room', r.num);
                    toast('success', 'Cleaning requested', `Housekeeping notified for room ${r.num}.`);
                    renderBoard();
                    renderList();
                    renderStatusCounts();
                    closeDrawer();
                } else {
                    toast('error', 'Invalid transition', `Room ${r.num} cannot be set to cleaning.`);
                }
            } else if (action === 'out-of-service') {
                openConfirm('out-of-service');
            } else if (action === 'change-room') {
                openConfirm('change-room');
            } else if (action === 'checkout') {
                toast('success', 'Check out', 'Opening check-out flow…');
            } else if (action === 'extend') {
                toast('success', 'Extend', 'Opening extend-stay form…');
            } else if (action === 'report-issue') {
                toast('success', 'Issue reported', 'Maintenance request submitted.');
            }
        });
    });

    /* ==========================================
       CONFIRM MODAL
       ========================================== */
    const confirmOverlay = $('#confirmOverlay');
    let confirmKind = null;

    function openConfirm(kind) {
        confirmKind = kind;
        const r = state.activeRoom;
        if (kind === 'out-of-service') {
            $('#confirmTitle').textContent = 'Mark out of service';
            $('#confirmText').innerHTML = `Room <strong>${r.num}</strong> will be taken out of service. Provide a reason (this is logged).`;
        } else if (kind === 'change-room') {
            $('#confirmTitle').textContent = 'Change room';
            $('#confirmText').innerHTML = `Move the current guest from room <strong>${r.num}</strong> to a new room. Provide a reason.`;
        }
        $('#confirmReason').value = '';
        $('#confirmReasonErr').textContent = '';
        $('#confirmReason').closest('.form-group').classList.remove('error');
        confirmOverlay.hidden = false;
        requestAnimationFrame(() => confirmOverlay.classList.add('open'));
    }

    function closeConfirm() {
        confirmOverlay.classList.remove('open');
        setTimeout(() => { confirmOverlay.hidden = true; }, 200);
    }

    $('#confirmClose')?.addEventListener('click', closeConfirm);
    $('#confirmCancel')?.addEventListener('click', closeConfirm);
    confirmOverlay?.addEventListener('click', (e) => { if (e.target === confirmOverlay) closeConfirm(); });

    $('#confirmSubmit')?.addEventListener('click', () => {
        const reason = $('#confirmReason').value.trim();
        if (reason.length < 5) {
            $('#confirmReason').closest('.form-group').classList.add('error');
            $('#confirmReasonErr').textContent = 'Please provide a reason (min 5 characters).';
            return;
        }
        const r = state.activeRoom;
        if (confirmKind === 'out-of-service') {
            r.status = 'maintenance';
            logAction('Marco Cruz', `marked room out of service (${reason})`, r.num);
            toast('success', 'Out of service', `Room ${r.num} is now under maintenance.`);
        } else if (confirmKind === 'change-room') {
            logAction('Marco Cruz', `changed room (${reason})`, r.num);
            toast('success', 'Room changed', 'Guest reassigned successfully.');
        }
        renderBoard();
        renderList();
        renderStatusCounts();
        closeConfirm();
        closeDrawer();
    });

    /* ==========================================
       AUDIT LOG
       ========================================== */
    function logAction(staff, action, room) {
        state.auditLog.unshift({ staff, action, room, time: nowTime() });
        state.auditLog = state.auditLog.slice(0, 10);
    }

    /* ==========================================
       KEYBOARD
       ========================================== */
    document.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
        if (typing && e.key !== 'Escape') return;

        if (e.key === '/') {
            e.preventDefault();
            $('#filterSearch')?.focus();
        }
        if (e.key === 'Escape') {
            closeSidebar();
            closeDrawer();
            closeConfirm();
        }
    });

    /* ==========================================
       TOASTS
       ========================================== */
    const toastContainer = $('#toastContainer');
    function toast(type, title, message, timeout = 3200) {
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `
            <span class="toast-icon" aria-hidden="true">
                ${type === 'success'
                    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e5a3a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9b1c1c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`}
            </span>
            <div class="toast-text"><strong>${title}</strong>${message}</div>
        `;
        toastContainer.appendChild(el);
        setTimeout(() => {
            el.classList.add('leaving');
            setTimeout(() => el.remove(), 250);
        }, timeout);
    }

    /* ==========================================
       LAST UPDATED TICKER
       ========================================== */
    const lastUpdated = $('#lastUpdated');
    let secs = 0;
    setInterval(() => {
        secs++;
        lastUpdated.textContent = secs < 60
            ? `Last updated ${secs}s ago`
            : `Last updated ${Math.floor(secs / 60)}m ago`;
    }, 1000);

    /* ==========================================
       INIT
       ========================================== */
    applyRole('front-desk');
    renderStatusCounts();
    renderBoard();
    renderList();
});

document.addEventListener('DOMContentLoaded', () => {
    if (!window.RBAC) return;
    RBAC.init({ active: 'rooms' });

    // Housekeeping: hide change-room / check-out / extend quick actions
    if (RBAC.getRole() === 'housekeeping') {
        document.querySelectorAll('[data-action="checkout"], [data-action="extend"], [data-action="change-room"]')
            .forEach((btn) => btn.setAttribute('hidden', ''));
    }

    // Hook up destructive actions through RBAC
    document.querySelectorAll('[data-action="out-of-service"], [data-action="change-room"]').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const isOOS = btn.dataset.action === 'out-of-service';
            const ok = await RBAC.confirmAction({
                title: isOOS ? 'Mark room out of service' : 'Change room',
                message: isOOS
                    ? 'This will take the room out of service. Guests cannot be assigned here until it is cleared.'
                    : 'Move the current guest to a different room.',
                keyword: isOOS ? 'OUT OF SERVICE' : 'CHANGE',
                requireRole: 'rooms.change'
            });
            if (ok) RBAC.toast('success', 'Confirmed', 'Action logged.');
        });
    });
});