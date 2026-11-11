document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       MOCK DATA — 24 users across all roles
       ========================================== */
    const USERS = [
        { id: 1,  name: 'Sarah Villanueva', email: 'sarah@haven.app',     role: 'Super admin',  status: 'active',     twofa: true,  lastActive: 'Now',                 lastActiveKey: 'today', initials: 'SV', isMe: true },
        { id: 2,  name: 'Ravi Batra',       email: 'ravi@haven.app',      role: 'Manager',      status: 'active',     twofa: true,  lastActive: 'Today · 4:30 PM',     lastActiveKey: 'today', initials: 'RB' },
        { id: 3,  name: 'Marco Cruz',       email: 'marco@haven.app',     role: 'Front desk',   status: 'active',     twofa: true,  lastActive: 'Today · 4:21 PM',     lastActiveKey: 'today', initials: 'MC' },
        { id: 4,  name: 'Joy Lim',          email: 'joy@haven.app',       role: 'Housekeeping', status: 'active',     twofa: false, lastActive: 'Today · 3:40 PM',     lastActiveKey: 'today', initials: 'JL' },
        { id: 5,  name: 'Ana Torres',       email: 'ana@haven.app',       role: 'Housekeeping', status: 'active',     twofa: true,  lastActive: 'Today · 1:02 PM',     lastActiveKey: 'today', initials: 'AT' },
        { id: 6,  name: 'Diego Santos',     email: 'diego@haven.app',     role: 'Maintenance',  status: 'active',     twofa: true,  lastActive: 'Today · 11:30 AM',    lastActiveKey: 'today', initials: 'DS' },
        { id: 7,  name: 'Priya Nair',       email: 'priya@haven.app',     role: 'Front desk',   status: 'active',     twofa: true,  lastActive: 'Today · 9:42 AM',     lastActiveKey: 'today', initials: 'PN' },
        { id: 8,  name: 'Omar Haddad',      email: 'omar@haven.app',      role: 'Front desk',   status: 'locked',     twofa: true,  lastActive: 'Oct 6 · 2:15 PM',     lastActiveKey: 'week',  initials: 'OH' },
        { id: 9,  name: 'Hana Kim',         email: 'hana@haven.app',      role: 'Housekeeping', status: 'active',     twofa: true,  lastActive: 'Oct 9 · 6:30 AM',     lastActiveKey: 'week',  initials: 'HK' },
        { id: 10, name: 'Tomás Silva',      email: 'tomas@haven.app',     role: 'Maintenance',  status: 'active',     twofa: false, lastActive: 'Yesterday · 5:15 PM', lastActiveKey: 'today', initials: 'TS' },
        { id: 11, name: 'Kim Reyes',        email: 'kim@haven.app',       role: 'Housekeeping', status: 'active',     twofa: true,  lastActive: 'Yesterday · 8:10 PM', lastActiveKey: 'today', initials: 'KR' },
        { id: 12, name: 'Alex Del Rosario', email: 'alex@haven.app',      role: 'Front desk',   status: 'invited',    twofa: false, lastActive: '—',                   lastActiveKey: 'never', initials: 'AD' },
        { id: 13, name: 'Mei Chen',         email: 'mei@example.com',     role: 'Guest',        status: 'active',     twofa: false, lastActive: 'Today · 3:14 PM',     lastActiveKey: 'today', initials: 'MC' },
        { id: 14, name: 'Sofia Reyes',      email: 'sofia@example.com',   role: 'Guest',        status: 'active',     twofa: false, lastActive: 'Today · 8:02 AM',     lastActiveKey: 'today', initials: 'SR', guestId: 'TR-1001', regId: 'HV-1001', room: '201', checkout: 'Oct 9, 2026', overdueDays: 2 },
        { id: 15, name: 'Aiko Tanaka',      email: 'aiko@example.com',    role: 'Guest',        status: 'active',     twofa: false, lastActive: 'Today · 10:30 AM',    lastActiveKey: 'today', initials: 'AT' },
        { id: 16, name: 'Diego Marquez',    email: 'diego.m@example.com', role: 'Guest',        status: 'active',     twofa: false, lastActive: 'Today · 11:05 AM',    lastActiveKey: 'today', initials: 'DM' },
        { id: 17, name: 'Lena Okafor',      email: 'lena@example.com',    role: 'Guest',        status: 'active',     twofa: false, lastActive: 'Yesterday · 6:42 PM', lastActiveKey: 'today', initials: 'LO' },
        { id: 18, name: 'Ravi Patel',       email: 'ravi.p@example.com',  role: 'Guest',        status: 'active',     twofa: false, lastActive: 'Yesterday · 4:20 PM', lastActiveKey: 'today', initials: 'RP' },
        { id: 19, name: 'Rina Suzuki',      email: 'rina@example.com',    role: 'Guest',        status: 'active',     twofa: false, lastActive: 'Oct 8 · 3:10 PM',     lastActiveKey: 'week',  initials: 'RS' },
        { id: 20, name: 'Carlos Mendez',    email: 'carlos@example.com',  role: 'Guest',        status: 'active',     twofa: false, lastActive: 'Oct 7 · 9:20 AM',     lastActiveKey: 'week',  initials: 'CM' },
        { id: 21, name: 'Support Admin 1',  email: 'support1@haven.app',  role: 'Support admin', status: 'active',    twofa: true,  lastActive: 'Today · 2:00 PM',     lastActiveKey: 'today', initials: 'SA' },
        { id: 22, name: 'Support Admin 2',  email: 'support2@haven.app',  role: 'Support admin', status: 'suspended', twofa: true, lastActive: 'Oct 4 · 11:30 AM',     lastActiveKey: 'week',  initials: 'SA' },
        { id: 23, name: 'Temp Admin · Maya',email: 'maya@haven.app',      role: 'Support admin', status: 'active',    twofa: true,  lastActive: 'Today · 1:00 PM',     lastActiveKey: 'today', initials: 'MA', tempRole: 'Support admin', expiresAt: '2026-10-13T18:00', isTemp: true },
        { id: 24, name: 'Pending Invite · Leo', email: 'leo@haven.app',   role: 'Front desk',   status: 'invited',    twofa: false, lastActive: '—',                   lastActiveKey: 'never', initials: 'LI', inviteExpires: '2 days' }
    ];

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

    const ACCESS_REQUESTS = [
        { id: 1, requester: 'Marco Cruz',  initials: 'MC', role: 'Front desk',   requested: 'Manager access',  duration: '7 days',   reason: 'Covering weekend manager shifts while Ravi is on leave.' },
        { id: 2, requester: 'Joy Lim',     initials: 'JL', role: 'Housekeeping', requested: 'Support admin',   duration: '3 days',   reason: 'Assisting with user onboarding for the new hires this week.' }
    ];

    const ROLE_HISTORY = [
        { admin: 'Sarah Villanueva', target: 'Ravi Batra',      oldRole: 'Front desk',   newRole: 'Manager',       reason: 'Promotion',                     time: 'Oct 8 · 3:15 PM' },
        { admin: 'Sarah Villanueva', target: 'Maya Cruz',       oldRole: '—',            newRole: 'Support admin', reason: 'Temporary elevation · 7 days',  time: 'Oct 6 · 9:00 AM' },
        { admin: 'Sarah Villanueva', target: 'Omar Haddad',     oldRole: 'Front desk',   newRole: 'Front desk (suspended)', reason: 'Policy violation',     time: 'Oct 5 · 4:30 PM' },
        { admin: 'Sarah Villanueva', target: 'Priya Nair',      oldRole: 'Guest',        newRole: 'Front desk',    reason: 'Hired as front desk',           time: 'Oct 3 · 10:12 AM' },
        { admin: 'Sarah Villanueva', target: 'Tomás Silva',     oldRole: 'Guest',        newRole: 'Maintenance',   reason: 'Hired as maintenance',          time: 'Oct 2 · 2:40 PM' },
        { admin: 'Sarah Villanueva', target: 'Kim Reyes',       oldRole: 'Guest',        newRole: 'Housekeeping',  reason: 'Hired as housekeeping',         time: 'Sep 30 · 9:05 AM' },
        { admin: 'Sarah Villanueva', target: 'Support Admin 2', oldRole: 'Support admin',newRole: 'Support admin (suspended)', reason: 'Access review', time: 'Sep 28 · 11:00 AM' },
        { admin: 'Sarah Villanueva', target: 'Ana Torres',      oldRole: 'Guest',        newRole: 'Housekeeping',  reason: 'Hired as housekeeping',         time: 'Sep 25 · 3:30 PM' },
        { admin: 'Sarah Villanueva', target: 'Diego Santos',    oldRole: 'Guest',        newRole: 'Maintenance',   reason: 'Hired as maintenance',          time: 'Sep 22 · 10:00 AM' },
        { admin: 'Sarah Villanueva', target: 'Hana Kim',        oldRole: 'Guest',        newRole: 'Housekeeping',  reason: 'Hired as housekeeping',         time: 'Sep 20 · 1:45 PM' },
        { admin: 'Sarah Villanueva', target: 'Joy Lim',         oldRole: 'Guest',        newRole: 'Housekeeping',  reason: 'Hired as housekeeping',         time: 'Sep 18 · 11:20 AM' },
        { admin: 'Sarah Villanueva', target: 'Marco Cruz',      oldRole: 'Guest',        newRole: 'Front desk',    reason: 'Hired as front desk',           time: 'Sep 15 · 9:10 AM' },
        { admin: 'Sarah Villanueva', target: 'Support Admin 1', oldRole: 'Guest',        newRole: 'Support admin', reason: 'New support admin',             time: 'Sep 12 · 3:00 PM' },
        { admin: 'Sarah Villanueva', target: 'Sarah Villanueva',oldRole: 'Support admin',newRole: 'Super admin',   reason: 'Promotion to Super admin',      time: 'Sep 1 · 9:00 AM' },
        { admin: 'System',           target: 'Ravi Batra',      oldRole: '—',            newRole: 'Manager (temp)',reason: 'Auto-expired temporary role',   time: 'Aug 15 · 11:59 PM' }
    ];

    const ROLE_LABELS = { 'super-admin': 'Super admin', 'support-admin': 'Support admin' };
    const ADMIN_BY_ROLE = {
        'super-admin': { name: 'Sarah Villanueva', initials: 'SV' },
        'support-admin': { name: 'Support Admin 1', initials: 'SA' }
    };

    /* ==========================================
       STATE
       ========================================== */
    const state = {
        role: 'super-admin',
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
       ROLE SWITCHER
       ========================================== */
    function applyRole(role) {
        state.role = role;
        document.body.dataset.role = role;
        $('#staffRoleLabel').textContent = ROLE_LABELS[role];
        $('#roleBreadcrumb').textContent = ROLE_LABELS[role];
        const admin = ADMIN_BY_ROLE[role];
        const staffNameEl = document.querySelector('.staff-name');
        const staffAvatarEl = document.querySelector('.staff-avatar');
        const topbarAvatar = document.querySelector('.topbar-avatar');
        if (staffNameEl) staffNameEl.textContent = admin.name;
        if (staffAvatarEl) staffAvatarEl.textContent = admin.initials;
        if (topbarAvatar) topbarAvatar.textContent = admin.initials;

        // Super-admin-only buttons
        $$('[data-role-required="super-admin"]').forEach((el) => {
            if (role === 'super-admin') {
                el.removeAttribute('aria-disabled');
                el.removeAttribute('title');
            } else {
                el.setAttribute('aria-disabled', 'true');
                el.setAttribute('title', 'Super admin only');
            }
        });

        // Bulk bar
        $$('.bulk-actions [data-role="super-admin"]').forEach((el) => {
            if (role === 'super-admin') {
                el.removeAttribute('aria-disabled');
                el.removeAttribute('title');
            } else {
                el.setAttribute('aria-disabled', 'true');
                el.setAttribute('title', 'Super admin only');
            }
        });

        toast('success', 'Role switched', `Now viewing as ${ROLE_LABELS[role]}.`);
    }
    document.getElementById('roleSelect')?.addEventListener('change', (e) => applyRole(e.target.value));
    applyRole('super-admin');

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
                openUserDrawer(Number(row.dataset.userId));
            });
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); openUserDrawer(Number(row.dataset.userId)); }
                if (e.key === 'ArrowDown') { e.preventDefault(); row.nextElementSibling?.focus(); }
                if (e.key === 'ArrowUp') { e.preventDefault(); row.previousElementSibling?.focus(); }
            });
        });

        // Checkboxes
        $$('.row-check', body).forEach((cb) => {
            cb.addEventListener('change', () => {
                const id = Number(cb.dataset.id);
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
                openRowMenu(Number(btn.dataset.userMenu), btn);
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
                <li><button data-menu="change-role" ${isMe || isLastSuper ? 'disabled title="You cannot change your own role or the last Super admin\\'s role"' : ''}>Change role</button></li>
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

        menu.querySelectorAll('button').forEach((b) => {
            b.addEventListener('click', () => {
                closeAllMenus();
                const action = b.dataset.menu;
                if (action === 'view') openUserDrawer(id);
                else if (action === 'change-role') openConfirm('change-role', `Change role for <strong>${u.name}</strong>?`, 'CHANGE');
                else if (action === 'reset-password') openConfirm('reset-password', `Send password reset to <strong>${u.name}</strong>?`, 'RESET');
                else if (action === 'reset-2fa') openConfirm('reset-2fa', `Reset 2FA for <strong>${u.name}</strong>? They will need to set it up again.`, 'RESET');
                else if (action === 'unlock') openConfirm('unlock', `Unlock account for <strong>${u.name}</strong>?`, 'UNLOCK');
                else if (action === 'suspend') {
                    if (u.status === 'suspended') { toast('success', 'Reactivated', `${u.name} can sign in again.`); return; }
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
    function renderRoles() {
        const grid = $('#roleGrid');
        grid.innerHTML = ROLES.map((r) => `
            <div class="role-card">
                <div class="role-card-head">
                    <span class="role-card-name">${r.name}</span>
                    <span class="role-card-count">${r.count} user${r.count === 1 ? '' : 's'}</span>
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
        list.innerHTML = ACCESS_REQUESTS.map((r) => `
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
        body.innerHTML = ROLE_HISTORY.map((h) => `
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
            $('#pRoom').textContent = u.room;
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

    $('#createSubmit')?.addEventListener('click', () => {
        const btn = $('#createSubmit');
        btn.disabled = true;
        btn.querySelector('.btn-spinner').hidden = false;
        setTimeout(() => {
            btn.disabled = false;
            btn.querySelector('.btn-spinner').hidden = true;
            toast('success', 'Invite sent', `${$('#cuName').value} will receive an invitation email.`);
            closeCreate();
        }, 700);
    });

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
        setTimeout(() => $('#stepupPassword').focus(), 100);
    }
    function closeStepup() { closeModal(stepupOverlay); }

    $('#stepupClose')?.addEventListener('click', closeStepup);
    $('#stepupCancel')?.addEventListener('click', closeStepup);
    stepupOverlay?.addEventListener('click', (e) => { if (e.target === stepupOverlay) closeStepup(); });

    $('#stepupVerify')?.addEventListener('click', () => {
        const pass = $('#stepupPassword').value.trim();
        const code = $('#stepupCode').value.trim();
        let ok = true;
        if (pass.length < 4) { $('#stepupPasswordErr').textContent = 'Enter your password.'; ok = false; }
        if (!/^\d{6}$/.test(code)) { $('#stepupCodeErr').textContent = 'Enter a 6-digit 2FA code.'; ok = false; }
        if (!ok) return;
        state.stepupCallback?.();
        closeStepup();
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
        closeConfirm();

        // Sensitive actions require step-up
        const sensitive = ['change-role','save-permissions','delete','suspend','bulk-suspend','signout-all','apply-elevation'];
        if (sensitive.includes(action)) {
            openStepup(() => {
                if (action === 'delete') toast('success', 'User deleted', 'Account and sessions removed. This action is logged.', 10000, { label: 'Undo', onClick: () => toast('success', 'Restored', 'User account restored.') });
                else if (action === 'save-permissions') toast('success', 'Permissions saved', 'Changes applied to every page that uses permissions.');
                else if (action === 'change-role') toast('success', 'Role changed', 'Role history updated.');
                else if (action === 'suspend' || action === 'bulk-suspend') toast('success', 'Suspended', 'Affected users were signed out.', 10000, { label: 'Undo', onClick: () => toast('success', 'Restored', 'Suspend undone.') });
                else if (action === 'signout-all') toast('success', 'Signed out', 'All sessions terminated.');
                else if (action === 'apply-elevation') toast('success', 'Elevation applied', 'Temporary access will expire automatically.');
            });
        } else {
            const messages = {
                'reset-password': ['Password reset', 'Reset link sent.'],
                'reset-2fa': ['2FA reset', 'User must set up 2FA again.'],
                'unlock': ['Account unlocked', 'User can sign in again.'],
                'approve-request': ['Request approved', 'Temporary access will expire automatically.'],
                'decline-request': ['Request declined', 'Requester notified.']
            };
            const [t, m] = messages[action] || ['Done', 'Action completed.'];
            toast('success', t, m);
        }
    });

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
       ROLE EXPIRY TICKER
       ========================================== */
    const expiryEl = $('#roleExpiry');
    let mins = 4 * 60 + 12;
    setInterval(() => {
        mins--;
        if (mins <= 0) { expiryEl.textContent = 'Access expired · re-authenticate'; expiryEl.style.color = 'var(--status-red-fg)'; return; }
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        expiryEl.textContent = `Access expires in ${h}h ${m}m`;
    }, 60000);

    /* ==========================================
       EXPORT BUTTON
       ========================================== */
    $('#exportBtn')?.addEventListener('click', () => {
        toast('success', 'Export started', 'Exports will include user IDs, roles and 2FA state. Sensitive fields are masked unless permitted.');
    });
});