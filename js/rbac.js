/* ==========================================================
   HAVEN — Staff Role-Based Access Control (RBAC)
   Shared by every staff page. Do not edit per-page.
   ========================================================== */
(function () {
    'use strict';

    /* ==========================================
       ROLE CONFIG (single source of truth)
       ========================================== */
    const ROLES = {
        'front-desk': {
            label: 'Front desk',
            name: 'Staff',
            initials: 'ST',
            home: 'staff-dashboard.html',
            nav: ['dashboard', 'guests', 'rooms', 'checkin', 'requests'],
            // What the role can DO (used by element gating and data filtering)
            permissions: {
                'dashboard.view': true,
                'guests.view': true,
                'guests.reveal': true,       // reveal masked ID/phone (with reason)
                'rooms.view': true,
                'rooms.change': true,
                'rooms.clean': false,
                'checkin.view': true,
                'checkin.do': true,
                'checkin.force': false,
                'bookings.approve': true,
                'requests.view': 'all',      // 'all' or 'housekeeping' or false
                'requests.assign': true,
                'reports.view': false,
                'settings.view': false
            }
        },
        'housekeeping': {
            label: 'Housekeeping',
            name: 'Staff',
            initials: 'ST',
            home: 'staff-dashboard.html',
            nav: ['dashboard', 'rooms', 'requests'],
            permissions: {
                'dashboard.view': true,
                'guests.view': false,
                'guests.reveal': false,
                'rooms.view': true,
                'rooms.change': false,
                'rooms.clean': true,         // update cleaning status only
                'checkin.view': false,
                'checkin.do': false,
                'checkin.force': false,
                'bookings.approve': false,
                'requests.view': 'housekeeping',
                'requests.assign': false,
                'reports.view': false,
                'settings.view': false
            }
        },
        'maintenance': {
            label: 'Maintenance',
            name: 'Staff',
            initials: 'ST',
            home: 'staff-dashboard.html',
            nav: ['dashboard', 'rooms', 'requests'],
            permissions: {
                'dashboard.view': true,
                'guests.view': false,
                'guests.reveal': false,
                'rooms.view': true,
                'rooms.change': false,
                'rooms.clean': false,
                'checkin.view': false,
                'checkin.do': false,
                'checkin.force': false,
                'bookings.approve': false,
                'requests.view': 'maintenance',
                'requests.assign': false,
                'reports.view': false,
                'settings.view': false
            }
        },
        'manager': {
            label: 'Manager',
            name: 'Staff',
            initials: 'ST',
            home: 'staff-dashboard.html',
            nav: ['dashboard', 'guests', 'rooms', 'checkin', 'requests', 'reports', 'settings'],
            permissions: {
                'dashboard.view': true,
                'guests.view': true,
                'guests.reveal': true,
                'rooms.view': true,
                'rooms.change': true,
                'rooms.clean': true,
                'checkin.view': true,
                'checkin.do': true,
                'checkin.force': true,
                'bookings.approve': false,
                'requests.view': 'all',
                'requests.assign': true,
                'reports.view': true,
                'settings.view': true
            }
        }
    };

    /* ==========================================
       NAV ITEMS (label + href per key)
       ========================================== */
    const NAV_ITEMS = {
        dashboard: { label: 'Dashboard',          href: 'staff-dashboard.html',        icon: 'grid' },
        guests:    { label: 'Guests',             href: 'staff-guests.html',           icon: 'users' },
        rooms:     { label: 'Rooms',              href: 'staff-rooms.html',            icon: 'home' },
        checkin:   { label: 'Check-in / out',     href: 'staff-checkin.html',          icon: 'check' },
        requests:  { label: 'Service requests',   href: 'staff-requests.html',         icon: 'chat', badge: true },
        reports:   { label: 'Reports',            href: 'staff-reports.html',          icon: 'chart' },
        settings:  { label: 'Staff & settings',   href: 'staff-settings.html',         icon: 'settings' }
    };

    /* ==========================================
       ICON HELPERS
       ========================================== */
    const ICONS = {
        grid: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
        users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
        home: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
        check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
        chat: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
        chart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
        settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
    };

    /* ==========================================
       ROLE STATE - the authenticated profiles.role is authoritative.
       Role previews and browser-cached roles are disabled.
       ========================================== */
    const CACHE_KEY = 'haven_role_cache';
    const VIEW_AS_KEY = 'haven_view_as';
    const STAFF_ROLES = Object.keys(ROLES);
    const state = { realRole: null, userId: null, name: 'Staff', initials: 'ST', verified: false, denied: false };

    function safeParse(json) { try { return JSON.parse(json); } catch (e) { return null; } }
    function readCache() { return null; }
    function writeCache() { /* no client-side role cache */ }
    function clearCache() {
        try { localStorage.removeItem(CACHE_KEY); } catch (e) { /* storage may be blocked */ }
        try { sessionStorage.removeItem(VIEW_AS_KEY); } catch (e) { /* storage may be blocked */ }
    }
    function getViewAs() { return null; }
    function setViewAs() { return false; }
    function isViewingAs() { return false; }
    function effectiveRole() { return state.verified ? state.realRole : null; }

    function currentNavKey() {
        const page = (window.location.pathname.split('/').pop() || 'staff-dashboard.html').toLowerCase();
        const found = Object.entries(NAV_ITEMS).find(([, item]) => item.href.toLowerCase() === page);
        return found ? found[0] : null;
    }

    function makeInitials(name) {
        return String(name || '').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'ST';
    }

    /* ---------- full-screen messages (checking / staff only / error) ---------- */
    function injectOverlayStyles() {
        if (document.getElementById('rbacGateCSS')) return;
        const style = document.createElement('style');
        style.id = 'rbacGateCSS';
        style.textContent = `
            .rbac-gate { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; padding: 24px;
                background: radial-gradient(900px 400px at 85% -10%, rgba(75,124,92,.14), transparent 60%), #f1f0ea;
                font-family: var(--sans, var(--font-sans, Inter, sans-serif)); color: #1b221e; }
            .rbac-gate-card { width: min(440px, 100%); padding: 40px 32px; text-align: center; background: #fff; border: 1px solid #e5e3dc;
                border-radius: 16px; box-shadow: 0 16px 40px rgba(20,28,24,.12); }
            .rbac-gate-icon { width: 64px; height: 64px; margin: 0 auto 16px; display: grid; place-items: center; border-radius: 50%;
                background: #eef2ee; color: #1b3a2e; }
            .rbac-gate-icon.warn { background: #fbeecf; color: #7a5200; }
            .rbac-gate h2 { font-family: var(--serif, var(--font-serif, 'Playfair Display', serif)); font-size: 1.4rem; font-weight: 500; color: #1b3a2e; margin-bottom: 8px; }
            .rbac-gate p { font-size: .9rem; line-height: 1.55; color: #4a554e; margin-bottom: 20px; }
            .rbac-gate-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
            .rbac-gate-btn { padding: 10px 18px; border-radius: 8px; border: 1px solid #cfccc1; background: #fff; font: inherit; font-size: .85rem;
                font-weight: 600; color: #1b221e; cursor: pointer; text-decoration: none; }
            .rbac-gate-btn.primary { background: #1b3a2e; border-color: #12291f; color: #fff; }
            .rbac-spinner { width: 28px; height: 28px; border: 3px solid #e2e8e0; border-top-color: #1b3a2e; border-radius: 50%; animation: rbacSpin .8s linear infinite; }
            @keyframes rbacSpin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }

    function showGate({ title, message, icon = 'lock', warn = false, actions = [] }) {
        injectOverlayStyles();
        hideGate();
        const icons = {
            spinner: '<div class="rbac-spinner" aria-hidden="true"></div>',
            lock: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'
        };
        const gate = document.createElement('div');
        gate.className = 'rbac-gate';
        gate.id = 'rbacGate';
        gate.setAttribute('role', 'alertdialog');
        gate.innerHTML = `
            <div class="rbac-gate-card">
                <div class="rbac-gate-icon${warn ? ' warn' : ''}">${icons[icon] || icons.lock}</div>
                <h2></h2><p></p>
                <div class="rbac-gate-actions"></div>
            </div>`;
        gate.querySelector('h2').textContent = title;
        gate.querySelector('p').textContent = message;
        const box = gate.querySelector('.rbac-gate-actions');
        actions.forEach((a) => {
            const el = document.createElement(a.href ? 'a' : 'button');
            el.className = 'rbac-gate-btn' + (a.primary ? ' primary' : '');
            el.textContent = a.label;
            if (a.href) el.href = a.href;
            if (a.onClick) el.addEventListener('click', a.onClick);
            box.appendChild(el);
        });
        document.body.appendChild(gate);
    }
    function hideGate() { const g = document.getElementById('rbacGate'); if (g) g.remove(); }

    /* ---------- sign out (also ends the Supabase session) ---------- */
    async function signOut() {
        clearCache();
        try { if (window.supabaseClient) await window.supabaseClient.auth.signOut(); } catch (e) { /* ignore */ }
        window.location.href = 'index.html';
    }

    /* ---------- verify the signed-in staff account against Supabase ---------- */
    async function verifyAccess() {
        const db = window.supabaseClient;
        if (!db) {
            state.denied = true;
            showGate({ title: 'Cannot connect', warn: true, icon: 'lock',
                message: 'The connection to Supabase is unavailable. Check the Supabase client script.',
                actions: [{ label: 'Try again', primary: true, onClick: () => window.location.reload() }] });
            return false;
        }

        let session = null;
        try {
            const result = await db.auth.getSession();
            session = result?.data?.session || null;
        } catch (error) {
            console.error('Could not read staff session:', error);
        }

        if (!session) {
            const page = window.location.pathname.split('/').pop() || '';
            window.location.href = 'index.html' + (/^staff-[a-z]+\.html$/.test(page) ? '?next=' + encodeURIComponent(page) : '');
            return false;
        }

        const { data: profile, error: profileError } = await db
            .from('profiles')
            .select('id,full_name,role,status')
            .eq('id', session.user.id)
            .maybeSingle();

        if (profileError || !profile) {
            state.denied = true;
            showGate({ title: 'We could not verify your staff profile', warn: true,
                message: 'Please sign in again. If the problem continues, contact CMDI management.',
                actions: [{ label: 'Try again', primary: true, onClick: () => window.location.reload() },
                          { label: 'Sign out', onClick: signOut }] });
            return false;
        }

        state.userId = session.user.id;
        state.name = profile.full_name || 'Staff';
        state.initials = makeInitials(state.name);
        Object.values(ROLES).forEach((item) => { item.name = state.name; item.initials = state.initials; });

        if (String(profile.status || '').toLowerCase() === 'suspended') {
            state.denied = true;
            clearCache();
            showGate({ title: 'Account suspended', icon: 'lock',
                message: 'This account is suspended. Contact CMDI management.',
                actions: [{ label: 'Sign out', primary: true, onClick: signOut }] });
            return false;
        }

        const role = String(profile.role || '').trim().toLowerCase();
        if (!STAFF_ROLES.includes(role)) {
            state.denied = true;
            clearCache();
            showGate({ title: 'Staff area', icon: 'lock',
                message: 'This part of CMDI is for authorized staff only. Your account has no operational staff role.',
                actions: [{ label: 'Go to my dashboard', primary: true, href: 'client-dashboard.html' },
                          { label: 'Sign out', onClick: signOut }] });
            return false;
        }

        // Database confirmation also checks account usability and the verified Login OTP session.
        try {
            const { data: isStaff, error } = await db.rpc('is_staff');
            if (error) throw error;
            if (isStaff !== true) throw new Error('The database did not authorize this staff account.');
        } catch (error) {
            state.denied = true;
            clearCache();
            console.error('Staff verification failed:', error);
            showGate({ title: 'Unable to verify staff access', warn: true,
                message: error.message || 'CMDI could not verify your staff permissions.',
                actions: [{ label: 'Try again', primary: true, onClick: () => window.location.reload() },
                          { label: 'Sign out', onClick: signOut }] });
            return false;
        }

        state.realRole = role;
        state.verified = true;
        state.denied = false;

        const activeKey = currentNavKey();
        if (activeKey && !ROLES[role].nav.includes(activeKey)) {
            state.denied = true;
            showGate({ title: 'No access', icon: 'lock',
                message: `Your assigned role (${ROLES[role].label}) cannot access this section.`,
                actions: [{ label: 'Go to Dashboard', primary: true, href: ROLES[role].home },
                          { label: 'Sign out', onClick: signOut }] });
            return false;
        }

        hideGate();
        RBAC.applySidebar(activeKey);
        RBAC.applyIdentity();
        RBAC.applyAssignedRole();
        RBAC.applyElementGating();
        RBAC.applyLogout();
        return true;
    }

    /* ==========================================
       PUBLIC API
       ========================================== */
    const RBAC = {
        ROLES,
        NAV_ITEMS,

        /* --- Assigned role: verified database profile only --- */
        getRole() { return effectiveRole(); },
        realRole() { return state.verified ? state.realRole : null; },
        isManager() { return state.verified && state.realRole === 'manager'; },
        isViewingAs() { return false; },
        setRole() { return false; },
        getProfile() { return state.verified && state.realRole ? ROLES[state.realRole] : null; },
        signOut() { return signOut(); },
        ready: null,
        can(perm) {
            const profile = this.getProfile();
            return !!profile && profile.permissions[perm] === true;
        },
        canView(navKey) {
            const profile = this.getProfile();
            return !!profile && profile.nav.includes(navKey);
        },
        requestsScope() {
            const profile = this.getProfile();
            return profile ? profile.permissions['requests.view'] : false;
        },

        /* ==========================================
           APPLY: sidebar nav
           ========================================== */
        applySidebar(activeKey) {
            const nav = document.querySelector('.sidebar-nav');
            if (!nav) return;
            const role = this.getProfile();
            if (!role) return;

            // Remove any existing nav items
            nav.querySelectorAll('.nav-item[data-nav-key]').forEach((el) => el.remove());
            // Also remove any legacy static nav items
            nav.querySelectorAll('.nav-item:not(.logout)').forEach((el) => {
                if (!el.dataset.navKey) el.remove();
            });

            // Insert section title if none
            let sectionTitle = nav.querySelector('.nav-section-title');
            if (!sectionTitle) {
                sectionTitle = document.createElement('span');
                sectionTitle.className = 'nav-section-title';
                sectionTitle.textContent = 'OPERATIONS';
                nav.insertBefore(sectionTitle, nav.firstChild);
            }

            // Add the current role's nav items
            role.nav.forEach((key) => {
                const item = NAV_ITEMS[key];
                if (!item) return;

                const isManagerOnly = (key === 'reports' || key === 'settings');
                const isActive = key === activeKey;

                const a = document.createElement('a');
                a.href = item.href;
                a.className = 'nav-item' + (isActive ? ' active' : '');
                a.dataset.navKey = key;
                if (isActive) a.setAttribute('aria-current', 'page');

                let badgeHTML = '';
                if (item.badge) {
                    const count = this.openRequestsCountFor(role);
                    badgeHTML = `<span class="badge" id="navReqBadge"${count ? '' : ' hidden'}>${count}</span>`;
                }

                a.innerHTML = `${ICONS[item.icon] || ''} ${item.label}${badgeHTML}`;
                nav.appendChild(a);
            });

        },

        /* Count of requests visible to a role (used for the sidebar badge) */
        openRequestsCountFor(role) {
            const scope = role.permissions['requests.view'];
            // No sample data: the real count is filled in by the page that loads the requests.
            return 0;
        },

        /* ==========================================
           APPLY: identity in sidebar footer + topbar
           ========================================== */
        applyIdentity() {
            const role = this.getProfile();
            if (!role) return;
            const setText = (selector, value) => {
                document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
            };
            setText('.staff-name', state.name);
            setText('#staffRoleLabel', role.label);
            setText('#roleBreadcrumb', role.label);
            setText('#assignedRoleValue', role.label);
            setText('.topbar-avatar', state.initials);
            setText('.staff-avatar', state.initials);
            setText('.mobile-topbar .topbar-avatar', state.initials);
            document.body.dataset.role = state.realRole;
        },

        applyAssignedRole() {
            const node = document.getElementById('assignedRoleValue');
            const role = this.getProfile();
            if (node && role) node.textContent = role.label;
        },

        // Compatibility no-op for older pages. Role switching is not supported.
        applyRoleSwitcher() { this.applyAssignedRole(); },

        /* ==========================================
           APPLY: sign-out links really end the session
           ========================================== */
        applyLogout() {
            document.querySelectorAll('.nav-item.logout').forEach((a) => {
                if (a.dataset.rbacLogout) return;
                a.dataset.rbacLogout = '1';
                a.addEventListener('click', (e) => { e.preventDefault(); signOut(); });
            });
        },

        /* ==========================================
           APPLY: element-level gating
           Elements marked with data-requires="manager|front-desk|..." 
           are hidden if the current role isn't in the list.
           Elements with data-requires-any="a,b,c" are hidden unless role in list.
           ========================================== */
        applyElementGating() {
            const role = this.getRole();
            document.querySelectorAll('[data-requires]').forEach((el) => {
                const roles = el.dataset.requires.split(/[|,]/).map((s) => s.trim());
                if (roles.includes(role)) {
                    el.removeAttribute('hidden');
                    el.removeAttribute('aria-disabled');
                    el.removeAttribute('title');
                } else {
                    el.setAttribute('hidden', '');
                }
            });
            document.querySelectorAll('[data-requires-any]').forEach((el) => {
                const roles = el.dataset.requiresAny.split(/[|,]/).map((s) => s.trim());
                if (roles.includes(role)) el.removeAttribute('hidden');
                else el.setAttribute('hidden', '');
            });
            document.querySelectorAll('[data-permission]').forEach((el) => {
                const allowed = this.can(el.dataset.permission.trim());
                if (allowed) {
                    el.removeAttribute('hidden');
                    el.removeAttribute('aria-disabled');
                } else {
                    el.setAttribute('hidden', '');
                    el.setAttribute('aria-disabled', 'true');
                }
            });
        },

        /* ==========================================
           ROUTE GUARD
           Call this at the top of each page: RBAC.guardPage('reports');
           If the current role can't view this page, replace body content with
           a "No access" screen.
           ========================================== */
        guardPage(navKey) {
            if (!state.verified || !state.realRole) return false;
            if (this.canView(navKey)) return true;
            // Build No-access UI
            const layout = document.querySelector('.dashboard-layout');
            if (!layout) return false;
            const denied = document.createElement('section');
            denied.className = 'rbac-denied';
            denied.innerHTML = `
                <div class="rbac-denied-card">
                    <div class="rbac-denied-icon" aria-hidden="true">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <h2>No access</h2>
                    <p>Your role (<strong>${this.getProfile().label}</strong>) does not have permission to view this page.</p>
                    <div class="rbac-denied-actions">
                        <a class="btn btn-primary" href="${this.getProfile().home}">Go to Dashboard</a>
                    </div>
                </div>
            `;
            // Hide every existing child of body except the denied section
            Array.from(document.body.children).forEach((child) => {
                if (child.tagName !== 'SCRIPT' && !child.classList.contains('rbac-denied')) {
                    child.style.display = 'none';
                }
            });
            document.body.appendChild(denied);
            // Inject minimal CSS
            if (!document.getElementById('rbacDeniedCSS')) {
                const style = document.createElement('style');
                style.id = 'rbacDeniedCSS';
                style.textContent = `
                    .rbac-denied { position: fixed; inset: 0; background: var(--bg-cream, #f6f5f1); display: grid; place-items: center; padding: 24px; font-family: var(--font-sans, Inter, sans-serif); z-index: 9999; }
                    .rbac-denied-card { background: #fff; border: 1px solid #e0dfd9; border-radius: 16px; padding: 48px 32px; max-width: 520px; text-align: center; box-shadow: 0 12px 32px rgba(31,41,35,0.08); }
                    .rbac-denied-icon { display: inline-flex; width: 80px; height: 80px; border-radius: 50%; background: #fdf0d5; color: #8a5a00; align-items: center; justify-content: center; margin-bottom: 16px; }
                    .rbac-denied h2 { font-family: var(--font-serif, 'Playfair Display', serif); font-size: 1.5rem; font-weight: 600; margin-bottom: 8px; color: #1f2923; }
                    .rbac-denied p { font-size: 0.9rem; color: #4f5a53; margin-bottom: 24px; line-height: 1.5; }
                    .rbac-denied .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; font-size: 0.85rem; font-weight: 500; text-decoration: none; background: #1b3a2e; color: #fff; }
                `;
                document.head.appendChild(style);
            }
            return false;
        },

        /* ==========================================
           MASKED DATA REVEAL
           data-masked-element -> on click, prompt for reason and reveal for 30s.
           Logs to console (mock audit).
           ========================================== */
        attachReveal(btn, value) {
            btn.addEventListener('click', () => {
                if (!this.can('guests.reveal')) {
                    this.toast('error', 'Not allowed', 'Your role cannot reveal masked data.');
                    return;
                }
                const reason = window.prompt('Reason for revealing this data (min 5 characters):');
                if (!reason || reason.trim().length < 5) {
                    this.toast('error', 'Reason required', 'You must provide a reason to reveal masked data.');
                    return;
                }
                // Log the reveal (mock)
                console.log('[AUDIT] Reveal', {
                    actor: this.getProfile().name,
                    role: this.getRole(),
                    value,
                    reason: reason.trim(),
                    timestamp: new Date().toISOString()
                });
                this.toast('success', 'Revealed', 'Data shown for 30 seconds. This action has been logged.');
                // Temporarily display
                const el = btn.previousElementSibling;
                const original = el.textContent;
                el.textContent = value;
                setTimeout(() => { el.textContent = original; }, 30000);
            });
        },

        /* ==========================================
           DESTRUCTIVE ACTION CONFIRMATION
           Usage: RBAC.confirmAction({title, message, keyword, requireRole})
           Returns a Promise<boolean>.
           ========================================== */
        confirmAction(opts) {
            return new Promise((resolve) => {
                if (opts.requireRole && !this.can(opts.requireRole)) {
                    this.toast('error', 'Not allowed', 'You do not have permission for this action.');
                    resolve(false);
                    return;
                }
                const overlay = document.createElement('div');
                overlay.className = 'rbac-confirm-overlay';
                overlay.innerHTML = `
                    <div class="rbac-confirm-modal" role="dialog" aria-modal="true">
                        <header>
                            <h3>${opts.title || 'Confirm action'}</h3>
                        </header>
                        <div class="rbac-confirm-body">
                            <p>${opts.message || 'Please confirm this action.'}</p>
                            ${opts.keyword ? `
                                <label>Type <strong>${opts.keyword}</strong> to proceed <span class="req">*</span>
                                    <input type="text" id="rbacConfirmWord" autocomplete="off" placeholder="${opts.keyword}">
                                </label>
                            ` : ''}
                            <label>Reason <span class="req">*</span>
                                <textarea id="rbacConfirmReason" rows="3" placeholder="Provide a reason (min 5 characters)…"></textarea>
                            </label>
                            <span class="rbac-confirm-err" id="rbacConfirmErr"></span>
                        </div>
                        <footer>
                            <button class="btn-ghost" data-act="cancel">Cancel</button>
                            <button class="btn-danger" data-act="confirm">Confirm</button>
                        </footer>
                    </div>
                `;
                document.body.appendChild(overlay);
                const err = overlay.querySelector('#rbacConfirmErr');
                overlay.querySelector('[data-act="cancel"]').addEventListener('click', () => {
                    overlay.remove(); resolve(false);
                });
                overlay.querySelector('[data-act="confirm"]').addEventListener('click', () => {
                    const reason = overlay.querySelector('#rbacConfirmReason').value.trim();
                    let ok = true;
                    if (opts.keyword) {
                        const w = overlay.querySelector('#rbacConfirmWord').value.trim();
                        if (w !== opts.keyword) {
                            err.textContent = `Please type "${opts.keyword}" exactly.`;
                            ok = false;
                        }
                    }
                    if (reason.length < 5) {
                        err.textContent = 'Please provide a reason (min 5 characters).';
                        ok = false;
                    }
                    if (!ok) return;
                    // Log
                    console.log('[AUDIT] Action', {
                        action: opts.title,
                        actor: this.getProfile().name,
                        role: this.getRole(),
                        reason,
                        timestamp: new Date().toISOString()
                    });
                    overlay.remove(); resolve(true);
                });
                if (!document.getElementById('rbacConfirmCSS')) {
                    const style = document.createElement('style');
                    style.id = 'rbacConfirmCSS';
                    style.textContent = `
                        .rbac-confirm-overlay { position: fixed; inset: 0; background: rgba(31,41,35,0.5); backdrop-filter: blur(2px); z-index: 200; display: grid; place-items: center; padding: 16px; }
                        .rbac-confirm-modal { background: #fff; border-radius: 16px; width: min(460px,100%); box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden; font-family: var(--font-sans, Inter, sans-serif); }
                        .rbac-confirm-modal header { padding: 16px 24px; border-bottom: 1px solid #e0dfd9; }
                        .rbac-confirm-modal h3 { font-family: var(--font-serif, 'Playfair Display', serif); font-size: 1.1rem; font-weight: 600; color: #1f2923; }
                        .rbac-confirm-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
                        .rbac-confirm-body p { font-size: 0.875rem; color: #4f5a53; line-height: 1.5; }
                        .rbac-confirm-body label { display: block; font-size: 0.8rem; font-weight: 500; color: #1f2923; }
                        .rbac-confirm-body .req { color: #9b1c1c; }
                        .rbac-confirm-body input, .rbac-confirm-body textarea { width: 100%; padding: 10px 12px; border: 1px solid #cfcdc4; border-radius: 8px; font-family: inherit; font-size: 0.9rem; margin-top: 6px; outline: none; }
                        .rbac-confirm-body input:focus, .rbac-confirm-body textarea:focus { border-color: #4b7c5c; box-shadow: 0 0 0 3px rgba(75,124,92,0.15); }
                        .rbac-confirm-err { color: #9b1c1c; font-size: 0.75rem; min-height: 14px; }
                        .rbac-confirm-modal footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px; border-top: 1px solid #e0dfd9; }
                        .rbac-confirm-modal button { padding: 8px 14px; border-radius: 8px; font-family: inherit; font-size: 0.85rem; font-weight: 500; cursor: pointer; border: 1px solid transparent; }
                        .rbac-confirm-modal .btn-ghost { background: transparent; color: #4f5a53; }
                        .rbac-confirm-modal .btn-ghost:hover { background: #f6f5f1; }
                        .rbac-confirm-modal .btn-danger { background: #9b1c1c; color: #fff; }
                        .rbac-confirm-modal .btn-danger:hover { background: #7a1414; }
                    `;
                    document.head.appendChild(style);
                }
            });
        },

        /* ==========================================
           TOAST (reuses page's toast if present)
           ========================================== */
        toast(type, title, message) {
            if (typeof window.showToast === 'function') {
                window.showToast(type, title, message);
                return;
            }
            // Fallback console log
            console.log(`[${type}] ${title} — ${message}`);
        },

        /* ==========================================
           BOOTSTRAP — call once per page
           ========================================== */
        init({ active } = {}) {
            if (state.denied || !state.verified) return false;
            const current = active || currentNavKey();
            if (current && !this.guardPage(current)) return false;
            this.applySidebar(current);
            this.applyIdentity();
            this.applyAssignedRole();
            this.applyElementGating();
            this.applyLogout();
            return true;
        }
    };

    window.RBAC = RBAC;

    /* ==========================================
       START: verify the role from Supabase on every page load.
       ========================================== */
    function start() {
        clearCache();
        state.realRole = null;
        state.verified = false;
        showGate({ title: 'Checking your access…', icon: 'spinner',
            message: 'One moment while CMDI confirms your assigned staff role.' });
        RBAC.ready = verifyAccess();
    }
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
})();