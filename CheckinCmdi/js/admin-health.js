document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       MOCK DATA
       ========================================== */
    const SERVICES = [
        { id: 1, name: 'Guest portal',      icon: '👤', status: 'operational', uptime: '99.99%', latency: '180 ms', lastIncident: '42 days ago', deps: 'Database, Auth' },
        { id: 2, name: 'Staff app',         icon: '🧑‍💼', status: 'operational', uptime: '99.97%', latency: '220 ms', lastIncident: '18 days ago', deps: 'Database, Auth, File storage' },
        { id: 3, name: 'Admin app',         icon: '🛡️', status: 'operational', uptime: '99.98%', latency: '240 ms', lastIncident: '9 days ago',  deps: 'Database, Auth' },
        { id: 4, name: 'Database',          icon: '🗄️', status: 'operational', uptime: '99.99%', latency: '24 ms',  lastIncident: '31 days ago', deps: '—' },
        { id: 5, name: 'Authentication',    icon: '🔑', status: 'operational', uptime: '100%',   latency: '90 ms',  lastIncident: 'Never',       deps: 'Database' },
        { id: 6, name: 'Email delivery',    icon: '✉️', status: 'operational', uptime: '99.94%', latency: '1.1 s',  lastIncident: '6 days ago',  deps: 'SendGrid' },
        { id: 7, name: 'SMS delivery',      icon: '💬', status: 'degraded',    uptime: '99.2%',  latency: '2.4 s',  lastIncident: 'Today',       deps: 'Twilio', impact: '2 staff affected', summary: 'SMS delivery is slow — 82% of monthly quota reached. Fallback to email is active.' },
        { id: 8, name: 'Payments',          icon: '💳', status: 'operational', uptime: '99.99%', latency: '340 ms', lastIncident: '22 days ago', deps: 'Stripe' },
        { id: 9, name: 'Door locks',        icon: '🔒', status: 'degraded',    uptime: '99.2%',  latency: '1.8 s',  lastIncident: '3 hours ago', deps: 'Salto, Database, Auth', impact: '12 staff affected', summary: 'Sync from Salto is timing out. 3 key revocations are queued for retry. Check-ins are unaffected (new keys are issued faster).' },
        { id: 10, name: 'File storage',     icon: '📁', status: 'operational', uptime: '99.98%', latency: '260 ms', lastIncident: '14 days ago', deps: 'AWS S3' },
        { id: 11, name: 'Scheduled jobs',   icon: '⏱️', status: 'degraded',    uptime: '98.9%',  latency: '—',      lastIncident: 'Today',       deps: 'Database', impact: '1 job missed', summary: 'Reminder emails missed their last schedule — worker was blocked by a long-running retention task.' }
    ];

    const JOBS = [
        { id: 1, name: 'Nightly backup',          schedule: 'Every 12h · 2AM / 2PM', lastRun: 'Today · 2:00 AM', duration: '1m 42s', result: 'success', nextRun: 'Today · 2:00 PM', queue: 0 },
        { id: 2, name: 'Overdue check',           schedule: 'Every hour',            lastRun: 'Today · 10:00 AM', duration: '0.4s',   result: 'success', nextRun: 'Today · 11:00 AM', queue: 0, note: 'Flagged 1 guest: Sofia Reyes · Room 201' },
        { id: 3, name: 'Reminder emails',         schedule: 'Every hour',            lastRun: 'Today · 9:00 AM', duration: '—',      result: 'missed',  nextRun: 'Today · 11:00 AM', queue: 148, note: 'Missed schedule at 10:00 AM — worker busy with retention purge' },
        { id: 4, name: 'Report generation',       schedule: 'Daily · 6AM',           lastRun: 'Today · 6:00 AM', duration: '3m 12s', result: 'success', nextRun: 'Tomorrow · 6:00 AM', queue: 3 },
        { id: 5, name: 'Retention purge',         schedule: 'Daily · 3AM',           lastRun: 'Today · 3:00 AM', duration: '8m 4s',  result: 'success', nextRun: 'Tomorrow · 3:00 AM', queue: 0 },
        { id: 6, name: 'Session cleanup',         schedule: 'Every 15 min',          lastRun: 'Today · 10:45 AM', duration: '0.2s',   result: 'success', nextRun: 'Today · 11:00 AM', queue: 0 },
        { id: 7, name: 'Quota check',             schedule: 'Every 15 min',          lastRun: 'Today · 10:45 AM', duration: '0.1s',   result: 'success', nextRun: 'Today · 11:00 AM', queue: 0, note: 'SMS quota warning at 82%' },
        { id: 8, name: 'Door lock sync',          schedule: 'Every 5 min',           lastRun: 'Today · 10:55 AM', duration: '22s',    result: 'failed',  nextRun: 'Today · 11:00 AM', queue: 3, note: 'Salto endpoint timing out — retrying' },
        { id: 9, name: 'Webhook delivery',        schedule: 'Every minute',          lastRun: 'Today · 10:59 AM', duration: '1.2s',   result: 'success', nextRun: 'Today · 11:00 AM', queue: 12 },
        { id: 10, name: 'Daily audit digest',     schedule: 'Daily · 8AM',           lastRun: 'Today · 8:00 AM', duration: '4.4s',   result: 'success', nextRun: 'Tomorrow · 8:00 AM', queue: 0 }
    ];

    const ERRORS = [
        { id: 1, message: 'Webhook delivery failed · POST /api/stripe/webhook', count: 142, first: 'Today · 02:14 AM', last: 'Today · 03:02 AM', affected: '3 payments', status: 'Investigating',
          summary: 'Payment provider webhooks were intermittently failing because the delivery endpoint was returning 502 responses. 3 charges did not update their status and were resolved by the retry queue.',
          request: 'req_9c2b7e14', audit: 'evt_8a4f3c12', trace: 'trace_a91f3d4e' },
        { id: 2, message: 'Salto API 504 Gateway Timeout', count: 38, first: 'Today · 07:32 AM', last: 'Today · 10:55 AM', affected: '12 staff', status: 'Investigating',
          summary: 'Door lock provider API is timing out during sync. Retries are queued.', request: 'req_2e9c1f30', audit: 'evt_3d21b0fe', trace: 'trace_7a1c5f22' },
        { id: 3, message: 'Slow query on stays · check_out > now()', count: 24, first: 'Today · 08:00 AM', last: 'Today · 10:00 AM', affected: '—', status: 'New' },
        { id: 4, message: 'SMS quota warning (82%)', count: 12, first: 'Yesterday · 6:00 PM', last: 'Today · 10:45 AM', affected: '—', status: 'New' },
        { id: 5, message: 'Reminder email delayed > 30 min', count: 8, first: 'Today · 09:00 AM', last: 'Today · 10:00 AM', affected: '148 emails', status: 'New' },
        { id: 6, message: 'Session expiry race condition', count: 6, first: 'Oct 9', last: 'Oct 9', affected: '2 staff', status: 'Resolved' },
        { id: 7, message: 'File upload timeout (id documents)', count: 4, first: 'Oct 8', last: 'Oct 8', affected: '1 guest', status: 'Resolved' },
        { id: 8, message: 'Stale cache on /rooms board', count: 3, first: 'Oct 7', last: 'Oct 7', affected: '—', status: 'Resolved' },
        { id: 9, message: 'Duplicate charge attempt (idempotency)', count: 2, first: 'Oct 6', last: 'Oct 6', affected: '1 payment', status: 'Resolved' },
        { id: 10, message: 'Notification email failed (bad address)', count: 12, first: 'Oct 5', last: 'Oct 5', affected: '1 staff', status: 'Ignored', note: 'Staff email was corrected manually' },
        { id: 11, message: 'Sentry rate limit — events dropped', count: 1, first: 'Oct 4', last: 'Oct 4', affected: '—', status: 'Ignored' },
        { id: 12, message: 'Idle session cleanup took > 30s', count: 1, first: 'Oct 3', last: 'Oct 3', affected: '—', status: 'Ignored' }
    ];

    const RESOLVED_INCIDENTS = [
        { id: 1, title: 'Database connection pool exhaustion', severity: 'Major', start: 'Sep 28 · 10:12 AM', end: 'Sep 28 · 10:52 AM', duration: '40 min', cause: 'Connection leak in a background job', handler: 'Sarah Villanueva',
          impact: 'Staff app slowed for ~12 minutes', followUps: 'Deployed connection leak fix · added Sentry alert' },
        { id: 2, title: 'Email delivery delays', severity: 'Minor', start: 'Sep 22 · 3:14 PM', end: 'Sep 22 · 5:02 PM', duration: '1h 48m', cause: 'SendGrid upstream delay', handler: 'Ravi Batra',
          impact: 'Check-in confirmation emails delayed by ~30 min', followUps: 'Added SendGrid to external uptime monitor' }
    ];

    const SERVICE_HISTORY = (() => {
        const days = [];
        for (let i = 89; i >= 0; i--) {
            // Mostly operational with a couple degraded/down days
            let status = 'operational';
            if (i === 0 || i === 1) status = 'degraded';
            else if (i === 30) status = 'down';
            else if (i === 45 || i === 60) status = 'degraded';
            else if (i % 17 === 0) status = 'no-data';
            days.push({ day: i, status });
        }
        return days;
    })();

    const WINDOWS = [
        { id: 1, title: 'Database index rebuild', start: 'Oct 14, 2026 · 11:30 PM', end: 'Oct 15, 2026 · 1:00 AM', impact: 'Staff app read-only for ~15 minutes', announce: true, by: 'Sarah Villanueva' },
        { id: 2, title: 'Stripe webhook endpoint update', start: 'Oct 22, 2026 · 2:00 AM', end: 'Oct 22, 2026 · 2:15 AM', impact: 'None expected', announce: true, by: 'Sarah Villanueva' }
    ];

    const RULES = [
        { id: 1, title: 'Error rate > 2% for 5 minutes', severity: 'critical', recipients: 'security@haven.app, ops@haven.app', enabled: true },
        { id: 2, title: 'Any job fails twice in a row',  severity: 'warning',  recipients: 'ops@haven.app',                  enabled: true },
        { id: 3, title: 'Job misses its schedule',       severity: 'warning',  recipients: 'ops@haven.app',                  enabled: true },
        { id: 4, title: 'Service latency p95 > 2× baseline for 10 min', severity: 'warning', recipients: 'ops@haven.app', enabled: true }
    ];

    const ROLE_LABELS = { 'super-admin': 'Super admin', 'support-admin': 'Support admin' };
    const ADMIN_BY_ROLE = {
        'super-admin': { name: 'Sarah Villanueva', initials: 'SV' },
        'support-admin': { name: 'Support Admin 1', initials: 'SA' }
    };

    const state = {
        role: 'super-admin',
        tab: 'overview',
        range: '24h',
        autoRefresh: true,
        errSearch: '',
        errStatus: 'all',
        activeService: null,
        activeError: null,
        confirmCtx: null,
        stepupCallback: null
    };

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

    /* ==========================================
       STATUS HELPERS
       ========================================== */
    function statusClass(status) {
        return { operational: 'pass', degraded: 'warn', down: 'fail', maintenance: 'info', 'no-data': 'neutral' }[status] || 'neutral';
    }
    function statusLabel(status) {
        return { operational: 'Operational', degraded: 'Degraded', down: 'Down', maintenance: 'Maintenance', 'no-data': 'No data' }[status] || status;
    }
    function statusIcon(status) {
        return { operational: '✓', degraded: '⚠', down: '✕', maintenance: '🔧', 'no-data': '—' }[status] || '●';
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
       OVERVIEW — SERVICE GRID
       ========================================== */
    function renderServiceGrid() {
        $('#serviceGrid').innerHTML = SERVICES.map((s) => `
            <button class="service-item" data-service-id="${s.id}">
                <span class="status-pill ${statusClass(s.status)}">
                    <span class="dot"></span> ${statusIcon(s.status)} ${statusLabel(s.status)}
                </span>
                <span class="service-name">${s.icon} ${s.name}</span>
                <span class="service-status-text">${s.uptime} · ${s.latency}</span>
            </button>
        `).join('');

        $$('.service-item').forEach((btn) => {
            btn.addEventListener('click', () => openService(Number(btn.dataset.serviceId)));
        });
    }
    renderServiceGrid();

    /* ==========================================
       OVERVIEW — ATTENTION LIST
       ========================================== */
    function renderAttention() {
        const items = [
            { severity: 'critical', title: 'Door-lock sync failing for 3 hours', sub: '12 staff affected · keys queued for retry', action: 'Open incident', source: 'incident' },
            { severity: 'warning', title: 'SMS delivery degraded (82% quota)',   sub: 'Fallback to email is active',              action: 'View integration', source: 'integrations' },
            { severity: 'warning', title: 'Reminder emails job missed schedule',  sub: 'Worker blocked by retention purge',        action: 'View job', source: 'jobs' },
            { severity: 'warning', title: 'External monitor: Salto upstream',     sub: 'Vendor reporting elevated latency',        action: 'View external status', source: 'external' }
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
                const i = items[Number(b.dataset.attn)];
                if (i.source === 'incident') {
                    $$('.tab').find((t) => t.dataset.tab === 'incidents')?.click();
                } else if (i.source === 'jobs') {
                    $$('.tab').find((t) => t.dataset.tab === 'jobs')?.click();
                } else {
                    toast('success', 'Opening…', i.action);
                }
            });
        });
    }
    renderAttention();

    /* ==========================================
       OVERVIEW — ALERT RULES
       ========================================== */
    function renderRules() {
        $('#ruleList').innerHTML = RULES.map((r) => `
            <li class="rule-item">
                <span class="status-pill ${r.severity === 'critical' ? 'fail' : 'warn'}"><span class="dot"></span> ${r.severity}</span>
                <div class="rule-body">
                    <div class="rule-title">${r.title}</div>
                    <div class="rule-desc">Notify ${r.recipients}</div>
                </div>
                <label class="toggle-row" style="padding:0;min-height:auto">
                    <input type="checkbox" ${r.enabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </li>
        `).join('');
    }
    renderRules();

    /* ==========================================
       SERVICES TAB
       ========================================== */
    function renderServices() {
        $('#servicesBody').innerHTML = SERVICES.map((s) => `
            <tr tabindex="0" data-service-row="${s.id}">
                <td><strong>${s.icon} ${s.name}</strong></td>
                <td><span class="status-pill ${statusClass(s.status)}"><span class="dot"></span> ${statusIcon(s.status)} ${statusLabel(s.status)}</span></td>
                <td>${s.uptime}</td>
                <td class="hide-md">${s.latency}</td>
                <td class="hide-sm muted">${s.lastIncident}</td>
                <td class="hide-md muted">${s.deps}</td>
            </tr>
        `).join('');

        $$('[data-service-row]').forEach((row) => {
            row.addEventListener('click', () => openService(Number(row.dataset.serviceRow)));
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); openService(Number(row.dataset.serviceRow)); }
            });
        });
    }
    renderServices();

    /* ==========================================
       SERVICE DRAWER
       ========================================== */
    const serviceDrawer = $('#serviceDrawer');
    const serviceOverlay = $('#serviceOverlay');

    function openService(id) {
        const s = SERVICES.find((x) => x.id === id);
        if (!s) return;
        state.activeService = s;

        $('#serviceIcon').textContent = s.icon;
        $('#serviceTitle').textContent = s.name;
        $('#serviceSub').textContent = `Depends on: ${s.deps}`;
        const statusEl = $('#serviceStatus');
        statusEl.className = `status-pill ${statusClass(s.status)}`;
        statusEl.innerHTML = `<span class="dot"></span> ${statusIcon(s.status)} ${statusLabel(s.status)}`;

        $('#sStatus').textContent = `${statusLabel(s.status)} · since 3h ago`;
        $('#sUptime').textContent = s.uptime;
        $('#sLatency').textContent = s.latency;
        $('#sImpact').textContent = s.impact || '—';
        $('#sSummary').textContent = s.summary || `${s.name} is operating normally.`;

        // Recent checks
        $('#sChecks').innerHTML = [
            { text: 'Health check passed', time: '30 seconds ago', ok: true },
            { text: 'Health check passed', time: '1 minute ago', ok: true },
            { text: 'Health check passed', time: '90 seconds ago', ok: true },
            { text: 'Response time 220ms (target <500ms)', time: '2 minutes ago', ok: true },
            { text: s.status === 'operational' ? 'Latency within target' : 'Latency above target', time: '5 minutes ago', ok: s.status === 'operational' },
            { text: 'Health check passed', time: '10 minutes ago', ok: true }
        ].map((c) => `
            <li>
                <span class="history-dot" style="background:${c.ok ? 'var(--green-accent)' : 'var(--status-amber-fg)'}"></span>
                <div><p>${c.text}</p><span>${c.time}</span></div>
            </li>
        `).join('');

        // 90-day history
        $('#sHistory').innerHTML = SERVICE_HISTORY.map((d) => `
            <div class="bar-seg ${d.status}" title="Day ${90 - d.day} · ${statusLabel(d.status)}"></div>
        `).join('');

        // Reset tabs
        $$('#serviceDrawer .drawer-tab').forEach((t, idx) => {
            t.classList.toggle('active', idx === 0);
            t.setAttribute('aria-selected', String(idx === 0));
        });
        $$('#serviceDrawer .drawer-panel').forEach((p, idx) => p.classList.toggle('active', idx === 0));

        serviceDrawer.hidden = false;
        serviceOverlay.hidden = false;
        requestAnimationFrame(() => {
            serviceDrawer.classList.add('open');
            serviceOverlay.classList.add('open');
        });
        document.body.style.overflow = 'hidden';
    }

    function closeService() {
        serviceDrawer.classList.remove('open');
        serviceOverlay.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => { serviceDrawer.hidden = true; serviceOverlay.hidden = true; }, 250);
    }
    $('#serviceClose')?.addEventListener('click', closeService);
    serviceOverlay?.addEventListener('click', closeService);
    $$('#serviceDrawer .drawer-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.dtab;
            $$('#serviceDrawer .drawer-tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            $$('#serviceDrawer .drawer-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === target));
        });
    });

    /* ==========================================
       PERFORMANCE — CHARTS
       ========================================== */
    function renderResponseChart() {
        const el = $('#chartResponse');
        const data = [
            { h: '00', median: 180, p95: 420 },
            { h: '03', median: 165, p95: 390 },
            { h: '06', median: 195, p95: 450 },
            { h: '09', median: 310, p95: 780, peak: true },
            { h: '12', median: 220, p95: 510 },
            { h: '15', median: 340, p95: 820, peak: true },
            { h: '18', median: 240, p95: 560 },
            { h: '21', median: 200, p95: 470 }
        ];
        const max = 900;
        const w = 500, h = 200, pad = 24;
        const stepX = (w - pad * 2) / (data.length - 1);
        const medianPts = data.map((d, i) => [pad + i * stepX, h - pad - (d.median / max) * (h - pad * 2)]);
        const p95Pts = data.map((d, i) => [pad + i * stepX, h - pad - (d.p95 / max) * (h - pad * 2)]);
        const medianPath = 'M ' + medianPts.map((p) => p.join(' ')).join(' L ');
        const p95Path = 'M ' + p95Pts.map((p) => p.join(' ')).join(' L ');

        el.innerHTML = `
            <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Response time over 24 hours">
                ${[0, 200, 400, 600, 800].map((v) => {
                    const y = h - pad - (v / max) * (h - pad * 2);
                    return `<line class="chart-grid-line" x1="${pad}" x2="${w - pad}" y1="${y}" y2="${y}"/>
                            <text class="chart-axis-label" x="4" y="${y + 3}">${v}ms</text>`;
                }).join('')}
                ${data.map((d, i) => d.peak ? `<rect class="chart-peak-zone" x="${pad + i * stepX - 20}" y="${pad}" width="40" height="${h - pad * 2}"/>` : '').join('')}
                <path class="chart-line-secondary" d="${p95Path}"/>
                <path class="chart-line" d="${medianPath}"/>
                ${data.map((d, i) => `
                    <circle cx="${medianPts[i][0]}" cy="${medianPts[i][1]}" r="3" fill="var(--green-accent)">
                        <title>${d.h}:00 · median ${d.median}ms</title>
                    </circle>
                    <text class="chart-axis-label" x="${medianPts[i][0]}" y="${h - 6}" text-anchor="middle">${d.h}</text>
                `).join('')}
            </svg>
        `;
    }

    function renderRpmChart() {
        const el = $('#chartRpm');
        const data = [42, 55, 88, 310, 240, 380, 190, 88];
        const labels = ['00', '03', '06', '09', '12', '15', '18', '21'];
        const max = Math.max(...data);
        const w = 500, h = 200, pad = 24;
        const stepX = (w - pad * 2) / data.length;
        const barW = stepX * 0.6;
        el.innerHTML = `
            <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Requests per minute over 24 hours">
                ${[0, 100, 200, 300, 400].map((v) => {
                    const y = h - pad - (v / max) * (h - pad * 2);
                    return `<line class="chart-grid-line" x1="${pad}" x2="${w - pad}" y1="${y}" y2="${y}"/>
                            <text class="chart-axis-label" x="4" y="${y + 3}">${v}</text>`;
                }).join('')}
                ${data.map((v, i) => {
                    const bh = (v / max) * (h - pad * 2);
                    const x = pad + i * stepX + (stepX - barW) / 2;
                    const y = h - pad - bh;
                    return `<rect class="chart-bar" x="${x}" y="${y}" width="${barW}" height="${bh}" rx="3">
                                <title>${labels[i]}:00 · ${v} req/min</title>
                            </rect>
                            <text class="chart-axis-label" x="${x + barW / 2}" y="${h - 6}" text-anchor="middle">${labels[i]}</text>`;
                }).join('')}
            </svg>
        `;
    }

    function renderDbChart() {
        const el = $('#chartDb');
        const data = [14, 16, 18, 32, 24, 38, 26, 18];
        const labels = ['00', '03', '06', '09', '12', '15', '18', '21'];
        const max = Math.max(...data);
        const w = 500, h = 200, pad = 24;
        const stepX = (w - pad * 2) / (data.length - 1);
        const pts = data.map((v, i) => [pad + i * stepX, h - pad - (v / max) * (h - pad * 2)]);
        const path = 'M ' + pts.map((p) => p.join(' ')).join(' L ');
        el.innerHTML = `
            <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Database query time">
                ${[0, 10, 20, 30, 40].map((v) => {
                    const y = h - pad - (v / max) * (h - pad * 2);
                    return `<line class="chart-grid-line" x1="${pad}" x2="${w - pad}" y1="${y}" y2="${y}"/>
                            <text class="chart-axis-label" x="4" y="${y + 3}">${v}ms</text>`;
                }).join('')}
                <path class="chart-area" d="${path} L ${pts[pts.length-1][0]} ${h-pad} L ${pad} ${h-pad} Z"/>
                <path class="chart-line" d="${path}"/>
                ${pts.map((p, i) => `
                    <circle cx="${p[0]}" cy="${p[1]}" r="3" fill="var(--green-accent)">
                        <title>${labels[i]}:00 · ${data[i]}ms</title>
                    </circle>
                    <text class="chart-axis-label" x="${p[0]}" y="${h - 6}" text-anchor="middle">${labels[i]}</text>
                `).join('')}
            </svg>
        `;
    }

    renderResponseChart();
    renderRpmChart();
    renderDbChart();

    /* ==========================================
       VIEW AS TABLE TOGGLE
       ========================================== */
    $$('[data-view="table"]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.chart;
            const chart = $('#chart' + key.charAt(0).toUpperCase() + key.slice(1));
            const table = $('#table' + key.charAt(0).toUpperCase() + key.slice(1));
            if (!chart || !table) return;
            const showTable = table.hidden;
            chart.hidden = showTable;
            table.hidden = !showTable;
            btn.textContent = showTable ? 'View as chart' : 'View as table';
        });
    });

    /* ==========================================
       ERRORS TAB
       ========================================== */
    function renderErrors() {
        const q = state.errSearch.toLowerCase();
        const list = ERRORS.filter((e) => {
            if (state.errStatus !== 'all' && e.status !== state.errStatus) return false;
            if (!q) return true;
            return e.message.toLowerCase().includes(q);
        });

        $('#errorsTabCount').textContent = ERRORS.length;

        $('#errorsBody').innerHTML = list.map((e) => {
            const cls = e.status === 'Resolved' ? 'pass' : e.status === 'Ignored' ? 'neutral' : e.status === 'Investigating' ? 'info' : 'warn';
            return `
                <tr tabindex="0" data-error-id="${e.id}">
                    <td><strong>${e.message}</strong></td>
                    <td class="hide-md">${e.count}</td>
                    <td class="hide-sm muted">${e.first}<br><span style="font-size:0.72rem">${e.last}</span></td>
                    <td class="hide-md muted">${e.affected}</td>
                    <td><span class="status-pill ${cls}"><span class="dot"></span> ${e.status}</span></td>
                    <td class="col-actions"><button class="btn btn-ghost btn-sm" data-view-error="${e.id}">Open</button></td>
                </tr>
            `;
        }).join('');

        $$('[data-view-error]').forEach((b) => {
            b.addEventListener('click', (e) => { e.stopPropagation(); openError(Number(b.dataset.viewError)); });
        });
        $$('tr[data-error-id]').forEach((row) => {
            row.addEventListener('click', () => openError(Number(row.dataset.errorId)));
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); openError(Number(row.dataset.errorId)); }
                if (e.key === 'ArrowDown') { e.preventDefault(); row.nextElementSibling?.focus(); }
                if (e.key === 'ArrowUp')   { e.preventDefault(); row.previousElementSibling?.focus(); }
            });
        });
    }
    renderErrors();

    $('#errSearch')?.addEventListener('input', (e) => { state.errSearch = e.target.value.trim(); renderErrors(); });

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
                state[btn.dataset.filter] = btn.dataset.value;
                menu.hidden = true;
                chip.classList.toggle('active', btn.dataset.value !== 'all');
                renderErrors();
            });
        });
    });
    document.addEventListener('click', () => { $$('.chip-menu').forEach((m) => { if (m.parentElement !== document.body) m.hidden = true; }); });

    /* ==========================================
       ERROR DRAWER
       ========================================== */
    const errorDrawer = $('#errorDrawer');
    const errorOverlay = $('#errorOverlay');

    function openError(id) {
        const e = ERRORS.find((x) => x.id === id);
        if (!e) return;
        state.activeError = e;

        $('#errorTitle').textContent = e.message;
        $('#errorSub').textContent = `Count ${e.count} · first seen ${e.first}`;
        const statusEl = $('#errorStatus');
        statusEl.className = `status-pill ${e.status === 'Resolved' ? 'pass' : e.status === 'Ignored' ? 'neutral' : e.status === 'Investigating' ? 'info' : 'warn'}`;
        statusEl.innerHTML = `<span class="dot"></span> ${e.status}`;

        $('#eSummary').textContent = e.summary || 'No summary yet — this error is still being triaged.';
        $('#eCount').textContent = e.count;
        $('#eFirst').textContent = e.first;
        $('#eLast').textContent = e.last;
        $('#eUsers').textContent = e.affected;
        $('#eRequest').textContent = e.request || '—';
        $('#eAudit').textContent = e.audit || '—';
        $('#eTrace').textContent = e.trace || '—';

        errorDrawer.hidden = false;
        errorOverlay.hidden = false;
        requestAnimationFrame(() => {
            errorDrawer.classList.add('open');
            errorOverlay.classList.add('open');
        });
        document.body.style.overflow = 'hidden';
    }
    function closeError() {
        errorDrawer.classList.remove('open');
        errorOverlay.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => { errorDrawer.hidden = true; errorOverlay.hidden = true; }, 250);
    }
    $('#errorClose')?.addEventListener('click', closeError);
    errorOverlay?.addEventListener('click', closeError);

    /* ==========================================
       JOBS TAB
       ========================================== */
    function renderJobs() {
        const missed = JOBS.filter((j) => j.result === 'missed' || j.result === 'failed').length;
        $('#jobsTabCount').textContent = missed;
        $('#jobsBody').innerHTML = JOBS.map((j) => {
            const cls = j.result === 'success' ? 'pass' : j.result === 'missed' ? 'warn' : j.result === 'failed' ? 'fail' : 'neutral';
            const label = j.result === 'success' ? 'Success' : j.result === 'missed' ? 'Missed' : j.result === 'failed' ? 'Failed' : j.result;
            return `
                <tr class="${j.result === 'missed' || j.result === 'failed' ? 'missed-row' : ''}" tabindex="0">
                    <td>
                        <strong>${j.name}</strong>
                        ${j.note ? `<div style="font-size:0.72rem;color:var(--text-muted)">${j.note}</div>` : ''}
                    </td>
                    <td class="hide-md muted">${j.schedule}</td>
                    <td>${j.lastRun}<br><span style="font-size:0.72rem;color:var(--text-muted)">${j.duration}</span></td>
                    <td><span class="status-pill ${cls}"><span class="dot"></span> ${label}</span></td>
                    <td class="hide-sm muted">${j.nextRun}</td>
                    <td class="hide-md muted">${j.queue}</td>
                    <td class="col-actions">
                        <button class="btn btn-ghost btn-sm" data-run-job="${j.id}" data-role="super-admin">Run now</button>
                        <button class="btn btn-ghost btn-sm" data-view-job="${j.id}">Log</button>
                    </td>
                </tr>
            `;
        }).join('');

        $$('[data-run-job]').forEach((b) => {
            b.addEventListener('click', (e) => {
                if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
                    toast('error', 'Not allowed', 'Super admin only.');
                    return;
                }
                const j = JOBS.find((x) => x.id === Number(b.dataset.runJob));
                openConfirm('run-job', `Run <strong>${j.name}</strong> immediately?`, 'RUN');
            });
        });
        $$('[data-view-job]').forEach((b) => {
            b.addEventListener('click', () => toast('success', 'Opening job log', 'Recent runs and errors.'));
        });
    }
    renderJobs();

    /* ==========================================
       INCIDENTS TAB
       ========================================== */
    function renderIncidents() {
        const open = [
            { text: 'Incident declared — Major', time: '3 hours ago · Sarah Villanueva', active: true },
            { text: 'Door-lock sync timing out. 12 staff affected. Check-ins unaffected.', time: '3 hours ago · Sarah Villanueva', active: true },
            { text: 'Vendor confirmed upstream issue. ETA for fix: 2 hours.', time: '1 hour ago · Sarah Villanueva', active: true },
            { text: 'Added to external status monitor. Guest banner posted.', time: '45 min ago · Sarah Villanueva', active: true }
        ];
        $('#openIncidentTimeline').innerHTML = open.map((l) => `
            <li>
                <p>${l.text}</p>
                <span>${l.time}</span>
            </li>
        `).join('');

        $('#resolvedList').innerHTML = RESOLVED_INCIDENTS.map((r) => `
            <li class="resolved-item">
                <span class="status-pill pass"><span class="dot"></span> Resolved</span>
                <div class="resolved-body">
                    <div class="resolved-title">${r.title}</div>
                    <div class="resolved-meta">
                        <strong>${r.severity}</strong> · ${r.start} → ${r.end} (${r.duration})<br>
                        <strong>Cause:</strong> ${r.cause}<br>
                        <strong>Impact:</strong> ${r.impact}<br>
                        <strong>Handler:</strong> ${r.handler} · <strong>Follow-ups:</strong> ${r.followUps}
                    </div>
                </div>
                <div class="attention-actions">
                    <button class="btn btn-outline btn-sm">View details</button>
                </div>
            </li>
        `).join('');
    }
    renderIncidents();

    /* ==========================================
       MAINTENANCE TAB
       ========================================== */
    function renderWindows() {
        $('#windowList').innerHTML = WINDOWS.map((w) => `
            <li class="window-item">
                <span class="status-pill info"><span class="dot"></span> Planned</span>
                <div class="window-body">
                    <div class="window-title">${w.title}</div>
                    <div class="window-meta">
                        ${w.start} → ${w.end}<br>
                        <strong>Impact:</strong> ${w.impact} · <strong>Announced:</strong> ${w.announce ? 'Yes' : 'No'}<br>
                        Scheduled by ${w.by}
                    </div>
                </div>
                <div class="attention-actions">
                    <button class="btn btn-outline btn-sm" data-role="super-admin">Edit</button>
                    <button class="btn btn-ghost btn-sm" data-role="super-admin">Cancel</button>
                </div>
            </li>
        `).join('');
    }
    renderWindows();

    $('#addWindowBtn')?.addEventListener('click', (e) => {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            toast('error', 'Not allowed', 'Super admin only.');
            return;
        }
        toast('success', 'Add maintenance window', 'Opening scheduler.');
    });

    $('#maintenanceToggle')?.addEventListener('change', (e) => {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            toast('error', 'Not allowed', 'Super admin only.');
            e.currentTarget.checked = false;
            return;
        }
        if (e.currentTarget.checked) {
            openConfirm('maintenance-on', 'Enable maintenance mode? Guests and staff will be blocked from performing any action until it is turned off.', 'MAINTENANCE ON');
        } else {
            openConfirm('maintenance-off', 'Disable maintenance mode? The system will return to normal operation.', 'MAINTENANCE OFF');
        }
    });

    // Status message composer
    $('#statusMessage')?.addEventListener('input', (e) => {
        $('#statusPreviewText').textContent = e.target.value || 'No message';
    });
    $('#statusLevel')?.addEventListener('change', (e) => {
        const preview = $('#statusPreview');
        preview.className = 'status-preview';
        if (e.target.value === 'info') preview.style.background = 'var(--status-blue-bg)', preview.style.color = 'var(--status-blue-fg)', preview.style.borderLeftColor = 'var(--status-blue-fg)';
        else if (e.target.value === 'warning') preview.style.background = 'var(--status-amber-bg)', preview.style.color = 'var(--status-amber-fg)', preview.style.borderLeftColor = 'var(--status-amber-fg)';
        else preview.style.background = 'var(--status-red-bg)', preview.style.color = 'var(--status-red-fg)', preview.style.borderLeftColor = 'var(--status-red-fg)';
    });

    $('#postStatus')?.addEventListener('click', () => {
        toast('success', 'Status posted', 'The banner will appear for all signed-in users.');
    });
    $('#clearStatus')?.addEventListener('click', () => {
        $('#statusMessage').value = '';
        $('#statusPreviewText').textContent = 'No message';
        toast('success', 'Status cleared', 'The banner has been removed.');
    });

    /* ==========================================
       AUTO-REFRESH + RANGE
       ========================================== */
    $('#autoRefreshOn')?.addEventListener('click', () => {
        state.autoRefresh = true;
        $('#autoRefreshOn').classList.add('active');
        $('#autoRefreshOff').classList.remove('active');
        toast('success', 'Auto-refresh on', 'This page will update every 15 seconds.');
    });
    $('#autoRefreshOff')?.addEventListener('click', () => {
        state.autoRefresh = false;
        $('#autoRefreshOff').classList.add('active');
        $('#autoRefreshOn').classList.remove('active');
        toast('success', 'Auto-refresh paused', 'Refresh manually when ready.');
    });

    const rangeBtn = $('#rangeBtn');
    const rangeMenu = $('#rangeMenu');
    rangeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = !rangeMenu.hidden;
        $$('.chip-menu').forEach((m) => { if (m.parentElement !== document.body) m.hidden = true; });
        rangeMenu.hidden = wasOpen;
    });
    rangeMenu?.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
            rangeMenu.hidden = true;
            rangeBtn.querySelector('.chip-label').textContent = b.textContent;
            state.range = b.dataset.range;
            toast('success', 'Range changed', `Showing ${b.textContent}.`);
        });
    });

    /* ==========================================
       DECLARE INCIDENT
       ========================================== */
    $('#declareIncidentBtn')?.addEventListener('click', (e) => {
        if (e.currentTarget.getAttribute('aria-disabled') === 'true') {
            toast('error', 'Not allowed', 'Super admin only.');
            return;
        }
        toast('success', 'Incident declaration', 'Opening the incident form.');
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
            if (action === 'maintenance-on') {
                toast('success', 'Maintenance mode ON', 'All users will see a maintenance banner. Action is logged.');
            } else if (action === 'maintenance-off') {
                toast('success', 'Maintenance mode OFF', 'The system is back to normal operation.');
            } else if (action === 'run-job') {
                toast('success', 'Job started', 'You will be notified when it completes.');
            } else {
                toast('success', 'Done', 'Action completed and logged.');
            }
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
            closeService();
            closeError();
            closeConfirm();
            closeStepup();
            $$('.chip-menu').forEach((m) => { if (m.parentElement !== document.body) m.hidden = true; });
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
       LAST UPDATED TICKER
       ========================================== */
    const lastUpdatedEl = $('#lastUpdated');
    let secs = 0;
    setInterval(() => {
        secs++;
        lastUpdatedEl.textContent = secs < 60
            ? `Last updated ${secs}s ago`
            : `Last updated ${Math.floor(secs / 60)}m ago`;
    }, 1000);

    /* ==========================================
       LIVE UPDATE SIMULATION
       ========================================== */
    setInterval(() => {
        if (!state.autoRefresh) return;
        if (Math.random() > 0.6) {
            // Update a status silently
            lastUpdatedEl.textContent = 'Last updated just now';
            secs = 0;
        }
    }, 8000);
});