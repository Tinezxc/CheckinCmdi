/* ==========================================================
   HAVEN — Staff core helpers (shared by every staff page)
   Everything lives in small named functions on window.HavenStaff.
   No sample data in here: pages start empty and fill from the database.
   ========================================================== */
(function () {
    'use strict';

    /* ---------- DOM + text helpers ---------- */
    function $(selector, root) { return (root || document).querySelector(selector); }
    function $$(selector, root) { return Array.from((root || document).querySelectorAll(selector)); }

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function initials(name) {
        return String(name || '').split(' ').filter(Boolean).map(function (w) { return w[0]; })
            .slice(0, 2).join('').toUpperCase() || '–';
    }

    function debounce(fn, wait) {
        var timer;
        return function () {
            var args = arguments, ctx = this;
            clearTimeout(timer);
            timer = setTimeout(function () { fn.apply(ctx, args); }, wait || 250);
        };
    }

    /* ---------- dates ---------- */
    function toDate(value) {
        var d = value instanceof Date ? value : new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    function formatDate(value) {
        var d = toDate(value);
        return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    }
    function formatDateTime(value) {
        var d = toDate(value);
        return d ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
    }
    function timeAgo(value) {
        var d = toDate(value);
        if (!d) return '—';
        var mins = Math.floor((Date.now() - d.getTime()) / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return mins + ' min ago';
        var hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + ' hr ago';
        var days = Math.floor(hrs / 24);
        return days + (days === 1 ? ' day ago' : ' days ago');
    }

    /* ---------- toasts ---------- */
    function toastContainer() {
        var box = document.getElementById('toastContainer');
        if (!box) {
            box = document.createElement('div');
            box.id = 'toastContainer';
            box.className = 'toast-container';
            box.setAttribute('aria-live', 'polite');
            document.body.appendChild(box);
        }
        return box;
    }
    function toast(type, title, message) {
        var el = document.createElement('div');
        el.className = 'toast' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '');
        el.innerHTML = '<div class="toast-text"><strong>' + esc(title) + '</strong>' + (message ? esc(message) : '') + '</div>';
        toastContainer().appendChild(el);
        setTimeout(function () {
            el.classList.add('leaving');
            setTimeout(function () { el.remove(); }, 180);
        }, 3500);
    }

    /* ---------- empty + loading placeholders ---------- */
    var EMPTY_ICONS = {
        inbox: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
        users: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        home: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
        chart: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>'
    };
    /* Returns the HTML for a friendly empty state */
    function emptyState(opts) {
        opts = opts || {};
        return '<div class="empty-state haven-empty">' +
            '<div class="haven-empty-icon" aria-hidden="true">' + (EMPTY_ICONS[opts.icon] || EMPTY_ICONS.inbox) + '</div>' +
            '<p class="empty-title">' + esc(opts.title || 'Nothing here yet') + '</p>' +
            (opts.sub ? '<p class="empty-sub">' + esc(opts.sub) + '</p>' : '') +
            '</div>';
    }
    /* Returns skeleton rows while data loads */
    function skeletonRows(count) {
        var out = '';
        for (var i = 0; i < (count || 4); i++) out += '<div class="skeleton-row" aria-hidden="true"></div>';
        return '<div class="skeleton-list" role="status" aria-label="Loading">' + out + '</div>';
    }

    /* ---------- styled confirmation (replaces window.confirm) ---------- */
    function confirmDialog(opts) {
        opts = opts || {};
        return new Promise(function (resolve) {
            var previous = document.activeElement;
            var overlay = document.createElement('div');
            overlay.className = 'haven-dialog-overlay';
            overlay.innerHTML =
                '<div class="haven-dialog" role="alertdialog" aria-modal="true" aria-labelledby="hdTitle">' +
                '<h3 id="hdTitle"></h3><p class="haven-dialog-msg"></p>' +
                (opts.requireReason ? '<label class="haven-dialog-label">Reason <span class="required">*</span>' +
                    '<textarea rows="3" placeholder="Provide a reason (min 5 characters)…"></textarea></label>' : '') +
                '<p class="haven-dialog-err" role="alert"></p>' +
                '<div class="haven-dialog-actions"><button type="button" class="btn btn-ghost" data-act="cancel"></button>' +
                '<button type="button" class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" data-act="ok"></button></div></div>';
            overlay.querySelector('h3').textContent = opts.title || 'Are you sure?';
            overlay.querySelector('.haven-dialog-msg').innerHTML = opts.message || '';
            overlay.querySelector('[data-act="cancel"]').textContent = opts.cancelText || 'Cancel';
            overlay.querySelector('[data-act="ok"]').textContent = opts.confirmText || 'Confirm';

            function close(result) {
                document.removeEventListener('keydown', onKey);
                overlay.classList.remove('open');
                setTimeout(function () { overlay.remove(); }, 180);
                if (previous && previous.focus) previous.focus();
                resolve(result);
            }
            function onKey(e) { if (e.key === 'Escape') close(null); }

            overlay.addEventListener('click', function (e) { if (e.target === overlay) close(null); });
            overlay.querySelector('[data-act="cancel"]').addEventListener('click', function () { close(null); });
            overlay.querySelector('[data-act="ok"]').addEventListener('click', function () {
                var reason = '';
                if (opts.requireReason) {
                    reason = overlay.querySelector('textarea').value.trim();
                    if (reason.length < 5) {
                        overlay.querySelector('.haven-dialog-err').textContent = 'Please enter a reason (min 5 characters).';
                        return;
                    }
                }
                close({ confirmed: true, reason: reason });
            });

            document.addEventListener('keydown', onKey);
            document.body.appendChild(overlay);
            requestAnimationFrame(function () { overlay.classList.add('open'); });
            (overlay.querySelector('textarea') || overlay.querySelector('[data-act="cancel"]')).focus();
        });
    }

    /* ---------- CSV export ---------- */
    function downloadCsv(filename, header, rows) {
        var lines = [header].concat(rows).map(function (cols) {
            return cols.map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(',');
        });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    /* ---------- database helpers (fail soft, never crash a page) ---------- */
    function db() { return window.supabaseClient || null; }

    /* Runs a Supabase query function and always returns { data, error } */
    async function query(run) {
        var client = db();
        if (!client) return { data: null, error: { message: 'Not connected to the database.' } };
        try {
            var res = await run(client);
            return { data: res.data == null ? null : res.data, error: res.error || null };
        } catch (err) {
            return { data: null, error: { message: (err && err.message) || 'Request failed.' } };
        }
    }

    /* Writes a row to the audit log (never blocks the action if it fails) */
    async function audit(action, target, reason, details) {
        target = target || {};
        var res = await query(function (c) {
            return c.rpc('log_audit', {
                p_action: action,
                p_target_type: target.type || null,
                p_target_id: target.id != null ? String(target.id) : null,
                p_reason: reason || null,
                p_details: details || null
            });
        });
        if (res.error) console.warn('Audit log not saved:', res.error.message);
        return !res.error;
    }

    /* The signed-in person's name (RBAC loads it; falls back to "Staff") */
    function currentStaffName() {
        return (window.RBAC && window.RBAC.getProfile && window.RBAC.getProfile().name) || 'Staff';
    }

    /* Let RBAC (and older page code) reuse the toast */
    if (typeof window.showToast !== 'function') window.showToast = toast;

    window.HavenStaff = {
        $: $, $$: $$, esc: esc, initials: initials, debounce: debounce,
        formatDate: formatDate, formatDateTime: formatDateTime, timeAgo: timeAgo,
        toast: toast, emptyState: emptyState, skeletonRows: skeletonRows,
        confirmDialog: confirmDialog, downloadCsv: downloadCsv,
        db: db, query: query, audit: audit, currentStaffName: currentStaffName
    };
})();