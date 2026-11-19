document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       MOCK DATA — 24 users across all roles
       ========================================== */
    const USERS = [];   // filled from the database

    const ROLES = [
        { name: 'Guest',         count: 9,  desc: 'External users with limited self-service access. They can view their own stay, submit service requests and manage their profile.', grantAll: ['view own stay', 'submit service requests', 'update own profile'] },
        { name: 'Front desk',    count: 4,  desc: 'Day-to-day operations for arrivals, departures, room assignment and guest services.', grantAll: ['view guests', 'reveal masked data', 'check in / out', 'change rooms'] },
        { name: 'Housekeeping',  count: 3,  desc: 'Room cleaning, laundry and status updates. Cannot see guest contact details.', grantAll: ['view rooms', 'update cleaning status', 'view own requests'] },
        { name: 'Maintenance',   count: 2,  desc: 'Repairs and maintenance tasks. Read-only for guest details.', grantAll: ['view rooms', 'update maintenance status', 'view own requests'] },
        { name: 'Manager',       count: 1,  desc: 'Full hotel operations, reporting and staff oversight.', grantAll: ['view guests', 'reveal masked data', 'check in / out', 'force check-out', 'view reports', 'export data', 'manage staff'] },
        { name: 'Support admin', count: 2,  desc: 'Platform support for user accounts and basic security. Cannot export or delete data.', grantAll: ['view users', 'reset passwords', 'unlock accounts', 'view audit logs'] },
        { name: 'Super admin',   count: 1,  desc: 'Full platform access including destructive actions, backups and system settings.', grantAll: ['everything'] }
    ];

    const PERMISSIONS = [
        { group: 'Guests',            key: 'viewGuests',        label: 'View guests',              roles: { Guest:false, 'Front desk':true,  Housekeeping:true,  Maintenance:false, Manager:true,  'Support admin':false, 'Super admin':true  }, sensitive: false },
        { group: 'Guests',            key: 'revealMasked',      label: 'Reveal masked data',       roles: { Guest:false, 'Front desk':true,  Housekeeping:false, Maintenance:false, Manager:true,  'Support admin':false, 'Super admin':true  }, sensitive: true  },
        { group: 'Rooms',             key: 'viewRooms',         label: 'View rooms',               roles: { Guest:false, 'Front desk':true,  Housekeeping:true,  Maintenance:true,  Manager:true,  'Support admin':false, 'Super admin':true  }, sensitive: false },
        { group: 'Rooms',             key: 'editRooms',         label: 'Edit rooms',               roles: { Guest:false, 'Front desk':false, Housekeeping:false, Maintenance:false, Manager:true,  'Support admin':false, 'Super admin':true  }, sensitive: false },
        { group: 'Check-in / out',    key: 'checkInOut',        label: 'Check in / check out',     roles: { Guest:false, 'Front desk':true,  Housekeeping:false, Maintenance:false, Manager:true,  'Support admin':false, 'Super admin':true  }, sensitive: false },
        { group: 'Check-in / out',    key: 'forceCheckout',     label: 'Force check-out',          roles: { Guest:false, 'Front desk':false, Housekeeping:false, Maintenance:false, Manager:true,  'Support admin':false, 'Super admin':true  }, sensitive: true  },
        { group: 'Check-in / out',    key: 'changeRooms',       label: 'Change rooms',             roles: { Guest:false, 'Front desk':true,  Housekeeping:false, Maintenance:false, Manager:true,  'Support admin':false, 'Super admin':true  }, sensitive: false },
        { group: 'Service requests',  key: 'viewRequests',      label: 'View service requests',    roles: { Guest:false, 'Front desk':true,  Housekeeping:true,  Maintenance:true,  Manager:true,  'Support admin':false, 'Super admin':true  }, sensitive: false },
        { group: 'Service requests',  key: 'assignRequests',    label: 'Assign requests',          roles: { Guest:false, 'Front desk':true,  Housekeeping:false, Maintenance:false, Manager:true,  'Support admin':false, 'Super admin':true  }, sensitive: false },
        { group: 'Reports',           key: 'viewReports',       label: 'View reports',             roles: { Guest:false, 'Front desk':false, Housekeeping:false, Maintenance:false, Manager:true,  'Support admin':false, 'Super admin':true  }, sensitive: false },
        { group: 'Reports',           key: 'exportData',        label: 'Export data',              roles: { Guest:false, 'Front desk':false, Housekeeping:false, Maintenance:false, Manager:true,  'Support admin':false, 'Super admin':true  }, sensitive: true  },
        { group: 'Staff & settings',  key: 'manageStaff',       label: 'Manage staff',             roles: { Guest:false, 'Front desk':false, Housekeeping:false, Maintenance:false, Manager:false, 'Support admin':false, 'Super admin':true  }, sensitive: true  },
        { group: 'Staff & settings',  key: 'manageRoles',       label: 'Manage roles',             roles: { Guest:false, 'Front desk':false, Housekeeping:false, Maintenance:false, Manager:false, 'Support admin':false, 'Super admin':true  }, sensitive: true  },
        { group: 'Security',          key: 'viewAudit',         label: 'View audit logs',          roles: { Guest:false, 'Front desk':false, Housekeeping:false, Maintenance:false, Manager:false, 'Support admin':true,  'Super admin':true  }, sensitive: false },
        { group: 'Security',          key: 'manageSecurity',    label: 'Manage security settings', roles: { Guest:false, 'Front desk':false, Housekeeping:false, Maintenance:false, Manager:false, 'Support admin':false, 'Super admin':true  }, sensitive: false },
        { group: 'Data',              key: 'deleteData',        label: 'Delete data',              roles: { Guest:false, 'Front desk':false, Housekeeping:false, Maintenance:false, Manager:false, 'Support admin':false, 'Super admin':true  }, sensitive: true  },
        { group: 'Data',              key: 'restoreBackups',    label: 'Restore backups',          roles: { Guest:false, 'Front desk':false, Housekeeping:false, Maintenance:false, Manager:false, 'Support admin':false, 'Super admin':true  }, sensitive: true  }
    ];

    const ROLE_COLUMNS = ['Guest', 'Front desk', 'Housekeeping', 'Maintenance', 'Manager', 'Support admin', 'Super admin'];

    const ACCESS_REQUESTS = [];   // no request feature in the database yet

    const ROLE_HISTORY = [];   // filled from the role_history table

    // Database role keys <-> the labels shown on this page
    const ROLE_KEY_TO_LABEL = {
        'client': 'Guest', 'front-desk': 'Front desk', 'housekeeping': 'Housekeeping', 'maintenance': 'Maintenance',
        'manager': 'Manager', 'support-admin': 'Support admin', 'super-admin': 'Super admin'
    };
    const ROLE_LABEL_TO_KEY = Object.fromEntries(Object.entries(ROLE_KEY_TO_LABEL).map(([k, v]) => [v, k]));
    const ROLE_LABELS = { 'super-admin': 'Super admin', 'support-admin': 'Support admin' };
    const db = window.supabaseClient;

    /* ==========================================
       STATE
       ========================================== */
    const state = {
        role: 'support-admin',
        me: null,
        actionTarget: null,
        tab: 'users',
        search: '',
        filterRole: 'all',
        filterStatus: 'all',
        filter2fa: 'all',
        filterLastActive: 'all',
        savedView: 'all',
        sortKey: 'name',
        sortDir: 'asc',
        selected: new Set(),
        activeUser: null,
        matrix: JSON.parse(JSON.stringify(PERMISSIONS)),
        confirmCtx: null,
        stepupCallback: null
    };

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

    function initials(name) {
        return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    }

    /* ==========================================
       ROLE DISPLAY (the role comes from the database)
       ========================================== */
    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function applyRole(roleKey) {
        state.role = roleKey;
        document.body.dataset.role = roleKey;
        const label = ROLE_LABELS[roleKey] || roleKey;
        const me = state.me || { name: 'Admin', initials: 'AD' };

        const roleLabel = $('#staffRoleLabel'); if (roleLabel) roleLabel.textContent = label;
        const crumb = $('#roleBreadcrumb'); if (crumb) crumb.textContent = label;
        $$('.staff-name').forEach((el) => { el.textContent = me.name; });
        $$('.staff-avatar, .topbar-avatar').forEach((el) => { el.textContent = me.initials; });

        const isSuper = roleKey === 'super-admin';
        $$('[data-role-required="super-admin"], .bulk-actions [data-role="super-admin"]').forEach((el) => {
            if (isSuper) { el.removeAttribute('aria-disabled'); el.removeAttribute('title'); }
            else { el.setAttribute('aria-disabled', 'true'); el.setAttribute('title', 'Super admin only'); }
        });
    }
    applyRole('support-admin');   // most restricted until the database confirms who you are

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
            state.tab = tab.dataset.tab;
            $$('.tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === state.tab));
        });
    });

    /* ==========================================
       SAVED VIEWS COUNT
       ========================================== */
    function updateSavedCounts() {
        $('#cvAll').textContent = USERS.length;
        $('#cvAdmins').textContent = USERS.filter((u) => u.role === 'Super admin' || u.role === 'Support admin').length;
        $('#cvStaff').textContent = USERS.filter((u) => ['Front desk','Housekeeping','Maintenance','Manager'].includes(u.role)).length;
        $('#cvGuests').textContent = USERS.filter((u) => u.role === 'Guest').length;
        $('#cvLocked').textContent = USERS.filter((u) => u.status === 'locked').length;
        $('#cvNo2fa').textContent = USERS.filter((u) => !u.twofa).length;
        $('#cvExpiring').textContent = USERS.filter((u) => u.isTemp).length;
        $('#totalCount').textContent = `${USERS.length} users`;
    }
    updateSavedCounts();

    /* ==========================================
       FILTER + SORT LOGIC
       ========================================== */
    function applyFilters() {
        let list = [...USERS];
        const q = state.search.toLowerCase();

        if (q) {
            list = list.filter((u) =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.guestId && u.guestId.toLowerCase().includes(q)) ||
                (u.regId && u.regId.toLowerCase().includes(q))
            );
        }
        if (state.filterRole !== 'all') list = list.filter((u) => u.role === state.filterRole);
        if (state.filterStatus !== 'all') list = list.filter((u) => u.status === state.filterStatus);
        if (state.filter2fa === 'on') list = list.filter((u) => u.twofa);
        if (state.filter2fa === 'off') list = list.filter((u) => !u.twofa);
        if (state.filterLastActive === 'today') list = list.filter((u) => u.lastActiveKey === 'today');
        if (state.filterLastActive === 'week') list = list.filter((u) => ['today','week'].includes(u.lastActiveKey));
        if (state.filterLastActive === 'month') list = list.filter((u) => ['today','week','month'].includes(u.lastActiveKey));

        // Saved view
        if (state.savedView === 'admins') list = list.filter((u) => u.role === 'Super admin' || u.role === 'Support admin');
        else if (state.savedView === 'staff') list = list.filter((u) => ['Front desk','Housekeeping','Maintenance','Manager'].includes(u.role));
        else if (state.savedView === 'guests') list = list.filter((u) => u.role === 'Guest');
        else if (state.savedView === 'locked') list = list.filter((u) => u.status === 'locked');
        else if (state.savedView === 'no2fa') list = list.filter((u) => !u.twofa);
        else if (state.savedView === 'expiring') list = list.filter((u) => u.isTemp);

        // Sort
        list.sort((a, b) => {
            let av = a[state.sortKey];
            let bv = b[state.sortKey];
            if (typeof av === 'boolean') av = av ? 1 : 0;
            if (typeof bv === 'boolean') bv = bv ? 1 : 0;
            av = String(av ?? '').toLowerCase();
            bv = String(bv ?? '').toLowerCase();
            if (av < bv) return state.sortDir === 'asc' ? -1 : 1;
            if (av > bv) return state.sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }

    /* ==========================================
       RENDER: USERS TABLE
       ========================================== */
    function renderUsers() {
        const body = $('#usersBody');
        const empty = $('#usersEmpty');
        const list = applyFilters();

        if (!list.length) {
            body.innerHTML = '';
            empty.hidden = false;
            $('#tableInfo').textContent = 'No users';
            return;
        }
        empty.hidden = true;

        body.innerHTML = list.map((u) => {
            const isSelected = state.selected.has(u.id);
            const statusLabel = u.status === 'active' ? 'Active'
                : u.status === 'invited' ? 'Invited'
                : u.status === 'locked' ? 'Locked'
                : u.status === 'suspended' ? 'Suspended'
                : u.status === 'expired' ? 'Expired' : u.status;
            const tempBadge = u.isTemp ? `<span class="status-pill temp" style="margin-left:6px"><span class="dot"></span> Temp · expires in 2d</span>` : '';
            return `
                <tr tabindex="0" data-user-id="${u.id}" class="${isSelected ? 'selected' : ''}">
                    <td>
                        <label class="checkbox" onclick="event.stopPropagation()">
                            <input type="checkbox" class="row-check" data-id="${u.id}" ${isSelected ? 'checked' : ''} aria-label="Select ${u.name}">
                            <span></span>
                        </label>
                    </td>
                    <td>
                        <div class="guest-cell">
                            <span class="guest-avatar">${u.initials}</span>
                            <div>
                                <div>${u.name}${u.isMe ? ' <span class="muted">(you)</span>' : ''}</div>
                                <div class="muted" style="font-size:0.72rem">${u.email}</div>
                            </div>
                        </div>
                    </td>
                    <td class="hide-md muted">${u.email}</td>
                    <td>${u.role}${tempBadge}</td>
                    <td><span class="status-pill ${u.status}"><span class="dot"></span> ${statusLabel}</span></td>
                    <td>${u.twofa ? `<span class="twofa-on">✓ Enabled</span>` : `<span class="twofa-off">⚠ Not set</span>`}</td>
                    <td class="hide-sm muted">${u.lastActive}</td>
                    <td class="col-actions">
                        <button class="row-menu-btn" aria-label="More options for ${u.name}" data-user-menu="${u.id}" onclick="event.stopPropagation()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        $('#tableInfo').textContent = `Showing 1–${list.length} of ${list.length}`;

        // Row click
        $$('tr[data-user-id]', body).forEach((row) => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('.row-check') || e.target.closest('.row-menu-btn')) return;
                openUserDrawer(row.dataset.userId);
            });
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); openUserDrawer(row.dataset.userId); }
                if (e.key === 'ArrowDown') { e.preventDefault(); row.nextElementSibling?.focus(); }
                if (e.key === 'ArrowUp') { e.preventDefault(); row.previousElementSibling?.focus(); }
            });
        });

        // Checkboxes
        $$('.row-check', body).forEach((cb) => {
            cb.addEventListener('change', () => {
                const id = cb.dataset.id;
                if (cb.checked) state.selected.add(id);
                else state.selected.delete(id);
                cb.closest('tr').classList.toggle('selected', cb.checked);
                updateBulkBar();
            });
        });

        // Row menus
        $$('[data-user-menu]', body).forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openRowMenu(btn.dataset.userMenu, btn);
            });
        });

        updateBulkBar();
    }

    function openRowMenu(id, anchor) {
        closeAllMenus();
        const u = USERS.find((x) => x.id === id);
        if (!u) return;

        const menu = document.createElement('ul');
        menu.className = 'chip-menu';
        menu.style.cssText = 'position:fixed;z-index:200;min-width:200px';
        const rect = anchor.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.right - 200}px`;

        const isGuest = u.role === 'Guest';
        const isMe = u.isMe;
        const isLastSuper = u.role === 'Super admin' && USERS.filter((x) => x.role === 'Super admin' && x.status === 'active').length <= 1;

        menu.innerHTML = `
            <li><button data-menu="view">View details</button></li>
            ${!isGuest ? `
                <li><button data-menu="change-role" ${isMe || isLastSuper ? 'disabled title="You cannot change your own role or the last Super admin"' : ''}>Change role</button></li>
            ` : ''}
            <li><button data-menu="reset-password" ${isGuest ? 'disabled title="Guest accounts do not have passwords"' : ''}>Reset password</button></li>
            <li><button data-menu="reset-2fa" ${!u.twofa ? 'disabled' : ''}>Reset 2FA</button></li>
            ${u.status === 'locked' ? `<li><button data-menu="unlock" data-role="super-admin">Unlock account</button></li>` : ''}
            ${!isGuest ? `
                <li><button data-menu="suspend" ${isMe || isLastSuper ? 'disabled' : ''}>${u.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button></li>
            ` : ''}
            <li><button data-menu="delete" data-role="super-admin" ${isMe || isLastSuper ? 'disabled' : ''}>Delete user</button></li>
        `;

        document.body.appendChild(menu);
        if (state.role !== 'super-admin') {
            menu.querySelectorAll('[data-menu="change-role"], [data-menu="suspend"], [data-menu="delete"]').forEach((b) => {
                b.disabled = true; b.title = 'Super admin only';
            });
        }

        menu.querySelectorAll('button').forEach((b) => {
            b.addEventListener('click', () => {
                closeAllMenus();
                const action = b.dataset.menu;
                state.actionTarget = u;
                if (action === 'view') openUserDrawer(id);
                else if (action === 'change-role') openConfirm('change-role', changeRoleMarkup(u), 'CHANGE');
                else if (action === 'reset-password') openConfirm('reset-password', `Send password reset to <strong>${u.name}</strong>?`, 'RESET');
                else if (action === 'reset-2fa') openConfirm('reset-2fa', `Reset 2FA for <strong>${u.name}</strong>? They will need to set it up again.`, 'RESET');
                else if (action === 'unlock') openConfirm('unlock', `Unlock account for <strong>${u.name}</strong>?`, 'UNLOCK');
                else if (action === 'suspend') {
                    if (u.status === 'suspended') { openConfirm('reactivate', `Reactivate <strong>${esc(u.name)}</strong>? They will be able to sign in again.`, 'REACTIVATE'); return; }
                    openConfirm('suspend', `Suspend <strong>${u.name}</strong>? They will be signed out and cannot sign in.`, 'SUSPEND');
                }
                else if (action === 'delete') openConfirm('delete', `Delete <strong>${u.name}</strong>? This will remove all sessions and cannot be undone. Consider suspending instead.`, 'DELETE');
            });
        });

        setTimeout(() => document.addEventListener('click', closeAllMenus, { once: true }), 0);
    }

    function closeAllMenus() {
        document.querySelectorAll('.chip-menu:not([hidden])').forEach((m) => {
            if (m.parentElement === document.body) m.remove();
        });
    }

    /* ==========================================
       FILTER EVENTS
       ========================================== */
    $('#filterSearch')?.addEventListener('input', (e) => {
        state.search = e.target.value.trim();
        $('#clearFilters').hidden = !hasActiveFilters();
        renderUsers();
    });

    function hasActiveFilters() {
        return state.search || state.filterRole !== 'all' || state.filterStatus !== 'all'
            || state.filter2fa !== 'all' || state.filterLastActive !== 'all';
    }

    $$('.chip-select').forEach((wrap) => {
        const chip = wrap.querySelector('.chip');
        const menu = wrap.querySelector('.chip-menu');
        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasOpen = !menu.hidden;
            $$('.chip-menu').forEach((m) => { if (m.parentElement !== document.body) m.hidden = true; });
            menu.hidden = wasOpen;
            chip.setAttribute('aria-expanded', String(!wasOpen));
        });
        menu.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.filter;
                state['filter' + key.charAt(0).toUpperCase() + key.slice(1)] = btn.dataset.value;
                menu.hidden = true;
                chip.classList.toggle('active', btn.dataset.value !== 'all');
                $('#clearFilters').hidden = !hasActiveFilters();
                renderUsers();
            });
        });
    });

    document.addEventListener('click', () => {
        $$('.chip-menu').forEach((m) => { if (m.parentElement !== document.body) m.hidden = true; });
    });

    $('#clearFilters')?.addEventListener('click', clearFilters);
    $('#emptyClearBtn')?.addEventListener('click', clearFilters);

    function clearFilters() {
        state.search = ''; state.filterRole = 'all'; state.filterStatus = 'all';
        state.filter2fa = 'all'; state.filterLastActive = 'all';
        $('#filterSearch').value = '';
        $$('.chip').forEach((c) => c.classList.remove('active'));
        $('#clearFilters').hidden = true;
        renderUsers();
    }

    /* ==========================================
       SAVED VIEWS
       ========================================== */
    $$('.saved-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            state.savedView = tab.dataset.view;
            $$('.saved-tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            renderUsers();
        });
    });

    /* ==========================================
       SORTING
       ========================================== */
    $$('.users-table th.sortable').forEach((th) => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
            else { state.sortKey = key; state.sortDir = 'asc'; }
            $$('.users-table th.sortable').forEach((h) => h.classList.remove('sort-asc', 'sort-desc'));
            th.classList.add(`sort-${state.sortDir}`);
            renderUsers();
        });
    });

    /* ==========================================
       SELECT ALL + BULK BAR
       ========================================== */
    $('#selectAll')?.addEventListener('change', (e) => {
        const list = applyFilters();
        if (e.target.checked) list.forEach((u) => state.selected.add(u.id));
        else state.selected.clear();
        renderUsers();
    });

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
        $$('.users-table tbody tr').forEach((tr) => tr.classList.remove('selected'));
        updateBulkBar();
    });

    $('#bulkExport')?.addEventListener('click', () => {
        exportUsers(USERS.filter((u) => state.selected.has(u.id)));
        toast('success', 'Exported', `${state.selected.size} user(s) exported as CSV.`);
        $('#bulkClear').click();
    });

    $('#bulkRemind')?.addEventListener('click', () => {
        toast('success', 'Reminders sent', `${state.selected.size} invite reminder(s) queued.`);
        $('#bulkClear').click();
    });

    $('#bulkSuspend')?.addEventListener('click', (e) => {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            toast('error', 'Not allowed', 'Super admin access required.');
            return;
        }
        const n = state.selected.size;
        openConfirm('bulk-suspend', `Suspend <strong>${n}</strong> user(s)? They will be signed out and cannot sign in.`, 'SUSPEND');
    });

    /* ==========================================
       ROLE CARDS
       ========================================== */
    function countFor(label) { return USERS.filter((u) => u.role === label).length; }

    function renderRoles() {
        const grid = $('#roleGrid');
        grid.innerHTML = ROLES.map((r) => `
            <div class="role-card">
                <div class="role-card-head">
                    <span class="role-card-name">${r.name}</span>
                    <span class="role-card-count">${countFor(r.name)} user${countFor(r.name) === 1 ? '' : 's'}</span>
                </div>
                <p class="role-card-desc">${r.desc}</p>
                <button class="btn btn-outline btn-sm" data-view-perms="${r.name}">View permissions</button>
            </div>
        `).join('');

        $$('[data-view-perms]').forEach((b) => {
            b.addEventListener('click', () => {
                $$('.tab').forEach((t) => {
                    const active = t.dataset.tab === 'permissions';
                    t.classList.toggle('active', active);
                    t.setAttribute('aria-selected', String(active));
                });
                $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === 'permissions'));
                toast('success', 'Permissions shown', `Viewing matrix for ${b.dataset.viewPerms}.`);
            });
        });
    }
    renderRoles();

    /* ==========================================
       PERMISSION MATRIX
       ========================================== */
    function renderMatrix() {
        const body = $('#matrixBody');
        let lastGroup = '';
        let html = '';
        state.matrix.forEach((perm) => {
            if (perm.group !== lastGroup) {
                lastGroup = perm.group;
                html += `<tr class="group-header"><th colspan="${ROLE_COLUMNS.length + 1}" scope="colgroup">${perm.group}</th></tr>`;
            }
            html += `
                <tr>
                    <th scope="row">
                        ${perm.label}
                        ${perm.sensitive ? '<span class="twofa-off" title="Sensitive permission">⚠</span>' : ''}
                    </th>
                    ${ROLE_COLUMNS.map((role) => {
                        const granted = perm.roles[role];
                        const isLocked = role === 'Super admin';
                        const isSensitive = perm.sensitive && granted;
                        return `
                            <td>
                                <button
                                    class="perm-check ${granted ? 'granted' : ''} ${isLocked ? 'locked' : ''} ${isSensitive ? 'sensitive' : ''}"
                                    data-perm="${perm.key}"
                                    data-role="${role}"
                                    ${isLocked ? 'aria-disabled="true" title="Super admin permissions are always granted"' : ''}
                                    aria-label="${perm.label} for ${role}: ${granted ? 'granted' : 'not granted'}">
                                    ${granted ? '✓' : '—'}
                                </button>
                                <span class="perm-label">${granted ? 'Allowed' : 'Denied'}</span>
                            </td>
                        `;
                    }).join('')}
                </tr>
            `;
        });
        body.innerHTML = html;

        $$('.perm-check', body).forEach((btn) => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('locked')) {
                    toast('error', 'Locked', 'Super admin permissions cannot be revoked.');
                    return;
                }
                const permKey = btn.dataset.perm;
                const role = btn.dataset.role;
                const perm = state.matrix.find((p) => p.key === permKey);
                if (!perm) return;
                perm.roles[role] = !perm.roles[role];
                btn.classList.toggle('granted', perm.roles[role]);
                btn.textContent = perm.roles[role] ? '✓' : '—';
                btn.classList.toggle('sensitive', perm.sensitive && perm.roles[role]);
                btn.nextElementSibling.textContent = perm.roles[role] ? 'Allowed' : 'Denied';
                checkMatrixDirty();
            });
        });
    }

    function checkMatrixDirty() {
        const dirty = JSON.stringify(state.matrix) !== JSON.stringify(PERMISSIONS);
        $('#matrixDirtyHint').textContent = dirty ? 'You have unsaved changes to permissions' : 'No changes';
        $('#matrixDirtyHint').classList.toggle('dirty', dirty);
        $('#matrixPreview').disabled = !dirty;
        $('#matrixDiscard').disabled = !dirty;
    }

    $('#matrixDiscard')?.addEventListener('click', () => {
        state.matrix = JSON.parse(JSON.stringify(PERMISSIONS));
        renderMatrix();
        checkMatrixDirty();
        toast('success', 'Discarded', 'Permission changes have been reverted.');
    });

    $('#matrixPreview')?.addEventListener('click', () => {
        // Build impact list — who is affected
        const affected = [];
        ROLE_COLUMNS.forEach((role) => {
            const count = USERS.filter((u) => u.role === role).length;
            const changes = state.matrix
                .map((perm, i) => ({ perm, changed: perm.roles[role] !== PERMISSIONS[i].roles[role] }))
                .filter((x) => x.changed);
            if (changes.length && count > 0) {
                affected.push({
                    role, count,
                    changes: changes.map((c) => `${c.perm.roles[role] ? '+ Grant' : '− Revoke'} ${c.perm.label}`)
                });
            }
        });
        if (!affected.length) {
            toast('error', 'No changes', 'Nothing to preview.');
            return;
        }
        $('#impactList').innerHTML = affected.map((a) => `
            <li>
                <strong>${a.role} · ${a.count} user${a.count === 1 ? '' : 's'} affected</strong><br>
                ${a.changes.join('<br>')}
            </li>
        `).join('');
        openModal($('#impactOverlay'));
    });

    $('#impactClose')?.addEventListener('click', () => closeModal($('#impactOverlay')));
    $('#impactCancel')?.addEventListener('click', () => closeModal($('#impactOverlay')));
    $('#impactOverlay')?.addEventListener('click', (e) => { if (e.target === $('#impactOverlay')) closeModal($('#impactOverlay')); });

    $('#impactConfirm')?.addEventListener('click', () => {
        closeModal($('#impactOverlay'));
        openConfirm('save-permissions',
            'Save permission changes? This affects every page that uses permissions.',
            'SAVE');
    });

    renderMatrix();
    checkMatrixDirty();

    /* ==========================================
       ACCESS REQUESTS
       ========================================== */
    function renderRequests() {
        const list = $('#requestList');
        list.innerHTML = !ACCESS_REQUESTS.length ? '<li class="muted" style="padding:24px;text-align:center">No pending access requests.</li>' : ACCESS_REQUESTS.map((r) => `
            <li class="request-item">
                <span class="request-avatar">${r.initials}</span>
                <div class="request-body">
                    <div class="request-title">${r.requester} · ${r.role}</div>
                    <div class="request-meta">
                        Requesting <strong>${r.requested}</strong> for <strong>${r.duration}</strong>.<br>
                        <em>Reason:</em> ${r.reason}
                    </div>
                </div>
                <div class="request-actions">
                    <button class="btn btn-outline btn-sm" data-req="${r.id}" data-action="decline">Decline</button>
                    <button class="btn btn-primary btn-sm" data-req="${r.id}" data-action="approve" data-role="super-admin">Approve</button>
                </div>
            </li>
        `).join('');

        $$('[data-req]', list).forEach((b) => {
            b.addEventListener('click', (e) => {
                const id = Number(b.dataset.req);
                const action = b.dataset.action;
                const req = ACCESS_REQUESTS.find((x) => x.id === id);
                if (action === 'decline') {
                    openConfirm('decline-request', `Decline ${req.requester}'s access request?`, 'DECLINE');
                } else {
                    if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
                        toast('error', 'Not allowed', 'Super admin access required.');
                        return;
                    }
                    openConfirm('approve-request', `Approve ${req.requester}'s request for ${req.requested}?`, 'APPROVE');
                }
            });
        });

        $('#reqTabCount').textContent = ACCESS_REQUESTS.length;
    }
    renderRequests();

    /* ==========================================
       ROLE HISTORY
       ========================================== */
    function renderHistory() {
        const body = $('#historyBody');
        body.innerHTML = !ROLE_HISTORY.length ? '<tr><td colspan="6" class="muted" style="padding:24px;text-align:center">No role changes yet.</td></tr>' : ROLE_HISTORY.map((h) => `
            <tr>
                <td>${h.admin}</td>
                <td>${h.target}</td>
                <td class="hide-sm muted">${h.oldRole}</td>
                <td>${h.newRole}</td>
                <td class="hide-md muted">${h.reason}</td>
                <td class="hide-sm muted">${h.time}</td>
            </tr>
        `).join('');
    }
    renderHistory();

    /* ==========================================
       USER DRAWER
       ========================================== */
    const userDrawer = $('#userDrawer');
    const userDrawerOverlay = $('#userDrawerOverlay');

    function openUserDrawer(id) {
        const u = USERS.find((x) => x.id === id);
        if (!u) return;
        state.activeUser = u;

        $('#drawerAvatar').textContent = u.initials;
        $('#drawerTitle').textContent = u.name;
        $('#drawerSub').textContent = `${u.role} · ${u.email}`;
        const statusEl = $('#drawerStatusPill');
        statusEl.className = `status-pill ${u.status}`;
        statusEl.innerHTML = `<span class="dot"></span> ${u.status.charAt(0).toUpperCase() + u.status.slice(1)}`;

        $('#pRole').textContent = u.role;
        $('#pStatus').textContent = u.status.charAt(0).toUpperCase() + u.status.slice(1);
        $('#p2FA').textContent = u.twofa ? 'Enabled' : 'Not set';
        $('#pLastActive').textContent = u.lastActive;
        $('#pEmail').textContent = u.email;

        if (u.role === 'Guest' && u.guestId) {
            $('#pGuestSection').hidden = false;
            $('#pGuestId').textContent = u.guestId;
            $('#pRegId').textContent = u.regId;
            $('#pRoom').textContent = u.room || '—';
            $('#pCheckout').textContent = u.checkout;
            $('#pOverdue').textContent = `${u.overdueDays} days`;
        } else {
            $('#pGuestSection').hidden = true;
        }

        // Effective permissions
        const rolePerms = PERMISSIONS.map((p) => ({ label: p.label, granted: p.roles[u.role] || false, sensitive: p.sensitive }));
        $('#pPermList').innerHTML = rolePerms.map((p) => `
            <li>
                <span class="perm-name">${p.label}</span>
                <span class="perm-state ${p.granted ? (p.sensitive ? 'sensitive' : 'granted') : 'denied'}">
                    ${p.granted ? (p.sensitive ? '⚠ Sensitive' : '✓ Granted') : '— Denied'}
                </span>
            </li>
        `).join('');

        // Activity + History
        $('#pActivity').innerHTML = `
            <li><span class="history-dot"></span><div><p><strong>${u.name}</strong> signed in from Chrome · macOS</p><span>${u.lastActive}</span></div></li>
            <li><span class="history-dot"></span><div><p><strong>${u.name}</strong> updated profile</p><span>Yesterday</span></div></li>
            <li><span class="history-dot"></span><div><p><strong>${u.name}</strong> password changed</p><span>Oct 2, 2026</span></div></li>
        `;
        $('#pHistory').innerHTML = ROLE_HISTORY.filter((h) => h.target === u.name).slice(0, 5).map((h) => `
            <li><span class="history-dot"></span><div><p><strong>${h.admin}</strong> changed role from <em>${h.oldRole}</em> to <em>${h.newRole}</em></p><span>${h.time} · ${h.reason}</span></div></li>
        `).join('') || '<li style="color:var(--text-muted);font-size:0.8rem">No role history for this user.</li>';

        userDrawer.hidden = false;
        userDrawerOverlay.hidden = false;
        requestAnimationFrame(() => {
            userDrawer.classList.add('open');
            userDrawerOverlay.classList.add('open');
        });
        document.body.style.overflow = 'hidden';
    }

    function closeUserDrawer() {
        userDrawer.classList.remove('open');
        userDrawerOverlay.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => { userDrawer.hidden = true; userDrawerOverlay.hidden = true; }, 250);
    }
    $('#drawerClose')?.addEventListener('click', closeUserDrawer);
    userDrawerOverlay?.addEventListener('click', closeUserDrawer);

    // Drawer tabs
    $$('#userDrawer .drawer-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.dtab;
            $$('#userDrawer .drawer-tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            $$('#userDrawer .drawer-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === target));
        });
    });

    // Security actions
    $('#resetPasswordBtn')?.addEventListener('click', () => openConfirm('reset-password', `Send password reset to <strong>${state.activeUser.name}</strong>?`, 'RESET'));
    $('#reset2faBtn')?.addEventListener('click', () => openConfirm('reset-2fa', `Reset 2FA for <strong>${state.activeUser.name}</strong>?`, 'RESET'));
    $('#unlockBtn')?.addEventListener('click', (e) => {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            toast('error', 'Not allowed', 'Super admin access required.');
            return;
        }
        openConfirm('unlock', `Unlock account for <strong>${state.activeUser.name}</strong>?`, 'UNLOCK');
    });
    $('#signOutAllBtn')?.addEventListener('click', (e) => {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            toast('error', 'Not allowed', 'Super admin access required.');
            return;
        }
        openConfirm('signout-all', `Sign out <strong>${state.activeUser.name}</strong> from all devices?`, 'SIGNOUT');
    });

    $('#elevApply')?.addEventListener('click', (e) => {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            toast('error', 'Not allowed', 'Super admin access required.');
            return;
        }
        openConfirm('apply-elevation', `Grant temporary ${$('#elevRole').value} access until ${$('#elevUntil').value}?`, 'GRANT');
    });

    /* ==========================================
       CREATE USER / ADMIN STEPPER
       ========================================== */
    const createDrawer = $('#createDrawer');
    const createOverlay = $('#createOverlay');
    let createStep = 1;
    let createMode = 'user';

    function openCreate(mode) {
        createMode = mode;
        createStep = 1;
        $('#createTitle').textContent = mode === 'admin' ? 'Create admin' : 'Create user';
        $('#cuName').value = '';
        $('#cuEmail').value = '';
        $('#cuStart').value = new Date().toISOString().slice(0, 10);
        $('#cuExpiry').value = new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);
        if ($('#cuTempPw')) $('#cuTempPw').checked = true;
        resetCreateResult();
        $('#cuRole').value = 'Guest';
        if (mode === 'admin') {
            // Pre-fill role options only for admin
            $('#cuRole').innerHTML = '<option>Support admin</option><option>Super admin</option>';
            $('#cuRole').value = 'Support admin';
        } else {
            $('#cuRole').innerHTML = '<option>Guest</option><option>Front desk</option><option>Housekeeping</option><option>Maintenance</option><option>Manager</option>';
            $('#cuRole').value = 'Guest';
        }
        goToCreateStep(1);
        createDrawer.hidden = false;
        createOverlay.hidden = false;
        requestAnimationFrame(() => {
            createDrawer.classList.add('open');
            createOverlay.classList.add('open');
        });
        document.body.style.overflow = 'hidden';
        setTimeout(() => $('#cuName').focus(), 100);
    }

    function closeCreate() {
        createDrawer.classList.remove('open');
        createOverlay.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => { createDrawer.hidden = true; createOverlay.hidden = true; }, 250);
    }

    function goToCreateStep(n) {
        createStep = n;
        $$('#createDrawer .stepper-item').forEach((it) => {
            const i = Number(it.dataset.step);
            it.classList.toggle('active', i === n);
            it.classList.toggle('done', i < n);
        });
        $$('#createDrawer .wizard-step').forEach((s) => s.classList.toggle('active', Number(s.dataset.wstep) === n));
        $('#createSub').textContent = `Step ${n} of 3 · ${['Details', 'Access', 'Review'][n - 1]}`;
        $('#createBack').hidden = n === 1;
        $('#createNext').hidden = n === 3;
        $('#createSubmit').hidden = n !== 3;
        if (n === 3) buildSummary();
    }

    function buildSummary() {
        const role = $('#cuRole').value;
        const perms = PERMISSIONS.filter((p) => p.roles[role]).map((p) => ({
            label: p.label, sensitive: p.sensitive
        }));
        $('#cuSummaryList').innerHTML = perms.length
            ? perms.map((p) => `
                <li>
                    <span class="perm-name">${p.label}</span>
                    <span class="perm-state ${p.sensitive ? 'sensitive' : 'granted'}">${p.sensitive ? '⚠ Sensitive' : '✓ Granted'}</span>
                </li>
            `).join('')
            : '<li style="color:var(--text-muted);font-size:0.8rem">This role has no permissions beyond basic access.</li>';
        const how = $('#cuSummaryHow');
        if (how) how.textContent = $('#cuTempPw') && $('#cuTempPw').checked
            ? 'You will see a temporary password to share with them, once.'
            : 'They will get an email invite to set their own password.';
        $('#cuSummaryExpiry').textContent = new Date($('#cuExpiry').value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    $('#createUserBtn')?.addEventListener('click', () => openCreate('user'));
    $('#createAdminBtn')?.addEventListener('click', (e) => {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            toast('error', 'Not allowed', 'Super admin access required.');
            return;
        }
        openCreate('admin');
    });
    $('#createClose')?.addEventListener('click', closeCreate);
    $('#createCancel')?.addEventListener('click', closeCreate);
    createOverlay?.addEventListener('click', closeCreate);

    $('#createBack')?.addEventListener('click', () => { if (createStep > 1) goToCreateStep(createStep - 1); });
    $('#createNext')?.addEventListener('click', () => {
        if (createStep === 1) {
            const name = $('#cuName').value.trim();
            const email = $('#cuEmail').value.trim();
            let ok = true;
            if (!name) { $('#cuNameErr').textContent = 'Full name is required.'; ok = false; }
            else $('#cuNameErr').textContent = '';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('#cuEmailErr').textContent = 'Enter a valid email.'; ok = false; }
            else $('#cuEmailErr').textContent = '';
            if (!ok) return;
        }
        if (createStep < 3) goToCreateStep(createStep + 1);
    });

    $('#createSubmit')?.addEventListener('click', async () => {
        const btn = $('#createSubmit');
        const spinner = btn.querySelector('.btn-spinner');
        const roleLabel = $('#cuRole').value;
        const email = $('#cuEmail').value.trim();
        const useTemp = !!($('#cuTempPw') && $('#cuTempPw').checked);
        const tempPassword = useTemp ? makeTempPassword() : null;

        btn.disabled = true;
        spinner.hidden = false;
        try {
            await callAdminFunction({
                action: 'create',
                email,
                full_name: $('#cuName').value.trim(),
                role: ROLE_LABEL_TO_KEY[roleLabel],
                expires_at: $('#cuExpiry').value || null,
                temp_password: tempPassword,
                redirect_to: window.location.origin + '/update-password.html'
            });
            showCreateResult({ email, name: $('#cuName').value.trim(), role: roleLabel, tempPassword });
            await refreshAll();
        } catch (err) {
            toast('error', 'Could not create the account', esc(err.message));
        } finally {
            btn.disabled = false;
            spinner.hidden = true;
        }
    });

    function makeTempPassword() {
        const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%&*'];
        const all = sets.join('');
        const rand = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
        const out = sets.map((chars) => chars[rand(chars.length)]);
        while (out.length < 14) out.push(all[rand(all.length)]);
        for (let i = out.length - 1; i > 0; i--) { const j = rand(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
        return out.join('');
    }

    function resetCreateResult() {
        const panel = $('#cuResult'); if (panel) panel.remove();
        const cancel = $('#createCancel'); if (cancel) cancel.textContent = 'Cancel';
    }

    function showCreateResult({ email, name, role, tempPassword }) {
        $$('#createDrawer .wizard-step').forEach((st) => st.classList.remove('active'));
        $$('#createDrawer .stepper-item').forEach((it) => it.classList.add('done'));
        $('#createBack').hidden = true;
        $('#createNext').hidden = true;
        $('#createSubmit').hidden = true;
        $('#createCancel').textContent = 'Done';
        $('#createSub').textContent = 'Account created';

        const panel = document.createElement('div');
        panel.id = 'cuResult';
        panel.innerHTML = `
            <div class="summary-block">
                <h4>${esc(name)} is ready</h4>
                <p class="summary-note">Role: <strong>${esc(role)}</strong><br>Email: <strong>${esc(email)}</strong></p>
                ${tempPassword
                    ? `<p class="summary-note" style="margin-top:12px">Temporary password (shown only once):</p>
                       <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
                           <code id="cuTempValue" style="flex:1;padding:10px 12px;border:1px dashed #cfccc1;border-radius:8px;background:#faf9f5;font-size:.95rem;user-select:all">${esc(tempPassword)}</code>
                           <button type="button" class="btn btn-outline btn-sm" id="cuCopyBtn">Copy</button>
                       </div>
                       <p class="summary-note" style="margin-top:10px">Share it privately. Ask them to change it after their first sign-in.</p>`
                    : `<p class="summary-note" style="margin-top:12px">An invite email was sent. They set their own password from the link.</p>`}
            </div>`;
        $('#createDrawer .drawer-body').appendChild(panel);

        const copy = $('#cuCopyBtn');
        if (copy) copy.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(tempPassword); copy.textContent = 'Copied'; } catch (e) { copy.textContent = 'Press Ctrl+C'; }
        });
    }

    /* ==========================================
       STEP-UP MODAL
       ========================================== */
    const stepupOverlay = $('#stepupOverlay');

    function openStepup(onVerify) {
        state.stepupCallback = onVerify;
        $('#stepupPassword').value = '';
        $('#stepupCode').value = '';
        $('#stepupPasswordErr').textContent = '';
        $('#stepupCodeErr').textContent = '';
        openModal(stepupOverlay);
        updateStepupCodeVisibility();
        setTimeout(() => $('#stepupPassword').focus(), 100);
    }
    function closeStepup() { closeModal(stepupOverlay); }

    $('#stepupClose')?.addEventListener('click', closeStepup);
    $('#stepupCancel')?.addEventListener('click', closeStepup);
    stepupOverlay?.addEventListener('click', (e) => { if (e.target === stepupOverlay) closeStepup(); });

    async function getVerifiedTotp() {
        try {
            const { data } = await db.auth.mfa.listFactors();
            return (data && data.totp && data.totp.find((f) => f.status === 'verified')) || null;
        } catch (e) { return null; }
    }

    // The 6-digit code is only asked for when this admin has an authenticator app set up
    async function updateStepupCodeVisibility() {
        const group = $('#stepupCode') && $('#stepupCode').closest('.form-group');
        if (group) group.hidden = !(await getVerifiedTotp());
    }

    $('#stepupVerify')?.addEventListener('click', async () => {
        const btn = $('#stepupVerify');
        const pass = $('#stepupPassword').value;
        const code = $('#stepupCode').value.trim();
        $('#stepupPasswordErr').textContent = '';
        $('#stepupCodeErr').textContent = '';
        if (!pass) { $('#stepupPasswordErr').textContent = 'Enter your password.'; return; }

        btn.disabled = true;
        try {
            const { error: pwErr } = await db.auth.signInWithPassword({ email: state.me.email, password: pass });
            if (pwErr) { $('#stepupPasswordErr').textContent = 'That password is not correct.'; return; }

            const totp = await getVerifiedTotp();
            if (totp) {
                if (!/^\d{6}$/.test(code)) { $('#stepupCodeErr').textContent = 'Enter the 6-digit code from your authenticator app.'; return; }
                const ch = await db.auth.mfa.challenge({ factorId: totp.id });
                if (ch.error) throw ch.error;
                const vr = await db.auth.mfa.verify({ factorId: totp.id, challengeId: ch.data.id, code });
                if (vr.error) { $('#stepupCodeErr').textContent = 'That code is not valid.'; return; }
            }
            const done = state.stepupCallback;
            closeStepup();
            if (done) done();
        } catch (err) {
            $('#stepupPasswordErr').textContent = err.message || 'Could not verify. Please try again.';
        } finally {
            btn.disabled = false;
        }
    });

    /* ==========================================
       CONFIRM MODAL
       ========================================== */
    const confirmOverlay = $('#confirmOverlay');

    function openConfirm(action, text, keyword = 'CONFIRM') {
        state.confirmCtx = { action, keyword };
        $('#confirmTitle').textContent = action.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        $('#confirmText').innerHTML = text;
        $('#confirmWordPrompt').textContent = keyword;
        $('#confirmWord').value = '';
        $('#confirmReason').value = '';
        $('#confirmWordErr').textContent = '';
        $('#confirmReasonErr').textContent = '';
        openModal(confirmOverlay);
        setTimeout(() => $('#confirmWord').focus(), 100);
    }
    function closeConfirm() { closeModal(confirmOverlay); }

    $('#confirmClose')?.addEventListener('click', closeConfirm);
    $('#confirmCancel')?.addEventListener('click', closeConfirm);
    confirmOverlay?.addEventListener('click', (e) => { if (e.target === confirmOverlay) closeConfirm(); });

    $('#confirmSubmit')?.addEventListener('click', () => {
        const word = $('#confirmWord').value.trim();
        const reason = $('#confirmReason').value.trim();
        let ok = true;
        if (word !== state.confirmCtx.keyword) {
            $('#confirmWordErr').textContent = `Please type "${state.confirmCtx.keyword}" exactly.`;
            ok = false;
        }
        if (reason.length < 5) {
            $('#confirmReasonErr').textContent = 'Please provide a reason (min 5 characters).';
            ok = false;
        }
        if (!ok) return;

        const { action } = state.confirmCtx;
        const target = state.actionTarget || state.activeUser;
        const picker = $('#crNewRole');
        const newRoleKey = picker ? picker.value : null;
        closeConfirm();
        state.actionTarget = null;

        const run = () => runAdminAction(action, { target, reason, newRoleKey });
        const sensitive = ['change-role', 'delete', 'suspend', 'bulk-suspend'];
        if (sensitive.includes(action)) openStepup(run);
        else run();
    });

    /* ==========================================
       DATABASE: load + admin actions
       ========================================== */
    async function callAdminFunction(body) {
        const { data, error } = await db.functions.invoke('admin-users', { body });
        if (error) {
            let message = error.message;
            try { const detail = await error.context.json(); if (detail && detail.error) message = detail.error; } catch (e) { /* keep default */ }
            throw new Error(message);
        }
        if (data && data.error) throw new Error(data.error);
        return data;
    }

    function fmtLast(d) {
        const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        if (new Date().toDateString() === d.toDateString()) return 'Today · ' + time;
        if (Date.now() - d.getTime() < 2 * 86400000) return 'Yesterday · ' + time;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + time;
    }
    function lastKey(d) {
        if (!d) return 'never';
        const days = (Date.now() - d.getTime()) / 86400000;
        return days < 2 ? 'today' : days < 8 ? 'week' : days < 31 ? 'month' : 'older';
    }

    function mapUser(r) {
        const name = r.full_name || r.email || 'Unnamed';
        const last = r.last_sign_in_at ? new Date(r.last_sign_in_at) : null;
        return {
            id: r.id, name, email: r.email || '',
            role: ROLE_KEY_TO_LABEL[r.role] || r.role,
            status: r.status || 'active',
            twofa: !!r.twofa,
            lastActive: last ? fmtLast(last) : '—',
            lastActiveKey: lastKey(last),
            initials: initials(name),
            isMe: !!(state.me && r.id === state.me.id),
            guestId: r.guest_id, regId: r.reg_id, room: r.room,
            checkout: '—', overdueDays: 0,
            isTemp: false
        };
    }

    async function loadUsers() {
        const { data, error } = await db.rpc('admin_list_users');
        if (error) { toast('error', 'Could not load users', esc(error.message)); return; }
        USERS.length = 0;
        (data || []).forEach((r) => USERS.push(mapUser(r)));
        state.selected.clear();
        updateSavedCounts();
        renderUsers();
        renderRoles();
    }

    async function loadHistory() {
        const { data } = await db.from('role_history').select('*').order('created_at', { ascending: false }).limit(200);
        ROLE_HISTORY.length = 0;
        (data || []).forEach((h) => ROLE_HISTORY.push({
            admin: h.changed_by_name || 'System',
            target: h.target_name || '—',
            oldRole: ROLE_KEY_TO_LABEL[h.old_role] || h.old_role || '—',
            newRole: ROLE_KEY_TO_LABEL[h.new_role] || h.new_role || '—',
            reason: h.reason || '—',
            time: fmtLast(new Date(h.created_at))
        }));
        renderHistory();
    }

    async function refreshAll() { await Promise.all([loadUsers(), loadHistory()]); }

    function changeRoleMarkup(u) {
        const current = ROLE_LABEL_TO_KEY[u.role];
        const options = Object.entries(ROLE_KEY_TO_LABEL)
            .filter(([key]) => key !== current)
            .map(([key, label]) => `<option value="${key}">${label}</option>`).join('');
        return `Change the role of <strong>${esc(u.name)}</strong> (now ${esc(u.role)}).
            <label style="display:block;margin-top:10px;font-size:.8rem;font-weight:500">New role
                <select id="crNewRole" style="display:block;width:100%;margin-top:6px;padding:9px 11px;border:1px solid #cfccc1;border-radius:8px;font:inherit">${options}</select>
            </label>`;
    }

    async function runAdminAction(action, ctx) {
        const t = ctx.target;
        const redirect = window.location.origin + '/update-password.html';
        try {
            if (action === 'change-role') {
                const { error } = await db.rpc('admin_set_role', { p_target: t.id, p_role: ctx.newRoleKey, p_reason: ctx.reason });
                if (error) throw error;
                toast('success', 'Role changed', `${esc(t.name)} is now ${esc(ROLE_KEY_TO_LABEL[ctx.newRoleKey])}.`);
            } else if (action === 'reset-password') {
                await callAdminFunction({ action: 'reset_password', user_id: t.id, redirect_to: redirect });
                toast('success', 'Password reset sent', 'A reset link was emailed to the user.');
            } else if (action === 'reset-2fa') {
                await callAdminFunction({ action: 'reset_2fa', user_id: t.id });
                toast('success', '2FA reset', 'They must set up two-step verification again.');
            } else if (action === 'unlock' || action === 'reactivate') {
                await callAdminFunction({ action: 'set_status', user_id: t.id, status: 'active' });
                toast('success', 'Account active', `${esc(t.name)} can sign in again.`);
            } else if (action === 'suspend') {
                await callAdminFunction({ action: 'set_status', user_id: t.id, status: 'suspended' });
                toast('success', 'Suspended', `${esc(t.name)} can no longer sign in.`);
            } else if (action === 'bulk-suspend') {
                const ids = [...state.selected].filter((id) => !(state.me && id === state.me.id));
                for (const id of ids) await callAdminFunction({ action: 'set_status', user_id: id, status: 'suspended' });
                toast('success', 'Suspended', `${ids.length} account(s) suspended.`);
            } else if (action === 'delete') {
                await callAdminFunction({ action: 'delete', user_id: t.id });
                toast('success', 'User deleted', 'The account was removed and the action was logged.');
                closeUserDrawer();
            } else {
                toast('error', 'Not available yet', 'This action is not connected to the database yet.');
                return;
            }
            await refreshAll();
        } catch (err) {
            toast('error', 'Action failed', esc(err.message || 'Please try again.'));
        }
    }

    /* ==========================================
       MODAL HELPERS
       ========================================== */
    function openModal(el) {
        el.hidden = false;
        requestAnimationFrame(() => el.classList.add('open'));
        document.body.style.overflow = 'hidden';
    }
    function closeModal(el) {
        el.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => { el.hidden = true; }, 200);
    }

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
       KEYBOARD
       ========================================== */
    document.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
        if (typing && e.key !== 'Escape') return;

        if (e.key === '/') { e.preventDefault(); $('#globalSearch')?.focus(); }
        if (e.key === 'Escape') {
            closeSidebar();
            closeUserDrawer();
            closeCreate();
            closeStepup();
            closeConfirm();
            closeAllMenus();
        }
    });

    /* ==========================================
       EXPORT (real CSV of what is on screen)
       ========================================== */
    function exportUsers(list) {
        const rows = [['Name', 'Email', 'Role', 'Status', '2FA', 'Last active']]
            .concat(list.map((u) => [u.name, u.email, u.role, u.status, u.twofa ? 'Enabled' : 'Not set', u.lastActive]));
        const csv = rows.map((r) => r.map((v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'users.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    }
    $('#exportBtn')?.addEventListener('click', () => {
        const list = applyFilters();
        if (!list.length) { toast('error', 'Nothing to export', 'The list is empty.'); return; }
        exportUsers(list);
        toast('success', 'Export ready', `${list.length} user(s) saved as CSV.`);
    });

    /* ==========================================
       ACCESS CHECK + START-UP
       ========================================== */
    function showAdminGate(title, message, retry) {
        const gate = document.createElement('div');
        gate.style.cssText = 'position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:24px;background:#f1f0ea;font-family:Inter,sans-serif;color:#1b221e';
        gate.innerHTML = `<div style="width:min(440px,100%);padding:40px 32px;text-align:center;background:#fff;border:1px solid #e5e3dc;border-radius:16px;box-shadow:0 16px 40px rgba(20,28,24,.12)">
            <h2 style="font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:500;color:#1b3a2e;margin-bottom:8px"></h2>
            <p style="font-size:.9rem;line-height:1.55;color:#4a554e;margin-bottom:20px"></p>
            <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"></div></div>`;
        gate.querySelector('h2').textContent = title;
        gate.querySelector('p').textContent = message;
        const box = gate.querySelector('div > div');
        const add = (label, primary, onClick) => {
            const b = document.createElement('button');
            b.textContent = label;
            b.style.cssText = 'padding:10px 18px;border-radius:8px;font:inherit;font-size:.85rem;font-weight:600;cursor:pointer;border:1px solid ' + (primary ? '#12291f;background:#1b3a2e;color:#fff' : '#cfccc1;background:#fff;color:#1b221e');
            b.addEventListener('click', onClick);
            box.appendChild(b);
        };
        if (retry) add('Try again', true, () => window.location.reload());
        else add('Go to my dashboard', true, () => { window.location.href = 'client-dashboard.html'; });
        add('Sign out', false, signOutAndLeave);
        document.body.appendChild(gate);
    }

    async function signOutAndLeave() {
        try { localStorage.removeItem('haven_role_cache'); if (db) await db.auth.signOut(); } catch (e) { /* ignore */ }
        window.location.href = 'index.html';
    }
    $$('.nav-item.logout').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); signOutAndLeave(); }));

    async function verifyAdmin() {
        if (!db) { showAdminGate('Cannot connect', 'The connection to the server is not available.', true); return null; }
        const { data: { session } } = await db.auth.getSession();
        if (!session) { window.location.href = 'index.html'; return null; }

        const { data: p, error } = await db.from('profiles').select('*').eq('id', session.user.id).single();
        if (error || !p) { showAdminGate('We could not check your access', 'Please try again. If this keeps happening, contact a Super admin.', true); return null; }

        const expired = p.access_expires_at && new Date(p.access_expires_at) < new Date();
        if (!['super-admin', 'support-admin'].includes(p.role) || p.status === 'suspended' || expired) {
            showAdminGate('Admin area', 'This part of Haven is for administrators only.', false);
            return null;
        }
        const name = p.full_name || 'Admin';
        state.me = { id: session.user.id, email: session.user.email, name, initials: initials(name), role: p.role };
        return p.role;
    }

    async function initAdmin() {
        const role = await verifyAdmin();
        if (!role) return;
        applyRole(role);
        await refreshAll();
    }
    initAdmin();
});