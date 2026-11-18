document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       ADMIN IDENTITY (static)
       ========================================== */
    const staffNameEl = document.querySelector('.staff-name');
    const staffAvatarEl = document.querySelector('.staff-avatar');
    const topbarAvatar = document.querySelector('.topbar-avatar');
    if (staffNameEl) staffNameEl.textContent = 'Sarah Villanueva';
    if (staffAvatarEl) staffAvatarEl.textContent = 'SV';
    if (topbarAvatar) topbarAvatar.textContent = 'SV';

    /* ==========================================
       MOBILE SIDEBAR
       ========================================== */
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
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
       ATTENTION LIST
       ========================================== */
    const ATTENTION = [
        { severity: 'critical', title: 'Last backup failed',       sub: 'Nightly backup at 3:00 AM · S3 endpoint unreachable', action: 'Open Data and backups', source: 'data' },
        { severity: 'warning',  title: 'Door-lock sync failing',   sub: 'Salto API timing out · 12 staff affected',            action: 'View integration',      source: 'integrations' },
        { severity: 'warning',  title: '1 manager without 2FA',    sub: 'Joy Lim · policy requires 2FA for manager-level',     action: 'Open Users and roles',  source: 'users' },
        { severity: 'warning',  title: '1 locked account',         sub: 'Omar Haddad · after 5 failed logins',                 action: 'Open Users and roles',  source: 'users' },
        { severity: 'warning',  title: 'Unusual data-reveal activity', sub: 'Joy Lim revealed 24 records in under an hour',     action: 'Review audit log',      source: 'audit' }
    ];

    function renderAttention() {
        const list = document.getElementById('attentionList');
        list.innerHTML = ATTENTION.map((item, i) => `
            <li class="attention-item">
                <span class="attention-icon ${item.severity}">${item.severity === 'critical' ? '⚠' : '!'}</span>
                <div class="attention-body">
                    <div class="attention-title">${item.title}</div>
                    <div class="attention-sub">${item.sub}</div>
                </div>
                <div class="attention-actions">
                    <button class="btn btn-outline btn-sm" data-attn="${i}">${item.action}</button>
                </div>
            </li>
        `).join('');

        list.querySelectorAll('[data-attn]').forEach((b) => {
            b.addEventListener('click', () => {
                const item = ATTENTION[Number(b.dataset.attn)];
                toast('success', 'Opening', item.action);
                if (item.source === 'data') window.location.href = 'admin-data.html';
                else if (item.source === 'integrations') window.location.href = 'admin-integrations.html';
                else if (item.source === 'users') window.location.href = 'admin-users.html';
                else if (item.source === 'audit') window.location.href = 'admin-audit.html';
            });
        });
    }
    renderAttention();

    /* ==========================================
       USER COUNTS
       ========================================== */
    const USERS = [
        { id: 1,  name: 'Sarah Villanueva', email: 'sarah@haven.app',   role: 'Admin',         status: 'active',  twofa: true,  lastActive: 'Now',                 initials: 'SV', isMe: true },
        { id: 2,  name: 'Ravi Batra',       email: 'ravi@haven.app',    role: 'Manager',       status: 'active',  twofa: true,  lastActive: 'Today · 4:30 PM',     initials: 'RB' },
        { id: 3,  name: 'Marco Cruz',       email: 'marco@haven.app',   role: 'Front desk',    status: 'active',  twofa: true,  lastActive: 'Today · 4:21 PM',     initials: 'MC' },
        { id: 4,  name: 'Joy Lim',          email: 'joy@haven.app',     role: 'Housekeeping',  status: 'active',  twofa: false, lastActive: 'Today · 3:40 PM',     initials: 'JL' },
        { id: 5,  name: 'Ana Torres',       email: 'ana@haven.app',     role: 'Housekeeping',  status: 'active',  twofa: true,  lastActive: 'Today · 1:02 PM',     initials: 'AT' },
        { id: 6,  name: 'Diego Santos',     email: 'diego@haven.app',   role: 'Maintenance',   status: 'active',  twofa: true,  lastActive: 'Today · 11:30 AM',    initials: 'DS' },
        { id: 7,  name: 'Priya Nair',       email: 'priya@haven.app',   role: 'Front desk',    status: 'active',  twofa: true,  lastActive: 'Today · 9:42 AM',     initials: 'PN' },
        { id: 8,  name: 'Omar Haddad',      email: 'omar@haven.app',    role: 'Front desk',    status: 'locked',  twofa: true,  lastActive: 'Oct 6 · 2:15 PM',     initials: 'OH' },
        { id: 9,  name: 'Hana Kim',         email: 'hana@haven.app',    role: 'Housekeeping',  status: 'active',  twofa: true,  lastActive: 'Oct 9 · 6:30 AM',     initials: 'HK' },
        { id: 10, name: 'Tomás Silva',      email: 'tomas@haven.app',   role: 'Maintenance',   status: 'active',  twofa: false, lastActive: 'Yesterday · 5:15 PM', initials: 'TS' },
        { id: 11, name: 'Kim Reyes',        email: 'kim@haven.app',     role: 'Housekeeping',  status: 'active',  twofa: true,  lastActive: 'Yesterday · 8:10 PM', initials: 'KR' },
        { id: 12, name: 'Alex Del Rosario', email: 'alex@haven.app',    role: 'Front desk',    status: 'invited', twofa: false, lastActive: '—',                   initials: 'AD' },
        { id: 13, name: 'Mei Chen',         email: 'mei@example.com',   role: 'Guest',         status: 'active',  twofa: false, lastActive: 'Today · 3:14 PM',     initials: 'MC' },
        { id: 14, name: 'Sofia Reyes',      email: 'sofia@example.com', role: 'Guest',         status: 'active',  twofa: false, lastActive: 'Today · 8:02 AM',     initials: 'SR', guestId: 'TR-1001', regId: 'HV-1001', room: '201', checkout: 'Oct 9, 2026', overdueDays: 2 },
        { id: 15, name: 'Aiko Tanaka',      email: 'aiko@example.com',  role: 'Guest',         status: 'active',  twofa: false, lastActive: 'Today · 10:30 AM',    initials: 'AT' },
        { id: 16, name: 'Diego Marquez',    email: 'diego.m@example.com', role: 'Guest',       status: 'active',  twofa: false, lastActive: 'Today · 11:05 AM',    initials: 'DM' },
        { id: 17, name: 'Lena Okafor',      email: 'lena@example.com',  role: 'Guest',         status: 'active',  twofa: false, lastActive: 'Yesterday · 6:42 PM', initials: 'LO' },
        { id: 18, name: 'Ravi Patel',       email: 'ravi.p@example.com', role: 'Guest',        status: 'active',  twofa: false, lastActive: 'Yesterday · 4:20 PM', initials: 'RP' },
        { id: 19, name: 'Rina Suzuki',      email: 'rina@example.com',  role: 'Guest',         status: 'active',  twofa: false, lastActive: 'Oct 8 · 3:10 PM',     initials: 'RS' },
        { id: 20, name: 'Carlos Mendez',    email: 'carlos@example.com', role: 'Guest',        status: 'active',  twofa: false, lastActive: 'Oct 7 · 9:20 AM',     initials: 'CM' }
    ];

    function renderUserCounts() {
        const counts = USERS.reduce((acc, u) => {
            acc[u.role] = (acc[u.role] || 0) + 1;
            return acc;
        }, {});
        const labels = ['Guest', 'Front desk', 'Housekeeping', 'Maintenance', 'Manager', 'Admin'];
        document.getElementById('userCounts').innerHTML = labels.map((label) => `
            <div class="user-count">
                <span class="user-count-label">${label}</span>
                <span class="user-count-value">${counts[label] || 0}</span>
            </div>
        `).join('');
    }
    renderUserCounts();

    function renderUsers() {
        const body = document.getElementById('usersBody');
        const list = USERS.slice(0, 5);
        body.innerHTML = list.map((u) => `
            <tr tabindex="0" data-user-id="${u.id}">
                <td>
                    <div class="guest-cell">
                        <span class="guest-avatar">${u.initials}</span>
                        <div>
                            <div>${u.name}${u.isMe ? ' <span class="muted">(you)</span>' : ''}</div>
                            <div class="muted" style="font-size:0.72rem">${u.email}</div>
                        </div>
                    </div>
                </td>
                <td class="hide-sm">${u.role}</td>
                <td>
                    <span class="status-pill ${u.status}">
                        <span class="dot"></span>
                        ${u.status === 'active' ? 'Active' : u.status === 'locked' ? 'Locked' : u.status === 'invited' ? 'Invited' : 'Suspended'}
                    </span>
                </td>
                <td class="hide-md">
                    ${u.twofa ? `<span class="twofa-on">✓ Enabled</span>` : `<span class="twofa-off">⚠ Not set</span>`}
                </td>
                <td class="hide-sm muted">${u.lastActive}</td>
            </tr>
        `).join('');

        body.querySelectorAll('tr[data-user-id]').forEach((row) => {
            row.addEventListener('click', () => openUserDrawer(Number(row.dataset.userId)));
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); openUserDrawer(Number(row.dataset.userId)); }
                if (e.key === 'ArrowDown') { e.preventDefault(); row.nextElementSibling?.focus(); }
                if (e.key === 'ArrowUp')   { e.preventDefault(); row.previousElementSibling?.focus(); }
            });
        });
    }
    renderUsers();

    /* ==========================================
       AUDIT FEED
       ========================================== */
    const AUDIT = [
        { staff: 'Sarah Villanueva', initials: 'SV', action: 'forced check-out for', target: 'Room 303 · Diego Marquez', time: '2 min ago', severity: 'warning' },
        { staff: 'Ravi Batra',       initials: 'RB', action: 'revealed masked data for', target: 'Sofia Reyes · TR-1001', time: '22 min ago', severity: 'info' },
        { staff: 'Sarah Villanueva', initials: 'SV', action: 'suspended account', target: 'Omar Haddad · Front desk', time: '1 hr ago', severity: 'critical' },
        { staff: 'System',           initials: 'SY', action: 'backup failed for', target: 'nightly-backup-2026-10-10', time: '3 hr ago', severity: 'critical' },
        { staff: 'Sarah Villanueva', initials: 'SV', action: 'changed role for', target: 'Ravi Batra · Manager', time: '5 hr ago', severity: 'warning' },
        { staff: 'Ravi Batra',       initials: 'RB', action: 'exported report', target: 'Audit log · Sept 2026', time: 'Yesterday · 5:20 PM', severity: 'info' },
        { staff: 'Sarah Villanueva', initials: 'SV', action: 'restored backup from', target: '2026-10-08 03:00', time: 'Yesterday · 2:10 PM', severity: 'warning' },
        { staff: 'System',           initials: 'SY', action: 'flagged unusual activity', target: 'Joy Lim · 24 reveals in 1h', time: 'Yesterday · 11:40 AM', severity: 'critical' }
    ];

    function renderAudit() {
        document.getElementById('auditFeed').innerHTML = AUDIT.map((a) => `
            <li class="audit-item">
                <span class="audit-avatar">${a.initials}</span>
                <div class="audit-body">
                    <p class="audit-text">
                        <strong>${a.staff}</strong>
                        ${a.action}
                        ${a.target ? `<em>${a.target}</em>` : ''}
                    </p>
                    <span class="audit-time">${a.time}</span>
                </div>
            </li>
        `).join('');
    }
    renderAudit();

    /* ==========================================
       INTEGRATIONS
       ========================================== */
    const INTEGRATIONS = [
        { id: 1, icon: '✉️', name: 'Email delivery',    meta: 'SendGrid · last sync 3 min ago',  status: 'healthy',  statusLabel: 'Healthy' },
        { id: 2, icon: '💬', name: 'SMS notifications', meta: 'Twilio · last sync 12 min ago',   status: 'warning',  statusLabel: 'Degraded' },
        { id: 3, icon: '💳', name: 'Payments',          meta: 'Stripe · last sync 45 min ago',   status: 'healthy',  statusLabel: 'Healthy' },
        { id: 4, icon: '🔒', name: 'Door locks',        meta: 'Salto · last sync failed',        status: 'critical', statusLabel: 'Failed' },
        { id: 5, icon: '☁️', name: 'Cloud backups',     meta: 'AWS S3 · last sync failed',       status: 'critical', statusLabel: 'Failed' }
    ];

    function renderIntegrations() {
        document.getElementById('integrationList').innerHTML = INTEGRATIONS.map((i) => `
            <li class="integration-item">
                <span class="integration-logo" aria-hidden="true">${i.icon}</span>
                <div class="integration-body">
                    <div class="integration-name">${i.name}</div>
                    <div class="integration-meta">${i.meta}</div>
                </div>
                <span class="integration-status ${i.status}">
                    ${i.status === 'healthy' ? '✓' : i.status === 'warning' ? '⚠' : '✕'}
                    ${i.statusLabel}
                </span>
                <button class="btn btn-outline btn-sm" data-test-conn="${i.id}">Test connection</button>
            </li>
        `).join('');

        document.querySelectorAll('[data-test-conn]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const integ = INTEGRATIONS.find((x) => x.id === Number(btn.dataset.testConn));
                if (integ) {
                    toast('success', 'Connection tested', `${integ.name}: ${integ.statusLabel}.`);
                }
            });
        });
    }
    renderIntegrations();

    /* ==========================================
       USER DRAWER
       ========================================== */
    const userDrawer = document.getElementById('userDrawer');
    const userDrawerOverlay = document.getElementById('userDrawerOverlay');

    function openUserDrawer(id) {
        const u = USERS.find((x) => x.id === id);
        if (!u) return;

        document.getElementById('userDrawerAvatar').textContent = u.initials;
        document.getElementById('userDrawerTitle').textContent = u.name;
        document.getElementById('userDrawerSub').textContent = `${u.role} · ${u.email}`;

        const statusEl = document.getElementById('userDrawerStatus');
        statusEl.className = `status-pill ${u.status}`;
        statusEl.innerHTML = `<span class="dot"></span> ${u.status === 'active' ? 'Active' : u.status === 'locked' ? 'Locked · requires unlock' : u.status === 'invited' ? 'Invited · invite pending' : 'Suspended'}`;

        document.getElementById('dUserRole').textContent = u.role;
        document.getElementById('dUserStatus').textContent = u.status.charAt(0).toUpperCase() + u.status.slice(1);
        document.getElementById('dUser2FA').textContent = u.twofa ? 'Enabled' : 'Not set';
        document.getElementById('dUserLastActive').textContent = u.lastActive;

        if (u.id === 14) {
            document.getElementById('dUserRoom').textContent = '201 · Floor 2';
            document.getElementById('userDrawerSub').textContent = 'Guest · TR-1001 / HV-1001';
            statusEl.className = 'status-pill overdue';
            statusEl.innerHTML = '<span class="dot"></span> Overdue · 2 days';
        } else {
            document.getElementById('dUserRoom').textContent = '—';
        }

        document.getElementById('dUserHistory').innerHTML = AUDIT.slice(0, 4).map((a) => `
            <li>
                <span class="history-dot" aria-hidden="true"></span>
                <div>
                    <strong>${a.staff}</strong> ${a.action} ${a.target ? `<em>${a.target}</em>` : ''}
                    <span>${a.time}</span>
                </div>
            </li>
        `).join('');

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
        setTimeout(() => {
            userDrawer.hidden = true;
            userDrawerOverlay.hidden = true;
        }, 250);
    }

    document.getElementById('userDrawerClose')?.addEventListener('click', closeUserDrawer);
    userDrawerOverlay?.addEventListener('click', closeUserDrawer);

    document.getElementById('breakGlassBtn')?.addEventListener('click', () => {
        openConfirm('break-glass', 'Reveal masked guest data (break-glass)? This action will be logged and reviewed.', 'REVEAL');
    });

    /* ==========================================
       STEP-UP MODAL
       ========================================== */
    const stepupOverlay = document.getElementById('stepupOverlay');
    let stepupCallback = null;

    function openStepup(onVerify) {
        stepupCallback = onVerify;
        document.getElementById('stepupPassword').value = '';
        document.getElementById('stepupCode').value = '';
        document.getElementById('stepupPasswordErr').textContent = '';
        document.getElementById('stepupCodeErr').textContent = '';
        openModal(stepupOverlay);
        setTimeout(() => document.getElementById('stepupPassword').focus(), 100);
    }
    function closeStepup() { closeModal(stepupOverlay); }

    document.getElementById('reauthBtn')?.addEventListener('click', () => {
        openStepup(() => toast('success', 'Authenticated', 'Step-up successful. Sensitive actions enabled for 15 minutes.'));
    });
    document.getElementById('stepupClose')?.addEventListener('click', closeStepup);
    document.getElementById('stepupCancel')?.addEventListener('click', closeStepup);
    stepupOverlay?.addEventListener('click', (e) => { if (e.target === stepupOverlay) closeStepup(); });

    document.getElementById('stepupVerify')?.addEventListener('click', () => {
        const pass = document.getElementById('stepupPassword').value.trim();
        const code = document.getElementById('stepupCode').value.trim();
        let ok = true;
        if (pass.length < 4) { document.getElementById('stepupPasswordErr').textContent = 'Enter your password.'; ok = false; }
        if (!/^\d{6}$/.test(code)) { document.getElementById('stepupCodeErr').textContent = 'Enter a 6-digit 2FA code.'; ok = false; }
        if (!ok) return;
        stepupCallback?.();
        closeStepup();
    });

    /* ==========================================
       CONFIRM MODAL
       ========================================== */
    const confirmOverlay = document.getElementById('confirmOverlay');
    let confirmCtx = null;

    function openConfirm(action, text, keyword = 'CONFIRM') {
        confirmCtx = { action, keyword };
        document.getElementById('confirmTitle').textContent = action === 'break-glass' ? 'Break-glass reveal' : 'Confirm';
        document.getElementById('confirmText').innerHTML = text;
        document.getElementById('confirmWordPrompt').textContent = keyword;
        document.getElementById('confirmWord').value = '';
        document.getElementById('confirmReason').value = '';
        document.getElementById('confirmWordErr').textContent = '';
        document.getElementById('confirmReasonErr').textContent = '';
        openModal(confirmOverlay);
        setTimeout(() => document.getElementById('confirmWord').focus(), 100);
    }
    function closeConfirm() { closeModal(confirmOverlay); }

    document.getElementById('confirmClose')?.addEventListener('click', closeConfirm);
    document.getElementById('confirmCancel')?.addEventListener('click', closeConfirm);
    confirmOverlay?.addEventListener('click', (e) => { if (e.target === confirmOverlay) closeConfirm(); });

    document.getElementById('confirmSubmit')?.addEventListener('click', () => {
        const word = document.getElementById('confirmWord').value.trim();
        const reason = document.getElementById('confirmReason').value.trim();
        let ok = true;
        if (word !== confirmCtx.keyword) {
            document.getElementById('confirmWordErr').textContent = `Please type "${confirmCtx.keyword}" exactly.`;
            ok = false;
        }
        if (reason.length < 5) {
            document.getElementById('confirmReasonErr').textContent = 'Please provide a reason (min 5 characters).';
            ok = false;
        }
        if (!ok) return;
        const action = confirmCtx.action;
        closeConfirm();
        openStepup(() => {
            if (action === 'break-glass') toast('success', 'Break-glass reveal', 'Data revealed for 30 seconds. Logged and will be reviewed.');
            else toast('success', 'Done', 'Action completed.');
        });
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
    const toastContainer = document.getElementById('toastContainer');
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

        if (e.key === '/') {
            e.preventDefault();
            document.getElementById('globalSearch')?.focus();
        }
        if (e.key === 'Escape') {
            closeSidebar();
            closeUserDrawer();
            closeStepup();
            closeConfirm();
        }
    });

    /* ==========================================
       LAST UPDATED TICKER
       ========================================== */
    const lastUpdated = document.getElementById('lastUpdated');
    let secs = 0;
    setInterval(() => {
        secs++;
        lastUpdated.textContent = secs < 5
            ? 'Data refreshed just now'
            : `Data refreshed ${secs}s ago`;
    }, 1000);
});