document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       MOCK DATA (15 requests — 5 open, 2 urgent, 1 breached, 2 unassigned)
       ========================================== */
    const REQUESTS = [
        { id: 1,  type: 'Late check-out', room: '201', floor: 2, guest: 'Sofia Reyes',  guestId: 'TR-1001',
          summary: 'Requesting late check-out / extend stay', priority: 'high', status: 'new',
          assignee: null, created: '15 min ago', createdMin: 15, targetMin: 30, slaState: 'fresh', breachesSLA: false,
          message: 'I would like to extend my stay by 2 more days if possible.' },
        { id: 2,  type: 'Maintenance', room: '103', floor: 1, guest: 'Not assigned', guestId: null,
          summary: 'Broken lock on room door — safety issue', priority: 'urgent', status: 'new',
          assignee: null, created: '8 min ago', createdMin: 8, targetMin: 15, slaState: 'fresh', breachesSLA: false,
          message: 'The lock on my door is broken. I cannot secure my belongings.' },
        { id: 3,  type: 'Housekeeping', room: '204', floor: 2, guest: 'Mei Chen', guestId: 'TR-1006',
          summary: 'Requesting a room tidy-up', priority: 'normal', status: 'assigned',
          assignee: 'joy', created: '32 min ago', createdMin: 32, targetMin: 60, slaState: 'fresh', breachesSLA: false,
          message: 'Could someone please tidy up my room this morning?' },
        { id: 4,  type: 'Extra bedding', room: '208', floor: 2, guest: 'Lena Okafor', guestId: 'TR-1004',
          summary: '1 additional pillow', priority: 'low', status: 'in-progress',
          assignee: 'joy', created: '1 hr ago', createdMin: 60, targetMin: 120, slaState: 'warn', breachesSLA: false,
          message: 'Could I get one more pillow for my bed?' },
        { id: 5,  type: 'Room change', room: '303', floor: 3, guest: 'Diego Marquez', guestId: 'TR-1003',
          summary: 'Moving to a quieter room', priority: 'high', status: 'waiting',
          assignee: 'marco', created: '2 hr ago', createdMin: 120, targetMin: 180, slaState: 'warn', breachesSLA: false,
          message: 'The neighbors are quite noisy. Could I move to a quieter room on a higher floor?' },
        { id: 6,  type: 'Housekeeping', room: '301', floor: 3, guest: 'Grace Abara', guestId: 'TR-1012',
          summary: 'Fresh linens please', priority: 'normal', status: 'assigned',
          assignee: 'joy', created: '25 min ago', createdMin: 25, targetMin: 60, slaState: 'fresh', breachesSLA: false,
          message: 'Could I get fresh linens today?' },
        { id: 7,  type: 'Maintenance', room: '207', floor: 2, guest: 'Omar Haddad', guestId: 'TR-1009',
          summary: 'No power in the bathroom', priority: 'urgent', status: 'in-progress',
          assignee: 'ravi', created: '45 min ago', createdMin: 45, targetMin: 30, slaState: 'breached', breachesSLA: true,
          message: 'The lights in my bathroom stopped working.' },
        { id: 8,  type: 'Housekeeping', room: '203', floor: 2, guest: '—', guestId: null,
          summary: 'Post-checkout cleaning required', priority: 'normal', status: 'new',
          assignee: null, created: '10 min ago', createdMin: 10, targetMin: 60, slaState: 'fresh', breachesSLA: false,
          message: 'Room was checked out by Hana Kim.' },
        { id: 9,  type: 'Housekeeping', room: '205', floor: 2, guest: '—', guestId: null,
          summary: 'Post-checkout cleaning required', priority: 'normal', status: 'new',
          assignee: null, created: '5 min ago', createdMin: 5, targetMin: 60, slaState: 'fresh', breachesSLA: false,
          message: 'Room was checked out by guest.' },
        { id: 10, type: 'Maintenance', room: '305', floor: 3, guest: '—', guestId: null,
          summary: 'Water leak under sink', priority: 'urgent', status: 'assigned',
          assignee: 'ravi', created: '20 min ago', createdMin: 20, targetMin: 30, slaState: 'warn', breachesSLA: false,
          message: 'Reported by housekeeping during routine check.' },
        { id: 11, type: 'Housekeeping', room: '202', floor: 2, guest: 'Aiko Tanaka', guestId: 'TR-1002',
          summary: 'Requesting a room tidy-up', priority: 'normal', status: 'in-progress',
          assignee: 'joy', created: '1 hr ago', createdMin: 60, targetMin: 120, slaState: 'warn', breachesSLA: false,
          message: 'Tidy up before I return this evening.' },
        { id: 12, type: 'Late check-out', room: '304', floor: 3, guest: 'Jamie Dela Cruz', guestId: 'TR-1007',
          summary: 'Late check-out request', priority: 'normal', status: 'done',
          assignee: 'marco', created: '2 hr ago', createdMin: 120, targetMin: 120, slaState: 'fresh', breachesSLA: false,
          message: 'Can I check out at 2 PM instead of 11 AM?' },
        { id: 13, type: 'Extra bedding', room: '308', floor: 3, guest: 'Hana Kim', guestId: 'TR-1008',
          summary: 'Extra blanket', priority: 'low', status: 'done',
          assignee: 'joy', created: '3 hr ago', createdMin: 180, targetMin: 240, slaState: 'fresh', breachesSLA: false,
          message: 'The room is quite cold at night.' },
        { id: 14, type: 'Maintenance', room: '101', floor: 1, guest: '—', guestId: null,
          summary: 'Lamp flickering', priority: 'low', status: 'cancelled',
          assignee: 'ravi', created: '1 day ago', createdMin: 1440, targetMin: 1440, slaState: 'fresh', breachesSLA: false,
          message: 'Guest reported flickering lamp — resolved by replacing bulb.' },
        { id: 15, type: 'Room change', room: '306', floor: 3, guest: 'Tomás Silva', guestId: 'TR-1011',
          summary: 'Prefer a room with better view', priority: 'low', status: 'cancelled',
          assignee: 'marco', created: '1 day ago', createdMin: 1440, targetMin: 1440, slaState: 'fresh', breachesSLA: false,
          message: 'Guest decided to stay in current room.' }
    ];

    const ROLE_LABELS = { 'front-desk': 'Front desk', 'housekeeping': 'Housekeeping', 'maintenance': 'Maintenance', 'manager': 'Manager' };
    const ASSIGNEES = { joy: 'Joy Lim', ravi: 'Ravi Batra', marco: 'Marco Cruz' };
    const STATUS_LABELS = { new: 'New', assigned: 'Assigned', 'in-progress': 'In progress', waiting: 'Waiting on guest', done: 'Done', cancelled: 'Cancelled' };
    const PRIORITY_LABELS = { urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' };

    const SAFETY_KEYWORDS = ['leak', 'no power', 'broken lock', 'flood', 'fire', 'smoke', 'gas', 'electrical'];

    // Role-based request type visibility
    const ROLE_TYPES = {
        'front-desk':   ['Housekeeping', 'Maintenance', 'Extra bedding', 'Late check-out', 'Room change'],
        'housekeeping': ['Housekeeping', 'Extra bedding'],
        'maintenance':  ['Maintenance'],
        'manager':      ['Housekeeping', 'Maintenance', 'Extra bedding', 'Late check-out', 'Room change']
    };

    /* ==========================================
       STATE
       ========================================== */
    const state = {
        role: 'front-desk',
        view: 'queue',
        statusFilter: 'all',
        type: 'all',
        priority: 'all',
        assignee: 'all',
        floor: 'all',
        search: '',
        savedView: 'all-open',
        sortKey: 'priority',
        sortDir: 'asc',
        activeId: null,
        notes: {},        // { requestId: [{ text, author, time }] }
        activity: {},     // { requestId: [{ text, author, time }] }
        auditLog: []
    };

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

    function initials(name) {
        if (!name || name === '—') return '—';
        return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    }

    function nowTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function isUrgent(r) {
        return r.priority === 'urgent' || SAFETY_KEYWORDS.some((k) => r.summary.toLowerCase().includes(k) || r.message.toLowerCase().includes(k));
    }

    /* ==========================================
       ROLE SWITCHER
       ========================================== */
    function applyRole(role) {
        state.role = role;
        document.body.dataset.role = role;
        $('#staffRoleLabel').textContent = ROLE_LABELS[role];
        $('#roleBreadcrumb').textContent = ROLE_LABELS[role];

        $$('[data-role-required="manager"]').forEach((el) => {
            if (role === 'manager') {
                el.removeAttribute('aria-disabled');
                el.removeAttribute('title');
            } else {
                el.setAttribute('aria-disabled', 'true');
                el.setAttribute('title', 'Manager access only');
            }
        });

        $$('.quick-btn[data-role]').forEach((btn) => {
            const allowed = btn.dataset.role.split(' ');
            if (allowed.includes(role)) {
                btn.removeAttribute('aria-disabled');
                btn.removeAttribute('title');
            } else {
                btn.setAttribute('aria-disabled', 'true');
                btn.setAttribute('title', `${allowed.map((r) => ROLE_LABELS[r]).join(' or ')} only`);
            }
        });

        renderCounts();
        renderQueue();
        renderBoard();
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
       FILTERING
       ========================================== */
    function applyFilters(requests) {
        const visibleTypes = ROLE_TYPES[state.role] || [];
        return requests.filter((r) => {
            // Role-based type visibility
            if (!visibleTypes.includes(r.type)) return false;

            // Status summary filter
            if (state.statusFilter === 'breached') { if (!r.breachesSLA) return false; }
            else if (state.statusFilter !== 'all') { if (r.status !== state.statusFilter) return false; }

            // Chip filters
            if (state.type !== 'all' && r.type !== state.type) return false;
            if (state.priority !== 'all') {
                if (state.priority === 'urgent') { if (!isUrgent(r)) return false; }
                else if (r.priority !== state.priority) return false;
            }
            if (state.assignee === 'me') { if (r.assignee !== 'marco') return false; }
            else if (state.assignee === 'unassigned') { if (r.assignee) return false; }
            else if (state.assignee !== 'all') { if (r.assignee !== state.assignee) return false; }
            if (state.floor !== 'all' && String(r.floor) !== state.floor) return false;

            // Search
            if (state.search) {
                const q = state.search.toLowerCase();
                if (!r.guest.toLowerCase().includes(q)
                    && !r.room.toLowerCase().includes(q)
                    && !r.summary.toLowerCase().includes(q)
                    && !r.type.toLowerCase().includes(q)) return false;
            }

            // Saved view
            if (state.savedView === 'all-open' && r.status === 'done') return false;
            if (state.savedView === 'all-open' && r.status === 'cancelled') return false;
            if (state.savedView === 'mine' && r.assignee !== 'marco') return false;
            if (state.savedView === 'unassigned' && r.assignee) return false;
            if (state.savedView === 'urgent' && !isUrgent(r)) return false;

            return true;
        });
    }

    function sortRequests(requests) {
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        return [...requests].sort((a, b) => {
            if (state.sortKey === 'priority') {
                const pa = priorityOrder[a.priority] ?? 99;
                const pb = priorityOrder[b.priority] ?? 99;
                if (pa !== pb) return state.sortDir === 'asc' ? pa - pb : pb - pa;
                return b.createdMin - a.createdMin;
            }
            const av = String(a[state.sortKey] ?? '').toLowerCase();
            const bv = String(b[state.sortKey] ?? '').toLowerCase();
            if (av < bv) return state.sortDir === 'asc' ? -1 : 1;
            if (av > bv) return state.sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /* ==========================================
       RENDER: COUNTS
       ========================================== */
    function renderCounts() {
        const visible = REQUESTS.filter((r) => (ROLE_TYPES[state.role] || []).includes(r.type));
        const open = visible.filter((r) => r.status !== 'done' && r.status !== 'cancelled').length;
        $('#openCount').textContent = `${open} open`;
        $('#navReqBadge').textContent = open;

        const counts = {
            all: visible.length,
            new: visible.filter((r) => r.status === 'new').length,
            assigned: visible.filter((r) => r.status === 'assigned').length,
            'in-progress': visible.filter((r) => r.status === 'in-progress').length,
            waiting: visible.filter((r) => r.status === 'waiting').length,
            done: visible.filter((r) => r.status === 'done').length,
            breached: visible.filter((r) => r.breachesSLA).length
        };

        $('#cAll').textContent = counts.all;
        $('#cNew').textContent = counts.new;
        $('#cAssigned').textContent = counts.assigned;
        $('#cInProgress').textContent = counts['in-progress'];
        $('#cWaiting').textContent = counts.waiting;
        $('#cDoneToday').textContent = counts.done;
        $('#cBreached').textContent = counts.breached;

        // Saved views counts
        const openVisible = visible.filter((r) => r.status !== 'done' && r.status !== 'cancelled');
        $('#countAllOpen').textContent = openVisible.length;
        $('#countMine').textContent = visible.filter((r) => r.assignee === 'marco' && r.status !== 'done' && r.status !== 'cancelled').length;
        $('#countUnassigned').textContent = visible.filter((r) => !r.assignee && r.status !== 'done' && r.status !== 'cancelled').length;
        $('#countUrgent').textContent = visible.filter((r) => isUrgent(r) && r.status !== 'done' && r.status !== 'cancelled').length;
    }

    /* ==========================================
       STATUS CHIPS + SAVED TABS
       ========================================== */
    $$('.status-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            state.statusFilter = chip.dataset.status;
            $$('.status-chip').forEach((c) => c.classList.toggle('active', c === chip));
            renderQueue();
            renderBoard();
        });
    });

    $$('.saved-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            state.savedView = tab.dataset.view;
            $$('.saved-tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            renderQueue();
            renderBoard();
        });
    });

    /* ==========================================
       CHIP FILTERS
       ========================================== */
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
                renderQueue();
                renderBoard();
            });
        });
    });

    document.addEventListener('click', () => { $$('.chip-menu').forEach((m) => m.hidden = true); });

    function hasActiveFilters() {
        return state.search || state.type !== 'all' || state.priority !== 'all'
            || state.assignee !== 'all' || state.floor !== 'all';
    }

    $('#clearFilters')?.addEventListener('click', clearFilters);
    $('#queueClearBtn')?.addEventListener('click', clearFilters);

    function clearFilters() {
        state.search = ''; state.type = 'all'; state.priority = 'all';
        state.assignee = 'all'; state.floor = 'all';
        $('#filterSearch').value = '';
        $$('.chip').forEach((c) => c.classList.remove('active'));
        $('#clearFilters').hidden = true;
        renderQueue(); renderBoard();
    }

    $('#filterSearch')?.addEventListener('input', (e) => {
        state.search = e.target.value.trim();
        $('#clearFilters').hidden = !hasActiveFilters();
        renderQueue();
        renderBoard();
    });

    /* ==========================================
       RENDER: QUEUE
       ========================================== */
    function renderQueue() {
        const body = $('#requestsBody');
        const empty = $('#queueEmpty');
        const filtered = sortRequests(applyFilters(REQUESTS));

        if (!filtered.length) {
            body.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        body.innerHTML = filtered.map((r) => {
            const showGuest = state.role === 'front-desk' || state.role === 'manager';
            const init = r.assignee ? initials(ASSIGNEES[r.assignee]) : '—';
            const ageClass = r.breachesSLA ? 'breached' : (r.slaState === 'warn' ? 'warn' : 'fresh');
            const primaryAction = !r.assignee ? 'assign-me' : (r.status === 'new' || r.status === 'assigned' ? 'start' : (r.status === 'in-progress' ? 'done' : null));

            return `
                <tr tabindex="0" data-id="${r.id}">
                    <td>
                        <span class="priority-pill ${isUrgent(r) ? 'urgent' : r.priority}">
                            ${isUrgent(r) ? '⚑ Urgent' : PRIORITY_LABELS[r.priority]}
                        </span>
                    </td>
                    <td><strong>${r.type}</strong></td>
                    <td><strong>${r.room}</strong></td>
                    <td class="hide-md muted">${showGuest ? r.guest : '—'}</td>
                    <td class="summary-cell" title="${r.summary}">${r.summary}</td>
                    <td class="hide-sm age-cell ${ageClass}">${r.created}</td>
                    <td class="hide-md">
                        <span class="assignee-cell">
                            <span class="assignee-avatar ${r.assignee ? '' : 'unassigned'}">${init}</span>
                            <span class="muted">${r.assignee ? ASSIGNEES[r.assignee] : 'Unassigned'}</span>
                        </span>
                    </td>
                    <td>
                        <span class="status-pill ${r.breachesSLA ? 'breached' : r.status}">
                            <span class="dot"></span> ${r.breachesSLA ? 'SLA breached' : STATUS_LABELS[r.status]}
                        </span>
                    </td>
                    <td class="col-actions">
                        <div class="row-actions">
                            ${primaryAction === 'assign-me' ? `<button class="btn btn-sm btn-outline" data-row-action="assign-me">Assign to me</button>` : ''}
                            ${primaryAction === 'start' ? `<button class="btn btn-sm btn-primary" data-row-action="start">Start</button>` : ''}
                            ${primaryAction === 'done' ? `<button class="btn btn-sm btn-primary" data-row-action="done">Mark done</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Row click → drawer
        $$('tr[data-id]', body).forEach((row) => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('[data-row-action]')) return;
                openDrawer(Number(row.dataset.id));
            });
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); openDrawer(Number(row.dataset.id)); }
                if (e.key === 'ArrowDown') { e.preventDefault(); row.nextElementSibling?.focus(); }
                if (e.key === 'ArrowUp') { e.preventDefault(); row.previousElementSibling?.focus(); }
                if (e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    quickAction(Number(row.dataset.id), 'assign-me');
                }
            });
        });

        // Row actions
        $$('[data-row-action]', body).forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number(btn.closest('tr').dataset.id);
                quickAction(id, btn.dataset.rowAction);
            });
        });
    }

    /* ==========================================
       RENDER: BOARD
       ========================================== */
    function renderBoard() {
        const columns = { new: [], assigned: [], 'in-progress': [], done: [] };
        applyFilters(REQUESTS).forEach((r) => {
            if (columns[r.status]) columns[r.status].push(r);
        });

        ['new', 'assigned', 'in-progress', 'done'].forEach((col) => {
            const body = $(`.board-col-body[data-col="${col}"]`);
            const list = columns[col];
            body.innerHTML = list.length
                ? list.map(renderBoardCard).join('')
                : `<div class="empty-state small"><p class="empty-sub">No requests</p></div>`;

            // Bind drag/drop
            attachDragDrop(body);
            // Card click
            $$('.board-card', body).forEach((card) => {
                card.addEventListener('click', () => openDrawer(Number(card.dataset.id)));
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); openDrawer(Number(card.dataset.id)); }
                });
            });
        });

        // Update column counts
        $('#bcNew').textContent = columns.new.length;
        $('#bcAssigned').textContent = columns.assigned.length;
        $('#bcInProgress').textContent = columns['in-progress'].length;
        $('#bcDone').textContent = columns.done.length;
    }

    function renderBoardCard(r) {
        const urgent = isUrgent(r);
        const init = r.assignee ? initials(ASSIGNEES[r.assignee]) : '—';
        const ageClass = r.breachesSLA ? 'breached' : (r.slaState === 'warn' ? 'warn' : 'fresh');
        return `
            <div class="board-card priority-${urgent ? 'urgent' : r.priority}" draggable="true" data-id="${r.id}" tabindex="0">
                <div class="board-card-top">
                    <span class="board-card-type">${r.type}</span>
                    <span class="priority-pill ${urgent ? 'urgent' : r.priority}">${urgent ? '⚑' : PRIORITY_LABELS[r.priority]}</span>
                </div>
                <span class="board-card-summary">${r.summary}</span>
                <div class="board-card-meta">
                    <span>Room ${r.room}</span>
                    <span class="age-cell ${ageClass}">${r.created}</span>
                </div>
                <div class="board-card-meta">
                    <span class="assignee-cell">
                        <span class="assignee-avatar ${r.assignee ? '' : 'unassigned'}">${init}</span>
                        <span>${r.assignee ? ASSIGNEES[r.assignee] : 'Unassigned'}</span>
                    </span>
                    <span class="status-pill ${r.breachesSLA ? 'breached' : r.status}">${STATUS_LABELS[r.status]}</span>
                </div>
            </div>
        `;
    }

    function attachDragDrop(body) {
        let draggedId = null;

        $$('.board-card', body).forEach((card) => {
            card.addEventListener('dragstart', () => {
                draggedId = Number(card.dataset.id);
                card.classList.add('dragging');
                body.classList.add('drag-over-target');
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                $$('.board-col-body').forEach((b) => b.classList.remove('drag-over'));
            });
        });

        body.addEventListener('dragover', (e) => {
            e.preventDefault();
            body.classList.add('drag-over');
        });
        body.addEventListener('dragleave', () => body.classList.remove('drag-over'));
        body.addEventListener('drop', (e) => {
            e.preventDefault();
            body.classList.remove('drag-over');
            if (draggedId == null) return;
            const newStatus = body.dataset.col;
            const r = REQUESTS.find((x) => x.id === draggedId);
            if (!r) return;
            const oldStatus = r.status;
            if (oldStatus === newStatus) return;
            if (newStatus === 'done' && !r.assignee) {
                toast('error', 'Not allowed', 'Assign this request before marking it done.');
                return;
            }
            r.status = newStatus;
            logAction('Marco Cruz', `moved status from "${STATUS_LABELS[oldStatus]}" to "${STATUS_LABELS[newStatus]}"`, r.room);
            notifyGuest(r, newStatus);
            renderQueue();
            renderBoard();
            renderCounts();
            toast('success', 'Status updated', `${r.type} · Room ${r.room} → ${STATUS_LABELS[newStatus]}`);
        });
    }

    /* ==========================================
       DRAWER
       ========================================== */
    const drawer = $('#reqDrawer');
    const drawerOverlay = $('#reqDrawerOverlay');

    function openDrawer(id) {
        const r = REQUESTS.find((x) => x.id === id);
        if (!r) return;
        state.activeId = id;

        $('#drawerTitle').textContent = r.type;
        $('#drawerSub').textContent = `Room ${r.room} · ${state.role === 'front-desk' || state.role === 'manager' ? r.guest : 'Guest hidden'}`;
        $('#drawerStatusPill').className = `status-pill ${r.breachesSLA ? 'breached' : r.status}`;
        $('#drawerStatusPill').innerHTML = `<span class="dot"></span> ${r.breachesSLA ? 'SLA breached' : STATUS_LABELS[r.status]}`;

        $('#dMessage').textContent = r.message;
        $('#dRoom').textContent = `Room ${r.room}`;
        $('#dFloor').textContent = `Floor ${r.floor}`;
        $('#dStay').textContent = r.guestId ? 'Oct 2 – Oct 9, 2026' : '—';
        $('#dGuest').textContent = state.role === 'front-desk' || state.role === 'manager' ? r.guest : 'Hidden for your role';
        $('#dTarget').textContent = `${r.targetMin} minutes (${r.slaState === 'breached' ? 'breached' : r.slaState === 'warn' ? 'near limit' : 'on track'})`;

        renderTypeSpecific(r);
        renderActivity(r);
        renderNotes(r);

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
        setTimeout(() => { drawer.hidden = true; drawerOverlay.hidden = true; }, 250);
    }

    $('#reqDrawerClose')?.addEventListener('click', closeDrawer);
    drawerOverlay?.addEventListener('click', closeDrawer);

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

    /* ==========================================
       TYPE-SPECIFIC BLOCKS
       ========================================== */
    function renderTypeSpecific(r) {
        const container = $('#typeSpecificSection');
        let html = '';

        if (r.type === 'Room change') {
            html = `
                <h4>Room change</h4>
                <div class="type-block info">
                    <h5>Availability check</h5>
                    <p>Room <strong>304</strong> (Floor 3, Standard Shared, Max 5) is available and matches capacity.</p>
                    <div class="btn-row">
                        <button class="btn btn-sm btn-outline">View on Rooms board</button>
                    </div>
                </div>
            `;
        } else if (r.type === 'Late check-out') {
            html = `
                <h4>Late check-out</h4>
                <div class="type-block">
                    <h5>Room 201 has a next arrival</h5>
                    <p>Room 201 is overdue and has an incoming guest at <strong>10:30 AM</strong>. Approving a late check-out will require reassigning the arriving guest.</p>
                    <div class="btn-row">
                        <button class="btn btn-sm btn-primary" data-type-action="approve-late">Approve late check-out</button>
                        <button class="btn btn-sm btn-outline" data-type-action="decline-late">Decline</button>
                    </div>
                </div>
            `;
        } else if (r.type === 'Housekeeping') {
            html = `
                <h4>Room cleaning status</h4>
                <div class="type-block info">
                    <h5>Room ${r.room}</h5>
                    <p>Current room status: <strong>${r.room === '201' ? 'Overdue' : 'Occupied'}</strong>. Request cleaning to queue this room for housekeeping.</p>
                    <div class="btn-row">
                        <button class="btn btn-sm btn-outline">Open Rooms board</button>
                    </div>
                </div>
            `;
        } else if (r.type === 'Maintenance') {
            html = `
                <h4>Maintenance</h4>
                <div class="type-block warn">
                    <h5>Safety-first</h5>
                    <p>If this issue affects guest safety or prevents the room from being occupied, you may mark the room out of service.</p>
                    <div class="btn-row">
                        <button class="btn btn-sm btn-danger" data-type-action="mark-oos">Mark room out of service</button>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        $$('[data-type-action]', container).forEach((b) => {
            b.addEventListener('click', () => {
                if (b.dataset.typeAction === 'mark-oos') openConfirm('mark-oos');
                else if (b.dataset.typeAction === 'approve-late') { toast('success', 'Late check-out approved', 'Guest has been notified.'); }
                else if (b.dataset.typeAction === 'decline-late') openConfirm('decline');
            });
        });
    }

    /* ==========================================
       ACTIVITY / NOTES
       ========================================== */
    function renderActivity(r) {
        const list = state.activity[r.id] || [
            { text: `Request created by guest`, author: 'System', time: r.created }
        ];
        $('#dActivity').innerHTML = list.map((a) => `
            <li>
                <span class="history-dot" aria-hidden="true"></span>
                <div>
                    <p><strong>${a.author}</strong> ${a.text}</p>
                    <span>${a.time}</span>
                </div>
            </li>
        `).join('');
    }

    function renderNotes(r) {
        const list = state.notes[r.id] || [];
        $('#notesList').innerHTML = list.map((n) => `
            <li>${n.text}<span>${n.author} · ${n.time}</span></li>
        `).join('');
    }

    function logAction(author, text, room) {
        if (state.activeId) {
            const arr = state.activity[state.activeId] || [];
            arr.unshift({ text, author, time: nowTime() });
            state.activity[state.activeId] = arr;
            renderActivity(REQUESTS.find((x) => x.id === state.activeId));
        }
        state.auditLog.unshift({ author, text, room, time: nowTime() });
    }

    function notifyGuest(r, newStatus) {
        // Simulated: In a real app this would POST to the guest Notifications API
        if (!r.guestId) return;
    }

    /* ==========================================
       QUICK ACTIONS
       ========================================== */
    function quickAction(id, action) {
        const r = REQUESTS.find((x) => x.id === id);
        if (!r) return;

        if (action === 'assign-me') {
            r.assignee = 'marco';
            if (r.status === 'new') r.status = 'assigned';
            logAction('Marco Cruz', 'assigned themselves to this request', r.room);
            toast('success', 'Assigned', `You are now handling this ${r.type}.`);
        } else if (action === 'start') {
            if (!r.assignee) r.assignee = 'marco';
            r.status = 'in-progress';
            logAction('Marco Cruz', 'started work on this request', r.room);
            toast('success', 'In progress', `${r.type} · Room ${r.room} is now in progress.`);
        } else if (action === 'waiting') {
            r.status = 'waiting';
            logAction('Marco Cruz', 'set status to "waiting on guest"', r.room);
            toast('success', 'Waiting', 'Marked as waiting on guest.');
        } else if (action === 'done') {
            r.status = 'done';
            r.slaState = 'fresh';
            logAction('Marco Cruz', 'marked this request done', r.room);
            toast('success', 'Done',
                `${r.type} · Room ${r.room} completed. Guest notified.`,
                10000, {
                    label: 'Undo',
                    onClick: () => {
                        r.status = 'in-progress';
                        toast('success', 'Undone', `Request re-opened as in progress.`);
                        renderQueue(); renderBoard(); renderCounts();
                    }
                });
        } else if (action === 'priority') {
            toast('success', 'Priority', 'Opening priority selector…');
        } else if (action === 'reassign') {
            toast('success', 'Reassign', 'Opening assignee selector…');
        } else if (action === 'cancel') {
            openConfirm('cancel');
        }

        renderQueue();
        renderBoard();
        renderCounts();
    }

    // Drawer quick actions
    $$('.quick-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn.getAttribute('aria-disabled') === 'true') {
                toast('error', 'Not allowed', btn.title || 'Insufficient permissions.');
                return;
            }
            quickAction(state.activeId, btn.dataset.action);
        });
    });

    /* ==========================================
       CONFIRM MODAL
       ========================================== */
    const confirmOverlay = $('#confirmOverlay');
    let confirmKind = null;

    function openConfirm(kind) {
        confirmKind = kind;
        const r = REQUESTS.find((x) => x.id === state.activeId);
        if (!r) return;
        const titles = {
            'cancel': 'Cancel request',
            'decline': 'Decline late check-out',
            'mark-oos': 'Mark room out of service'
        };
        $('#confirmTitle').textContent = titles[kind] || 'Confirm action';
        $('#confirmText').innerHTML = `Provide a reason (this will be logged and shared with the guest).`;
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
        const r = REQUESTS.find((x) => x.id === state.activeId);
        if (confirmKind === 'cancel') {
            r.status = 'cancelled';
            logAction('Marco Cruz', `cancelled this request — ${reason}`, r.room);
            toast('success', 'Request cancelled', 'The guest has been notified.');
        } else if (confirmKind === 'decline') {
            logAction('Marco Cruz', `declined late check-out — ${reason}`, r.room);
            toast('success', 'Declined', 'The guest has been notified.');
        } else if (confirmKind === 'mark-oos') {
            logAction('Marco Cruz', `marked room out of service — ${reason}`, r.room);
            toast('success', 'Room out of service', `Room ${r.room} is now unavailable.`);
        }
        renderQueue(); renderBoard(); renderCounts();
        closeConfirm();
        closeDrawer();
    });

    /* ==========================================
       NOTES & REPLY
       ========================================== */
    $('#saveNote')?.addEventListener('click', () => {
        const text = $('#staffNote').value.trim();
        if (!text) return;
        const id = state.activeId;
        state.notes[id] = state.notes[id] || [];
        state.notes[id].unshift({ text, author: 'Marco Cruz', time: nowTime() });
        $('#staffNote').value = '';
        renderNotes(REQUESTS.find((x) => x.id === id));
        toast('success', 'Note saved', 'Visible to staff only.');
    });

    $('#sendReply')?.addEventListener('click', () => {
        const text = $('#replyText').value.trim();
        if (!text) return;
        logAction('Marco Cruz', `replied to guest: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`, '');
        $('#replyText').value = '';
        toast('success', 'Reply sent', 'Guest notified in their Notifications.');
    });

    /* ==========================================
       SORTING
       ========================================== */
    $$('.requests-table th.sortable').forEach((th) => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
            else { state.sortKey = key; state.sortDir = 'asc'; }
            $$('.requests-table th.sortable').forEach((h) => h.classList.remove('sort-asc', 'sort-desc'));
            th.classList.add(`sort-${state.sortDir}`);
            renderQueue();
        });
    });

    /* ==========================================
       NEW REQUEST
       ========================================== */
    $('#newRequestBtn')?.addEventListener('click', () => {
        toast('success', 'New request', 'Opening walk-in request form…');
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
            $('#filterSearch')?.focus();
        }
        if (e.key === 'Escape') {
            closeSidebar();
            closeDrawer();
            closeConfirm();
        }
        if (e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
            // Only when a row is focused
            const row = document.activeElement.closest?.('tr[data-id]');
            if (row) {
                e.preventDefault();
                quickAction(Number(row.dataset.id), 'assign-me');
            }
        }
    });

    /* ==========================================
       TOASTS
       ========================================== */
    const toastContainer = $('#toastContainer');
    function toast(type, title, message, timeout = 3500, action = null) {
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
                el.classList.add('leaving');
                setTimeout(() => el.remove(), 250);
            });
        }
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
    renderCounts();
    renderQueue();
    renderBoard();
});