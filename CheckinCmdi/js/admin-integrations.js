document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       MOCK DATA
       ========================================== */
    const INTEGRATIONS = [
        {
            id: 1, name: 'Email (SendGrid)', icon: '✉️', category: 'Messaging', status: 'healthy',
            purpose: 'Sends transactional emails — check-in confirmations, overdue reminders, receipts.',
            lastSync: '3 minutes ago', nextSync: 'In 27 minutes', usage: '34% of 10,000',
            added: 'Sep 12, 2026 · by Sarah Villanueva', quota: 34,
            scopes: ['send_email', 'read_delivery_status', 'manage_templates'],
            dataShared: ['guest_name', 'room_number', 'check_in_date', 'check_out_date'],
            activity: [
                { text: 'Sent overdue reminder to Sofia Reyes', time: '2 minutes ago' },
                { text: 'Sent check-in confirmation to Aiko Tanaka', time: '8 minutes ago' },
                { text: 'All deliveries confirmed by SendGrid', time: 'Today · 9:00 AM' }
            ],
            history: [
                { text: 'API key rotated by Sarah Villanueva', time: 'Oct 3, 2026 · Reason: quarterly rotation' },
                { text: 'Added integration by Sarah Villanueva', time: 'Sep 12, 2026' }
            ]
        },
        {
            id: 2, name: 'SMS (Twilio)', icon: '💬', category: 'Messaging', status: 'degraded',
            purpose: 'Sends SMS reminders and confirmations. Falls back to email when unavailable.',
            lastSync: '12 minutes ago', nextSync: 'In 18 minutes', usage: '82% of 5,000 · near quota',
            added: 'Sep 12, 2026 · by Sarah Villanueva', quota: 82,
            scopes: ['send_sms', 'read_delivery_status'],
            dataShared: ['guest_name', 'phone_number'],
            activity: [
                { text: 'Sent overdue reminder to Sofia Reyes (TR-1001)', time: '10 minutes ago' },
                { text: 'Fallback triggered: 2 SMS switched to email', time: '30 minutes ago' },
                { text: 'Delivered reminder to Mei Chen', time: '1 hour ago' }
            ],
            history: [
                { text: 'Updated quota alert by Sarah Villanueva', time: 'Oct 8, 2026' },
                { text: 'Added integration by Sarah Villanueva', time: 'Sep 12, 2026' }
            ]
        },
        {
            id: 3, name: 'Payments (Stripe)', icon: '💳', category: 'Payments', status: 'healthy',
            purpose: 'Processes payments for extended stays, damages and incidentals.',
            lastSync: '45 minutes ago', nextSync: 'In 15 minutes', usage: '21% of ₱ 1,000,000',
            added: 'Sep 12, 2026 · by Sarah Villanueva', quota: 21,
            scopes: ['charge', 'refund', 'read_transactions'],
            dataShared: ['guest_name', 'amount', 'currency', 'receipt_email'],
            activity: [
                { text: 'Charged ₱ 8,232.00 for Sofia Reyes', time: '45 minutes ago' },
                { text: 'Refunded ₱ 500.00 to Hana Kim', time: 'Yesterday' }
            ],
            history: [
                { text: 'Webhook secret rotated by Sarah Villanueva', time: 'Oct 5, 2026 · Reason: routine' }
            ]
        },
        {
            id: 4, name: 'Door locks (Salto)', icon: '🔒', category: 'Door locks', status: 'failing',
            purpose: 'Issues and revokes keycards for guests during check-in and check-out.',
            lastSync: '3 hours ago', nextSync: 'Retrying in 5 minutes', usage: '—',
            added: 'Sep 20, 2026 · by Sarah Villanueva', quota: 0,
            scopes: ['issue_key', 'revoke_key', 'read_status'],
            dataShared: ['guest_name', 'room_number', 'check_in_date', 'check_out_date'],
            activity: [
                { text: 'FAILED — key revocation for room 201 (Sofia Reyes · TR-1001)', time: '3 hours ago · error 504 timeout' },
                { text: 'Key issued for Aiko Tanaka · Room 202', time: '4 hours ago' },
                { text: 'Status: Active · expires per overdue policy for Room 201', time: 'Today · 8:00 AM' }
            ],
            history: [
                { text: 'Marked failing by System', time: 'Today · 10:15 AM · Reason: 3 consecutive sync failures' }
            ]
        },
        {
            id: 5, name: 'SSO (Okta)', icon: '🛡️', category: 'Identity', status: 'healthy',
            purpose: 'Single sign-on for staff and admins. Enforces 2FA and role mapping.',
            lastSync: '2 minutes ago', nextSync: 'Real-time (event-driven)', usage: '—',
            added: 'Sep 12, 2026 · by Sarah Villanueva', quota: 0,
            scopes: ['read_profile', 'read_groups'],
            dataShared: ['staff_email', 'staff_role'],
            activity: [
                { text: 'Signed in Marco Cruz via Okta SSO', time: '3 minutes ago' },
                { text: 'Signed in Sarah Villanueva via Okta SSO · step-up verified', time: '8 minutes ago' }
            ],
            history: [
                { text: 'Updated scope mapping by Sarah Villanueva', time: 'Oct 2, 2026 · Reason: add support admin' }
            ]
        },
        {
            id: 6, name: 'Booking import (iCal)', icon: '📅', category: 'Booking', status: 'paused',
            purpose: 'Imports external bookings from partner calendars to prevent overbooking.',
            lastSync: '2 days ago', nextSync: 'Paused', usage: '—',
            added: 'Sep 22, 2026 · by Sarah Villanueva', quota: 0,
            scopes: ['read_events'],
            dataShared: ['guest_name', 'check_in_date', 'check_out_date'],
            activity: [
                { text: 'Integration paused by Sarah Villanueva', time: '2 days ago' },
                { text: 'Imported 4 bookings', time: '3 days ago' }
            ],
            history: [
                { text: 'Paused by Sarah Villanueva', time: 'Oct 9, 2026 · Reason: partner calendar migrating' }
            ]
        },
        {
            id: 7, name: 'Monitoring (Sentry)', icon: '📊', category: 'Monitoring', status: 'healthy',
            purpose: 'Captures application errors and performance data for the engineering team.',
            lastSync: '1 minute ago', nextSync: 'Real-time (event-driven)', usage: '—',
            added: 'Sep 12, 2026 · by Sarah Villanueva', quota: 0,
            scopes: ['read_errors', 'read_performance'],
            dataShared: ['error_message', 'stack_trace'],
            activity: [
                { text: 'Reported error: SendGrid webhook timeout (1 event)', time: '2 minutes ago' },
                { text: 'Reported error: Door lock sync failure (3 events)', time: '3 hours ago' }
            ],
            history: [
                { text: 'Added integration by Sarah Villanueva', time: 'Sep 12, 2026' }
            ]
        }
    ];

    const CATALOG = [
        { id: 'slack', icon: '💼', name: 'Slack', category: 'Messaging', desc: 'Send alerts and status updates to a Slack channel.', dataNeeded: 'Alert text only', perms: 'Post messages' },
        { id: 'mailchimp', icon: '📧', name: 'Mailchimp', category: 'Messaging', desc: 'Sync guest email subscriptions and send marketing.', dataNeeded: 'Email, name', perms: 'Manage lists, send campaigns' },
        { id: 'twilio2', icon: '📱', name: 'Twilio Verify', category: 'Identity', desc: 'One-time password (OTP) delivery for staff sign-in.', dataNeeded: 'Phone number', perms: 'Send OTP' },
        { id: 'onfido', icon: '🪪', name: 'Onfido', category: 'Identity', desc: 'Verify government IDs for guest registration.', dataNeeded: 'ID image, name', perms: 'Create & read checks' },
        { id: 'xero', icon: '📊', name: 'Xero', category: 'Payments', desc: 'Sync accounting entries for payments and refunds.', dataNeeded: 'Transaction data', perms: 'Write invoices' },
        { id: 'gcal', icon: '📅', name: 'Google Calendar', category: 'Booking', desc: 'Sync bookings to a shared calendar.', dataNeeded: 'Stay dates, room', perms: 'Read/write events' },
        { id: 'gdrive', icon: '☁️', name: 'Google Drive', category: 'Storage', desc: 'Back up receipts and documents.', dataNeeded: 'Files', perms: 'Upload, read' },
        { id: 'dropbox', icon: '📦', name: 'Dropbox', category: 'Storage', desc: 'Encrypted backup of receipts and contracts.', dataNeeded: 'Files', perms: 'Upload, read' },
        { id: 'datadog', icon: '🐶', name: 'Datadog', category: 'Monitoring', desc: 'Metrics, logs and traces for observability.', dataNeeded: 'Metrics & logs', perms: 'Send metrics' },
        { id: 'pagerduty', icon: '🚨', name: 'PagerDuty', category: 'Monitoring', desc: 'On-call rotations and incident escalation.', dataNeeded: 'Alert data', perms: 'Trigger incidents' },
        { id: 'smartlock', icon: '🔑', name: 'SmartLock Pro', category: 'Door locks', desc: 'Alternate door-lock provider with offline keys.', dataNeeded: 'Guest name, room', perms: 'Issue/revoke keys' },
        { id: 'quickbooks', icon: '💼', name: 'QuickBooks', category: 'Payments', desc: 'Accounting for extended stays and damages.', dataNeeded: 'Transactions', perms: 'Write invoices' },
        { id: 'auth0', icon: '🛡️', name: 'Auth0', category: 'Identity', desc: 'Alternate SSO provider for staff and admins.', dataNeeded: 'Email, role', perms: 'Read profile' },
        { id: 'rollbar', icon: '📈', name: 'Rollbar', category: 'Monitoring', desc: 'Error monitoring alternative to Sentry.', dataNeeded: 'Errors', perms: 'Read errors' }
    ];

    const WEBHOOKS = [
        { id: 1, url: 'https://hooks.haven.app/checkin-events', events: 'guest.checked_in, guest.checked_out', secret: 'whsec_·······9b2a', lastDelivery: '3 min ago · success', successRate: '99.4%' },
        { id: 2, url: 'https://hooks.haven.app/sla-alerts', events: 'sla.warning, sla.breached', secret: 'whsec_·······4f1c', lastDelivery: '12 min ago · failed 3×', successRate: '78.2%', failed: true }
    ];

    const API_KEYS = [
        { id: 1, name: 'Front desk webhook signer', scopes: 'sign:webhooks', key: '••••••••••••1a2b', created: 'Sep 20, 2026', lastUsed: '2 min ago', expiry: 'Never' },
        { id: 2, name: 'Analytics read-only', scopes: 'read:analytics', key: '••••••••••••3c4d', created: 'Sep 15, 2026', lastUsed: '1 hr ago', expiry: 'Oct 15, 2026 · expiring soon', expiring: true },
        { id: 3, name: 'Backup worker', scopes: 'read:backups, write:backups', key: '••••••••••••5e6f', created: 'Sep 12, 2026', lastUsed: 'Yesterday', expiry: 'Never' },
        { id: 4, name: 'Monitoring agent', scopes: 'write:metrics', key: '••••••••••••7g8h', created: 'Sep 12, 2026', lastUsed: '5 min ago', expiry: 'Never' }
    ];

    const LOGS = [
        { time: '10:32 AM', integration: 'Email (SendGrid)', result: 'success', error: '—', retries: '0', related: 'Overdue reminder · Sofia Reyes · Room 201' },
        { time: '10:22 AM', integration: 'SMS (Twilio)', result: 'success', error: '—', retries: '0', related: 'Overdue reminder · Sofia Reyes · Room 201' },
        { time: '10:15 AM', integration: 'Door locks (Salto)', result: 'failure', error: '504 Gateway Timeout', retries: '2', related: 'Revoke key · Room 201 · Sofia Reyes' },
        { time: '10:12 AM', integration: 'Door locks (Salto)', result: 'retry', error: 'Connection reset', retries: '1', related: 'Revoke key · Room 201' },
        { time: '10:02 AM', integration: 'Email (SendGrid)', result: 'success', error: '—', retries: '0', related: 'Check-in confirmation · Aiko Tanaka · Room 202' },
        { time: '09:45 AM', integration: 'Payments (Stripe)', result: 'success', error: '—', retries: '0', related: 'Charge ₱ 8,232.00 · Sofia Reyes' },
        { time: '09:30 AM', integration: 'Door locks (Salto)', result: 'failure', error: '504 Gateway Timeout', retries: '3', related: 'Revoke key · Room 201' },
        { time: '09:15 AM', integration: 'SMS (Twilio)', result: 'failure', error: 'Quota 82% — slowed delivery', retries: '1', related: 'Reminder · Mei Chen · Room 204' },
        { time: '09:02 AM', integration: 'Email (SendGrid)', result: 'success', error: '—', retries: '0', related: 'Booking update · Room 303' },
        { time: '08:45 AM', integration: 'SSO (Okta)', result: 'success', error: '—', retries: '0', related: 'Login · Marco Cruz' },
        { time: '08:30 AM', integration: 'Booking import (iCal)', result: 'success', error: '—', retries: '0', related: 'Imported 2 events' },
        { time: '08:15 AM', integration: 'Monitoring (Sentry)', result: 'success', error: '—', retries: '0', related: 'Reported 1 event' },
        { time: '08:00 AM', integration: 'Email (SendGrid)', result: 'success', error: '—', retries: '0', related: 'Overdue reminder · Diego Marquez · Room 303' },
        { time: '07:45 AM', integration: 'SMS (Twilio)', result: 'success', error: '—', retries: '0', related: 'Check-in reminder · Ravi Patel · Room 405' },
        { time: '07:30 AM', integration: 'Door locks (Salto)', result: 'success', error: '—', retries: '0', related: 'Issue key · Room 202 · Aiko Tanaka' },
        { time: '07:15 AM', integration: 'Payments (Stripe)', result: 'success', error: '—', retries: '0', related: 'Refund ₱ 500.00 · Hana Kim' },
        { time: '07:00 AM', integration: 'Email (SendGrid)', result: 'success', error: '—', retries: '0', related: 'Daily arrivals summary · ops@haven.app' },
        { time: '06:45 AM', integration: 'SSO (Okta)', result: 'success', error: '—', retries: '0', related: 'Login · Sarah Villanueva' },
        { time: '06:30 AM', integration: 'Monitoring (Sentry)', result: 'failure', error: 'Webhook rate limit', retries: '1', related: 'Monitoring alert' },
        { time: '06:15 AM', integration: 'SMS (Twilio)', result: 'success', error: '—', retries: '0', related: 'Reminder · Lena Okafor · Room 208' },
        { time: '06:00 AM', integration: 'Email (SendGrid)', result: 'success', error: '—', retries: '0', related: 'Daily arrivals summary' },
        { time: '05:45 AM', integration: 'Door locks (Salto)', result: 'success', error: '—', retries: '0', related: 'Issue key · Room 104 · Omar Haddad' },
        { time: '05:30 AM', integration: 'Booking import (iCal)', result: 'success', error: '—', retries: '0', related: 'Imported 1 event' },
        { time: '05:15 AM', integration: 'Monitoring (Sentry)', result: 'success', error: '—', retries: '0', related: 'Reported 0 events' },
        { time: '05:00 AM', integration: 'Email (SendGrid)', result: 'success', error: '—', retries: '0', related: 'Nightly digest' },
        { time: '04:45 AM', integration: 'SMS (Twilio)', result: 'success', error: '—', retries: '0', related: 'Reminder · Priya Nair · Room 102' },
        { time: '04:30 AM', integration: 'Door locks (Salto)', result: 'success', error: '—', retries: '0', related: 'Revoke key · Room 308 · Hana Kim' },
        { time: '04:15 AM', integration: 'Payments (Stripe)', result: 'success', error: '—', retries: '0', related: 'Payment ₱ 3,500.00 · Room 104' },
        { time: '04:00 AM', integration: 'Email (SendGrid)', result: 'success', error: '—', retries: '0', related: 'Backup report' },
        { time: '03:45 AM', integration: 'SSO (Okta)', result: 'success', error: '—', retries: '0', related: 'Nightly sync' }
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
        tab: 'connected',
        connSearch: '',
        category: 'all',
        status: 'all',
        logSearch: '',
        logResult: 'all',
        logIntegration: 'all',
        activeIntegration: null,
        selectedCatalog: null,
        addStep: 1,
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
       STATUS HELPERS
       ========================================== */
    function statusClass(status) {
        return { healthy: 'pass', degraded: 'warn', failing: 'fail', paused: 'neutral', 'not-configured': 'neutral' }[status] || 'neutral';
    }
    function statusLabel(status) {
        return { healthy: 'Healthy', degraded: 'Degraded', failing: 'Failing', paused: 'Paused', 'not-configured': 'Not configured' }[status] || status;
    }
    function statusIcon(status) {
        return { healthy: '✓', degraded: '⚠', failing: '✕', paused: '⏸', 'not-configured': '○' }[status] || '●';
    }
    function statusSort(a, b) {
        const order = { failing: 0, degraded: 1, paused: 2, 'not-configured': 3, healthy: 4 };
        return (order[a.status] ?? 99) - (order[b.status] ?? 99);
    }

    /* ==========================================
       CONNECTED TAB
       ========================================== */
    function renderConnected() {
        const grid = $('#intGrid');
        const empty = $('#intEmpty');
        const q = state.connSearch.toLowerCase();

        let list = INTEGRATIONS.filter((i) => {
            if (state.category !== 'all' && i.category !== state.category) return false;
            if (state.status !== 'all' && i.status !== state.status) return false;
            if (!q) return true;
            return i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
        });

        list.sort(statusSort);

        $('#connectedTabCount').textContent = list.length;
        $('#summaryText').textContent = `${list.length} connected · ${list.filter((i) => i.status === 'failing' || i.status === 'degraded').length} need attention`;

        if (!list.length) {
            grid.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        grid.innerHTML = list.map((i) => `
            <button class="int-card status-${i.status}" data-int-id="${i.id}">
                <div class="int-card-head">
                    <span class="int-card-icon">${i.icon}</span>
                    <div class="int-card-info">
                        <div class="int-card-name">${i.name}</div>
                        <div class="int-card-cat">${i.category}</div>
                    </div>
                    <span class="status-pill ${statusClass(i.status)}">
                        <span class="dot"></span> ${statusIcon(i.status)} ${statusLabel(i.status)}
                    </span>
                </div>
                <p class="int-card-purpose">${i.purpose}</p>
                <div class="int-card-meta">
                    <div>Last sync · <strong>${i.lastSync}</strong></div>
                    <div>Next · <strong>${i.nextSync}</strong></div>
                    ${i.usage !== '—' ? `<div>Usage · <strong>${i.usage}</strong></div>` : ''}
                </div>
                <div class="int-card-actions">
                    <button class="btn btn-outline btn-sm" data-card-action="test" data-int="${i.id}">Test</button>
                    <button class="btn btn-outline btn-sm" data-card-action="sync" data-int="${i.id}">Sync now</button>
                    <button class="btn btn-outline btn-sm" data-card-action="pause" data-int="${i.id}">${i.status === 'paused' ? 'Resume' : 'Pause'}</button>
                </div>
            </button>
        `).join('');

        $$('.int-card', grid).forEach((card) => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('[data-card-action]')) return;
                openIntegration(Number(card.dataset.intId));
            });
        });

        $$('[data-card-action]', grid).forEach((b) => {
            b.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = b.dataset.cardAction;
                const id = Number(b.dataset.int);
                const integration = INTEGRATIONS.find((x) => x.id === id);
                if (action === 'test') runTest(integration);
                else if (action === 'sync') runSync(integration);
                else if (action === 'pause') togglePause(integration);
            });
        });
    }

    function runTest(integration) {
        toast('success', 'Connection test started', `Testing ${integration.name}…`);
        setTimeout(() => {
            if (integration.status === 'failing') {
                toast('error', 'Test failed', '504 Gateway Timeout. Check provider status or rotate credentials.');
            } else {
                toast('success', 'Test passed', `${integration.name} responded in 234ms.`);
            }
        }, 900);
    }

    function runSync(integration) {
        toast('success', 'Sync triggered', `${integration.name} sync queued.`);
        setTimeout(() => {
            toast('success', 'Sync complete', `${integration.name} synced successfully.`);
        }, 1200);
    }

    function togglePause(integration) {
        const wasPaused = integration.status === 'paused';
        integration.status = wasPaused ? 'healthy' : 'paused';
        renderConnected();
        toast('success', wasPaused ? 'Integration resumed' : 'Integration paused',
            wasPaused ? `${integration.name} is active again.` : `${integration.name} is paused.`,
            10000,
            wasPaused ? null : {
                label: 'Undo',
                onClick: () => {
                    integration.status = 'healthy';
                    renderConnected();
                    toast('success', 'Resumed', `${integration.name} is active again.`);
                }
            }
        );
    }

    /* ==========================================
       CATALOG (Available tab)
       ========================================== */
    function renderCatalog(catFilter = 'all') {
        const grid = $('#catalogGrid');
        const list = catFilter === 'all' ? CATALOG : CATALOG.filter((c) => c.category === catFilter);
        $('#availableTabCount').textContent = CATALOG.length;

        grid.innerHTML = list.map((c) => `
            <div class="catalog-card">
                <div class="catalog-head">
                    <span class="catalog-icon">${c.icon}</span>
                    <div>
                        <div class="catalog-name">${c.name}</div>
                        <div class="catalog-cat">${c.category}</div>
                    </div>
                </div>
                <p class="catalog-desc">${c.desc}</p>
                <div class="catalog-meta">
                    <span>📋 ${c.dataNeeded}</span>
                    <span>🔑 ${c.perms}</span>
                </div>
                <button class="btn btn-primary btn-sm" data-add="${c.id}" style="align-self:flex-start;margin-top:8px">Add</button>
            </div>
        `).join('');

        $$('[data-add]', grid).forEach((b) => {
            b.addEventListener('click', () => {
                if (state.role !== 'super-admin') {
                    toast('error', 'Not allowed', 'Super admin only.');
                    return;
                }
                openAddDrawer(b.dataset.add);
            });
        });
    }

    $$('.cat-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            $$('.cat-chip').forEach((c) => c.classList.toggle('active', c === chip));
            renderCatalog(chip.dataset.category);
        });
    });

    /* ==========================================
       CONNECTED FILTERS
       ========================================== */
    $('#connSearch')?.addEventListener('input', (e) => {
        state.connSearch = e.target.value.trim();
        $('#clearConnFilters').hidden = !hasConnFilters();
        renderConnected();
    });

    function hasConnFilters() {
        return state.connSearch || state.category !== 'all' || state.status !== 'all';
    }

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
                $('#clearConnFilters').hidden = !hasConnFilters();

                if (key === 'category' || key === 'status') renderConnected();
                if (key === 'result' || key === 'logIntegration') renderLogs();
            });
        });
    });

    document.addEventListener('click', () => {
        $$('.chip-menu').forEach((m) => m.hidden = true);
    });

    $('#clearConnFilters')?.addEventListener('click', () => {
        state.connSearch = ''; state.category = 'all'; state.status = 'all';
        $('#connSearch').value = '';
        $$('.chip').forEach((c) => c.classList.remove('active'));
        $('#clearConnFilters').hidden = true;
        renderConnected();
    });
    $('#emptyConnClearBtn')?.addEventListener('click', () => $('#clearConnFilters').click());

    /* ==========================================
       WEBHOOKS + API KEYS
       ========================================== */
    function renderWebhooks() {
        $('#webhooksBody').innerHTML = WEBHOOKS.map((w) => `
            <tr>
                <td><code>${w.url}</code></td>
                <td class="hide-sm muted">${w.events}</td>
                <td>${w.secret}</td>
                <td>${w.lastDelivery}</td>
                <td class="hide-md">
                    <span class="status-pill ${w.failed ? 'warn' : 'pass'}">
                        <span class="dot"></span> ${w.successRate}
                    </span>
                </td>
                <td class="col-actions">
                    ${w.failed ? `<button class="btn btn-outline btn-sm" data-replay="${w.id}">Replay failed</button>` : ''}
                </td>
            </tr>
        `).join('');

        $$('[data-replay]').forEach((b) => {
            b.addEventListener('click', () => {
                toast('success', 'Events replayed', 'Failed deliveries queued for retry.');
            });
        });
    }

    function renderKeys() {
        $('#keysBody').innerHTML = API_KEYS.map((k) => `
            <tr>
                <td>${k.name}</td>
                <td class="hide-sm muted">${k.scopes}</td>
                <td><code>${k.key}</code></td>
                <td class="hide-md muted">${k.created}</td>
                <td class="hide-sm muted">${k.lastUsed}</td>
                <td>
                    ${k.expiring
                        ? `<span class="status-pill warn"><span class="dot"></span> ${k.expiry}</span>`
                        : `<span class="muted">${k.expiry}</span>`}
                </td>
                <td class="col-actions">
                    <button class="btn btn-ghost btn-sm" data-rotate-key="${k.id}" data-role="super-admin">Rotate</button>
                    <button class="btn btn-ghost btn-sm" data-revoke-key="${k.id}" data-role="super-admin">Revoke</button>
                </td>
            </tr>
        `).join('');

        $$('[data-rotate-key]').forEach((b) => {
            b.addEventListener('click', (e) => {
                if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
                    toast('error', 'Not allowed', 'Super admin only.');
                    return;
                }
                openConfirm('rotate-key', 'Rotate this API key? The old key will be revoked immediately.', 'ROTATE');
            });
        });
        $$('[data-revoke-key]').forEach((b) => {
            b.addEventListener('click', (e) => {
                if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
                    toast('error', 'Not allowed', 'Super admin only.');
                    return;
                }
                openConfirm('revoke-key', 'Revoke this API key? Any service using it will fail immediately.', 'REVOKE');
            });
        });
    }

    /* ==========================================
       LOGS TAB
       ========================================== */
    function renderLogs() {
        const body = $('#logsBody');
        const empty = $('#logsEmpty');
        const q = state.logSearch.toLowerCase();

        let list = LOGS.filter((l) => {
            if (state.logResult !== 'all' && l.result !== state.logResult) return false;
            if (state.logIntegration !== 'all' && l.integration !== state.logIntegration) return false;
            if (!q) return true;
            return l.integration.toLowerCase().includes(q) || l.error.toLowerCase().includes(q) || l.related.toLowerCase().includes(q);
        });

        if (!list.length) {
            body.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        body.innerHTML = list.map((l) => {
            const resultLabel = l.result.charAt(0).toUpperCase() + l.result.slice(1);
            const cls = l.result === 'success' ? 'pass' : l.result === 'failure' ? 'fail' : 'warn';
            return `
                <tr>
                    <td class="muted">${l.time}</td>
                    <td>${l.integration}</td>
                    <td><span class="status-pill ${cls}"><span class="dot"></span> ${resultLabel}</span></td>
                    <td class="hide-md muted">${l.error}</td>
                    <td class="hide-sm muted">${l.retries}</td>
                    <td class="hide-md muted">${l.related}</td>
                </tr>
            `;
        }).join('');
    }

    $('#logSearchInput')?.addEventListener('input', (e) => {
        state.logSearch = e.target.value.trim();
        renderLogs();
    });

    $('#exportLogsBtn')?.addEventListener('click', () => {
        openStepup(() => toast('success', 'Export started', 'Delivery logs will be emailed as CSV.'));
    });

    /* ==========================================
       INTEGRATION DRAWER
       ========================================== */
    const intDrawer = $('#intDrawer');
    const intOverlay = $('#intOverlay');

    function openIntegration(id) {
        const i = INTEGRATIONS.find((x) => x.id === id);
        if (!i) return;
        state.activeIntegration = i;

        $('#dLogo').textContent = i.icon;
        $('#intDrawerTitle').textContent = i.name;
        $('#intDrawerSub').textContent = `${i.category} · ${i.purpose.split('.')[0]}`;
        const statusEl = $('#intDrawerStatus');
        statusEl.className = `status-pill ${statusClass(i.status)}`;
        statusEl.innerHTML = `<span class="dot"></span> ${statusIcon(i.status)} ${statusLabel(i.status)}`;

        $('#dSummary').textContent = i.purpose;
        $('#dLastSync').textContent = i.lastSync;
        $('#dNextSync').textContent = i.nextSync;
        $('#dUsage').textContent = i.usage;
        $('#dAdded').textContent = i.added;

        $('#dScopes').innerHTML = i.scopes.map((s) => `<li>${s}</li>`).join('');
        $('#dDataList').innerHTML = i.dataShared.map((s) => `<li>${s}</li>`).join('');

        $('#dActivity').innerHTML = i.activity.map((a) => `
            <li>
                <span class="history-dot"></span>
                <div>
                    <p>${a.text}</p>
                    <span>${a.time}</span>
                </div>
            </li>
        `).join('');

        $('#dHistory').innerHTML = i.history.map((h) => `
            <li>
                <span class="history-dot"></span>
                <div>
                    <p>${h.text}</p>
                    <span>${h.time}</span>
                </div>
            </li>
        `).join('');

        // Reset tabs
        $$('#intDrawer .drawer-tab').forEach((t, idx) => {
            t.classList.toggle('active', idx === 0);
            t.setAttribute('aria-selected', String(idx === 0));
        });
        $$('#intDrawer .drawer-panel').forEach((p, idx) => p.classList.toggle('active', idx === 0));

        intDrawer.hidden = false;
        intOverlay.hidden = false;
        requestAnimationFrame(() => {
            intDrawer.classList.add('open');
            intOverlay.classList.add('open');
        });
        document.body.style.overflow = 'hidden';
    }

    function closeIntegration() {
        intDrawer.classList.remove('open');
        intOverlay.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => { intDrawer.hidden = true; intOverlay.hidden = true; }, 250);
    }
    $('#intDrawerClose')?.addEventListener('click', closeIntegration);
    intOverlay?.addEventListener('click', closeIntegration);

    $$('#intDrawer .drawer-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.dtab;
            $$('#intDrawer .drawer-tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            $$('#intDrawer .drawer-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === target));
        });
    });

    $$('#intDrawer .quick-btn').forEach((b) => {
        b.addEventListener('click', () => {
            if (b.getAttribute('aria-disabled') === 'true') {
                toast('error', 'Not allowed', 'Super admin only.');
                return;
            }
            const i = state.activeIntegration;
            if (!i) return;
            const action = b.dataset.action;
            if (action === 'test') runTest(i);
            else if (action === 'sync') runSync(i);
            else if (action === 'pause') { togglePause(i); closeIntegration(); }
            else if (action === 'configure') toast('success', 'Configuration opened', 'Editing configuration is in the Configuration tab.');
        });
    });

    $$('[data-rotate]').forEach((b) => {
        b.addEventListener('click', (e) => {
            if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
                toast('error', 'Not allowed', 'Super admin only.');
                return;
            }
            const i = state.activeIntegration;
            openConfirm('rotate-' + b.dataset.rotate, `Rotate the ${b.dataset.rotate} for <strong>${i.name}</strong>? The old value will be revoked immediately.`, 'ROTATE');
        });
    });

    /* ==========================================
       ADD INTEGRATION DRAWER
       ========================================== */
    const addDrawer = $('#addDrawer');
    const addOverlay = $('#addOverlay');

    function openAddDrawer(catalogId) {
        state.selectedCatalog = catalogId ? CATALOG.find((c) => c.id === catalogId) : null;
        state.addStep = 1;
        goToAddStep(1);
        renderChooseList();
        addDrawer.hidden = false;
        addOverlay.hidden = false;
        requestAnimationFrame(() => {
            addDrawer.classList.add('open');
            addOverlay.classList.add('open');
        });
        document.body.style.overflow = 'hidden';
    }
    function closeAddDrawer() {
        addDrawer.classList.remove('open');
        addOverlay.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => { addDrawer.hidden = true; addOverlay.hidden = true; }, 250);
    }
    $('#addIntegrationBtn')?.addEventListener('click', (e) => {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            toast('error', 'Not allowed', 'Super admin only.');
            return;
        }
        openAddDrawer(null);
    });
    $('#addClose')?.addEventListener('click', closeAddDrawer);
    $('#addCancel')?.addEventListener('click', closeAddDrawer);
    addOverlay?.addEventListener('click', closeAddDrawer);

    function renderChooseList() {
        $('#chooseList').innerHTML = CATALOG.map((c) => `
            <button class="choose-item ${state.selectedCatalog?.id === c.id ? 'selected' : ''}" data-choose="${c.id}">
                <span>${c.icon}</span>
                <div>
                    <div style="font-weight:600">${c.name}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${c.category} · ${c.desc}</div>
                </div>
            </button>
        `).join('');

        $$('[data-choose]').forEach((b) => {
            b.addEventListener('click', () => {
                state.selectedCatalog = CATALOG.find((c) => c.id === b.dataset.choose);
                $$('.choose-item').forEach((i) => i.classList.remove('selected'));
                b.classList.add('selected');
            });
        });
    }

    function goToAddStep(n) {
        state.addStep = n;
        $$('#addDrawer .stepper-item').forEach((it) => {
            const i = Number(it.dataset.step);
            it.classList.toggle('active', i === n);
            it.classList.toggle('done', i < n);
        });
        $$('#addDrawer .wizard-step').forEach((s) => s.classList.toggle('active', Number(s.dataset.wstep) === n));
        $('#addSub').textContent = `Step ${n} of 5 · ${['Choose', 'Connect', 'Scopes', 'Test', 'Activate'][n - 1]}`;
        $('#addBack').hidden = n === 1;
        $('#addNext').hidden = n === 5;
        $('#addActivate').hidden = n !== 5;
        if (n === 3) buildScopesAndData();
        if (n === 4) $('#testResult').textContent = 'Ready to test.';
        if (n === 5) buildSummary();
    }

    function buildScopesAndData() {
        const c = state.selectedCatalog;
        if (!c) return;
        $('#addScopeList').innerHTML = c.perms.split(',').map((p) => `<li>${p.trim()}</li>`).join('');
        $('#addDataList').innerHTML = c.dataNeeded.split(',').map((d) => `<li>${d.trim()}</li>`).join('');
    }

    function buildSummary() {
        const c = state.selectedCatalog;
        if (!c) return;
        const env = document.querySelector('input[name="env"]:checked')?.value || 'prod';
        $('#sumInt').textContent = c.name;
        $('#sumEnv').textContent = env === 'prod' ? 'Production' : 'Sandbox';
        $('#sumScopes').textContent = c.perms.split(',').length + ' scope(s)';
        $('#sumData').textContent = c.dataNeeded.split(',').length + ' field(s)';
    }

    $('#addBack')?.addEventListener('click', () => {
        if (state.addStep > 1) goToAddStep(state.addStep - 1);
    });
    $('#addNext')?.addEventListener('click', () => {
        if (state.addStep === 1 && !state.selectedCatalog) {
            toast('error', 'Select an integration', 'Pick a service to connect.');
            return;
        }
        if (state.addStep < 5) goToAddStep(state.addStep + 1);
    });

    $('#runTestBtn')?.addEventListener('click', () => {
        const el = $('#testResult');
        el.className = 'test-result';
        el.textContent = 'Testing connection…';
        setTimeout(() => {
            el.className = 'test-result pass';
            el.textContent = '✓ Connection successful. Credentials valid.';
        }, 900);
    });

    $('#addActivate')?.addEventListener('click', () => {
        const btn = $('#addActivate');
        btn.disabled = true;
        btn.querySelector('.btn-spinner').hidden = false;
        setTimeout(() => {
            btn.disabled = false;
            btn.querySelector('.btn-spinner').hidden = true;
            toast('success', 'Integration activated', `${state.selectedCatalog.name} is now live.`);
            closeAddDrawer();
        }, 900);
    });

    /* ==========================================
       SETTINGS FORM
       ========================================== */
    $('#intSettingsForm')?.addEventListener('input', () => {
        // Simplest possible: mark as dirty via toast only on save
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

        const action = state.confirmCtx.action;
        closeConfirm();

        openStepup(() => {
            if (action === 'rotate-key' || action.startsWith('rotate-')) toast('success', 'Key rotated', 'The new key has been issued. Old one revoked.');
            else if (action === 'revoke-key') toast('success', 'Key revoked', 'The API key is no longer valid.');
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
            closeIntegration();
            closeAddDrawer();
            closeConfirm();
            closeStepup();
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
       INITIAL RENDER
       ========================================== */
    renderConnected();
    renderCatalog('all');
    renderWebhooks();
    renderKeys();
    renderLogs();
});