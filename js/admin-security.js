document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       MOCK DATA
       ========================================== */
    const POSTURE = [
        { key: '2fa',      title: '2FA enforced for privileged roles', desc: 'Managers and admins must have 2FA enabled.',                        status: 'warn', fix: 'Enforce 2FA for Manager role',   fixAction: 'enforce-2fa' },
        { key: 'pw',       title: 'Password policy meets NIST',        desc: 'Minimum 10 characters · complexity · breach check enabled.',       status: 'pass' },
        { key: 'ip',       title: 'IP allowlist configured',           desc: 'Admin sign-in restricted to HQ network ranges.',                   status: 'pass' },
        { key: 'session',  title: 'Session timeout within policy',     desc: 'Idle 30 min · absolute 12 h.',                                      status: 'pass' },
        { key: 'backups',  title: 'Encrypted backups',                 desc: 'Nightly encrypted backup · last success Oct 9, 2026.',             status: 'warn', fix: 'Retry last backup',             fixAction: 'retry-backup' },
        { key: 'stale',    title: 'No stale admin accounts',           desc: 'All admin accounts active within the last 90 days.',               status: 'pass' },
        { key: 'review',   title: 'Quarterly access review completed', desc: 'Last review Oct 5, 2026 · next due Jan 5, 2027.',                   status: 'pass' }
    ];

    const PRIVILEGED = [
        { name: 'Sarah Villanueva', role: 'Super admin', twofa: true,  lastLogin: 'Today · 4:30 PM' },
        { name: 'Support Admin 1',  role: 'Support admin', twofa: true,  lastLogin: 'Today · 2:00 PM' },
        { name: 'Support Admin 2',  role: 'Support admin', twofa: true,  lastLogin: 'Oct 4 · 11:30 AM' },
        { name: 'Ravi Batra',       role: 'Manager',     twofa: true,  lastLogin: 'Today · 4:30 PM' },
        { name: 'Joy Lim',          role: 'Housekeeping', twofa: false, lastLogin: 'Today · 3:40 PM' }
    ];

    const BREAK_GLASS = [
        { name: 'Marco Cruz', initials: 'MC', target: 'Sofia Reyes · TR-1001 / HV-1001 · Room 201', reason: 'Verify overdue guest contact',          time: '2 min ago' },
        { name: 'Sarah Villanueva', initials: 'SV', target: 'Guest contact · Rina Suzuki',           reason: 'Compliance review',                     time: 'Yesterday · 3:30 PM' },
        { name: 'Ravi Batra', initials: 'RB', target: 'Guest contact · Aiko Tanaka',                reason: 'Verify emergency contact for medical', time: 'Oct 8 · 6:15 PM' }
    ];

    const SESSIONS = [
        { name: 'Sarah Villanueva', initials: 'SV', role: 'Super admin',   device: 'Chrome · macOS',   location: 'Manila, PH',     started: 'Today · 8:00 AM',  lastActive: 'Now',           isCurrent: true,  ip: '192.168.1.24' },
        { name: 'Marco Cruz',       initials: 'MC', role: 'Front desk',    device: 'Chrome · Windows', location: 'Manila, PH',     started: 'Today · 6:45 AM',  lastActive: '2 min ago',     ip: '192.168.1.31' },
        { name: 'Ravi Batra',       initials: 'RB', role: 'Manager',       device: 'Safari · macOS',   location: 'Manila, PH',     started: 'Today · 7:15 AM',  lastActive: '5 min ago',     ip: '192.168.1.11' },
        { name: 'Joy Lim',          initials: 'JL', role: 'Housekeeping',  device: 'Chrome · Android', location: 'Manila, PH',     started: 'Today · 9:00 AM',  lastActive: '15 min ago',    ip: '192.168.1.42' },
        { name: 'Marco Cruz',       initials: 'MC', role: 'Front desk',    device: 'Chrome · iPhone',  location: 'Cebu, PH',       started: 'Today · 10:00 AM', lastActive: '3 min ago',     ip: '203.0.113.42', unusual: true },
        { name: 'Support Admin 1',  initials: 'SA', role: 'Support admin', device: 'Chrome · macOS',   location: 'Manila, PH',     started: 'Today · 9:30 AM',  lastActive: '1 hr ago',      ip: '192.168.1.55' },
        { name: 'Priya Nair',       initials: 'PN', role: 'Front desk',    device: 'Firefox · Windows',location: 'Manila, PH',     started: 'Today · 8:30 AM',  lastActive: '30 min ago',    ip: '192.168.1.66' },
        { name: 'Diego Santos',     initials: 'DS', role: 'Maintenance',   device: 'Safari · iPad',    location: 'Manila, PH',     started: 'Today · 9:15 AM',  lastActive: '20 min ago',    ip: '192.168.1.77' },
        { name: 'Ana Torres',       initials: 'AT', role: 'Housekeeping',  device: 'Chrome · Android', location: 'Manila, PH',     started: 'Today · 9:45 AM',  lastActive: '10 min ago',    ip: '192.168.1.88' },
        { name: 'Kim Reyes',        initials: 'KR', role: 'Housekeeping',  device: 'Chrome · Android', location: 'Manila, PH',     started: 'Today · 10:15 AM', lastActive: '5 min ago',     ip: '192.168.1.99' },
        { name: 'Hana Kim',         initials: 'HK', role: 'Housekeeping',  device: 'Safari · iPhone',  location: 'Manila, PH',     started: 'Today · 10:30 AM', lastActive: '2 min ago',     ip: '192.168.1.101' },
        { name: 'Tomás Silva',      initials: 'TS', role: 'Maintenance',   device: 'Chrome · Windows', location: 'Manila, PH',     started: 'Today · 11:00 AM', lastActive: '1 hr ago',      ip: '192.168.1.102' }
    ];

    const ALLOWLIST = [
        { role: 'Super admin',   cidr: '192.168.1.0/24, 203.0.113.0/24' },
        { role: 'Support admin', cidr: '192.168.1.0/24' },
        { role: 'Manager',       cidr: '192.168.1.0/24' },
        { role: 'Front desk',    cidr: '(no restriction)' },
        { role: 'Housekeeping',  cidr: '(no restriction)' },
        { role: 'Maintenance',   cidr: '(no restriction)' }
    ];

    const ELEVATIONS = [
        { name: 'Maya Cruz', email: 'maya@haven.app', role: 'Support admin', granted: 'Oct 6, 2026', expires: 'Oct 13, 2026 · 6:00 PM', minutesLeft: 2 * 24 * 60 + 720 },
        { name: 'Ravi Batra (temp)', email: 'ravi@haven.app', role: 'Manager (temp)', granted: 'Oct 10, 2026', expires: 'Oct 12, 2026 · 6:00 PM', minutesLeft: 24 * 60 + 720 }
    ];

    const LOGIN_ACTIVITY = [
        { user: 'Sarah Villanueva', event: 'Login',          result: 'success', ip: '192.168.1.24',   location: 'Manila, PH', device: 'Chrome · macOS',   time: 'Today · 4:30 PM' },
        { user: 'Marco Cruz',       event: 'Login',          result: 'success', ip: '192.168.1.31',   location: 'Manila, PH', device: 'Chrome · Windows', time: 'Today · 4:21 PM' },
        { user: 'Joy Lim',          event: 'Login',          result: 'success', ip: '192.168.1.42',   location: 'Manila, PH', device: 'Chrome · Android', time: 'Today · 3:40 PM' },
        { user: 'Omar Haddad',      event: 'Login',          result: 'failure', ip: '203.0.113.42',   location: 'Cebu, PH',   device: 'Firefox · Windows',time: 'Today · 3:30 PM' },
        { user: 'Omar Haddad',      event: 'Login',          result: 'failure', ip: '203.0.113.42',   location: 'Cebu, PH',   device: 'Firefox · Windows',time: 'Today · 3:29 PM' },
        { user: 'Omar Haddad',      event: 'Lockout',        result: 'lockout', ip: '203.0.113.42',   location: 'Cebu, PH',   device: 'Firefox · Windows',time: 'Today · 3:28 PM' },
        { user: 'Marco Cruz',       event: 'Login',          result: 'success', ip: '203.0.113.42',   location: 'Cebu, PH',   device: 'Chrome · iPhone',  time: 'Today · 10:00 AM' },
        { user: 'Priya Nair',       event: 'Login',          result: 'success', ip: '192.168.1.66',   location: 'Manila, PH', device: 'Firefox · Windows',time: 'Today · 9:42 AM' },
        { user: 'Ana Torres',       event: 'Password reset', result: 'success', ip: '192.168.1.88',   location: 'Manila, PH', device: 'Chrome · Android', time: 'Today · 9:15 AM' },
        { user: 'Diego Santos',     event: '2FA enabled',    result: 'success', ip: '192.168.1.77',   location: 'Manila, PH', device: 'Safari · iPad',    time: 'Today · 9:00 AM' },
        { user: 'Ravi Batra',       event: 'New device',     result: 'success', ip: '192.168.1.11',   location: 'Manila, PH', device: 'Safari · macOS',   time: 'Today · 7:15 AM' },
        { user: 'Hana Kim',         event: 'Login',          result: 'success', ip: '192.168.1.101',  location: 'Manila, PH', device: 'Safari · iPhone',  time: 'Today · 6:30 AM' },
        { user: 'Kim Reyes',        event: 'Login',          result: 'success', ip: '192.168.1.99',   location: 'Manila, PH', device: 'Chrome · Android', time: 'Yesterday · 8:10 PM' },
        { user: 'Tomás Silva',      event: 'Login',          result: 'success', ip: '192.168.1.102',  location: 'Manila, PH', device: 'Chrome · Windows', time: 'Yesterday · 5:15 PM' },
        { user: 'Support Admin 2',  event: 'Login',          result: 'failure', ip: '203.0.113.42',   location: 'Cebu, PH',   device: 'Chrome · macOS',   time: 'Yesterday · 4:00 PM' },
        { user: 'Support Admin 2',  event: 'Login',          result: 'failure', ip: '203.0.113.42',   location: 'Cebu, PH',   device: 'Chrome · macOS',   time: 'Yesterday · 3:59 PM' },
        { user: 'Marco Cruz',       event: 'Login',          result: 'success', ip: '192.168.1.31',   location: 'Manila, PH', device: 'Chrome · Windows', time: 'Yesterday · 3:40 PM' },
        { user: 'Ravi Batra',       event: 'Login',          result: 'success', ip: '192.168.1.11',   location: 'Manila, PH', device: 'Safari · macOS',   time: 'Yesterday · 9:00 AM' },
        { user: 'Sarah Villanueva', event: 'Login',          result: 'success', ip: '192.168.1.24',   location: 'Manila, PH', device: 'Chrome · macOS',   time: 'Yesterday · 8:00 AM' },
        { user: 'Joy Lim',          event: '2FA change',     result: 'success', ip: '192.168.1.42',   location: 'Manila, PH', device: 'Chrome · Android', time: 'Oct 9 · 3:00 PM' }
    ];

    const RULES = [
        { id: 1, title: '5 failed logins in 10 minutes',    desc: 'Triggers a critical alert after 5 consecutive failures.',  severity: 'critical', recipients: 'security@haven.app', enabled: true },
        { id: 2, title: 'Login from a new country',        desc: 'Fires when a login comes from a country not in the allowlist.', severity: 'warning',  recipients: 'security@haven.app', enabled: true },
        { id: 3, title: 'Many reveals by one user',        desc: 'Triggers when a single user exceeds 20 break-glass reveals in an hour.', severity: 'critical', recipients: 'security@haven.app', enabled: true },
        { id: 4, title: 'Admin role change',               desc: 'Fires when any user is promoted to or demoted from an admin role.', severity: 'warning',  recipients: 'security@haven.app, ops@haven.app', enabled: true },
        { id: 5, title: 'Guest data export',               desc: 'Notifies on every guest-data export.',                     severity: 'info',     recipients: 'compliance@haven.app', enabled: true }
    ];

    const ALERTS = [
        { id: 1, severity: 'critical', title: 'Suspicious login attempts',        desc: 'Omar Haddad had 3 failed logins from Cebu, PH (203.0.113.42) in the last hour. Account locked after the third attempt.', time: 'Today · 3:28 PM', status: 'open' },
        { id: 2, severity: 'warning',  title: 'Manager without 2FA',              desc: 'Joy Lim (Housekeeping, Manager permission level) has not enabled 2FA. Policy requires 2FA for manager-level access.', time: 'Yesterday · 2:00 PM', status: 'open' }
    ];

    const ROLE_2FA = [
        { role: 'Super admin',   required: true,  count: 1, methods: ['TOTP', 'Recovery codes'] },
        { role: 'Support admin', required: true,  count: 2, methods: ['TOTP', 'Recovery codes'] },
        { role: 'Manager',       required: false, count: 1, methods: ['TOTP'] },
        { role: 'Front desk',    required: false, count: 4, methods: ['TOTP'] },
        { role: 'Housekeeping',  required: false, count: 3, methods: ['TOTP'] },
        { role: 'Maintenance',   required: false, count: 2, methods: ['TOTP'] },
        { role: 'Guest',         required: false, count: 9, methods: ['—'] }
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
        tab: 'overview',
        loginSearch: '',
        loginResult: 'all',
        dirtyForms: new Set(),
        stepupCallback: null,
        confirmCtx: null
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

        $$('[data-role-required="super-admin"], [data-role="super-admin"]').forEach((el) => {
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
    $('#roleSelect')?.addEventListener('change', (e) => applyRole(e.target.value));
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
       POSTURE CHECKLIST
       ========================================== */
    function renderPosture() {
        const list = $('#postureList');
        list.innerHTML = POSTURE.map((p) => `
            <li class="posture-item">
                <span class="posture-icon ${p.status}" aria-hidden="true">
                    ${p.status === 'pass' ? '✓' : p.status === 'warn' ? '⚠' : '✕'}
                </span>
                <div class="posture-body">
                    <div class="posture-title">${p.title}</div>
                    <div class="posture-desc">${p.desc}</div>
                </div>
                <div class="posture-actions">
                    ${p.fix ? `<button class="posture-fix" data-fix="${p.fixAction}">${p.fix} →</button>` : ''}
                </div>
            </li>
        `).join('');

        $$('[data-fix]', list).forEach((btn) => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.fix;
                if (action === 'enforce-2fa') openConfirm('enforce-2fa', 'Enforce 2FA for the Manager role? Joy Lim will be required to set up 2FA on next sign-in.', 'ENFORCE');
                else if (action === 'retry-backup') openConfirm('retry-backup', 'Retry the last failed backup now?', 'BACKUP');
            });
        });
    }
    renderPosture();

    /* ==========================================
       PRIVILEGED ACCOUNTS
       ========================================== */
    function renderPrivileged() {
        $('#privilegedBody').innerHTML = PRIVILEGED.map((p) => `
            <tr>
                <td>${p.name}</td>
                <td>${p.role}</td>
                <td>${p.twofa ? `<span class="twofa-on">✓ On</span>` : `<span class="twofa-off">⚠ Off</span>`}</td>
                <td class="hide-sm muted">${p.lastLogin}</td>
            </tr>
        `).join('');
    }
    renderPrivileged();

    /* ==========================================
       BREAK-GLASS REVEALS
       ========================================== */
    function renderReveals() {
        $('#revealList').innerHTML = BREAK_GLASS.map((r) => `
            <li class="reveal-item">
                <span class="reveal-avatar">${r.initials}</span>
                <div class="reveal-body">
                    <p><strong>${r.name}</strong> revealed <em>${r.target}</em></p>
                    <p style="color:var(--text-muted);font-size:0.75rem;margin-top:2px">Reason: ${r.reason}</p>
                    <span class="reveal-time">${r.time}</span>
                </div>
            </li>
        `).join('');
    }
    renderReveals();

    /* ==========================================
       2FA ROLE LIST (Authentication tab)
       ========================================== */
    function renderRole2FA() {
        $('#role2faList').innerHTML = ROLE_2FA.map((r) => `
            <li class="role-2fa-item">
                <span class="role-2fa-name">${r.role}</span>
                <span class="role-2fa-count">${r.count} user${r.count === 1 ? '' : 's'}</span>
                <label class="toggle-row" style="padding:0;min-height:auto">
                    <input type="checkbox" data-2fa-role="${r.role}" ${r.required ? 'checked' : ''} ${r.role === 'Super admin' ? 'disabled' : ''}>
                    <span class="toggle-slider"></span>
                    <span style="font-size:0.78rem">${r.required ? 'Required' : 'Optional'}</span>
                </label>
            </li>
        `).join('');

        $$('[data-2fa-role]').forEach((cb) => {
            cb.addEventListener('change', () => {
                const role = cb.dataset['2faRole'] || cb.getAttribute('data-2fa-role');
                markDirty('authForm');
                if (cb.checked) {
                    toast('success', 'Requires 2FA', `${role} role will require 2FA. Users will be prompted on next sign-in.`);
                } else {
                    openConfirm('disable-2fa', `Remove 2FA requirement for <strong>${role}</strong>? This weakens security for ${ROLE_2FA.find((r) => r.role === role)?.count || 0} users.`, 'WEAKEN');
                }
            });
        });
    }
    renderRole2FA();

    /* ==========================================
       SESSIONS
       ========================================== */
    function renderSessions() {
        $('#sessionsBody').innerHTML = SESSIONS.map((s, i) => `
            <tr class="${s.isCurrent ? 'current' : ''}" tabindex="0">
                <td>
                    <div class="user-cell">
                        <span class="user-avatar">${s.initials}</span>
                        <div>
                            <div>${s.name}${s.isCurrent ? ' <span class="status-pill info" style="font-size:0.65rem">Current</span>' : ''}</div>
                            ${s.unusual ? '<div style="font-size:0.72rem;color:var(--status-amber-fg);font-weight:600">⚠ Unusual location</div>' : ''}
                        </div>
                    </div>
                </td>
                <td class="hide-md">${s.role}</td>
                <td>${s.device}</td>
                <td class="hide-sm">${s.location}${s.unusual ? ' ⚠' : ''}</td>
                <td class="hide-md muted">${s.started}</td>
                <td class="hide-sm muted">${s.lastActive}</td>
                <td class="col-actions">
                    <button class="btn btn-ghost btn-sm" data-signout="${i}" ${s.isCurrent ? 'disabled title="You cannot sign out your own current session here"' : ''}>Sign out</button>
                </td>
            </tr>
        `).join('');

        $$('[data-signout]').forEach((b) => {
            b.addEventListener('click', () => {
                const i = Number(b.dataset.signout);
                const s = SESSIONS[i];
                openConfirm('signout-one', `Sign out <strong>${s.name}</strong> from "${s.device}"?`, 'SIGNOUT');
            });
        });
    }
    renderSessions();

    $('#signOutAllUsers')?.addEventListener('click', (e) => {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            toast('error', 'Not allowed', 'Super admin access required.');
            return;
        }
        openConfirm('signout-all', 'Sign out <strong>all users</strong> from every device? This is used during incidents.', 'SIGNOUT-ALL');
    });

    /* ==========================================
       ALLOWLIST + TEST IP
       ========================================== */
    function renderAllowlist() {
        $('#allowlistList').innerHTML = ALLOWLIST.map((a) => `
            <li class="allowlist-item">
                <span class="allowlist-role">${a.role}</span>
                <span class="allowlist-cidr">${a.cidr}</span>
                <div class="allowlist-actions">
                    <button class="btn btn-ghost btn-sm" data-edit-allowlist="${a.role}">Edit</button>
                </div>
            </li>
        `).join('');

        $$('[data-edit-allowlist]').forEach((b) => {
            b.addEventListener('click', () => {
                toast('success', 'Edit allowlist', `Editing rules for ${b.dataset.editAllowlist}.`);
            });
        });
    }
    renderAllowlist();

    $('#testIpBtn')?.addEventListener('click', () => {
        const el = $('#testIpResult');
        el.textContent = '✓ Your IP (192.168.1.24) is in the Super admin allowlist.';
        el.style.color = 'var(--status-green-fg)';
        toast('success', 'IP verified', 'You can safely save allowlist changes.');
    });

    /* ==========================================
       ELEVATIONS
       ========================================== */
    function renderElevations() {
        $('#elevationList').innerHTML = ELEVATIONS.map((e) => {
            const days = Math.floor(e.minutesLeft / (60 * 24));
            const hours = Math.floor((e.minutesLeft % (60 * 24)) / 60);
            const label = days > 0 ? `${days}d ${hours}h remaining` : `${hours}h remaining`;
            return `
                <li class="elevation-item">
                    <div class="elevation-body">
                        <div class="elevation-title">${e.name}</div>
                        <div class="elevation-meta">${e.role} · granted ${e.granted} · expires ${e.expires}</div>
                    </div>
                    <span class="elevation-countdown">${label}</span>
                    <button class="btn btn-ghost btn-sm" data-revoke-elevation="${e.email}">Revoke</button>
                </li>
            `;
        }).join('');

        $$('[data-revoke-elevation]').forEach((b) => {
            b.addEventListener('click', () => {
                openConfirm('revoke-elevation', `Revoke temporary elevation for <strong>${b.dataset.revokeElevation}</strong>?`, 'REVOKE');
            });
        });
    }
    renderElevations();

    /* ==========================================
       MASK LIST (Data protection)
       ========================================== */
    function renderMaskList() {
        const items = [
            { key: 'idNumber', label: 'ID number', preview: '•••• ••123' },
            { key: 'phone',    label: 'Phone number', preview: '+63 ••• ••• 6789' },
            { key: 'email',    label: 'Email address', preview: 's•••@example.com' },
            { key: 'address',  label: 'Home address', preview: '(masked)' }
        ];
        $('#maskList').innerHTML = items.map((m) => `
            <li class="mask-item">
                <input type="checkbox" id="mask-${m.key}" data-mask="${m.key}" checked>
                <label for="mask-${m.key}">Mask ${m.label}</label>
                <span class="mask-preview">${m.preview}</span>
            </li>
        `).join('');

        $$('[data-mask]').forEach((cb) => {
            cb.addEventListener('change', () => {
                markDirty('dataForm');
                if (!cb.checked) {
                    openConfirm('unmask-field', `Stop masking <strong>${cb.dataset.mask}</strong>? This weakens data protection across all pages.`, 'WEAKEN');
                }
            });
        });
    }
    renderMaskList();

    /* ==========================================
       LOGIN ACTIVITY
       ========================================== */
    function renderLoginActivity() {
        const q = state.loginSearch.toLowerCase();
        const list = LOGIN_ACTIVITY.filter((l) => {
            if (state.loginResult !== 'all' && l.result !== state.loginResult) return false;
            if (!q) return true;
            return l.user.toLowerCase().includes(q) || l.ip.includes(q) || l.event.toLowerCase().includes(q) || l.location.toLowerCase().includes(q);
        });

        const body = $('#loginBody');
        const empty = $('#loginEmpty');

        if (!list.length) {
            body.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        body.innerHTML = list.map((l) => {
            const resultClass = l.result === 'success' ? 'pass' : l.result === 'failure' ? 'fail' : 'warn';
            const resultLabel = l.result === 'success' ? 'Success' : l.result === 'failure' ? 'Failure' : 'Lockout';
            return `
                <tr tabindex="0">
                    <td>${l.user}</td>
                    <td>${l.event}</td>
                    <td><span class="status-pill ${resultClass}"><span class="dot"></span> ${resultLabel}</span></td>
                    <td class="hide-sm">${l.ip}<br><span class="muted" style="font-size:0.72rem">${l.location}</span></td>
                    <td class="hide-md muted">${l.device}</td>
                    <td class="hide-sm muted">${l.time}</td>
                </tr>
            `;
        }).join('');
    }
    renderLoginActivity();

    $('#loginSearch')?.addEventListener('input', (e) => {
        state.loginSearch = e.target.value.trim();
        renderLoginActivity();
    });

    $$('.chip-select').forEach((wrap) => {
        const chip = wrap.querySelector('.chip');
        const menu = wrap.querySelector('.chip-menu');
        if (!menu) return;
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
                renderLoginActivity();
            });
        });
    });

    document.addEventListener('click', () => { $$('.chip-menu').forEach((m) => m.hidden = true); });

    $('#exportLogin')?.addEventListener('click', () => {
        openStepup(() => {
            toast('success', 'Export started', 'Login activity will be exported as CSV. This export is logged.');
        });
    });

    /* ==========================================
       RULES + ALERTS
       ========================================== */
    function renderRules() {
        $('#rulesList').innerHTML = RULES.map((r) => `
            <li class="rule-item">
                <span class="alert-icon ${r.severity === 'critical' ? 'critical' : r.severity === 'warning' ? 'warning' : 'info'}">
                    ${r.severity === 'critical' ? '⚠' : r.severity === 'warning' ? '!' : 'i'}
                </span>
                <div class="rule-body">
                    <div class="rule-title">${r.title}</div>
                    <div class="rule-desc">${r.desc}</div>
                    <div class="rule-meta">
                        <span class="status-pill ${r.severity === 'critical' ? 'fail' : r.severity === 'warning' ? 'warn' : 'info'}" style="margin-top:6px">${r.severity}</span>
                        <span class="rule-desc">Recipients: ${r.recipients}</span>
                    </div>
                </div>
                <label class="toggle-row" style="padding:0;min-height:auto">
                    <input type="checkbox" data-rule="${r.id}" ${r.enabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                    <span style="font-size:0.78rem">${r.enabled ? 'On' : 'Off'}</span>
                </label>
            </li>
        `).join('');

        $$('[data-rule]').forEach((cb) => {
            cb.addEventListener('change', () => {
                markDirty('rulesForm');
                if (!cb.checked) {
                    toast('error', 'Rule disabled', 'Re-enable when ready. Alerts are logged in audit history.');
                }
            });
        });
    }
    renderRules();

    function renderAlerts() {
        $('#alertList').innerHTML = ALERTS.map((a) => `
            <li class="alert-item">
                <span class="alert-icon ${a.severity}">${a.severity === 'critical' ? '⚠' : '!'}</span>
                <div class="alert-body">
                    <div class="alert-title">${a.title}</div>
                    <div class="alert-desc">${a.desc}</div>
                    <span class="alert-time">${a.time}</span>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-outline btn-sm" data-alert="${a.id}" data-action="ack">Acknowledge</button>
                    <button class="btn btn-outline btn-sm" data-alert="${a.id}" data-action="investigate">Investigate</button>
                    <button class="btn btn-ghost btn-sm" data-alert="${a.id}" data-action="dismiss">Dismiss</button>
                </div>
            </li>
        `).join('');

        $$('[data-alert]').forEach((b) => {
            b.addEventListener('click', () => {
                const action = b.dataset.action;
                if (action === 'ack') {
                    toast('success', 'Acknowledged', 'Alert acknowledged. It remains visible in your audit history.');
                } else if (action === 'investigate') {
                    toast('success', 'Investigating', 'Opening audit log filtered to this alert…');
                } else if (action === 'dismiss') {
                    openConfirm('dismiss-alert', 'Dismiss this alert? Provide a reason — dismissals are logged.', 'DISMISS');
                }
            });
        });

        $('#alertTabCount').textContent = ALERTS.length;
    }
    renderAlerts();

    /* ==========================================
       DIRTY STATE + STICKY SAVE BAR
       ========================================== */
    const saveBar = $('#saveBar');
    const formIds = ['authForm', 'sessionForm', 'accessForm', 'dataForm'];

    formIds.forEach((id) => {
        const form = document.getElementById(id);
        if (!form) return;
        form.addEventListener('input', () => markDirty(id));
    });

    function markDirty(id) {
        state.dirtyForms.add(id);
        updateSaveBar();
    }

    function updateSaveBar() {
        if (state.dirtyForms.size > 0) {
            saveBar.hidden = false;
            requestAnimationFrame(() => saveBar.classList.add('visible'));
        } else {
            saveBar.classList.remove('visible');
            setTimeout(() => { if (state.dirtyForms.size === 0) saveBar.hidden = true; }, 250);
        }
    }

    $('#saveAll')?.addEventListener('click', () => {
        openImpactPreview();
    });

    $('#discardAll')?.addEventListener('click', () => {
        state.dirtyForms.clear();
        updateSaveBar();
        toast('success', 'Discarded', 'Unsaved changes have been discarded.');
    });

    /* ==========================================
       IMPACT PREVIEW
       ========================================== */
    function openImpactPreview() {
        const affected = [];
        // Sample: if authForm is dirty, 2FA enforcement may affect Joy Lim
        if (state.dirtyForms.has('authForm')) {
            affected.push({ title: '1 user affected by 2FA enforcement', desc: 'Joy Lim (Housekeeping · manager-level access) will be required to set up 2FA on next sign-in.' });
        }
        if (state.dirtyForms.has('sessionForm')) {
            affected.push({ title: 'All signed-in users affected', desc: 'New session timeouts apply from the moment you save. Existing sessions are unaffected until they renew.' });
        }
        if (state.dirtyForms.has('accessForm')) {
            affected.push({ title: 'Admin sign-in will be restricted', desc: 'After saving, admin sign-in requires an IP in the allowlist. Your current IP (192.168.1.24) is verified.' });
        }
        if (state.dirtyForms.has('dataForm')) {
            affected.push({ title: 'Data masking & retention changes', desc: 'All pages using masked fields will reflect the new settings immediately.' });
        }
        if (!affected.length) affected.push({ title: 'No visible impact', desc: 'No affected users detected.' });

        $('#impactList').innerHTML = affected.map((a) => `
            <li>
                <strong>${a.title}</strong>
                ${a.desc}
            </li>
        `).join('');
        openModal($('#impactOverlay'));
    }

    $('#impactClose')?.addEventListener('click', () => closeModal($('#impactOverlay')));
    $('#impactCancel')?.addEventListener('click', () => closeModal($('#impactOverlay')));
    $('#impactOverlay')?.addEventListener('click', (e) => { if (e.target === $('#impactOverlay')) closeModal($('#impactOverlay')); });

    $('#impactConfirm')?.addEventListener('click', () => {
        closeModal($('#impactOverlay'));
        openStepup(() => {
            state.dirtyForms.clear();
            updateSaveBar();
            toast('success', 'Security settings saved', 'Changes are live. This update is logged in audit history.');
        });
    });

    /* ==========================================
       STEP-UP
       ========================================== */
    function openStepup(onVerify) {
        state.stepupCallback = onVerify;
        $('#stepupPassword').value = '';
        $('#stepupCode').value = '';
        $('#stepupPasswordErr').textContent = '';
        $('#stepupCodeErr').textContent = '';
        openModal($('#stepupOverlay'));
        setTimeout(() => $('#stepupPassword').focus(), 100);
    }
    function closeStepup() { closeModal($('#stepupOverlay')); }

    $('#stepupClose')?.addEventListener('click', closeStepup);
    $('#stepupCancel')?.addEventListener('click', closeStepup);
    $('#stepupOverlay')?.addEventListener('click', (e) => { if (e.target === $('#stepupOverlay')) closeStepup(); });

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
       TYPED CONFIRM
       ========================================== */
    function openConfirm(action, text, keyword = 'CONFIRM') {
        state.confirmCtx = { action, keyword };
        $('#confirmTitle').textContent = action.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        $('#confirmText').innerHTML = text;
        $('#confirmWordPrompt').textContent = keyword;
        $('#confirmWord').value = '';
        $('#confirmReason').value = '';
        $('#confirmWordErr').textContent = '';
        $('#confirmReasonErr').textContent = '';
        openModal($('#confirmOverlay'));
        setTimeout(() => $('#confirmWord').focus(), 100);
    }
    function closeConfirm() { closeModal($('#confirmOverlay')); }

    $('#confirmClose')?.addEventListener('click', closeConfirm);
    $('#confirmCancel')?.addEventListener('click', closeConfirm);
    $('#confirmOverlay')?.addEventListener('click', (e) => { if (e.target === $('#confirmOverlay')) closeConfirm(); });

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

        const weakening = ['disable-2fa','unmask-field'].includes(action);
        const needsStepup = weakening || ['signout-all','retry-backup','revoke-elevation','dismiss-alert','enforce-2fa'].includes(action);

        if (needsStepup) {
            openStepup(() => {
                const messages = {
                    'enforce-2fa':      ['Enforced', 'Joy Lim will be prompted to set up 2FA on next sign-in.'],
                    'retry-backup':     ['Backup retried', 'Nightly backup queued. Expected to complete in ~5 min.'],
                    'disable-2fa':      ['2FA weakened', 'The role no longer requires 2FA. This action is logged.'],
                    'unmask-field':     ['Masking weakened', 'Field will be visible unmasked. This action is logged.'],
                    'signout-one':      ['Signed out', 'The session has been terminated.'],
                    'signout-all':      ['All sessions signed out', 'Every user has been signed out. This is logged.'],
                    'revoke-elevation': ['Elevation revoked', 'The temporary role was removed immediately.'],
                    'dismiss-alert':    ['Alert dismissed', 'Dismissal logged with your reason.'],
                    'change-retention': ['Retention updated', 'New retention rules apply from today.']
                };
                const [t, m] = messages[action] || ['Done', 'Action completed.'];
                if (weakening) toast('error', t, m);
                else toast('success', t, m);
            });
        } else {
            toast('success', 'Done', 'Action completed.');
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
       EXPORT REPORT
       ========================================== */
    $('#exportReportBtn')?.addEventListener('click', () => {
        openStepup(() => {
            toast('success', 'Report exported', 'Security report exported. This action is logged in audit history.');
        });
    });

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
            closeStepup();
            closeConfirm();
            closeModal($('#impactOverlay'));
            $$('.chip-menu').forEach((m) => m.hidden = true);
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
       STAT CARDS
       ========================================== */
    $$('.stat-card').forEach((card) => {
        card.addEventListener('click', () => {
            const key = card.dataset.stat;
            if (key === 'failed') {
                $$('.tab').forEach((t) => {
                    const active = t.dataset.tab === 'login';
                    t.classList.toggle('active', active);
                    t.setAttribute('aria-selected', String(active));
                });
                $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === 'login'));
            } else if (key === 'locked') {
                toast('success', 'Locked accounts', 'Omar Haddad (Front desk) is locked. Unlock from Users and roles.');
            } else if (key === 'sessions') {
                $$('.tab').forEach((t) => {
                    const active = t.dataset.tab === 'sessions';
                    t.classList.toggle('active', active);
                    t.setAttribute('aria-selected', String(active));
                });
                $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === 'sessions'));
            } else if (key === 'no2fa') {
                $$('.tab').forEach((t) => {
                    const active = t.dataset.tab === 'authentication';
                    t.classList.toggle('active', active);
                    t.setAttribute('aria-selected', String(active));
                });
                $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === 'authentication'));
            } else if (key === 'alerts') {
                $$('.tab').forEach((t) => {
                    const active = t.dataset.tab === 'alerts';
                    t.classList.toggle('active', active);
                    t.setAttribute('aria-selected', String(active));
                });
                $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === 'alerts'));
            }
        });
    });
});