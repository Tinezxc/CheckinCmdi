document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       MOCK DATA
       ========================================== */
    const BACKUPS = [
        // Newest first
        { id: 1,  time: 'Today · 2:00 AM',   type: 'Scheduled',   size: '4.2 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: 'a91f…3d4e', age: '3 hours ago' },
        { id: 2,  time: 'Yesterday · 2:00 PM', type: 'Scheduled',  size: '4.1 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '7c1e…9b02', age: '17 hours ago' },
        { id: 3,  time: 'Yesterday · 2:00 AM', type: 'Scheduled',  size: '4.1 GB', result: 'partial', location: 'Primary + Secondary',             verified: true,  checksum: '3a2f…5c1b', age: '1 day ago' },
        { id: 4,  time: 'Oct 9 · 3:15 PM',   type: 'Pre-change',  size: '4.0 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '6d8e…1a7c', age: '2 days ago', note: 'Taken before schema update' },
        { id: 5,  time: 'Oct 9 · 2:00 PM',   type: 'Scheduled',   size: '4.0 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: 'b4c5…2e8f', age: '2 days ago' },
        { id: 6,  time: 'Oct 9 · 2:00 AM',   type: 'Scheduled',   size: '3.9 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: 'e1a2…7d3c', age: '2 days ago' },
        { id: 7,  time: 'Oct 8 · 2:00 PM',   type: 'Scheduled',   size: '3.9 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: 'f9b3…4c6e', age: '3 days ago' },
        { id: 8,  time: 'Oct 8 · 2:00 AM',   type: 'Scheduled',   size: '3.8 GB', result: 'failed',  location: '—',                              verified: false, checksum: '—',          age: '3 days ago', note: 'S3 endpoint unreachable' },
        { id: 9,  time: 'Oct 7 · 3:00 PM',   type: 'Pre-change',  size: '3.8 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '2b1c…9a4d', age: '4 days ago', note: 'Taken before bulk retention change' },
        { id: 10, time: 'Oct 7 · 2:00 PM',   type: 'Scheduled',   size: '3.8 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '8d7f…3c2a', age: '4 days ago' },
        { id: 11, time: 'Oct 7 · 2:00 AM',   type: 'Scheduled',   size: '3.7 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '1e4b…6f7a', age: '4 days ago' },
        { id: 12, time: 'Oct 6 · 2:00 PM',   type: 'Scheduled',   size: '3.7 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '5a3c…8b9d', age: '5 days ago' },
        { id: 13, time: 'Oct 6 · 2:00 AM',   type: 'Scheduled',   size: '3.6 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '4f2e…1d5c', age: '5 days ago' },
        { id: 14, time: 'Oct 5 · 2:00 PM',   type: 'Scheduled',   size: '3.6 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '7b9a…2c4e', age: '6 days ago' },
        { id: 15, time: 'Oct 5 · 2:00 AM',   type: 'Scheduled',   size: '3.5 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '3d1f…9a6b', age: '6 days ago' },
        { id: 16, time: 'Oct 4 · 2:00 PM',   type: 'Scheduled',   size: '3.5 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '6c8e…4f2a', age: '7 days ago' },
        { id: 17, time: 'Oct 4 · 2:00 AM',   type: 'Scheduled',   size: '3.4 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '9e2d…1b7c', age: '7 days ago' },
        { id: 18, time: 'Oct 3 · 2:00 PM',   type: 'Scheduled',   size: '3.4 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '2f4b…6a9d', age: '8 days ago' },
        { id: 19, time: 'Oct 3 · 2:00 AM',   type: 'Scheduled',   size: '3.3 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '7a1c…3e5f', age: '8 days ago' },
        { id: 20, time: 'Oct 2 · 2:00 PM',   type: 'Manual',      size: '3.3 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '1d6b…9c2e', age: '9 days ago', note: 'Manual run before deployment' },
        { id: 21, time: 'Oct 2 · 2:00 AM',   type: 'Scheduled',   size: '3.3 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '5c4f…2a8b', age: '9 days ago' },
        { id: 22, time: 'Oct 1 · 2:00 PM',   type: 'Scheduled',   size: '3.2 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '9b2c…7d1e', age: '10 days ago' },
        { id: 23, time: 'Oct 1 · 2:00 AM',   type: 'Scheduled',   size: '3.2 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '3e8a…4c6f', age: '10 days ago' },
        { id: 24, time: 'Sep 30 · 2:00 PM',  type: 'Scheduled',   size: '3.1 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '8f1d…2b5c', age: '11 days ago' },
        { id: 25, time: 'Sep 30 · 2:00 AM',  type: 'Scheduled',   size: '3.1 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '4a2e…9d7b', age: '11 days ago' },
        { id: 26, time: 'Sep 29 · 2:00 PM',  type: 'Scheduled',   size: '3.0 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '6b9c…1a4f', age: '12 days ago' },
        { id: 27, time: 'Sep 29 · 2:00 AM',  type: 'Scheduled',   size: '3.0 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '2d8e…5f7a', age: '12 days ago' },
        { id: 28, time: 'Sep 28 · 2:00 PM',  type: 'Scheduled',   size: '2.9 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '7c1a…4b8d', age: '13 days ago' },
        { id: 29, time: 'Sep 28 · 2:00 AM',  type: 'Scheduled',   size: '2.9 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '9e4f…2c6b', age: '13 days ago' },
        { id: 30, time: 'Sep 27 · 2:00 PM',  type: 'Scheduled',   size: '2.8 GB', result: 'success', location: 'Primary + Secondary + Off-site', verified: true,  checksum: '1a5d…8c3e', age: '14 days ago' }
    ];

    const RETENTION = [
        { id: 1, type: 'Guest profiles',            retention: 365, endOfPeriod: 'Anonymise', nextPurge: 'Nov 1, 2026',  affectedIfChanged: 1240 },
        { id: 2, type: 'ID verification data',      retention: 90,  endOfPeriod: 'Delete',    nextPurge: 'Oct 20, 2026', affectedIfChanged: 412  },
        { id: 3, type: 'Stays',                     retention: 730, endOfPeriod: 'Archive',   nextPurge: 'Jan 1, 2027',  affectedIfChanged: 8900 },
        { id: 4, type: 'Service requests',          retention: 365, endOfPeriod: 'Archive',   nextPurge: 'Nov 1, 2026',  affectedIfChanged: 3420 },
        { id: 5, type: 'Audit logs',                retention: 730, endOfPeriod: 'Delete',    nextPurge: 'Never (append-only)', affectedIfChanged: 0 },
        { id: 6, type: 'Backups',                   retention: 90,  endOfPeriod: 'Delete',    nextPurge: 'Oct 25, 2026', affectedIfChanged: 30   },
        { id: 7, type: 'Exports',                   retention: 180, endOfPeriod: 'Delete',    nextPurge: 'Nov 15, 2026', affectedIfChanged: 42   }
    ];

    const REQUESTS = [
        { id: 1, requester: 'Sofia Reyes',  initials: 'SR', guestId: 'TR-1001', regId: 'HV-1001', room: '201',
          type: 'Deletion', received: 'Oct 8, 2026', due: 'Oct 22, 2026', daysLeft: 11, status: 'Blocked',
          blocked: true, blockedReason: 'Overdue stay · 2 days', assignee: 'Sarah Villanueva',
          dataIncluded: ['Guest profile', 'Contact details', 'Stay history (7 stays)', 'ID verification image', 'Service requests'],
          dataKept: [
            { item: 'Audit log entries', why: 'Legal requirement · 2 years' },
            { item: 'Payment records', why: 'Financial compliance · 7 years' },
            { item: 'Anonymised stay statistics', why: 'Preserve historical accuracy' }
          ] },
        { id: 2, requester: 'Aiko Tanaka',  initials: 'AT', guestId: 'TR-1002', regId: 'HV-1002', room: '202',
          type: 'Export',    received: 'Oct 8, 2026', due: 'Oct 14, 2026', daysLeft: 3,  status: 'Verifying identity',
          assignee: 'Support Admin 1',
          dataIncluded: ['Guest profile', 'Contact details', 'Stay history', 'Service requests'],
          dataKept: [] },
        { id: 3, requester: 'Diego Marquez', initials: 'DM', guestId: 'TR-1003', regId: 'HV-1003', room: '303',
          type: 'Export',    received: 'Oct 6, 2026', due: 'Oct 12, 2026', daysLeft: 1,  status: 'In progress',
          assignee: 'Sarah Villanueva',
          dataIncluded: ['Guest profile', 'Contact details', 'Stay history'],
          dataKept: [] },
        { id: 4, requester: 'Mei Chen',      initials: 'MC', guestId: 'TR-1006', regId: 'HV-1006', room: '204',
          type: 'Export',    received: 'Oct 4, 2026', due: 'Oct 10, 2026', daysLeft: 0,  status: 'Completed',
          assignee: 'Support Admin 1',
          dataIncluded: ['Guest profile', 'Contact details', 'Stay history', 'Service requests'],
          dataKept: [] },
        { id: 5, requester: 'Grace Abara',   initials: 'GA', guestId: 'TR-1012', regId: 'HV-1012', room: '403',
          type: 'Deletion',  received: 'Oct 2, 2026', due: 'Oct 16, 2026', daysLeft: 5,  status: 'Rejected',
          assignee: 'Sarah Villanueva',
          dataIncluded: [],
          dataKept: [], rejectedReason: 'Active stay' }
    ];

    const EXPORTS = [
        { id: 1, admin: 'Sarah Villanueva', what: 'Guest data · Sofia Reyes', filters: 'Guest ID TR-1001', rows: 1, time: 'Today · 10:12 AM' },
        { id: 2, admin: 'Sarah Villanueva', what: 'Audit log',                filters: 'Last 7 days · All', rows: 60, time: 'Today · 10:15 AM' },
        { id: 3, admin: 'Ravi Batra',       what: 'Guest list',               filters: 'In-house · All floors', rows: 128, time: 'Oct 9 · 5:20 PM' },
        { id: 4, admin: 'Marco Cruz',       what: 'Service requests',         filters: 'Last 30 days', rows: 342, time: 'Oct 8 · 3:10 PM' },
        { id: 5, admin: 'Sarah Villanueva', what: 'Retention report',         filters: 'All data types', rows: 7, time: 'Oct 7 · 11:30 AM' },
        { id: 6, admin: 'Support Admin 1',  what: 'Guest list',               filters: 'Floor 2 · Vacant clean', rows: 4, time: 'Oct 6 · 9:15 AM' },
        { id: 7, admin: 'Sarah Villanueva', what: 'Backup inventory',         filters: 'Last 30 days', rows: 30, time: 'Oct 5 · 2:00 PM' },
        { id: 8, admin: 'Ravi Batra',       what: 'Occupancy report',         filters: 'Sept 2026', rows: 30, time: 'Oct 4 · 3:00 PM' },
        { id: 9, admin: 'Sarah Villanueva', what: 'Audit log',                filters: 'Sept 2026 · All', rows: 1842, time: 'Oct 1 · 9:00 AM' },
        { id: 10, admin: 'Marco Cruz',      what: 'Guest list',               filters: 'Check-in this month', rows: 82, time: 'Sep 30 · 4:10 PM' }
    ];

    const LINKS = [
        { id: 1, label: 'Guest data export · Sofia Reyes', generatedBy: 'Sarah Villanueva', expiresIn: '18 hours', href: '#', personal: true },
        { id: 2, label: 'Audit log · last 7 days',         generatedBy: 'Sarah Villanueva', expiresIn: '4 hours',  href: '#', personal: false }
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
        reqSearch: '',
        reqType: 'all',
        reqStatus: 'all',
        activeRequest: null,
        restoreStep: 1,
        restorePoint: null,
        dirtyRetention: new Set(),
        confirmCtx: null,
        stepupCallback: null
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
       OVERVIEW — ATTENTION LIST
       ========================================== */
    function renderAttention() {
        const items = [
            { severity: 'warning', title: 'Restore test is stale', sub: 'Last verified restore was 41 days ago. Recommended every 30 days.', action: 'Run restore test' },
            { severity: 'critical', title: 'Last backup failed',    sub: 'Oct 8 · 2:00 AM — S3 endpoint unreachable. Subsequent backups succeeded.', action: 'View backup' }
        ];
        $('#attentionList').innerHTML = items.map((i, idx) => `
            <li class="attention-item">
                <span class="attention-icon ${i.severity}">${i.severity === 'critical' ? '⚠' : '!'}</span>
                <div class="attention-body">
                    <div class="attention-title">${i.title}</div>
                    <div class="attention-sub">${i.sub}</div>
                </div>
                <div class="attention-actions">
                    <button class="btn btn-outline btn-sm" data-attn="${idx}">${i.action}</button>
                </div>
            </li>
        `).join('');

        $$('[data-attn]').forEach((b) => {
            b.addEventListener('click', () => {
                const idx = Number(b.dataset.attn);
                if (items[idx].action === 'Run restore test') {
                    toast('success', 'Restore test queued', 'A test restore will run against the preview copy.');
                } else {
                    // Jump to backups tab
                    const tabs = $$('.tab');
                    const backupsTab = tabs.find((t) => t.dataset.tab === 'backups');
                    backupsTab?.click();
                    toast('success', 'Backup', 'Viewing backup history.');
                }
            });
        });
    }
    renderAttention();

    /* ==========================================
       BACKUPS TAB
       ========================================== */
    function renderBackups() {
        const body = $('#backupsBody');
        body.innerHTML = BACKUPS.map((b) => {
            const cls = b.result === 'success' ? 'pass' : b.result === 'partial' ? 'warn' : 'fail';
            const label = b.result.charAt(0).toUpperCase() + b.result.slice(1);
            return `
                <tr class="${b.result === 'failed' ? 'failed-row' : ''}" tabindex="0" data-backup-id="${b.id}">
                    <td>${b.time}${b.note ? `<div style="font-size:0.72rem;color:var(--text-muted)">${b.note}</div>` : ''}</td>
                    <td>${b.type}</td>
                    <td class="hide-md muted">${b.size}</td>
                    <td><span class="status-pill ${cls}"><span class="dot"></span> ${label}</span></td>
                    <td class="hide-sm muted">${b.location}</td>
                    <td class="hide-sm">${b.verified ? `✓ <code>${b.checksum}</code>` : `<span class="status-pill warn"><span class="dot"></span> Unverified</span>`}</td>
                    <td class="col-actions">
                        <button class="row-menu-btn" aria-label="Actions for backup" data-backup-menu="${b.id}" onclick="event.stopPropagation()">
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

        $$('tr[data-backup-id]').forEach((row) => {
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); openBackupMenu(Number(row.dataset.backupId), row); }
                if (e.key === 'ArrowDown') { e.preventDefault(); row.nextElementSibling?.focus(); }
                if (e.key === 'ArrowUp')   { e.preventDefault(); row.previousElementSibling?.focus(); }
            });
        });
        $$('[data-backup-menu]').forEach((b) => {
            b.addEventListener('click', (e) => {
                e.stopPropagation();
                openBackupMenu(Number(b.dataset.backupMenu), b);
            });
        });
    }

    function openBackupMenu(id, anchor) {
        closeAllMenus();
        const b = BACKUPS.find((x) => x.id === id);
        if (!b) return;

        const menu = document.createElement('ul');
        menu.className = 'chip-menu';
        menu.style.cssText = 'position:fixed;z-index:200;min-width:200px';
        const rect = anchor.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.right - 200}px`;

        menu.innerHTML = `
            <li><button data-menu="verify" ${b.verified ? 'disabled title="Already verified"' : ''}>Verify checksum</button></li>
            <li><button data-menu="restore" data-role="super-admin">Restore from this backup</button></li>
            <li><button data-menu="download" data-role="super-admin" ${!b.verified ? 'disabled title="Cannot download unverified backup"' : ''}>Download</button></li>
        `;
        document.body.appendChild(menu);

        menu.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', () => {
                closeAllMenus();
                const action = btn.dataset.menu;
                if (action === 'verify') toast('success', 'Verification started', `Verifying checksum for ${b.time}…`);
                else if (action === 'restore') {
                    if (state.role !== 'super-admin') { toast('error', 'Not allowed', 'Super admin only.'); return; }
                    // Pre-select this restore point
                    state.restorePoint = b;
                    $$('.tab').forEach((t) => {
                        const active = t.dataset.tab === 'restore';
                        t.classList.toggle('active', active);
                        t.setAttribute('aria-selected', String(active));
                    });
                    $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === 'restore'));
                    toast('success', 'Restore point selected', `Restore from ${b.time}.`);
                } else if (action === 'download') {
                    if (state.role !== 'super-admin') { toast('error', 'Not allowed', 'Super admin only.'); return; }
                    openConfirm('download-backup', `Download backup from <strong>${b.time}</strong> (${b.size})? This action is logged.`, 'DOWNLOAD');
                }
            });
        });

        setTimeout(() => document.addEventListener('click', closeAllMenus, { once: true }), 0);
    }

    function closeAllMenus() {
        document.querySelectorAll('.chip-menu:not([hidden])').forEach((m) => {
            if (m.parentElement === document.body) m.remove();
        });
    }

    renderBackups();

    /* ==========================================
       BACK UP NOW
       ========================================== */
    $('#backupNowBtn')?.addEventListener('click', () => {
        toast('success', 'Manual backup started', 'A pre-change snapshot is being taken now. You will be notified when it finishes.');
        // Prepend a new in-progress backup
        BACKUPS.unshift({
            id: Date.now(), time: 'Just now', type: 'Manual', size: '—', result: 'partial',
            location: 'Pending…', verified: false, checksum: '—', note: 'Running…'
        });
        renderBackups();
        setTimeout(() => {
            toast('success', 'Backup complete', 'Manual backup finished successfully.');
            renderBackups();
        }, 3000);
    });

    /* ==========================================
       RESTORE STEPPER
       ========================================== */
    function goToRestoreStep(n) {
        state.restoreStep = n;
        $$('.stepper-item').forEach((it) => {
            const i = Number(it.dataset.step);
            it.classList.toggle('active', i === n);
            it.classList.toggle('done', i < n);
        });
        $$('.restore-step').forEach((s) => s.classList.toggle('active', Number(s.dataset.rstep) === n));
        $('#restoreBack').hidden = n === 1;
        $('#restoreNext').hidden = n === 5 || n === 6;
        if (n === 6) {
            simulateRestore();
        }
    }

    $('#restoreBack')?.addEventListener('click', () => { if (state.restoreStep > 1) goToRestoreStep(state.restoreStep - 1); });
    $('#restoreNext')?.addEventListener('click', () => { if (state.restoreStep < 6) goToRestoreStep(state.restoreStep + 1); });
    $('#restoreCancel')?.addEventListener('click', () => {
        goToRestoreStep(1);
        toast('success', 'Restore cancelled', 'No changes were made.');
    });

    function renderRestorePoints() {
        const list = $('#restorePointList');
        // Show 6 most recent verified backups
        const points = BACKUPS.filter((b) => b.verified && b.result !== 'failed').slice(0, 6);
        list.innerHTML = points.map((b) => `
            <li data-point-id="${b.id}" class="${state.restorePoint?.id === b.id ? 'selected' : ''}" tabindex="0">
                <div>
                    <strong>${b.time}</strong>
                    <span>${b.type} · ${b.size} · ${b.checksum}</span>
                </div>
                <span class="status-pill pass"><span class="dot"></span> Verified</span>
            </li>
        `).join('');

        $$('li[data-point-id]', list).forEach((li) => {
            li.addEventListener('click', () => {
                const id = Number(li.dataset.pointId);
                state.restorePoint = BACKUPS.find((x) => x.id === id);
                $$('li', list).forEach((l) => l.classList.toggle('selected', l === li));
            });
        });
    }
    renderRestorePoints();

    $('#previewBtn')?.addEventListener('click', () => {
        $('#previewResult').hidden = false;
        toast('success', 'Preview copy created', 'Browse the preview before applying.');
    });

    $('#restoreStartBtn')?.addEventListener('click', () => {
        const word = $('#restoreWord').value.trim();
        const reason = $('#restoreReason').value.trim();
        let ok = true;
        if (word !== 'RESTORE PRODUCTION') {
            $('#restoreWordErr').textContent = 'Type "RESTORE PRODUCTION" exactly.';
            ok = false;
        }
        if (reason.length < 10) {
            $('#restoreReasonErr').textContent = 'Please provide a reason (min 10 characters).';
            ok = false;
        }
        if (!ok) return;
        openStepup(() => {
            toast('success', 'Restore started', 'A pre-restore snapshot is being taken.');
            goToRestoreStep(6);
        });
    });

    function simulateRestore() {
        const stages = [
            'Taking pre-restore snapshot…',
            'Restoring database… 34%',
            'Restoring database… 78%',
            'Re-applying 3 guest deletions…',
            'Rebuilding indexes…',
            'Restore complete.'
        ];
        let i = 0;
        const el = $('#restoreProgress');
        const interval = setInterval(() => {
            el.textContent = stages[i];
            i++;
            if (i >= stages.length) {
                clearInterval(interval);
                toast('success', 'Restore complete', 'System is back online. Deletions were re-applied.');
            }
        }, 900);
    }

    /* ==========================================
       RETENTION
       ========================================== */
    function renderRetention() {
        $('#retentionBody').innerHTML = RETENTION.map((r) => `
            <tr data-retention-id="${r.id}">
                <td><strong>${r.type}</strong></td>
                <td>
                    <select data-retention="${r.id}">
                        <option value="30"  ${r.retention===30?'selected':''}>30 days</option>
                        <option value="90"  ${r.retention===90?'selected':''}>90 days</option>
                        <option value="180" ${r.retention===180?'selected':''}>180 days</option>
                        <option value="365" ${r.retention===365?'selected':''}>365 days</option>
                        <option value="730" ${r.retention===730?'selected':''}>730 days</option>
                        <option value="0"   ${r.retention===0?'selected':''}>Forever</option>
                    </select>
                </td>
                <td class="hide-md">${r.endOfPeriod}</td>
                <td class="hide-sm muted">${r.nextPurge}</td>
                <td class="col-actions">
                    <button class="btn btn-ghost btn-sm" data-preview-retention="${r.id}">Preview</button>
                </td>
            </tr>
        `).join('');

        $$('[data-retention]').forEach((sel) => {
            sel.addEventListener('change', () => {
                const id = Number(sel.dataset.retention);
                const r = RETENTION.find((x) => x.id === id);
                if (Number(sel.value) !== r.retention) state.dirtyRetention.add(id);
                else state.dirtyRetention.delete(id);
                updateRetentionDirty();
            });
        });

        $$('[data-preview-retention]').forEach((b) => {
            b.addEventListener('click', () => {
                const r = RETENTION.find((x) => x.id === Number(b.dataset.previewRetention));
                toast('success', 'Preview', `Changing ${r.type} retention would affect ${r.affectedIfChanged} records.`);
            });
        });
    }

    function updateRetentionDirty() {
        const dirty = state.dirtyRetention.size > 0;
        $('#retentionDirtyHint').textContent = dirty ? `${state.dirtyRetention.size} data type(s) with unsaved changes` : 'No changes';
        $('#retentionDirtyHint').classList.toggle('dirty', dirty);
        $('#retentionSave').disabled = !dirty;
        $('#retentionDiscard').disabled = !dirty;
    }

    renderRetention();
    updateRetentionDirty();

    $('#retentionDiscard')?.addEventListener('click', () => {
        state.dirtyRetention.clear();
        renderRetention();
        updateRetentionDirty();
        toast('success', 'Discarded', 'Retention changes have been reverted.');
    });

    $('#retentionSave')?.addEventListener('click', () => {
        const affected = RETENTION.filter((r) => state.dirtyRetention.has(r.id));
        const total = affected.reduce((s, r) => s + r.affectedIfChanged, 0);
        $('#impactList').innerHTML = `
            <li>
                <strong>${total} records affected</strong>
                Changing retention for ${affected.length} data type(s) will impact ${total} records.
            </li>
            ${affected.map((r) => `<li><strong>${r.type}</strong> · Next purge ${r.nextPurge}</li>`).join('')}
        `;
        openModal($('#impactOverlay'));
    });

    $('#impactClose')?.addEventListener('click', () => closeModal($('#impactOverlay')));
    $('#impactCancel')?.addEventListener('click', () => closeModal($('#impactOverlay')));
    $('#impactOverlay')?.addEventListener('click', (e) => { if (e.target === $('#impactOverlay')) closeModal($('#impactOverlay')); });

    $('#impactContinue')?.addEventListener('click', () => {
        closeModal($('#impactOverlay'));
        openConfirm('change-retention', 'Retention changes require confirmation and step-up authentication.', 'CHANGE');
    });

    /* ==========================================
       GUEST DATA REQUESTS
       ========================================== */
    function renderRequests() {
        const q = state.reqSearch.toLowerCase();
        const list = REQUESTS.filter((r) => {
            if (state.reqType !== 'all' && r.type !== state.reqType) return false;
            if (state.reqStatus !== 'all' && r.status !== state.reqStatus) return false;
            if (!q) return true;
            return r.requester.toLowerCase().includes(q) || r.guestId.toLowerCase().includes(q) || r.room.toLowerCase().includes(q);
        });

        $('#requestsTabCount').textContent = REQUESTS.length;

        $('#requestsBody').innerHTML = list.map((r) => {
            const cls = r.blocked ? 'fail' : r.status === 'Completed' ? 'pass' : r.status === 'Rejected' ? 'neutral' : r.status === 'In progress' ? 'info' : 'warn';
            const daysLabel = r.daysLeft <= 0 ? 'Due today' : `${r.daysLeft} day${r.daysLeft === 1 ? '' : 's'}`;
            const daysClass = r.daysLeft <= 3 ? 'stat-warn' : '';
            return `
                <tr tabindex="0" data-request-id="${r.id}">
                    <td>
                        <div class="actor-cell">
                            <span class="actor-avatar">${r.initials}</span>
                            <div>
                                <div class="actor-name">${r.requester}</div>
                                <div class="actor-role">${r.guestId} · Room ${r.room}</div>
                            </div>
                        </div>
                    </td>
                    <td>${r.type}</td>
                    <td class="hide-md muted">${r.received}</td>
                    <td class="${daysClass}">${r.due}<br><span style="font-size:0.72rem">${daysLabel}</span></td>
                    <td><span class="status-pill ${cls}"><span class="dot"></span> ${r.status}</span></td>
                    <td class="hide-sm muted">${r.assignee}</td>
                    <td class="col-actions"><button class="btn btn-ghost btn-sm" data-view-request="${r.id}">Open</button></td>
                </tr>
            `;
        }).join('');

        $$('[data-view-request]').forEach((b) => {
            b.addEventListener('click', (e) => {
                e.stopPropagation();
                openRequestDrawer(Number(b.dataset.viewRequest));
            });
        });

        $$('tr[data-request-id]').forEach((row) => {
            row.addEventListener('click', () => openRequestDrawer(Number(row.dataset.requestId)));
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); openRequestDrawer(Number(row.dataset.requestId)); }
                if (e.key === 'ArrowDown') { e.preventDefault(); row.nextElementSibling?.focus(); }
                if (e.key === 'ArrowUp')   { e.preventDefault(); row.previousElementSibling?.focus(); }
            });
        });
    }

    function openRequestDrawer(id) {
        const r = REQUESTS.find((x) => x.id === id);
        if (!r) return;
        state.activeRequest = r;

        $('#reqAvatar').textContent = r.initials;
        $('#reqTitle').textContent = r.requester;
        $('#reqSub').textContent = `${r.type} request · Guest ID ${r.guestId} / ${r.regId}`;

        const statusEl = $('#reqStatusPill');
        if (r.blocked) {
            statusEl.className = 'status-pill fail';
            statusEl.innerHTML = `<span class="dot"></span> Blocked · overdue stay`;
        } else {
            const cls = r.status === 'Completed' ? 'pass' : r.status === 'Rejected' ? 'neutral' : 'info';
            statusEl.className = `status-pill ${cls}`;
            statusEl.innerHTML = `<span class="dot"></span> ${r.status}`;
        }

        $('#dType').textContent = r.type;
        $('#dReceived').textContent = r.received;
        $('#dDue').textContent = `${r.due} · ${r.daysLeft} day(s) remaining`;
        $('#dAssignee').textContent = r.assignee;
        $('#dRequester').textContent = `${r.requester} · ${r.guestId}`;

        $('#blockedWarning').hidden = !r.blocked;

        $('#dIncludedList').innerHTML = r.dataIncluded.length
            ? r.dataIncluded.map((d) => `<li>${d}</li>`).join('')
            : '<li style="color:var(--text-muted)">No data to include.</li>';

        $('#dKeptList').innerHTML = r.dataKept.length
            ? r.dataKept.map((k) => `<li><strong>${k.item}</strong> — ${k.why}</li>`).join('')
            : '<li style="color:var(--text-muted)">No data will be kept for this request.</li>';

        // Reset tabs
        $$('#reqDrawer .drawer-tab').forEach((t, idx) => {
            t.classList.toggle('active', idx === 0);
            t.setAttribute('aria-selected', String(idx === 0));
        });
        $$('#reqDrawer .drawer-panel').forEach((p, idx) => p.classList.toggle('active', idx === 0));

        $('#reqDrawer').hidden = false;
        $('#reqOverlay').hidden = false;
        requestAnimationFrame(() => {
            $('#reqDrawer').classList.add('open');
            $('#reqOverlay').classList.add('open');
        });
        document.body.style.overflow = 'hidden';
    }

    function closeRequestDrawer() {
        $('#reqDrawer').classList.remove('open');
        $('#reqOverlay').classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => { $('#reqDrawer').hidden = true; $('#reqOverlay').hidden = true; }, 250);
    }
    $('#reqClose')?.addEventListener('click', closeRequestDrawer);
    $('#reqOverlay')?.addEventListener('click', closeRequestDrawer);

    $$('#reqDrawer .drawer-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.dtab;
            $$('#reqDrawer .drawer-tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            $$('#reqDrawer .drawer-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === target));
        });
    });

    $('#resolveStayBtn')?.addEventListener('click', () => {
        toast('success', 'Resolving stay', 'Opening Check-in / out for Sofia Reyes · Room 201.');
    });

    // Verify checkboxes
    ['v1','v2','v3'].forEach((id) => {
        $(`#${id}`)?.addEventListener('change', () => {
            const all = ['v1','v2','v3'].every((i) => $(`#${i}`).checked);
            $('#markVerified').disabled = !all;
        });
    });

    $('#markVerified')?.addEventListener('click', () => {
        toast('success', 'Identity verified', 'Verification logged in the audit trail.');
    });

    $('#sendToGuestBtn')?.addEventListener('click', (e) => {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            toast('error', 'Not allowed', 'Super admin only.');
            return;
        }
        openStepup(() => {
            toast('success', 'Export link sent', 'The guest will receive a link that expires in 24 hours.');
            closeRequestDrawer();
        });
    });

    $$('.chip-select').forEach((wrap) => {
        const chip = wrap.querySelector('.chip');
        const menu = wrap.querySelector('.chip-menu');
        if (!menu) return;
        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasOpen = !menu.hidden;
            $$('.chip-menu').forEach((m) => { if (m.parentElement !== document.body) m.hidden = true; });
            menu.hidden = wasOpen;
        });
        menu.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.filter;
                state[key] = btn.dataset.value;
                menu.hidden = true;
                chip.classList.toggle('active', btn.dataset.value !== 'all');
                renderRequests();
            });
        });
    });

    document.addEventListener('click', () => {
        $$('.chip-menu').forEach((m) => { if (m.parentElement !== document.body) m.hidden = true; });
    });

    $('#reqSearch')?.addEventListener('input', (e) => {
        state.reqSearch = e.target.value.trim();
        renderRequests();
    });

    renderRequests();

    /* ==========================================
       EXPORTS TAB
       ========================================== */
    function renderExports() {
        $('#exportHistoryBody').innerHTML = EXPORTS.map((x) => `
            <tr>
                <td>${x.admin}</td>
                <td>${x.what}</td>
                <td class="hide-md muted">${x.filters}</td>
                <td>${x.rows}</td>
                <td class="hide-sm muted">${x.time}</td>
            </tr>
        `).join('');

        $('#linkList').innerHTML = LINKS.map((l) => `
            <li class="attention-item">
                <span class="attention-icon ${l.personal ? 'warning' : 'info'}">${l.personal ? '⚠' : '🔗'}</span>
                <div class="attention-body">
                    <div class="attention-title">${l.label}</div>
                    <div class="attention-sub">Generated by ${l.generatedBy} · expires in ${l.expiresIn}${l.personal ? ' · contains personal data' : ''}</div>
                </div>
                <div class="attention-actions">
                    <button class="btn btn-outline btn-sm" data-copy-link="${l.id}">Copy link</button>
                    <button class="btn btn-ghost btn-sm" data-revoke-link="${l.id}">Revoke</button>
                </div>
            </li>
        `).join('');

        $$('[data-copy-link]').forEach((b) => b.addEventListener('click', () => {
            toast('success', 'Link copied', 'Expiring link copied to clipboard.');
        }));
        $$('[data-revoke-link]').forEach((b) => b.addEventListener('click', () => {
            toast('success', 'Link revoked', 'The link can no longer be used.');
        }));
    }
    renderExports();

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
        const action = state.confirmCtx.action;
        closeConfirm();
        openStepup(() => {
            if (action === 'download-backup') toast('success', 'Download started', 'Encrypted backup download is being prepared. This action is logged.');
            else if (action === 'change-retention') {
                state.dirtyRetention.clear();
                updateRetentionDirty();
                toast('success', 'Retention updated', 'New rules will be applied at the next purge.');
            }
            else toast('success', 'Done', 'Action completed.');
        });
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
       KEYBOARD
       ========================================== */
    document.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
        if (typing && e.key !== 'Escape') return;

        if (e.key === '/') { e.preventDefault(); $('#globalSearch')?.focus(); }
        if (e.key === 'Escape') {
            closeSidebar();
            closeRequestDrawer();
            closeConfirm();
            closeStepup();
            closeModal($('#impactOverlay'));
            $$('.chip-menu').forEach((m) => { if (m.parentElement !== document.body) m.hidden = true; });
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
       HEALTH SUMMARY
       ========================================== */
    const healthEl = $('#healthText');
    const healthPill = $('#healthPill');
    // Stale restore test → amber
    healthPill.classList.add('warn');
    healthEl.textContent = 'Last backup succeeded 2:00 AM · restore test stale (41 days)';

    /* ==========================================
       STAT CARD CLICKS
       ========================================== */
    $$('.stat-card').forEach((card) => {
        card.addEventListener('click', () => {
            const key = card.dataset.stat;
            const tabs = $$('.tab');
            if (key === 'requests') tabs.find((t) => t.dataset.tab === 'requests')?.click();
            else if (key === 'last-backup' || key === 'next-backup' || key === 'size' || key === 'storage' || key === 'restore-test')
                tabs.find((t) => t.dataset.tab === 'backups')?.click();
        });
    });

    /* ==========================================
       INITIAL RENDER
       ========================================== */
    renderRestorePoints();
});