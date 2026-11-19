document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       MOCK DATA — 60 entries
       ========================================== */
    // Helper to reduce repetition
    function ev(id, time, actor, role, action, target, result, severity, ip, device, reason, category, extra = {}) {
        return Object.assign({
            id, time, actor, role, action, target, result, severity, ip, device, reason, category,
            date: extra.date || 'Today', initials: actor === 'System' ? 'SY' : (actor === 'Anonymised user' ? '?' : actor.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()),
            isSystem: actor === 'System',
            isAnonymised: actor === 'Anonymised user'
        }, extra);
    }

    const EVENTS = [
        // TODAY — 8:00 AM to now
        ev(1,  'Today · 10:28 AM', 'Ana Cruz', 'Front desk', 'Force check-out', 'Sofia Reyes · TR-1001 / HV-1001 · Room 201', 'success', 'critical', '192.168.1.31', 'Chrome · macOS', 'Guest unreachable · overdue 2 days', 'Privileged', {
            summary: 'Ana Cruz (Front desk) force checked out Sofia Reyes (TR-1001 / HV-1001) from room 201. Reason: Guest unreachable. Step-up authentication was used.',
            changes: [{ field: 'Stay status', oldVal: 'Overdue · 2 days', newVal: 'Checked out', changed: true }, { field: 'Room status', oldVal: 'Occupied', newVal: 'Vacant dirty', changed: true }],
            stepup: 'Yes · 2FA verified', session: 'ses_8a4f3c12', request: 'req_9c2b7e14',
            related: [
                { text: 'Overdue rule flagged by System', time: 'Today · 8:02 AM', author: 'System' },
                { text: 'Guest notification queued',      time: 'Today · 10:28 AM', author: 'System' }
            ]
        }),
        ev(2,  'Today · 10:22 AM', 'Marco Cruz', 'Front desk', 'Reveal masked data', 'Sofia Reyes · TR-1001 · Phone number', 'success', 'warning', '192.168.1.31', 'Chrome · macOS', 'Verify overdue guest contact', 'Data', {
            summary: 'Marco Cruz (Front desk) revealed the phone number for Sofia Reyes (TR-1001) for 30 seconds. Reason: Verify overdue guest contact.',
            changes: [{ field: 'Phone number', oldVal: '••• ••• ••89', newVal: '+63 917 888 2289', changed: true }],
            stepup: 'No', session: 'ses_3d21b0fe', request: 'req_2e9c1f30'
        }),
        ev(3,  'Today · 10:15 AM', 'Sarah Villanueva', 'Super admin', 'Export audit log', 'Last 7 days · 60 events', 'success', 'warning', '192.168.1.24', 'Chrome · macOS', 'Compliance review · Q4 2026', 'Data', {
            summary: 'Sarah Villanueva (Super admin) exported 60 audit events for the last 7 days as CSV. Reason: Compliance review · Q4 2026. This export is itself logged.',
            stepup: 'Yes · 2FA verified', session: 'ses_7a1c5f22', request: 'req_1a8e3c21'
        }),
        ev(4,  'Today · 10:10 AM', 'Sarah Villanueva', 'Super admin', 'Role change', 'Maya Cruz · Guest → Support admin', 'success', 'warning', '192.168.1.24', 'Chrome · macOS', 'Temporary elevation · 7 days', 'Roles', {
            summary: 'Sarah Villanueva (Super admin) promoted Maya Cruz from Guest to Support admin for 7 days. Reason: Temporary elevation · 7 days.',
            changes: [{ field: 'Role', oldVal: 'Guest', newVal: 'Support admin', changed: true }, { field: 'Expires at', oldVal: '—', newVal: 'Oct 18, 2026 · 6:00 PM', changed: true }],
            stepup: 'Yes · 2FA verified', session: 'ses_7a1c5f22', request: 'req_8f2d4b10'
        }),
        ev(5,  'Today · 9:44 AM', 'Ana Cruz', 'Front desk', 'Attempt change role', 'Sarah Villanueva · Super admin', 'blocked', 'critical', '192.168.1.31', 'Chrome · macOS', 'Blocked — cannot demote last Super admin', 'Roles', {
            summary: 'Ana Cruz (Front desk) attempted to demote Sarah Villanueva (Super admin). Action was blocked by policy — the last Super admin cannot be demoted.',
            changes: [{ field: 'Role', oldVal: 'Super admin', newVal: 'Attempted: Manager', changed: true }],
            stepup: 'No', session: 'ses_3d21b0fe'
        }),
        ev(6,  'Today · 9:30 AM', 'System', 'System', 'Password policy updated', 'Security settings · password', 'success', 'info', '10.0.0.5', 'Server', 'Auto-synced with NIST 2026 guidance', 'System', {
            summary: 'System applied the new NIST 2026 password policy automatically during the nightly sync.',
            changes: [{ field: 'Min length', oldVal: '10', newVal: '12', changed: true }]
        }),
        ev(7,  'Today · 9:15 AM', 'Marco Cruz', 'Front desk', 'Login', 'Marco Cruz', 'success', 'info', '203.0.113.42', 'Chrome · iPhone', 'Sign-in from new location', 'System', {
            summary: 'Marco Cruz (Front desk) signed in from a new location (Cebu, PH).'
        }),
        ev(8,  'Today · 9:02 AM', 'System', 'System', 'Overdue rule triggered', 'Sofia Reyes · Room 201', 'success', 'warning', '10.0.0.5', 'Server', 'Guest past expected check-out · 2 days', 'System', {
            summary: 'System flagged stay for Sofia Reyes (Room 201) as overdue. Expected check-out Oct 9, 2026 · 2 days overdue.'
        }),
        ev(9,  'Today · 8:45 AM', 'Joy Lim', 'Housekeeping', 'Update room status', 'Room 305 · Vacant dirty → Cleaning', 'success', 'info', '192.168.1.42', 'Chrome · Android', '—', 'Guest'),
        ev(10, 'Today · 8:30 AM', 'System', 'System', 'Nightly backup', 'nightly-backup-2026-10-11', 'failed', 'critical', '10.0.0.5', 'Server', 'S3 endpoint unreachable', 'System', {
            summary: 'System ran the nightly backup at 3:00 AM but it failed — S3 endpoint was unreachable.'
        }),
        ev(11, 'Today · 8:15 AM', 'Ravi Batra', 'Manager', 'Login', 'Ravi Batra', 'success', 'info', '192.168.1.11', 'Safari · macOS', '—', 'System'),
        ev(12, 'Today · 8:02 AM', 'System', 'System', 'Send guest notification', 'Sofia Reyes · Overdue reminder', 'success', 'info', '10.0.0.5', 'Server', 'Automated overdue reminder', 'System'),

        // YESTERDAY — 7 entries
        ev(13, 'Yesterday · 5:30 PM', 'Sarah Villanueva', 'Super admin', 'Enable 2FA requirement', 'Manager role', 'success', 'warning', '192.168.1.24', 'Chrome · macOS', 'Post-incident hardening', 'Roles', {
            summary: 'Sarah Villanueva (Super admin) enabled 2FA requirement for the Manager role. Reason: Post-incident hardening.',
            changes: [{ field: '2FA required', oldVal: 'Off', newVal: 'On', changed: true }],
            stepup: 'Yes · 2FA verified'
        }),
        ev(14, 'Yesterday · 4:15 PM', 'Joy Lim', 'Housekeeping', 'Reveal masked data', 'Ravi Patel · TR-1005 · Phone number', 'blocked', 'warning', '192.168.1.42', 'Chrome · Android', 'Blocked — role does not permit reveals', 'Data', {
            summary: 'Joy Lim (Housekeeping) attempted to reveal a phone number. Blocked — Housekeeping role does not have permission.'
        }),
        ev(15, 'Yesterday · 3:14 PM', 'Marco Cruz', 'Front desk', 'Change room', 'Lena Okafor · 208 → 210', 'success', 'info', '192.168.1.31', 'Chrome · Windows', 'A/C noise complaint', 'Guest'),
        ev(16, 'Yesterday · 2:10 PM', 'Sarah Villanueva', 'Super admin', 'Restore backup', 'backup-2026-10-10', 'success', 'warning', '192.168.1.24', 'Chrome · macOS', 'Recovering from earlier failure', 'System', {
            summary: 'Sarah Villanueva (Super admin) restored backup from 2026-10-10 03:00. Reason: Recovering from earlier failure.',
            stepup: 'Yes · 2FA verified'
        }),
        ev(17, 'Yesterday · 11:40 AM', 'System', 'System', 'Unusual activity detected', 'Joy Lim · 24 reveals in 1 hour', 'success', 'critical', '10.0.0.5', 'Server', 'Threshold exceeded · alert sent', 'System', {
            summary: 'System detected that Joy Lim revealed 24 masked records in under an hour — exceeding the alert threshold of 20.'
        }),
        ev(18, 'Yesterday · 9:05 AM', 'Support Admin 1', 'Support admin', 'Login', 'Support Admin 1', 'success', 'info', '192.168.1.55', 'Chrome · macOS', '—', 'System'),
        ev(19, 'Yesterday · 9:00 AM', 'Ravi Batra', 'Manager', 'Login', 'Ravi Batra', 'success', 'info', '192.168.1.11', 'Safari · macOS', '—', 'System'),

        // 3 days ago (Oct 9)
        ev(20, 'Oct 9 · 8:14 PM', 'Sarah Villanueva', 'Super admin', 'Delete user', 'Temp Admin (deleted)', 'success', 'critical', '192.168.1.24', 'Chrome · macOS', 'Contract ended', 'Roles', {
            summary: 'Sarah Villanueva (Super admin) deleted user "Temp Admin". The reference in this log now shows as anonymised because the user was deleted.',
            stepup: 'Yes · 2FA verified'
        }),
        ev(21, 'Oct 9 · 6:00 PM', 'Marco Cruz', 'Front desk', 'Check in guest', 'Aiko Tanaka · Room 202', 'success', 'info', '192.168.1.31', 'Chrome · macOS', '—', 'Guest'),
        ev(22, 'Oct 9 · 5:42 PM', 'Ravi Batra', 'Manager', 'Export report', 'Occupancy · Oct', 'success', 'info', '192.168.1.11', 'Safari · macOS', 'Weekly ops review', 'Data'),
        ev(23, 'Oct 9 · 4:00 PM', 'Support Admin 2', 'Support admin', 'Login', 'Support Admin 2', 'failed', 'warning', '203.0.113.42', 'Chrome · macOS', 'Wrong password · 1 of 5', 'System'),
        ev(24, 'Oct 9 · 3:59 PM', 'Support Admin 2', 'Support admin', 'Login', 'Support Admin 2', 'failed', 'warning', '203.0.113.42', 'Chrome · macOS', 'Wrong password · 2 of 5', 'System'),
        ev(25, 'Oct 9 · 3:58 PM', 'Support Admin 2', 'Support admin', 'Login', 'Support Admin 2', 'failed', 'critical', '203.0.113.42', 'Chrome · macOS', 'Wrong password · 3 of 5 · account locked', 'System', {
            summary: 'Support Admin 2 triggered 3 failed logins and the account was locked.'
        }),
        ev(26, 'Oct 9 · 12:30 PM', 'Priya Nair', 'Front desk', 'Check out guest', 'Hana Kim · Room 308', 'success', 'info', '192.168.1.66', 'Firefox · Windows', '—', 'Guest'),
        ev(27, 'Oct 9 · 10:02 AM', 'System', 'System', 'Stale admin account detected', 'Support Admin 2 · 92 days inactive', 'success', 'warning', '10.0.0.5', 'Server', 'Auto-flag for review', 'System'),
        ev(28, 'Oct 9 · 8:15 AM', 'Sarah Villanueva', 'Super admin', 'Enable 2FA for admins', 'All admin accounts', 'success', 'warning', '192.168.1.24', 'Chrome · macOS', 'Security baseline', 'Roles', {
            summary: 'Sarah Villanueva (Super admin) enforced 2FA for all admin accounts. Reason: Security baseline.',
            changes: [{ field: '2FA required (admins)', oldVal: 'Off', newVal: 'On', changed: true }],
            stepup: 'Yes · 2FA verified'
        }),

        // 4–7 days ago — collapsed history
        ev(29, 'Oct 8 · 5:30 PM', 'Ravi Batra', 'Manager', 'Update password policy', 'Min length 8 → 10', 'success', 'warning', '192.168.1.11', 'Safari · macOS', 'Compliance requirement', 'System', {
            summary: 'Ravi Batra (Manager) updated the password policy: minimum length 8 → 10.',
            changes: [{ field: 'Min length', oldVal: '8', newVal: '10', changed: true }]
        }),
        ev(30, 'Oct 8 · 3:14 PM', 'Marco Cruz', 'Front desk', 'Change room', 'Lena Okafor · 208 → 210', 'success', 'info', '192.168.1.31', 'Chrome · Windows', 'Guest request', 'Guest'),
        ev(31, 'Oct 8 · 1:02 PM', 'Ana Torres', 'Housekeeping', 'Login', 'Ana Torres', 'success', 'info', '192.168.1.88', 'Chrome · Android', '—', 'System'),
        ev(32, 'Oct 8 · 9:30 AM', 'Sarah Villanueva', 'Super admin', 'Update retention', 'Guest data 180 → 365 days', 'success', 'warning', '192.168.1.24', 'Chrome · macOS', 'Compliance review recommendation', 'Roles', {
            summary: 'Sarah Villanueva (Super admin) updated guest data retention from 180 to 365 days. Reason: Compliance review recommendation.',
            changes: [{ field: 'Guest data retention', oldVal: '180 days', newVal: '365 days', changed: true }],
            stepup: 'Yes · 2FA verified'
        }),
        ev(33, 'Oct 7 · 6:15 PM', 'Ravi Batra', 'Manager', 'Reveal masked data', 'Aiko Tanaka · Phone', 'success', 'warning', '192.168.1.11', 'Safari · macOS', 'Verify emergency contact', 'Data', {
            summary: 'Ravi Batra (Manager) revealed the phone number for Aiko Tanaka. Reason: Verify emergency contact.',
            changes: [{ field: 'Phone number', oldVal: '••• ••• ••78', newVal: '+81 90 1234 5678', changed: true }],
            stepup: 'Yes · 2FA verified'
        }),
        ev(34, 'Oct 7 · 2:00 PM', 'System', 'System', 'Data export scheduled', 'Daily occupancy · 6:00 PM', 'success', 'info', '10.0.0.5', 'Server', 'Scheduled task', 'System'),
        ev(35, 'Oct 7 · 11:20 AM', 'Priya Nair', 'Front desk', 'Check in guest', 'Diego Marquez · Room 303', 'success', 'info', '192.168.1.66', 'Firefox · Windows', '—', 'Guest'),
        ev(36, 'Oct 6 · 8:00 PM', 'Marco Cruz', 'Front desk', 'Login', 'Marco Cruz', 'success', 'info', '192.168.1.31', 'Chrome · macOS', '—', 'System'),
        ev(37, 'Oct 6 · 5:40 PM', 'Sarah Villanueva', 'Super admin', 'Block staff deletion', 'Ravi Batra (last Manager)', 'blocked', 'critical', '192.168.1.24', 'Chrome · macOS', 'Last Manager cannot be deleted — action blocked by policy', 'Roles', {
            summary: 'Sarah Villanueva attempted to remove the last active Manager. Action was blocked by policy.'
        }),
        ev(38, 'Oct 6 · 2:15 PM', 'Omar Haddad', 'Front desk', 'Login', 'Omar Haddad', 'failed', 'warning', '203.0.113.42', 'Firefox · Windows', 'Wrong password', 'System'),
        ev(39, 'Oct 6 · 2:14 PM', 'Omar Haddad', 'Front desk', 'Login', 'Omar Haddad', 'failed', 'warning', '203.0.113.42', 'Firefox · Windows', 'Wrong password', 'System'),
        ev(40, 'Oct 6 · 2:13 PM', 'Omar Haddad', 'Front desk', 'Login', 'Omar Haddad', 'failed', 'critical', '203.0.113.42', 'Firefox · Windows', 'Wrong password · account locked', 'System', {
            summary: 'Omar Haddad (Front desk) triggered 3 failed logins and the account was locked.'
        }),
        ev(41, 'Oct 6 · 10:00 AM', 'Sarah Villanueva', 'Super admin', 'Create admin', 'Support Admin 2', 'success', 'warning', '192.168.1.24', 'Chrome · macOS', 'New support admin', 'Roles', {
            summary: 'Sarah Villanueva (Super admin) created a new Support admin account. Reason: New support admin.',
            stepup: 'Yes · 2FA verified'
        }),
        ev(42, 'Oct 5 · 8:15 AM', 'Sarah Villanueva', 'Super admin', 'Enable 2FA requirement', 'All admins', 'success', 'warning', '192.168.1.24', 'Chrome · macOS', 'Security hardening', 'Roles', {
            summary: 'Sarah Villanueva (Super admin) enabled 2FA requirement for all admins.',
            changes: [{ field: '2FA required (admins)', oldVal: 'Off', newVal: 'On', changed: true }],
            stepup: 'Yes · 2FA verified'
        }),
        ev(43, 'Oct 5 · 6:00 PM', 'Marco Cruz', 'Front desk', 'Check out guest', 'Jamie Dela Cruz · Room 304', 'success', 'info', '192.168.1.31', 'Chrome · macOS', '—', 'Guest'),
        ev(44, 'Oct 4 · 11:30 AM', 'Support Admin 2', 'Support admin', 'Login', 'Support Admin 2', 'success', 'info', '192.168.1.55', 'Chrome · macOS', '—', 'System'),
        ev(45, 'Oct 4 · 9:15 AM', 'Marco Cruz', 'Front desk', 'Login', 'Marco Cruz', 'success', 'info', '192.168.1.31', 'Chrome · macOS', '—', 'System'),
        ev(46, 'Oct 4 · 3:40 PM', 'Marco Cruz', 'Front desk', 'Reveal masked data', 'Mei Chen · Phone', 'success', 'warning', '192.168.1.31', 'Chrome · macOS', 'Verify contact for late check-out', 'Data', {
            summary: 'Marco Cruz (Front desk) revealed the phone number for Mei Chen. Reason: Verify contact for late check-out.'
        }),
        ev(47, 'Oct 4 · 2:00 PM', 'System', 'System', 'Session timeout sweep', 'Expired sessions', 'success', 'info', '10.0.0.5', 'Server', 'Automated cleanup', 'System'),
        ev(48, 'Oct 4 · 12:30 PM', 'Priya Nair', 'Front desk', 'Login', 'Priya Nair', 'success', 'info', '192.168.1.66', 'Firefox · Windows', '—', 'System'),
        ev(49, 'Oct 4 · 11:00 AM', 'Ravi Batra', 'Manager', 'Login', 'Ravi Batra', 'success', 'info', '192.168.1.11', 'Safari · macOS', '—', 'System'),
        ev(50, 'Oct 4 · 10:30 AM', 'System', 'System', 'Backup completed', 'nightly-backup-2026-10-04', 'success', 'info', '10.0.0.5', 'Server', 'Encrypted with separate key', 'System'),
        ev(51, 'Oct 4 · 9:00 AM', 'Joy Lim', 'Housekeeping', 'Login', 'Joy Lim', 'success', 'info', '192.168.1.42', 'Chrome · Android', '—', 'System'),
        ev(52, 'Oct 4 · 7:45 AM', 'System', 'System', 'Alert rule triggered', 'Login from new country', 'success', 'warning', '10.0.0.5', 'Server', 'Recipient: security@haven.app', 'System'),
        ev(53, 'Oct 4 · 6:00 AM', 'System', 'System', 'Scheduled export completed', 'Daily arrivals · Oct 4', 'success', 'info', '10.0.0.5', 'Server', 'Sent to frontdesk@haven.app', 'System'),
        ev(54, 'Oct 3 · 8:30 PM', 'Marco Cruz', 'Front desk', 'Change room', 'Lena Okafor · 208 → 210', 'success', 'info', '192.168.1.31', 'Chrome · macOS', 'A/C noise complaint', 'Guest'),
        ev(55, 'Oct 3 · 3:30 PM', 'Sarah Villanueva', 'Super admin', 'Role change', 'Priya Nair · Guest → Front desk', 'success', 'warning', '192.168.1.24', 'Chrome · macOS', 'Hired as front desk', 'Roles', {
            summary: 'Sarah Villanueva (Super admin) promoted Priya Nair from Guest to Front desk. Reason: Hired as front desk.',
            changes: [{ field: 'Role', oldVal: 'Guest', newVal: 'Front desk', changed: true }],
            stepup: 'Yes · 2FA verified'
        }),
        ev(56, 'Oct 3 · 10:12 AM', 'Sarah Villanueva', 'Super admin', 'Create admin', 'Support Admin 1', 'success', 'warning', '192.168.1.24', 'Chrome · macOS', 'New support admin', 'Roles', {
            summary: 'Sarah Villanueva (Super admin) created Support Admin 1.',
            stepup: 'Yes · 2FA verified'
        }),
        ev(57, 'Oct 2 · 4:20 PM', 'Ravi Batra', 'Manager', 'Update SLA', 'Housekeeping 90 → 60 min', 'success', 'warning', '192.168.1.11', 'Safari · macOS', 'Improved staffing', 'System', {
            summary: 'Ravi Batra (Manager) tightened the Housekeeping SLA from 90 to 60 minutes. Reason: Improved staffing.'
        }),
        ev(58, 'Oct 2 · 3:40 PM', 'Marco Cruz', 'Front desk', 'Check in guest', 'Sofia Reyes · Room 201', 'success', 'info', '192.168.1.31', 'Chrome · macOS', '—', 'Guest'),
        ev(59, 'Oct 2 · 10:00 AM', 'System', 'System', 'Overdue rule updated', 'Grace period 6h → 4h', 'success', 'warning', '10.0.0.5', 'Server', 'Auto-applied policy change', 'System'),
        ev(60, 'Oct 1 · 9:00 AM', 'System', 'System', 'Monthly audit export', 'Sept 2026 · 1,842 events', 'success', 'info', '10.0.0.5', 'Server', 'Sent to compliance@haven.app', 'System')
    ];

    const EXPORT_HISTORY = [
        { admin: 'Sarah Villanueva', filters: 'Last 7 days · All categories', rows: 60,    format: 'CSV', time: 'Today · 10:15 AM' },
        { admin: 'Sarah Villanueva', filters: 'Sept 2026 · All',              rows: 1842,  format: 'CSV', time: 'Oct 1 · 9:00 AM' },
        { admin: 'Ravi Batra',       filters: 'Privileged actions · Oct',     rows: 124,   format: 'PDF', time: 'Oct 9 · 5:20 PM' }
    ];

    const SCHEDULED = [
        { title: 'Weekly audit digest',    schedule: 'Mon · 8:00 AM',  recipients: 'security@haven.app' },
        { title: 'Monthly compliance export', schedule: '1st of month', recipients: 'compliance@haven.app' }
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
        tab: 'log',
        search: '',
        range: '7',
        actor: 'all',
        category: 'all',
        severity: 'all',
        result: 'all',
        savedView: 'all',
        sortKey: 'time',
        sortDir: 'desc',
        live: true,
        activeEvent: null
    };

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

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

        $$('[data-role="super-admin"], [data-role-required="super-admin"]').forEach((el) => {
            if (role === 'super-admin') {
                el.removeAttribute('aria-disabled');
                el.removeAttribute('title');
            } else {
                el.setAttribute('aria-disabled', 'true');
                el.setAttribute('title', 'Super admin only');
            }
        });

        // Support admin sees a warning banner about redaction
        const banner = $('#integrityBanner');
        if (role === 'support-admin') {
            banner.querySelector('.integrity-sub').innerHTML = 'Some categories are redacted for your role. Sensitive fields shown as references only.';
        } else {
            banner.querySelector('.integrity-sub').innerHTML = 'Hash-chained entries · last entry hash <code id="lastHash">a91f…3d4e</code>';
        }

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
       FILTERING
       ========================================== */
    function filterEvents() {
        let list = [...EVENTS];
        const q = state.search.toLowerCase();

        if (q) {
            list = list.filter((e) =>
                e.actor.toLowerCase().includes(q) ||
                e.action.toLowerCase().includes(q) ||
                e.target.toLowerCase().includes(q) ||
                (e.reason && e.reason.toLowerCase().includes(q))
            );
        }
        if (state.actor !== 'all') {
            list = list.filter((e) => {
                if (state.actor === 'System') return e.isSystem;
                if (state.actor === 'Admin') return e.role === 'Super admin' || e.role === 'Support admin';
                if (state.actor === 'Staff') return ['Front desk','Housekeeping','Maintenance','Manager'].includes(e.role);
                if (state.actor === 'Guest') return e.role === 'Guest';
                return true;
            });
        }
        if (state.category !== 'all') {
            list = list.filter((e) => {
                if (state.category === 'Data') return e.category === 'Data' && e.action.toLowerCase().includes('reveal');
                if (state.category === 'Roles') return e.category === 'Roles';
                if (state.category === 'Privileged') return e.category === 'Privileged';
                if (state.category === 'System') return e.category === 'System';
                if (state.category === 'Guest') return e.category === 'Guest';
                return true;
            });
        }
        if (state.severity !== 'all') list = list.filter((e) => e.severity === state.severity);
        if (state.result !== 'all') list = list.filter((e) => e.result === state.result);

        // Saved views
        if (state.savedView === 'privileged') list = list.filter((e) => e.category === 'Privileged' || e.category === 'Roles');
        else if (state.savedView === 'data') list = list.filter((e) => e.category === 'Data');
        else if (state.savedView === 'roles') list = list.filter((e) => e.category === 'Roles');
        else if (state.savedView === 'failed') list = list.filter((e) => e.result === 'failed' || e.result === 'blocked');
        else if (state.savedView === 'guest') list = list.filter((e) => e.category === 'Guest');

        return list;
    }

    /* ==========================================
       RENDER: LOG TABLE
       ========================================== */
    function renderLog() {
        const body = $('#logBody');
        const empty = $('#logEmpty');
        const list = filterEvents();

        $('#eventCount').textContent = `${list.length} event${list.length === 1 ? '' : 's'}`;

        if (!list.length) {
            body.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        body.innerHTML = list.map((e) => {
            const sev = e.severity === 'critical' ? 'critical' : e.severity === 'warning' ? 'warning' : 'info';
            const resultLabel = e.result.charAt(0).toUpperCase() + e.result.slice(1);
            return `
                <tr tabindex="0" data-event-id="${e.id}">
                    <td class="muted" title="${e.time}">${e.time}</td>
                    <td>
                        <div class="actor-cell">
                            <span class="actor-avatar ${e.isSystem ? 'system' : e.isAnonymised ? 'anonymised' : ''}">${e.initials}</span>
                            <div>
                                <div class="actor-name">${e.actor}</div>
                                <div class="actor-role">${e.role}</div>
                            </div>
                        </div>
                    </td>
                    <td>${e.action}</td>
                    <td class="hide-md muted">${e.target}</td>
                    <td><span class="result-pill ${e.result}"><span class="dot"></span> ${resultLabel}</span></td>
                    <td class="hide-sm"><span class="sev-pill ${sev}">${sev === 'critical' ? '⚠' : sev === 'warning' ? '!' : 'i'} ${sev}</span></td>
                    <td class="hide-md muted">${e.ip}<br><span style="font-size:0.72rem">${e.device}</span></td>
                    <td class="hide-md muted">${e.reason || '—'}</td>
                </tr>
            `;
        }).join('');

        // Bind row click
        $$('tr[data-event-id]', body).forEach((row) => {
            row.addEventListener('click', () => openEventDrawer(Number(row.dataset.eventId)));
            row.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') { ev.preventDefault(); openEventDrawer(Number(row.dataset.eventId)); }
                if (ev.key === 'ArrowDown') { ev.preventDefault(); row.nextElementSibling?.focus(); }
                if (ev.key === 'ArrowUp')   { ev.preventDefault(); row.previousElementSibling?.focus(); }
            });
        });
    }

    /* ==========================================
       RENDER: TIMELINE
       ========================================== */
    function renderTimeline() {
        const today = EVENTS.filter((e) => e.time.startsWith('Today'));
        const yest  = EVENTS.filter((e) => e.time.startsWith('Yesterday'));
        const older = EVENTS.filter((e) => e.time.startsWith('Oct 9') || e.time.startsWith('Oct 8'));

        const item = (e) => `
            <li class="timeline-event" data-event-id="${e.id}">
                <span class="timeline-time">${e.time.replace(/^.*· /, '')}</span>
                <div class="timeline-body">
                    <strong>${e.actor}</strong> · ${e.action} — ${e.target}
                </div>
                <span class="result-pill ${e.result}" style="align-self:center"><span class="dot"></span> ${e.result}</span>
            </li>
        `;

        $('#timelineToday').innerHTML = today.map(item).join('');
        $('#timelineYesterday').innerHTML = yest.map(item).join('');
        $('#timelineOlder').innerHTML = older.slice(0, 12).map(item).join('');

        $$('.timeline-event').forEach((el) => {
            el.addEventListener('click', () => openEventDrawer(Number(el.dataset.eventId)));
        });
    }

    /* ==========================================
       RENDER: EXPORTS
       ========================================== */
    function renderExports() {
        $('#exportHistoryBody').innerHTML = EXPORT_HISTORY.map((x) => `
            <tr>
                <td>${x.admin}</td>
                <td class="muted">${x.filters}</td>
                <td>${x.rows}</td>
                <td class="hide-md">${x.format}</td>
                <td class="hide-sm muted">${x.time}</td>
            </tr>
        `).join('');

        $('#scheduledList').innerHTML = SCHEDULED.map((s) => `
            <li class="scheduled-item">
                <div class="scheduled-title">${s.title}</div>
                <div class="scheduled-meta">${s.schedule} · ${s.recipients}</div>
            </li>
        `).join('');
    }

    /* ==========================================
       SAVED VIEWS + CHIP FILTERS
       ========================================== */
    $$('.saved-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            state.savedView = tab.dataset.view;
            $$('.saved-tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            renderLog();
            toast('success', 'View applied', `Showing "${tab.textContent.trim().split(' ')[0]}" view.`);
        });
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
                const key = btn.dataset.filter;
                state[key] = btn.dataset.value;
                menu.hidden = true;
                chip.classList.toggle('active', btn.dataset.value !== 'all');
                $('#clearFilters').hidden = !hasActiveFilters();
                renderLog();

                // Viewing sensitive filters is logged
                if (key === 'category' && ['Data','Roles','Privileged'].includes(btn.dataset.value)) {
                    toast('success', 'Filter applied', 'Viewing sensitive category — action logged to audit.');
                }
            });
        });
    });

    document.addEventListener('click', () => {
        $$('.chip-menu').forEach((m) => m.hidden = true);
    });

    function hasActiveFilters() {
        return state.search || state.actor !== 'all' || state.category !== 'all'
            || state.severity !== 'all' || state.result !== 'all';
    }

    $('#logSearch')?.addEventListener('input', (e) => {
        state.search = e.target.value.trim();
        $('#clearFilters').hidden = !hasActiveFilters();
        renderLog();
    });

    function clearFilters() {
        state.search = ''; state.actor = 'all'; state.category = 'all';
        state.severity = 'all'; state.result = 'all';
        $('#logSearch').value = '';
        $$('.chip').forEach((c) => c.classList.remove('active'));
        $('#clearFilters').hidden = true;
        renderLog();
    }
    $('#clearFilters')?.addEventListener('click', clearFilters);
    $('#emptyClearBtn')?.addEventListener('click', clearFilters);

    /* ==========================================
       SUMMARY STRIP
       ========================================== */
    $$('.summary-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            const key = chip.dataset.summary;
            $$('.summary-chip').forEach((c) => c.classList.toggle('active', c === chip));
            if (key === 'all') { clearFilters(); return; }
            if (key === 'privileged') { state.savedView = 'privileged'; }
            else if (key === 'data') { state.savedView = 'data'; }
            else if (key === 'failed') { state.savedView = 'failed'; }
            else if (key === 'system') { state.actor = 'System'; state.savedView = 'all'; }
            else if (key === 'exports') { state.category = 'Data'; state.savedView = 'all'; }
            renderLog();
        });
    });

    /* ==========================================
       SORTING
       ========================================== */
    $$('.audit-table th.sortable').forEach((th) => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
            else { state.sortKey = key; state.sortDir = 'asc'; }
            $$('.audit-table th.sortable').forEach((h) => h.classList.remove('sort-asc', 'sort-desc'));
            th.classList.add(`sort-${state.sortDir}`);
            renderLog();
        });
    });

    /* ==========================================
       LIVE / PAUSED TOGGLE
       ========================================== */
    $('#liveBtn')?.addEventListener('click', () => {
        state.live = true;
        $('#liveBtn').classList.add('active');
        $('#pauseBtn').classList.remove('active');
        toast('success', 'Live updates resumed', 'New entries will appear as they are created.');
    });
    $('#pauseBtn')?.addEventListener('click', () => {
        state.live = false;
        $('#pauseBtn').classList.add('active');
        $('#liveBtn').classList.remove('active');
        toast('success', 'Live updates paused', 'The log will not auto-update until you resume.');
    });

    /* ==========================================
       EVENT DRAWER
       ========================================== */
    const eventDrawer = $('#eventDrawer');
    const eventOverlay = $('#eventOverlay');

    function openEventDrawer(id) {
        const e = EVENTS.find((x) => x.id === id);
        if (!e) return;
        state.activeEvent = e;

        $('#eventDrawerTitle').textContent = e.action;
        $('#eventDrawerSub').textContent = `${e.target} · ${e.time}`;
        $('#dSummary').textContent = e.summary || `${e.actor} (${e.role}) performed "${e.action}" on ${e.target}. Result: ${e.result}. Severity: ${e.severity}.`;

        const changes = e.changes || [];
        if (changes.length) {
            $('#dChanges').innerHTML = `
                <thead>
                    <tr><th>Field</th><th>Old</th><th>New</th></tr>
                </thead>
                <tbody>
                    ${changes.map((c) => `
                        <tr class="${c.changed ? 'changed' : ''}">
                            <td>${c.field}</td>
                            <td><code>${c.oldVal}</code></td>
                            <td><code>${c.newVal}</code></td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        } else {
            $('#dChanges').innerHTML = `<tbody><tr><td style="padding:12px 0;color:var(--text-muted);font-size:0.82rem">No field-level changes recorded for this event.</td></tr></tbody>`;
        }

        $('#dIP').textContent = e.ip;
        $('#dDevice').textContent = e.device;
        $('#dSession').textContent = e.session || 'ses_8a4f3c12';
        $('#dRequest').textContent = e.request || 'req_9c2b7e14';
        $('#dStepup').textContent = e.stepup || 'No';

        const related = e.related || [
            { author: 'System', text: 'Session created for this actor', time: 'Same day' },
            { author: 'System', text: 'No related events found', time: '—' }
        ];
        $('#dRelated').innerHTML = related.map((r) => `
            <li>
                <span class="history-dot"></span>
                <div>
                    <p><strong>${r.author}</strong> · ${r.text}</p>
                    <span>${r.time}</span>
                </div>
            </li>
        `).join('');

        $('#dEventId').textContent = `evt_${String(e.id).padStart(8, '0')}${e.id.toString(16).padStart(2,'0')}`;
        $('#dPrevHash').textContent = `${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`;
        $('#dThisHash').textContent = `${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`;

        eventDrawer.hidden = false;
        eventOverlay.hidden = false;
        requestAnimationFrame(() => {
            eventDrawer.classList.add('open');
            eventOverlay.classList.add('open');
        });
        document.body.style.overflow = 'hidden';
    }

    function closeEventDrawer() {
        eventDrawer.classList.remove('open');
        eventOverlay.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => { eventDrawer.hidden = true; eventOverlay.hidden = true; }, 250);
    }
    $('#eventClose')?.addEventListener('click', closeEventDrawer);
    eventOverlay?.addEventListener('click', closeEventDrawer);

    /* ==========================================
       CREATE ALERT
       ========================================== */
    $('#createAlertBtn')?.addEventListener('click', () => {
        toast('success', 'Alert rule drafted', 'Opening the alert rule editor pre-filled with your current filters.');
    });

    /* ==========================================
       EXPORT
       ========================================== */
    const exportOverlay = $('#exportOverlay');
    const stepupOverlay = $('#stepupOverlay');
    let stepupCallback = null;

    function openExport() {
        const count = filterEvents().length;
        $('#exportText').innerHTML = `You are about to export <strong>${count} events</strong> matching the current filters (${state.range === '7' ? 'last 7 days' : `last ${state.range} days`}).`;
        $('#exportReason').value = '';
        $('#exportReasonErr').textContent = '';
        $('#exportWarning').hidden = true;
        openModal(exportOverlay);
    }
    function closeExport() { closeModal(exportOverlay); }

    $('#exportBtn')?.addEventListener('click', (e) => {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            toast('error', 'Not allowed', 'Super admin only. Sensitive filters and full exports are restricted.');
            return;
        }
        openExport();
    });
    $('#exportClose')?.addEventListener('click', closeExport);
    $('#exportCancel')?.addEventListener('click', closeExport);
    exportOverlay?.addEventListener('click', (e) => { if (e.target === exportOverlay) closeExport(); });

    $('#exportLimit')?.addEventListener('change', (e) => {
        $('#exportWarning').hidden = !e.target.value.includes('10,000');
    });

    $('#exportSubmit')?.addEventListener('click', () => {
        const reason = $('#exportReason').value.trim();
        if (reason.length < 5) {
            $('#exportReasonErr').textContent = 'Please provide a reason (min 5 characters).';
            return;
        }
        $('#exportReasonErr').textContent = '';
        closeExport();
        openStepup(() => {
            toast('success', 'Export started',
                'Your CSV will be ready shortly. This export is logged in the audit trail.');
            // Log the export as an event
            EVENTS.unshift(ev(Date.now(), 'Today · Just now', ADMIN_BY_ROLE[state.role].name, ROLE_LABELS[state.role], 'Export audit log', `${filterEvents().length} events · ${reason}`, 'success', 'warning', '192.168.1.24', 'Chrome · macOS', reason, 'Data', {
                summary: `${ADMIN_BY_ROLE[state.role].name} exported ${filterEvents().length} audit events. Reason: ${reason}.`
            }));
            renderLog();
        });
    });

    /* ==========================================
       STEP-UP MODAL
       ========================================== */
    function openStepup(onVerify) {
        stepupCallback = onVerify;
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
        stepupCallback?.();
        closeStepup();
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
    function toast(type, title, message, timeout = 3500) {
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
       INITIAL RENDER
       ========================================== */
    renderLog();
    renderTimeline();
    renderExports();

    /* ==========================================
       LIVE UPDATES (simulated)
       ========================================== */
    let liveTimer = setInterval(() => {
        if (!state.live) return;
        // Small chance a new event comes in
        if (Math.random() > 0.7) {
            const actors = ['Marco Cruz', 'Joy Lim', 'Ravi Batra', 'Ana Cruz'];
            const actor = actors[Math.floor(Math.random() * actors.length)];
            const role = { 'Marco Cruz': 'Front desk', 'Joy Lim': 'Housekeeping', 'Ravi Batra': 'Manager', 'Ana Cruz': 'Front desk' }[actor];
            const newEv = ev(Date.now(), 'Today · Just now', actor, role, 'Login', actor, 'success', 'info', '192.168.1.31', 'Chrome · macOS', '—', 'System');
            EVENTS.unshift(newEv);
            $('#lastEvent').textContent = `Last event: ${newEv.time}`;
            // Flash the new row
            const firstRow = document.querySelector('#logBody tr:first-child');
            if (firstRow) firstRow.classList.add('row-new');
            renderLog();
        }
    }, 8000);

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
            closeEventDrawer();
            closeExport();
            closeStepup();
            $$('.chip-menu').forEach((m) => m.hidden = true);
        }
    });

    /* ==========================================
       LAST EVENT TICKER
       ========================================== */
    setInterval(() => {
        // Update relative time of the last event
        const lastEl = $('#lastEvent');
        if (lastEl) {
            const m = lastEl.textContent.match(/(\d+)s/);
            if (m) {
                const n = parseInt(m[1], 10) + 1;
                if (n < 60) lastEl.textContent = `Last event: ${n}s ago`;
                else lastEl.textContent = `Last event: ${Math.floor(n / 60)}m ago`;
            }
        }
    }, 1000);

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
});