document.addEventListener('DOMContentLoaded', function () {

    /* ==========================================
       DATA
       ========================================== */
    let GUESTS = window.GuestStore.all();

    const STATUS_LABELS = {
        'checked-in': 'Checked in',
        'checked-out': 'Checked out',
        'overdue': 'Overdue',
        'arriving': 'Arriving',
        'urgent': 'Urgent',
        'reserved': 'Reserved'
    };

    /* ==========================================
       ROLE SWITCHER
       ========================================== */
    const ROLE_LABELS = { 'front-desk': 'Front desk', 'housekeeping': 'Housekeeping', 'manager': 'Manager' };
    const roleSelect = document.getElementById('roleSelect');
    const staffRoleLabel = document.getElementById('staffRoleLabel');
    const roleBreadcrumb = document.getElementById('roleBreadcrumb');

    function applyRole(role) {
        document.body.dataset.role = role;
        if (staffRoleLabel) staffRoleLabel.textContent = ROLE_LABELS[role];
        if (roleBreadcrumb) roleBreadcrumb.textContent = ROLE_LABELS[role];

        document.querySelectorAll('[data-role-required="manager"]').forEach(function (el) {
            if (role === 'manager') { el.removeAttribute('aria-disabled'); el.removeAttribute('title'); }
            else { el.setAttribute('aria-disabled', 'true'); el.setAttribute('title', 'Manager access only'); }
        });

        document.querySelectorAll('.quick-btn[data-role]').forEach(function (btn) {
            const allowed = btn.dataset.role.split(' ');
            if (allowed.indexOf(role) !== -1) { btn.removeAttribute('aria-disabled'); btn.removeAttribute('title'); }
            else { btn.setAttribute('aria-disabled', 'true'); btn.setAttribute('title', allowed.map(function (r) { return ROLE_LABELS[r]; }).join(' or ') + ' only'); }
        });

        const notesTab = document.querySelector('[data-dtab="notes"]');
        if (notesTab) {
            const allowed = (notesTab.dataset.role || '').split(' ');
            notesTab.style.display = allowed.indexOf(role) !== -1 ? '' : 'none';
        }
    }

    if (roleSelect) {
        roleSelect.addEventListener('change', function (e) {
            applyRole(e.target.value);
            showToast('success', 'Role switched', 'Now viewing as ' + ROLE_LABELS[e.target.value] + '.');
        });
    }

    /* ==========================================
       MOBILE SIDEBAR
       ========================================== */
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
    if (toggle) {
        toggle.addEventListener('click', function () {
            const isOpen = sidebar.classList.toggle('open');
            overlay.classList.toggle('open', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
        });
    }
    if (overlay) overlay.addEventListener('click', closeSidebar);

    /* ==========================================
       FILTER STATE
       ========================================== */
    const state = {
        search: '', status: 'all', floor: 'all', institution: 'all',
        date: 'all', view: 'all', sortKey: 'name', sortDir: 'asc',
        selected: new Set()
    };

    const guestsBody = document.getElementById('guestsBody');
    const guestsEmpty = document.getElementById('guestsEmpty');
    const guestsError = document.getElementById('guestsError');
    const tableInfo = document.getElementById('tableInfo');
    const tableFooterInfo = document.getElementById('tableFooterInfo');
    const guestCount = document.getElementById('guestCount');
    const clearFilters = document.getElementById('clearFilters');

    /* ==========================================
       FILTERS + SORT
       ========================================== */
    function isToday(s) { return new Date(s).toDateString() === new Date().toDateString(); }
    function isThisWeek(s) {
        const d = new Date(s), now = new Date();
        const start = new Date(now); start.setDate(now.getDate() - now.getDay());
        const end = new Date(start); end.setDate(start.getDate() + 7);
        return d >= start && d < end;
    }
    function isThisMonth(s) {
        const d = new Date(s), now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    function applyFilters() {
        let list = GUESTS.slice();

        if (state.view === 'in-house') list = list.filter(function (g) { return g.status === 'checked-in' || g.status === 'overdue'; });
        if (state.view === 'arrivals') list = list.filter(function (g) { return g.status === 'arriving' || isToday(g.checkIn); });
        if (state.view === 'overdue')  list = list.filter(function (g) { return g.status === 'overdue'; });

        if (state.search) {
            const q = state.search.toLowerCase();
            list = list.filter(function (g) {
                return [g.name, g.guestId, g.regId, g.room, g.institution, g.branch, g.phone, g.email, g.idNum]
                    .some(function (v) { return String(v || '').toLowerCase().indexOf(q) !== -1; });
            });
        }

        if (state.status !== 'all')      list = list.filter(function (g) { return g.status === state.status; });
        if (state.floor !== 'all')       list = list.filter(function (g) { return String(g.floor) === state.floor; });
        if (state.institution !== 'all') list = list.filter(function (g) { return g.institution === state.institution; });
        if (state.date === 'today')      list = list.filter(function (g) { return isToday(g.checkIn); });
        if (state.date === 'week')       list = list.filter(function (g) { return isThisWeek(g.checkIn); });
        if (state.date === 'month')      list = list.filter(function (g) { return isThisMonth(g.checkIn); });

        const k = state.sortKey, dir = state.sortDir === 'asc' ? 1 : -1;
        list.sort(function (a, b) {
            let av = a[k], bv = b[k];
            if (k === 'room') { av = Number(av) || 0; bv = Number(bv) || 0; }
            else if (k === 'checkIn' || k === 'checkOut') { av = new Date(av).getTime() || 0; bv = new Date(bv).getTime() || 0; }
            else { av = String(av || '').toLowerCase(); bv = String(bv || '').toLowerCase(); }
            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
            return 0;
        });
        return list;
    }

    function updateCounts() {
        const all = GUESTS.length;
        const inhouse = GUESTS.filter(function (g) { return g.status === 'checked-in' || g.status === 'overdue'; }).length;
        const arrivals = GUESTS.filter(function (g) { return g.status === 'arriving' || isToday(g.checkIn); }).length;
        const overdue = GUESTS.filter(function (g) { return g.status === 'overdue'; }).length;
        const el = function (id) { return document.getElementById(id); };
        if (el('countAll')) el('countAll').textContent = all;
        if (el('countInhouse')) el('countInhouse').textContent = inhouse;
        if (el('countArrivals')) el('countArrivals').textContent = arrivals;
        if (el('countOverdue')) el('countOverdue').textContent = overdue;
    }

    function renderTable() {
        const list = applyFilters();
        updateCounts();

        if (list.length === 0) {
            if (guestsBody) guestsBody.innerHTML = '';
            if (guestsEmpty) guestsEmpty.hidden = false;
            if (guestsError) guestsError.hidden = true;
            if (tableInfo) tableInfo.textContent = 'No guests';
            if (tableFooterInfo) tableFooterInfo.textContent = 'No guests';
            if (guestCount) guestCount.textContent = '0 total';
            updateBulkBar();
            return;
        }
        if (guestsEmpty) guestsEmpty.hidden = true;
        if (guestsError) guestsError.hidden = true;

        guestsBody.innerHTML = list.map(function (g) {
            const initials = g.name.split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
            const overdueDays = g.status === 'overdue'
                ? Math.max(0, Math.ceil((Date.now() - new Date(g.checkOut).getTime()) / 86400000)) : 0;
            const statusLabel = g.status === 'overdue'
                ? 'Overdue' + (overdueDays > 0 ? ' · ' + overdueDays + 'd' : '')
                : (STATUS_LABELS[g.status] || g.status);
            const isSelected = state.selected.has(g.id);
            return '<tr tabindex="0" data-id="' + g.id + '" class="' + (isSelected ? 'selected' : '') + '">' +
                '<td><label class="checkbox" onclick="event.stopPropagation()"><input type="checkbox" class="row-check" data-id="' + g.id + '" ' + (isSelected ? 'checked' : '') + ' aria-label="Select ' + g.name + '"><span></span></label></td>' +
                '<td><div class="guest-cell"><span class="guest-avatar">' + initials + '</span><span class="guest-name">' + g.name + '</span></div></td>' +
                '<td class="muted">' + g.guestId + '</td>' +
                '<td class="muted hide-md">' + g.regId + '</td>' +
                '<td class="muted hide-md">' + g.institution + '</td>' +
                '<td><strong>' + g.room + '</strong></td>' +
                '<td class="muted hide-sm">' + formatDate(g.checkIn) + '</td>' +
                '<td class="muted hide-sm ' + (g.status === 'overdue' ? 'text-overdue' : '') + '">' + formatDate(g.checkOut) + '</td>' +
                '<td><span class="status-pill ' + g.status + '"><span class="dot"></span> ' + statusLabel + '</span></td>' +
                '<td class="col-actions"><button class="row-menu-btn" data-id="' + g.id + '" aria-label="More options for ' + g.name + '" onclick="event.stopPropagation()">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>' +
                '</button></td></tr>';
        }).join('');

        if (tableInfo) tableInfo.textContent = 'Showing 1–' + list.length + ' of ' + list.length;
        if (tableFooterInfo) tableFooterInfo.textContent = 'Showing 1–' + list.length + ' of ' + list.length;
        if (guestCount) guestCount.textContent = list.length + ' total';

        guestsBody.querySelectorAll('tr').forEach(function (row) {
            row.addEventListener('click', function (e) {
                if (e.target.closest('.row-check, .row-menu-btn')) return;
                openDrawer(Number(row.dataset.id));
            });
            row.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { e.preventDefault(); openDrawer(Number(row.dataset.id)); }
            });
        });

        guestsBody.querySelectorAll('.row-check').forEach(function (cb) {
            cb.addEventListener('change', function () {
                const id = Number(cb.dataset.id);
                if (cb.checked) state.selected.add(id); else state.selected.delete(id);
                cb.closest('tr').classList.toggle('selected', cb.checked);
                updateBulkBar();
            });
        });

        updateBulkBar();
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    /* ==========================================
       SORTING
       ========================================== */
    document.querySelectorAll('.guests-table th.sortable').forEach(function (th) {
        th.addEventListener('click', function () {
            const key = th.dataset.sort;
            if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
            else { state.sortKey = key; state.sortDir = 'asc'; }
            document.querySelectorAll('.guests-table th.sortable').forEach(function (h) { h.classList.remove('sort-asc', 'sort-desc'); });
            th.classList.add('sort-' + state.sortDir);
            renderTable();
        });
    });

    /* ==========================================
       SEARCH + CHIPS
       ========================================== */
    const filterSearch = document.getElementById('filterSearch');
    if (filterSearch) {
        filterSearch.addEventListener('input', function (e) {
            state.search = e.target.value.trim();
            if (clearFilters) clearFilters.hidden = !hasActiveFilters();
            renderTable();
        });
    }

    function hasActiveFilters() {
        return state.search || state.status !== 'all' || state.floor !== 'all' ||
               state.institution !== 'all' || state.date !== 'all';
    }

    document.querySelectorAll('.chip-select').forEach(function (wrap) {
        const chip = wrap.querySelector('.chip');
        const menu = wrap.querySelector('.chip-menu');
        if (!chip || !menu) return;
        chip.addEventListener('click', function (e) {
            e.stopPropagation();
            const wasOpen = !menu.hidden;
            document.querySelectorAll('.chip-menu').forEach(function (m) { m.hidden = true; });
            menu.hidden = wasOpen;
            chip.setAttribute('aria-expanded', String(!wasOpen));
        });
        menu.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                state[btn.dataset.filter] = btn.dataset.value;
                menu.hidden = true;
                const label = chip.querySelector('.chip-label');
                const base = label.textContent.split(':')[0];
                label.textContent = btn.dataset.value === 'all' ? base : btn.textContent;
                chip.classList.toggle('active', btn.dataset.value !== 'all');
                if (clearFilters) clearFilters.hidden = !hasActiveFilters();
                renderTable();
            });
        });
    });

    document.addEventListener('click', function () {
        document.querySelectorAll('.chip-menu').forEach(function (m) { m.hidden = true; });
        const rm = document.getElementById('rowMenu');
        if (rm) rm.hidden = true;
    });

    if (clearFilters) {
        clearFilters.addEventListener('click', function () {
            state.search = ''; state.status = 'all'; state.floor = 'all';
            state.institution = 'all'; state.date = 'all';
            if (filterSearch) filterSearch.value = '';
            document.querySelectorAll('.chip').forEach(function (c) {
                c.classList.remove('active');
                const lbl = c.querySelector('.chip-label');
                if (lbl) lbl.textContent = lbl.textContent.split(':')[0];
            });
            clearFilters.hidden = true;
            renderTable();
        });
    }
    const emptyClearBtn = document.getElementById('emptyClearBtn');
    if (emptyClearBtn) emptyClearBtn.addEventListener('click', function () { if (clearFilters) clearFilters.click(); });

    /* ==========================================
       SAVED VIEWS
       ========================================== */
    document.querySelectorAll('.saved-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            state.view = tab.dataset.view;
            document.querySelectorAll('.saved-tab').forEach(function (t) {
                t.classList.toggle('active', t === tab);
                t.setAttribute('aria-selected', String(t === tab));
            });
            renderTable();
        });
    });

    /* ==========================================
       SELECT ALL + BULK BAR
       ========================================== */
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', function (e) {
            const list = applyFilters();
            if (e.target.checked) list.forEach(function (g) { state.selected.add(g.id); });
            else state.selected.clear();
            renderTable();
        });
    }

    const bulkBar = document.getElementById('bulkBar');
    const bulkCount = document.getElementById('bulkCount');
    const bulkPlural = document.getElementById('bulkPlural');

    function updateBulkBar() {
        const n = state.selected.size;
        if (bulkBar) bulkBar.hidden = n === 0;
        if (bulkCount) bulkCount.textContent = n;
        if (bulkPlural) bulkPlural.textContent = n === 1 ? '' : 's';
    }

    const bulkClear = document.getElementById('bulkClear');
    if (bulkClear) {
        bulkClear.addEventListener('click', function () {
            state.selected.clear();
            document.querySelectorAll('.row-check').forEach(function (cb) { cb.checked = false; });
            document.querySelectorAll('.guests-table tbody tr').forEach(function (tr) { tr.classList.remove('selected'); });
            updateBulkBar();
        });
    }

    const bulkExport = document.getElementById('bulkExport');
    if (bulkExport) {
        bulkExport.addEventListener('click', function () {
            const list = GUESTS.filter(function (g) { return state.selected.has(g.id); });
            exportCsv(list);
        });
    }

    const bulkNotify = document.getElementById('bulkNotify');
    if (bulkNotify) {
        bulkNotify.addEventListener('click', function () {
            const list = GUESTS.filter(function (g) { return state.selected.has(g.id); });
            list.forEach(function (g) {
                if (window.HavenNotify) window.HavenNotify.push({
                    type: 'system', title: 'Staff notification',
                    message: 'Message sent to ' + g.name, guestId: g.id, guestName: g.name
                });
            });
            showToast('success', 'Notification sent', 'Notified ' + list.length + ' guest(s).');
        });
    }

    /* ==========================================
       ROW MENU
       ========================================== */
    const rowMenu = document.getElementById('rowMenu');
    let menuGuestId = null;

    function requireRole(roles, action) {
        const r = document.body.dataset.role;
        if (roles.indexOf(r) !== -1) return true;
        showToast('error', 'Not allowed', action + ' requires: ' + roles.map(function (x) { return ROLE_LABELS[x]; }).join(' or ') + '.');
        return false;
    }

    if (guestsBody) {
        guestsBody.addEventListener('click', function (e) {
            const btn = e.target.closest('.row-menu-btn');
            if (!btn || !rowMenu) return;
            e.stopPropagation();
            menuGuestId = Number(btn.dataset.id);
            const rect = btn.getBoundingClientRect();
            rowMenu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
            rowMenu.style.left = Math.max(8, rect.right + window.scrollX - 180) + 'px';
            rowMenu.hidden = false;
        });
    }

    if (rowMenu) {
        rowMenu.addEventListener('click', function (e) {
            const actEl = e.target.closest('[data-act]');
            if (!actEl) return;
            const act = actEl.dataset.act;
            rowMenu.hidden = true;
            const g = window.GuestStore.find(menuGuestId);
            if (!g) return;

            if (act === 'view') openDrawer(g.id);
            else if (act === 'edit') {
                if (!requireRole(['front-desk', 'manager'], 'Edit guest')) return;
                openGuestForm(g);
            }
            else if (act === 'checkin') {
                if (!requireRole(['front-desk', 'manager'], 'Check in')) return;
                const r = window.GuestStore.checkIn(g.id);
                showToast(r.ok ? 'success' : 'error', r.ok ? 'Checked in' : 'Cannot check in', r.ok ? g.name + ' is now checked in.' : r.error);
            }
            else if (act === 'checkout') {
                if (!requireRole(['front-desk', 'manager'], 'Check out')) return;
                openConfirm('checkout', g);
            }
            else if (act === 'extend') {
                if (!requireRole(['front-desk', 'manager'], 'Extend stay')) return;
                openConfirm('extend', g);
            }
            else if (act === 'history') {
                openDrawer(g.id);
                setTimeout(function () {
                    const tab = document.querySelector('[data-dtab="history"]');
                    if (tab) tab.click();
                }, 100);
            }
            else if (act === 'delete') {
                if (!requireRole(['manager'], 'Delete guest')) return;
                openConfirm('delete', g);
            }
        });
    }

    /* ==========================================
       GUEST FORM
       ========================================== */
    const formOverlay = document.getElementById('guestFormOverlay');
    const form = document.getElementById('guestForm');
    let editingId = null;

    function openGuestForm(guest) {
        guest = guest || null;
        editingId = guest ? guest.id : null;
        document.getElementById('guestFormTitle').textContent = guest ? 'Edit guest' : 'New guest';
        form.reset();
        form.querySelectorAll('.error-msg').forEach(function (e) { e.textContent = ''; });
        form.querySelectorAll('.form-group').forEach(function (e) { e.classList.remove('error'); });

        if (guest) {
            ['name','guestId','regId','phone','email','idNum','institution','branch','room','checkIn','checkOut']
                .forEach(function (k) { if (form.elements[k]) form.elements[k].value = guest[k] != null ? guest[k] : ''; });
        } else {
            form.elements.guestId.value = window.GuestStore.nextGuestId();
            form.elements.regId.value = window.GuestStore.nextRegId();
            form.elements.checkIn.value = new Date().toISOString().slice(0, 10);
            const d = new Date(); d.setDate(d.getDate() + 7);
            form.elements.checkOut.value = d.toISOString().slice(0, 10);
        }
        formOverlay.hidden = false;
        requestAnimationFrame(function () { formOverlay.classList.add('open'); });
    }

    function closeGuestForm() {
        if (!formOverlay) return;
        formOverlay.classList.remove('open');
        setTimeout(function () { formOverlay.hidden = true; }, 200);
    }

    const gfClose = document.getElementById('guestFormClose');
    if (gfClose) gfClose.addEventListener('click', closeGuestForm);
    const gfCancel = document.getElementById('guestFormCancel');
    if (gfCancel) gfCancel.addEventListener('click', closeGuestForm);
    if (formOverlay) formOverlay.addEventListener('click', function (e) { if (e.target === formOverlay) closeGuestForm(); });

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form));
            const res = editingId ? window.GuestStore.update(editingId, data) : window.GuestStore.add(data);
            if (!res.ok) {
                Object.entries(res.errors || {}).forEach(function (pair) {
                    const field = pair[0], msg = pair[1];
                    const el = form.querySelector('[data-err="' + field + '"]');
                    if (el) { el.textContent = msg; el.closest('.form-group').classList.add('error'); }
                });
                showToast('error', 'Please fix the highlighted fields', '');
                return;
            }
            closeGuestForm();
            showToast('success', editingId ? 'Guest updated' : 'Guest added', res.guest.name + ' · ' + res.guest.guestId);
            if (window.HavenNotify) window.HavenNotify.push({
                type: 'success',
                title: editingId ? 'Guest record updated' : 'New guest registered',
                message: res.guest.name + ' · ' + res.guest.guestId,
                guestId: res.guest.id, guestName: res.guest.name
            });
        });
    }

    const newGuestBtn = document.getElementById('newGuestBtn');
    if (newGuestBtn) {
        newGuestBtn.addEventListener('click', function () {
            if (!requireRole(['front-desk', 'manager'], 'Add guest')) return;
            openGuestForm();
        });
    }

    /* ==========================================
       DRAWER
       ========================================== */
    const drawer = document.getElementById('guestDrawer');
    const drawerOverlay = document.getElementById('guestDrawerOverlay');
    const drawerName = document.getElementById('drawerName');
    const drawerSub = document.getElementById('drawerSub');
    const drawerAvatar = document.getElementById('drawerAvatar');
    const drawerStatus = document.getElementById('drawerStatus');
    const dEmail = document.getElementById('dEmail');
    const dInstitution = document.getElementById('dInstitution');
    let drawerOpenId = null;

    function openDrawer(guestId) {
        const g = window.GuestStore.find(guestId);
        if (!g) return;
        drawerOpenId = guestId;

        const initials = g.name.split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
        if (drawerAvatar) drawerAvatar.textContent = initials;
        if (drawerName) drawerName.textContent = g.name;
        if (drawerSub) drawerSub.textContent = 'Guest ID ' + g.guestId + ' · Room ' + g.room;
        if (drawerStatus) {
            drawerStatus.className = 'status-pill ' + g.status;
            drawerStatus.innerHTML = '<span class="dot"></span> ' + (STATUS_LABELS[g.status] || g.status);
        }
        if (dEmail) dEmail.textContent = g.email || '—';
        if (dInstitution) dInstitution.textContent = g.institution || '—';

        const phoneEl = document.getElementById('dPhone');
        const idEl = document.getElementById('dIdNum');
        if (phoneEl) {
            phoneEl.dataset.value = g.phone || '';
            phoneEl.dataset.revealed = 'false';
            phoneEl.textContent = '•••• ' + String(g.phone || '').slice(-3);
        }
        if (idEl) {
            idEl.dataset.value = g.idNum || '';
            idEl.dataset.revealed = 'false';
            idEl.textContent = '•••• ' + String(g.idNum || '').slice(-3);
        }

        const stayPanel = document.querySelector('[data-panel="stay"]');
        if (stayPanel) {
            const nights = Math.max(0, Math.round((new Date(g.checkOut) - new Date(g.checkIn)) / 86400000));
            stayPanel.innerHTML =
                '<div class="drawer-section"><h4>Stay dates</h4><dl class="drawer-details">' +
                '<div><dt>Check-in</dt><dd>' + formatDate(g.checkIn) + '</dd></div>' +
                '<div><dt>Expected check-out</dt><dd class="' + (g.status === 'overdue' ? 'text-overdue' : '') + '">' + formatDate(g.checkOut) + '</dd></div>' +
                '<div><dt>Nights</dt><dd>' + nights + '</dd></div>' +
                '<div><dt>Status</dt><dd><span class="status-pill ' + g.status + '"><span class="dot"></span> ' + (STATUS_LABELS[g.status] || g.status) + '</span></dd></div>' +
                '</dl></div>' +
                '<div class="drawer-section"><h4>Room</h4><dl class="drawer-details">' +
                '<div><dt>Room</dt><dd>' + g.room + '</dd></div>' +
                '<div><dt>Floor</dt><dd>' + (g.floor ? 'Floor ' + g.floor : '—') + '</dd></div>' +
                '<div><dt>Institution</dt><dd>' + (g.institution || '—') + '</dd></div>' +
                '<div><dt>Branch</dt><dd>' + (g.branch || '—') + '</dd></div>' +
                '</dl></div>';
        }

        const histPanel = document.querySelector('[data-panel="history"]');
        if (histPanel) {
            const items = (g.history || []).map(function (h) {
                const when = new Date(h.at);
                return '<li><span class="history-dot"></span><div>' +
                    '<p><strong>' + (h.by || 'System') + '</strong> ' + h.note + '</p>' +
                    '<span>' + when.toLocaleString('en-US') + ' · ' + h.type + '</span>' +
                    '</div></li>';
            }).join('');
            histPanel.innerHTML = items
                ? '<ul class="drawer-history">' + items + '</ul>'
                : '<p class="muted" style="padding:1rem">No history yet.</p>';
        }

        if (drawer) drawer.hidden = false;
        if (drawerOverlay) drawerOverlay.hidden = false;
        requestAnimationFrame(function () {
            if (drawer) drawer.classList.add('open');
            if (drawerOverlay) drawerOverlay.classList.add('open');
        });
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        if (drawer) drawer.classList.remove('open');
        if (drawerOverlay) drawerOverlay.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(function () {
            if (drawer) drawer.hidden = true;
            if (drawerOverlay) drawerOverlay.hidden = true;
            drawerOpenId = null;
        }, 250);
    }

    const drawerClose = document.getElementById('guestDrawerClose');
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

    document.querySelectorAll('.reveal-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const el = document.getElementById(btn.dataset.reveal);
            if (!el) return;
            const revealed = el.dataset.revealed === 'true';
            el.dataset.revealed = String(!revealed);
            el.textContent = revealed ? '•••• ' + (el.dataset.value || '').slice(-3) : (el.dataset.value || '');
            if (!revealed) {
                showToast('success', 'Revealed', 'Action logged in the guest audit history.');
                const g = window.GuestStore.find(drawerOpenId);
                if (g) window.GuestStore.pushHistory(g, 'audit', 'Revealed ' + btn.dataset.reveal);
            }
        });
    });

    document.querySelectorAll('.drawer-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            const target = tab.dataset.dtab;
            document.querySelectorAll('.drawer-tab').forEach(function (t) {
                const on = t === tab;
                t.classList.toggle('active', on);
                t.setAttribute('aria-selected', String(on));
            });
            document.querySelectorAll('.drawer-panel').forEach(function (p) {
                p.classList.toggle('active', p.dataset.panel === target);
            });
        });
    });

    document.querySelectorAll('.quick-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (btn.getAttribute('aria-disabled') === 'true') {
                showToast('error', 'Not allowed', btn.title || 'Insufficient permissions.');
                return;
            }
            const g = window.GuestStore.find(drawerOpenId);
            if (!g) return;
            const action = btn.dataset.action;

            if (action === 'checkin') {
                const r = window.GuestStore.checkIn(g.id);
                showToast(r.ok ? 'success' : 'error', r.ok ? 'Checked in' : 'Cannot check in', r.ok ? g.name + ' checked in.' : r.error);
            }
            else if (action === 'checkout') openConfirm('checkout', g);
            else if (action === 'extend') openConfirm('extend', g);
            else if (action === 'change-room') openConfirm('change-room', g);
            else if (action === 'notify') {
                if (window.HavenNotify) window.HavenNotify.push({
                    type: 'system', title: 'Guest notification',
                    message: 'To ' + g.name, guestId: g.id, guestName: g.name
                });
                showToast('success', 'Notification sent', 'Guest will receive a message shortly.');
            }
            else if (action === 'contact') showToast('success', 'Contact', 'Front desk notified to contact guest.');
        });
    });

    const saveNote = document.getElementById('saveNote');
    if (saveNote) {
        saveNote.addEventListener('click', function () {
            const g = window.GuestStore.find(drawerOpenId);
            const textEl = document.getElementById('staffNote');
            const text = textEl ? textEl.value.trim() : '';
            if (!g || !text) { showToast('error', 'Empty note', 'Type something first.'); return; }
            window.GuestStore.pushHistory(g, 'note', text);
            if (textEl) textEl.value = '';
            showToast('success', 'Note saved', 'Stored in guest history.');
        });
    }

    /* ==========================================
       CONFIRM MODAL
       ========================================== */
    const confirmOverlay = document.getElementById('confirmOverlay');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmText = document.getElementById('confirmText');
    const confirmReason = document.getElementById('confirmReason');
    const confirmReasonErr = document.getElementById('confirmReasonErr');
    const confirmSubmit = document.getElementById('confirmSubmit');
    let confirmAction = null;
    let confirmGuestId = null;

    function openConfirm(kind, guest) {
        confirmAction = kind;
        confirmGuestId = guest ? guest.id : null;
        const g = guest;

        if (kind === 'change-room') {
            confirmTitle.textContent = 'Change room';
            confirmText.innerHTML = 'Move <strong>' + g.name + '</strong> to a different room. Enter the new room number below.';
            confirmSubmit.className = 'btn btn-primary';
        } else if (kind === 'force-checkout') {
            confirmTitle.textContent = 'Force check-out';
            confirmText.innerHTML = 'Force <strong>' + g.name + '</strong> out of room ' + g.room + ' immediately. Cannot be undone.';
            confirmSubmit.className = 'btn btn-danger';
        } else if (kind === 'checkout') {
            confirmTitle.textContent = 'Check out guest';
            confirmText.innerHTML = 'Check out <strong>' + g.name + '</strong> from room <strong>' + g.room + '</strong>.';
            confirmSubmit.className = 'btn btn-primary';
        } else if (kind === 'extend') {
            confirmTitle.textContent = 'Extend stay';
            confirmText.innerHTML = 'Extend <strong>' + g.name + '</strong>\'s stay. Enter new check-out date (YYYY-MM-DD). Current: ' + g.checkOut + '.';
            confirmSubmit.className = 'btn btn-primary';
        } else if (kind === 'delete') {
            confirmTitle.textContent = 'Delete guest';
            confirmText.innerHTML = 'Permanently delete <strong>' + g.name + '</strong> (' + g.guestId + ')? Cannot be undone.';
            confirmSubmit.className = 'btn btn-danger';
        }

        confirmReason.value = '';
        confirmReasonErr.textContent = '';
        confirmReason.closest('.form-group').classList.remove('error');
        confirmOverlay.hidden = false;
        requestAnimationFrame(function () {
            confirmOverlay.classList.add('open');
            setTimeout(function () { confirmReason.focus(); }, 100);
        });
    }

    function closeConfirm() {
        if (!confirmOverlay) return;
        confirmOverlay.classList.remove('open');
        setTimeout(function () { confirmOverlay.hidden = true; }, 200);
    }

    const cClose = document.getElementById('confirmClose');
    if (cClose) cClose.addEventListener('click', closeConfirm);
    const cCancel = document.getElementById('confirmCancel');
    if (cCancel) cCancel.addEventListener('click', closeConfirm);
    if (confirmOverlay) confirmOverlay.addEventListener('click', function (e) { if (e.target === confirmOverlay) closeConfirm(); });

    if (confirmSubmit) {
        confirmSubmit.addEventListener('click', function () {
            const reason = confirmReason.value.trim();
            if (reason.length < 5) {
                confirmReason.closest('.form-group').classList.add('error');
                confirmReasonErr.textContent = 'Please provide a reason (min 5 characters).';
                confirmReason.focus();
                return;
            }
            const g = window.GuestStore.find(confirmGuestId);
            if (!g) { closeConfirm(); return; }

            if (confirmAction === 'checkout') {
                const r = window.GuestStore.checkOut(g.id, { reason: reason });
                showToast(r.ok ? 'success' : 'error', r.ok ? 'Checked out' : 'Cannot check out', r.ok ? g.name + ' checked out.' : r.error);
                if (r.ok && window.HavenNotify) window.HavenNotify.push({
                    type: 'success', title: 'Guest checked out',
                    message: g.name + ' · room ' + g.room, guestId: g.id, guestName: g.name
                });
            }
            else if (confirmAction === 'force-checkout') {
                const r = window.GuestStore.checkOut(g.id, { force: true, reason: reason });
                showToast(r.ok ? 'success' : 'error', 'Force check-out', r.ok ? 'Done.' : r.error);
            }
            else if (confirmAction === 'extend') {
                const r = window.GuestStore.extend(g.id, reason);
                showToast(r.ok ? 'success' : 'error', r.ok ? 'Stay extended' : 'Cannot extend', r.ok ? 'New check-out: ' + reason : r.error);
            }
            else if (confirmAction === 'change-room') {
                const r = window.GuestStore.update(g.id, { room: reason });
                showToast(r.ok ? 'success' : 'error', 'Room changed', r.ok ? 'Moved to room ' + reason + '.' : 'Update failed.');
            }
            else if (confirmAction === 'delete') {
                const r = window.GuestStore.remove(g.id);
                if (!r.ok) showToast('error', 'Cannot delete', r.error);
                else { showToast('success', 'Guest deleted', g.name + ' removed.'); closeDrawer(); }
            }
            closeConfirm();
        });
    }

    /* ==========================================
       CSV EXPORT
       ========================================== */
    function exportCsv(list) {
        const header = ['Guest', 'Guest ID', 'Registration ID', 'Institution', 'Room', 'Check-in', 'Expected check-out', 'Status', 'Phone', 'Email'];
        const rows = list.map(function (g) {
            return [g.name, g.guestId, g.regId, g.institution, g.room, g.checkIn, g.checkOut,
                STATUS_LABELS[g.status] || g.status, g.phone, g.email];
        });
        const csv = [header].concat(rows).map(function (line) {
            return line.map(function (c) { return '"' + String(c || '').replace(/"/g, '""') + '"'; }).join(',');
        }).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'haven-guests-' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        showToast('success', 'Exported', list.length + ' guest(s) exported as CSV.');
    }

    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) exportBtn.addEventListener('click', function () { exportCsv(applyFilters()); });

    /* ==========================================
       KEYBOARD
       ========================================== */
    document.addEventListener('keydown', function (e) {
        const tag = (e.target.tagName || '').toLowerCase();
        const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
        if (!typing && e.key === '/') {
            e.preventDefault();
            const fs = document.getElementById('filterSearch');
            if (fs) fs.focus();
        }
        if (e.key === 'Escape') {
            closeSidebar(); closeDrawer(); closeConfirm(); closeGuestForm();
            const rm = document.getElementById('rowMenu');
            if (rm) rm.hidden = true;
        }
    });

    /* ==========================================
       TOASTS
       ========================================== */
    const toastContainer = document.getElementById('toastContainer');
    function showToast(type, title, message, timeout) {
        timeout = timeout || 3200;
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.innerHTML =
            '<span class="toast-icon" aria-hidden="true">' +
            (type === 'success'
                ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e5a3a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9b1c1c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>') +
            '</span>' +
            '<div class="toast-text"><strong>' + title + '</strong>' + message + '</div>';
        toastContainer.appendChild(toast);
        setTimeout(function () {
            toast.classList.add('leaving');
            setTimeout(function () { toast.remove(); }, 250);
        }, timeout);
    }

    /* ==========================================
       STORE SYNC
       ========================================== */
    window.GuestStore.onChange(function () {
        GUESTS = window.GuestStore.all();
        state.selected.forEach(function (id) {
            if (!GUESTS.some(function (g) { return g.id === id; })) state.selected.delete(id);
        });
        renderTable();
        if (drawerOpenId && drawer && !drawer.hidden) openDrawer(drawerOpenId);
    });

    /* ==========================================
       INIT
       ========================================== */
    applyRole('front-desk');
    renderTable();
});

/* RBAC bootstrap */
document.addEventListener('DOMContentLoaded', function () {
    if (!window.RBAC) return;
    try { RBAC.init({ active: 'guests' }); } catch (e) { /* RBAC optional */ }
});