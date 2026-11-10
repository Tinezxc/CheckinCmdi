document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       ROLE + ACCESS CONTROL
       ========================================== */
    const roleSelect = document.getElementById('roleSelect');
    const accessDenied = document.getElementById('accessDenied');
    const reportsContent = document.getElementById('reportsContent');
    const staffRoleLabel = document.getElementById('staffRoleLabel');
    const roleBreadcrumb = document.getElementById('roleBreadcrumb');
    const staffNameEl = document.querySelector('.staff-name');
    const staffAvatarEl = document.querySelector('.staff-avatar');
    const topbarAvatar = document.querySelector('.topbar-avatar');

    const ROLE_LABELS = { 'front-desk': 'Front desk', 'housekeeping': 'Housekeeping', 'manager': 'Manager' };
    const STAFF_BY_ROLE = {
        'front-desk': { name: 'Marco Cruz', initials: 'MC' },
        'housekeeping': { name: 'Joy Lim', initials: 'JL' },
        'manager': { name: 'Ravi Batra', initials: 'RB' }
    };

    function applyRole(role) {
        document.body.dataset.role = role;
        staffRoleLabel.textContent = ROLE_LABELS[role];
        roleBreadcrumb.textContent = ROLE_LABELS[role];
        const staff = STAFF_BY_ROLE[role];
        if (staffNameEl) staffNameEl.textContent = staff.name;
        if (staffAvatarEl) staffAvatarEl.textContent = staff.initials;
        if (topbarAvatar) topbarAvatar.textContent = staff.initials;

        // Sidebar — Reports and Staff & settings are manager-only
        document.querySelectorAll('[data-role-required="manager"]').forEach((el) => {
            if (role === 'manager') {
                el.removeAttribute('aria-disabled');
                el.removeAttribute('title');
            } else {
                el.setAttribute('aria-disabled', 'true');
                el.setAttribute('title', 'Manager access only');
            }
        });

        // Access control
        if (role === 'manager') {
            accessDenied.hidden = true;
            reportsContent.hidden = false;
        } else {
            accessDenied.hidden = false;
            reportsContent.hidden = true;
        }

        showToast('success', 'Role switched', `Now viewing as ${ROLE_LABELS[role]}.`);
    }

    roleSelect?.addEventListener('change', (e) => applyRole(e.target.value));

    document.getElementById('switchToManager')?.addEventListener('click', () => {
        roleSelect.value = 'manager';
        applyRole('manager');
    });

    // Initialize (manager by default)
    applyRole('manager');

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
       TABS
       ========================================== */
    document.querySelectorAll('.tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            document.querySelectorAll('.tab-panel').forEach((p) => {
                p.classList.toggle('active', p.dataset.panel === target);
            });
        });
    });

    /* ==========================================
       RANGE / EXPORT / SCHEDULE MENUS
       ========================================== */
    const rangeBtn = document.getElementById('rangeBtn');
    const rangeMenu = document.getElementById('rangeMenu');
    const exportBtn = document.getElementById('exportBtn');
    const exportMenu = document.getElementById('exportMenu');

    function bindMenu(btn, menu) {
        btn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasOpen = !menu.hidden;
            document.querySelectorAll('.chip-menu').forEach((m) => m.hidden = true);
            menu.hidden = wasOpen;
            btn.setAttribute('aria-expanded', String(!wasOpen));
        });
    }
    bindMenu(rangeBtn, rangeMenu);
    bindMenu(exportBtn, exportMenu);

    document.addEventListener('click', () => {
        document.querySelectorAll('.chip-menu').forEach((m) => m.hidden = true);
    });

    document.querySelectorAll('[data-range]').forEach((btn) => {
        btn.addEventListener('click', () => {
            rangeMenu.hidden = true;
            const label = btn.textContent.trim();
            rangeBtn.querySelector('.chip-label').textContent = label;
            document.getElementById('rangeLabel').textContent = label;
            showToast('success', 'Range changed', `Showing ${label}.`);
        });
    });

    document.querySelectorAll('[data-export]').forEach((btn) => {
        btn.addEventListener('click', () => {
            exportMenu.hidden = true;
            const format = btn.dataset.export;
            if (format === 'print') { window.print(); return; }
            logExport(format);
            showToast('success', 'Export started',
                `Exporting ${document.getElementById('rangeLabel').textContent} as ${format.toUpperCase()}. Manager permission applied — sensitive fields masked.`);
        });
    });

    document.getElementById('scheduleBtn')?.addEventListener('click', () => {
        showToast('success', 'Schedule report', 'Choose frequency, recipients and format in the dialog.');
    });
    document.getElementById('addScheduleBtn')?.addEventListener('click', () => {
        showToast('success', 'New schedule', 'Configure schedule in the dialog.');
    });

    function logExport(format) {
        const tbody = document.querySelectorAll('.data-table')[document.querySelectorAll('.data-table').length - 1].querySelector('tbody');
        if (!tbody) return;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>Ravi Batra</td>
            <td>${document.getElementById('rangeLabel').textContent}</td>
            <td>${format.toUpperCase()}</td>
            <td>Today · ${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</td>
        `;
        tbody.prepend(row);
    }

    /* ==========================================
       KPI DRILL-DOWN DRAWER
       ========================================== */
    const drillOverlay = document.getElementById('drillOverlay');
    const drillDrawer = document.getElementById('drillDrawer');
    const drillTitle = document.getElementById('drillTitle');
    const drillSub = document.getElementById('drillSub');
    const drillBody = document.getElementById('drillBody');

    function openDrill(title, sub, content) {
        drillTitle.textContent = title;
        drillSub.textContent = sub;
        drillBody.innerHTML = content;
        drillDrawer.hidden = false;
        drillOverlay.hidden = false;
        requestAnimationFrame(() => {
            drillDrawer.classList.add('open');
            drillOverlay.classList.add('open');
        });
        document.body.style.overflow = 'hidden';
    }
    function closeDrill() {
        drillDrawer.classList.remove('open');
        drillOverlay.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => { drillDrawer.hidden = true; drillOverlay.hidden = true; }, 250);
    }
    document.getElementById('drillClose')?.addEventListener('click', closeDrill);
    drillOverlay?.addEventListener('click', closeDrill);

    document.querySelectorAll('.kpi-card').forEach((card) => {
        card.addEventListener('click', () => {
            const key = card.dataset.kpi;
            openKpiDrill(key);
        });
    });

    const DRILL_CONTENT = {
        occupancy: {
            title: 'Occupancy rate — 78%',
            sub: 'Last 7 days · avg across floors',
            body: `<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px">Percentage of available bed-nights occupied. 43 of 55 beds currently occupied.</p>
                <table class="data-table compact"><thead><tr><th>Floor</th><th>Beds</th><th>Occupied</th><th>Rate</th></tr></thead>
                <tbody>
                    <tr><td>Floor 1</td><td>18</td><td>12</td><td>67%</td></tr>
                    <tr><td>Floor 2</td><td>18</td><td>16</td><td>89%</td></tr>
                    <tr><td>Floor 3</td><td>19</td><td>15</td><td>79%</td></tr>
                </tbody></table>`
        },
        alos: {
            title: 'Avg length of stay — 6.4 nights',
            sub: 'Last 7 days · checked-out guests only',
            body: `<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px">Average nights per checked-out guest.</p>
                <table class="data-table compact"><thead><tr><th>Guest</th><th>Room</th><th>Nights</th></tr></thead>
                <tbody>
                    <tr><td>Sofia Reyes</td><td>201</td><td>7</td></tr>
                    <tr><td>Hana Kim</td><td>308</td><td>7</td></tr>
                    <tr><td>Jamie Dela Cruz</td><td>304</td><td>7</td></tr>
                    <tr><td>Aiko Tanaka</td><td>202</td><td>7</td></tr>
                </tbody></table>`
        },
        overdue: {
            title: 'Overdue check-outs — 1 guest',
            sub: 'Average 2 days overdue',
            body: `<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px">Guests past expected check-out date.</p>
                <table class="data-table compact"><thead><tr><th>Guest</th><th>Room</th><th>Guest ID</th><th>Reg ID</th><th>Expected</th><th>Days overdue</th></tr></thead>
                <tbody>
                    <tr>
                        <td>Sofia Reyes</td>
                        <td>201</td>
                        <td>TR-1001</td>
                        <td>HV-1001</td>
                        <td>Oct 9, 2026</td>
                        <td><span style="color:var(--status-amber-fg);font-weight:600">2 days</span></td>
                    </tr>
                </tbody></table>`
        },
        response: {
            title: 'Avg request response — 18 min',
            sub: 'Last 7 days · from creation to first staff action',
            body: `<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px">60 requests total this period.</p>
                <table class="data-table compact"><thead><tr><th>Type</th><th>Volume</th><th>Avg response</th></tr></thead>
                <tbody>
                    <tr><td>Housekeeping</td><td>24</td><td>14 min</td></tr>
                    <tr><td>Maintenance</td><td>12</td><td>22 min</td></tr>
                    <tr><td>Extra bedding</td><td>10</td><td>16 min</td></tr>
                    <tr><td>Late check-out</td><td>8</td><td>28 min</td></tr>
                    <tr><td>Room change</td><td>6</td><td>35 min</td></tr>
                </tbody></table>`
        },
        sla: {
            title: 'SLA compliance — 94%',
            sub: '4 requests breached their target time',
            body: `<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px">Compliance is measured against each request's target time.</p>
                <table class="data-table compact"><thead><tr><th>Type</th><th>Breaches</th><th>Target</th></tr></thead>
                <tbody>
                    <tr><td>Maintenance</td><td>2</td><td>30 min</td></tr>
                    <tr><td>Housekeeping</td><td>1</td><td>60 min</td></tr>
                    <tr><td>Room change</td><td>1</td><td>180 min</td></tr>
                </tbody></table>`
        },
        oos: {
            title: 'Rooms out of service — 2',
            sub: 'Maintenance or inspection required',
            body: `<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px">Rooms currently unavailable for check-in.</p>
                <table class="data-table compact"><thead><tr><th>Room</th><th>Reason</th><th>Since</th></tr></thead>
                <tbody>
                    <tr><td>305</td><td>Deep clean scheduled</td><td>Oct 9, 2026</td></tr>
                    <tr><td>106</td><td>A/C unit replacement</td><td>Oct 6, 2026</td></tr>
                </tbody></table>`
        }
    };

    function openKpiDrill(key) {
        const c = DRILL_CONTENT[key];
        if (!c) return;
        openDrill(c.title, c.sub, c.body);
    }

    /* ==========================================
       CHART PLACEHOLDERS — RENDER ON LOAD
       ========================================== */
    renderOccupancyChart();
    renderArrivalsChart();
    renderRequestsChart();
    renderMixChart();

    function renderOccupancyChart() {
        const el = document.getElementById('chartOccupancy');
        if (!el) return;
        const data = [72, 75, 78, 80, 79, 76, 78];
        const labels = ['Oct 4', 'Oct 5', 'Oct 6', 'Oct 7', 'Oct 8', 'Oct 9', 'Oct 10'];
        const max = 100;
        const w = 500, h = 200, pad = 24;
        const stepX = (w - pad * 2) / (data.length - 1);
        const points = data.map((v, i) => [pad + i * stepX, h - pad - (v / max) * (h - pad * 2)]);
        const path = 'M ' + points.map((p) => p.join(' ')).join(' L ');

        el.innerHTML = `
            <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Occupancy over the last 7 days">
                ${[0, 25, 50, 75, 100].map((v) => {
                    const y = h - pad - (v / max) * (h - pad * 2);
                    return `<line class="grid-line" x1="${pad}" x2="${w - pad}" y1="${y}" y2="${y}"/>
                            <text class="axis-label" x="4" y="${y + 3}">${v}%</text>`;
                }).join('')}
                <path class="line-area" d="${path} L ${points[points.length-1][0]} ${h-pad} L ${pad} ${h-pad} Z"/>
                <path class="line-path" d="${path}"/>
                ${points.map(([x, y], i) => `
                    <circle class="point" cx="${x}" cy="${y}" r="4">
                        <title>${labels[i]}: ${data[i]}%</title>
                    </circle>
                    <text class="axis-label" x="${x}" y="${h - 6}" text-anchor="middle">${labels[i]}</text>
                `).join('')}
            </svg>
        `;
    }

    function renderArrivalsChart() {
        const el = document.getElementById('chartArrivals');
        if (!el) return;
        const arrivals = [8, 10, 7, 12, 9, 11, 12];
        const departures = [6, 9, 11, 8, 10, 12, 8];
        const labels = ['Oct 4', 'Oct 5', 'Oct 6', 'Oct 7', 'Oct 8', 'Oct 9', 'Oct 10'];
        const max = Math.max(...arrivals, ...departures);

        el.innerHTML = `
            <div class="bar-chart" role="img" aria-label="Arrivals vs departures over the last 7 days">
                ${labels.map((label, i) => {
                    const aH = (arrivals[i] / max) * 100;
                    const dH = (departures[i] / max) * 100;
                    return `
                        <div class="bar-group">
                            <span class="bar-value">${arrivals[i]}/${departures[i]}</span>
                            <div class="bar-stack">
                                <div class="bar" style="height:${dH}%" title="Departures: ${departures[i]}"></div>
                                <div class="bar secondary" style="height:${aH}%" title="Arrivals: ${arrivals[i]}"></div>
                            </div>
                            <span class="bar-label" style="position:relative;bottom:-18px">${label}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="display:flex;gap:16px;font-size:0.75rem;color:var(--text-muted);margin-top:24px">
                <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:2px;background:var(--green-accent)"></span>Arrivals</span>
                <span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:2px;background:var(--status-blue-fg)"></span>Departures</span>
            </div>
        `;
    }

    function renderRequestsChart() {
        const el = document.getElementById('chartRequests');
        if (!el) return;
        const data = [
            { type: 'Housekeeping', volume: 24, response: 14 },
            { type: 'Maintenance', volume: 12, response: 22 },
            { type: 'Extra bedding', volume: 10, response: 16 },
            { type: 'Late check-out', volume: 8, response: 28 },
            { type: 'Room change', volume: 6, response: 35 }
        ];
        const max = Math.max(...data.map((d) => d.volume));
        el.innerHTML = `
            <div class="bar-chart" role="img" aria-label="Service requests by type">
                ${data.map((d) => `
                    <div class="bar-group">
                        <span class="bar-value">${d.volume}</span>
                        <div class="bar-stack">
                            <div class="bar" style="height:${(d.volume / max) * 100}%" title="${d.type}: ${d.volume} requests, avg ${d.response} min"></div>
                        </div>
                        <span class="bar-label" style="position:relative;bottom:-18px;font-size:0.6rem;max-width:70px;white-space:normal">${d.type}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderMixChart() {
        const el = document.getElementById('chartMix');
        if (!el) return;
        const segments = [
            { key: 'occupied',      label: 'Occupied',       value: 18, color: '#4b7c5c', fg: '#fff' },
            { key: 'vacant-clean',  label: 'Vacant clean',   value: 3,  color: '#a8b8b0', fg: '#1f2923' },
            { key: 'vacant-dirty',  label: 'Vacant dirty',   value: 3,  color: '#c9a961', fg: '#fff' },
            { key: 'cleaning',      label: 'Cleaning',       value: 1,  color: '#1e3a8a', fg: '#fff' },
            { key: 'maintenance',   label: 'Maintenance',    value: 2,  color: '#9b1c1c', fg: '#fff' },
            { key: 'reserved',      label: 'Reserved',       value: 2,  color: '#8a5a00', fg: '#fff' },
            { key: 'overdue',       label: 'Overdue',        value: 1,  color: '#b06a00', fg: '#fff' }
        ];
        const total = segments.reduce((s, x) => s + x.value, 0);

        el.innerHTML = `
            <div class="stacked-bar" role="img" aria-label="Room status distribution">
                ${segments.map((s) => `
                    <div class="seg ${s.key}" style="width:${(s.value/total)*100}%;background:${s.color};color:${s.fg}"
                         title="${s.label}: ${s.value}">
                        ${s.value / total > 0.08 ? s.value : ''}
                    </div>
                `).join('')}
            </div>
            <div class="stacked-legend">
                ${segments.map((s) => `
                    <span class="legend-item">
                        <span class="swatch" style="background:${s.color}"></span>
                        ${s.label} · ${s.value}
                    </span>
                `).join('')}
            </div>
        `;
    }

    /* ==========================================
       "VIEW AS TABLE" TOGGLE
       ========================================== */
    document.querySelectorAll('[data-view="table"]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const chartKey = btn.dataset.chart;
            const chart = document.getElementById('chart' + capitalize(chartKey));
            const table = document.getElementById('table' + capitalize(chartKey));
            if (!chart || !table) return;
            const showTable = table.hidden;
            chart.hidden = showTable;
            table.hidden = !showTable;
            btn.textContent = showTable ? 'View as chart' : 'View as table';
        });
    });

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    /* ==========================================
       AUDIT LOG RENDER + FILTER
       ========================================== */
    const AUDIT = [
        { staff: 'Ravi Batra',  action: 'Force check-out', target: 'Room 303 · Diego Marquez', reason: '2 days overdue', time: 'Today · 11:08 AM' },
        { staff: 'Marco Cruz',  action: 'Revealed ID number', target: 'Aiko Tanaka · TR-1002', reason: 'Verify student status', time: 'Today · 9:15 AM' },
        { staff: 'Ravi Batra',  action: 'Changed role', target: 'Self · Manager', reason: 'Shift handover', time: 'Yesterday · 5:30 PM' },
        { staff: 'Marco Cruz',  action: 'Changed room', target: 'Room 208 → 210 · Lena Okafor', reason: 'A/C noise complaint', time: 'Yesterday · 3:14 PM' },
        { staff: 'Joy Lim',     action: 'Marked out of service', target: 'Room 106', reason: 'A/C unit replacement', time: 'Oct 6 · 8:42 AM' },
        { staff: 'Marco Cruz',  action: 'Force check-out', target: 'Room 304 · Jamie Dela Cruz', reason: 'No contact for 24 hours', time: 'Oct 5 · 10:20 PM' },
        { staff: 'Ravi Batra',  action: 'Exported report', target: 'Audit log · Sept 2026', reason: 'Compliance review', time: 'Oct 9 · 5:20 PM' }
    ];

    const auditBody = document.getElementById('auditBody');
    function renderAudit(filter = '') {
        if (!auditBody) return;
        const q = filter.toLowerCase();
        const rows = AUDIT.filter((a) =>
            !q || a.staff.toLowerCase().includes(q)
                 || a.action.toLowerCase().includes(q)
                 || a.target.toLowerCase().includes(q)
                 || a.reason.toLowerCase().includes(q)
        );
        auditBody.innerHTML = rows.length
            ? rows.map((a) => `
                <tr>
                    <td>${a.staff}</td>
                    <td>${a.action}</td>
                    <td>${a.target}</td>
                    <td class="muted">${a.reason}</td>
                    <td class="muted">${a.time}</td>
                </tr>
            `).join('')
            : `<tr><td colspan="5"><div class="empty-state small"><p class="empty-sub">No matching audit entries.</p></div></td></tr>`;
    }
    renderAudit();

    document.getElementById('auditSearch')?.addEventListener('input', (e) => renderAudit(e.target.value.trim()));

    /* ==========================================
       KEYBOARD
       ========================================== */
    document.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
        if (typing && e.key !== 'Escape') return;

        if (e.key === 'Escape') {
            closeSidebar();
            closeDrill();
            document.querySelectorAll('.chip-menu').forEach((m) => m.hidden = true);
        }
    });

    /* ==========================================
       TOASTS
       ========================================== */
    const toastContainer = document.getElementById('toastContainer');
    function showToast(type, title, message, timeout = 3500) {
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
    const dataAsOf = document.getElementById('dataAsOf');
    let secs = 0;
    setInterval(() => {
        secs++;
        const base = 'Data as of Oct 10, 2026 · 4:30 PM';
        dataAsOf.textContent = secs < 5 ? base : `${base} · updated ${secs}s ago`;
    }, 1000);
});