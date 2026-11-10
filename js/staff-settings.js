document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       MOCK DATA
       ========================================== */
    const STAFF = [
        { id: 1,  name: 'Marco Cruz',    email: 'marco@haven.app',    role: 'Front desk',   status: 'active',    lastActive: 'Today · 4:21 PM', isMe: false },
        { id: 2,  name: 'Joy Lim',       email: 'joy@haven.app',      role: 'Housekeeping', status: 'active',    lastActive: 'Today · 3:40 PM', isMe: false },
        { id: 3,  name: 'Ravi Batra',    email: 'ravi@haven.app',     role: 'Manager',      status: 'active',    lastActive: 'Today · 4:30 PM', isMe: true },
        { id: 4,  name: 'Ana Torres',    email: 'ana@haven.app',      role: 'Housekeeping', status: 'active',    lastActive: 'Today · 1:02 PM', isMe: false },
        { id: 5,  name: 'Kim Reyes',     email: 'kim@haven.app',      role: 'Housekeeping', status: 'active',    lastActive: 'Yesterday · 8:10 PM', isMe: false },
        { id: 6,  name: 'Diego Santos',  email: 'diego@haven.app',    role: 'Maintenance',  status: 'active',    lastActive: 'Today · 11:30 AM', isMe: false },
        { id: 7,  name: 'Priya Nair',    email: 'priya@haven.app',    role: 'Front desk',   status: 'active',    lastActive: 'Today · 9:42 AM', isMe: false },
        { id: 8,  name: 'Omar Haddad',   email: 'omar@haven.app',     role: 'Front desk',   status: 'suspended', lastActive: 'Oct 6 · 2:15 PM', isMe: false },
        { id: 9,  name: 'Hana Kim',      email: 'hana@haven.app',     role: 'Housekeeping', status: 'active',    lastActive: 'Oct 9 · 6:30 AM', isMe: false },
        { id: 10, name: 'Tomás Silva',   email: 'tomas@haven.app',    role: 'Maintenance',  status: 'active',    lastActive: 'Yesterday · 5:15 PM', isMe: false }
    ];

    const INVITES = [
        { id: 1, email: 'alex@haven.app', role: 'Front desk', expiresAt: 'Oct 17, 2026', sent: 'Oct 10, 2026' }
    ];

    const PERMISSIONS = [
        { key: 'viewGuests',    label: 'View guests',           roles: { 'front-desk': true,  'housekeeping': true,  'maintenance': true,  'manager': true  } },
        { key: 'revealData',    label: 'Reveal masked data',    roles: { 'front-desk': true,  'housekeeping': false, 'maintenance': false, 'manager': true  } },
        { key: 'checkInOut',    label: 'Check in / check out',  roles: { 'front-desk': true,  'housekeeping': false, 'maintenance': false, 'manager': true  } },
        { key: 'forceCheckout', label: 'Force check-out',       roles: { 'front-desk': false, 'housekeeping': false, 'maintenance': false, 'manager': true  } },
        { key: 'changeRooms',   label: 'Change rooms',          roles: { 'front-desk': true,  'housekeeping': false, 'maintenance': false, 'manager': true  } },
        { key: 'editRooms',     label: 'Edit rooms',            roles: { 'front-desk': false, 'housekeeping': false, 'maintenance': false, 'manager': true  } },
        { key: 'viewReports',   label: 'View reports',          roles: { 'front-desk': false, 'housekeeping': false, 'maintenance': false, 'manager': true  } },
        { key: 'exportData',    label: 'Export data',           roles: { 'front-desk': false, 'housekeeping': false, 'maintenance': false, 'manager': true  } },
        { key: 'manageStaff',   label: 'Manage staff',          roles: { 'front-desk': false, 'housekeeping': false, 'maintenance': false, 'manager': true  } }
    ];

    const ROOM_TYPES = [
        { id: 1, type: 'Standard Shared', capacity: 5, amenities: 'A/C · Wi-Fi · Bunk beds' },
        { id: 2, type: 'Deluxe Shared',   capacity: 5, amenities: 'A/C · Wi-Fi · Ensuite · Study desk' },
        { id: 3, type: 'Single',          capacity: 3, amenities: 'A/C · Wi-Fi · Private room' }
    ];

    const HISTORY = [
        { staff: 'Ravi Batra',  setting: 'Auto-urgent keywords',  oldVal: 'leak, no power',       newVal: 'leak, no power, broken lock, flood', reason: 'Incident review 2026-10-08', time: 'Today · 11:02 AM' },
        { staff: 'Ravi Batra',  setting: 'SLA · Urgent',          oldVal: '30 min',               newVal: '15 min',                              reason: 'Tighten response time',      time: 'Today · 10:48 AM' },
        { staff: 'Marco Cruz',  setting: 'Hotel phone',           oldVal: '+63 2 8888 0000',      newVal: '+63 2 8888 0001',                     reason: 'New landline',               time: 'Yesterday · 4:12 PM' },
        { staff: 'Ravi Batra',  setting: 'Staff role · Omar Haddad', oldVal: 'Front desk',        newVal: 'Front desk (suspended)',              reason: 'Policy violation',           time: 'Yesterday · 9:20 AM' },
        { staff: 'Ravi Batra',  setting: 'Reveal duration',       oldVal: '60s',                  newVal: '30s',                                 reason: 'Tighten privacy',            time: 'Oct 9 · 6:14 PM' },
        { staff: 'Joy Lim',     setting: 'Housekeeping default assignee', oldVal: 'Unassigned',    newVal: 'Joy Lim',                             reason: 'Streamline triage',          time: 'Oct 9 · 2:05 PM' },
        { staff: 'Ravi Batra',  setting: 'Password min length',   oldVal: '8',                    newVal: '10',                                  reason: 'Security policy update',     time: 'Oct 8 · 5:30 PM' },
        { staff: 'Ravi Batra',  setting: 'Max extension nights',  oldVal: '7',                    newVal: '14',                                  reason: 'Extended trainee programs',  time: 'Oct 8 · 4:15 PM' },
        { staff: 'Marco Cruz',  setting: 'Quiet hours start',     oldVal: '23:00',                newVal: '22:00',                               reason: 'Guest feedback',             time: 'Oct 7 · 3:10 PM' },
        { staff: 'Ravi Batra',  setting: 'Data retention (days)', oldVal: '180',                  newVal: '365',                                 reason: 'Compliance requirement',     time: 'Oct 6 · 10:42 AM' },
        { staff: 'Ravi Batra',  setting: '2FA required for managers', oldVal: 'Off',              newVal: 'On',                                  reason: 'Security hardening',         time: 'Oct 5 · 8:15 AM' },
        { staff: 'Marco Cruz',  setting: 'House rules',           oldVal: '(previous rules)',     newVal: 'Visitors must register at front desk',reason: 'Incident prevention',        time: 'Oct 4 · 6:00 PM' },
        { staff: 'Ravi Batra',  setting: 'Overdue grace period',  oldVal: '6 hours',              newVal: '4 hours',                             reason: 'Tighten turnover',           time: 'Oct 3 · 2:30 PM' },
        { staff: 'Joy Lim',     setting: 'Housekeeping SLA',      oldVal: '90 min',               newVal: '60 min',                              reason: 'Improved staffing',          time: 'Oct 2 · 4:20 PM' },
        { staff: 'Ravi Batra',  setting: 'Audit export recipients', oldVal: '(none)',             newVal: 'compliance@haven.app',                reason: 'Compliance setup',           time: 'Oct 1 · 9:00 AM' }
    ];

    const ROLE_LABELS = { 'front-desk': 'Front desk', 'housekeeping': 'Housekeeping', 'maintenance': 'Maintenance', 'manager': 'Manager' };
    const ROLE_COLUMNS = ['front-desk', 'housekeeping', 'maintenance', 'manager'];

    /* ==========================================
       STATE
       ========================================== */
    const state = {
        role: 'manager',
        section: 'staff',
        staffSearch: '',
        matrix: JSON.parse(JSON.stringify(PERMISSIONS)),
        matrixDirty: false,
        dirtyForms: new Set(),
        activeTemplate: 'checkin',
        confirmAction: null
    };

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

    function initials(name) {
        return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    }

    /* ==========================================
       ROLE + ACCESS
       ========================================== */
    const roleSelect = $('#roleSelect');
    const accessDenied = $('#accessDenied');
    const settingsContent = $('#settingsContent');
    const STAFF_BY_ROLE = {
        'front-desk': { name: 'Marco Cruz', initials: 'MC' },
        'housekeeping': { name: 'Joy Lim', initials: 'JL' },
        'maintenance': { name: 'Diego Santos', initials: 'DS' },
        'manager': { name: 'Ravi Batra', initials: 'RB' }
    };

    function applyRole(role) {
        state.role = role;
        document.body.dataset.role = role;
        $('#staffRoleLabel').textContent = ROLE_LABELS[role];
        $('#roleBreadcrumb').textContent = ROLE_LABELS[role];
        const staff = STAFF_BY_ROLE[role];
        const staffNameEl = document.querySelector('.staff-name');
        const staffAvatarEl = document.querySelector('.staff-avatar');
        const topbarAvatar = document.querySelector('.topbar-avatar');
        if (staffNameEl) staffNameEl.textContent = staff.name;
        if (staffAvatarEl) staffAvatarEl.textContent = staff.initials;
        if (topbarAvatar) topbarAvatar.textContent = staff.initials;

        // Manager-only sidebar items
        $$('[data-role-required="manager"]').forEach((el) => {
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
            settingsContent.hidden = false;
        } else {
            accessDenied.hidden = false;
            settingsContent.hidden = true;
        }

        toast('success', 'Role switched', `Now viewing as ${ROLE_LABELS[role]}.`);
    }

    roleSelect?.addEventListener('change', (e) => applyRole(e.target.value));
    $('#switchToManager')?.addEventListener('click', () => {
        roleSelect.value = 'manager';
        applyRole('manager');
    });

    applyRole('manager');

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
       SUBNAV
       ========================================== */
    $$('.subnav-item').forEach((item) => {
        item.addEventListener('click', () => {
            const target = item.dataset.section;
            if (state.dirtyForms.size > 0) {
                if (!confirm('You have unsaved changes. Discard and switch sections?')) return;
                state.dirtyForms.clear();
                updateSaveBar();
            }
            state.section = target;
            $$('.subnav-item').forEach((b) => b.classList.toggle('active', b === item));
            $$('.settings-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === target));
        });
    });

    /* ==========================================
       SETTINGS SEARCH — filters subnav
       ========================================== */
    $('#settingsSearch')?.addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        $$('.subnav-item').forEach((item) => {
            const text = item.textContent.toLowerCase();
            item.style.display = !q || text.includes(q) ? '' : 'none';
        });
    });

    /* ==========================================
       RENDER STAFF TABLE
       ========================================== */
    function renderStaff() {
        const body = $('#staffBody');
        const empty = $('#staffEmpty');
        if (!body) return;
        const q = state.staffSearch.toLowerCase();

        const list = STAFF.filter((s) => {
            if (!q) return true;
            return s.name.toLowerCase().includes(q)
                || s.email.toLowerCase().includes(q)
                || s.role.toLowerCase().includes(q)
                || s.status.toLowerCase().includes(q);
        });

        if (!list.length) {
            body.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        // Count managers to prevent removal of last manager
        const managerCount = STAFF.filter((s) => s.role === 'Manager' && s.status === 'active').length;

        body.innerHTML = list.map((s) => {
            const isMe = s.isMe;
            const isLastManager = s.role === 'Manager' && managerCount <= 1;
            return `
                <tr tabindex="0">
                    <td>
                        <div class="guest-cell">
                            <span class="guest-avatar">${initials(s.name)}</span>
                            <span>${s.name}${isMe ? ' <span class="muted">(you)</span>' : ''}</span>
                        </div>
                    </td>
                    <td class="hide-md muted">${s.email}</td>
                    <td>${s.role}</td>
                    <td>
                        <span class="status-pill ${s.status}">
                            <span class="dot"></span>
                            ${s.status === 'active' ? 'Active' : s.status === 'invited' ? 'Invited' : 'Suspended'}
                        </span>
                    </td>
                    <td class="hide-sm muted">${s.lastActive}</td>
                    <td class="col-actions">
                        <button class="row-menu-btn" aria-label="More options for ${s.name}" data-staff-menu="${s.id}">
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

        // Bind menus
        $$('[data-staff-menu]', body).forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number(btn.dataset.staffMenu);
                openStaffMenu(id, btn);
            });
        });
    }

    function openStaffMenu(id, anchor) {
        closeAllMenus();
        const s = STAFF.find((x) => x.id === id);
        if (!s) return;
        const managerCount = STAFF.filter((x) => x.role === 'Manager' && x.status === 'active').length;
        const isLastManager = s.role === 'Manager' && managerCount <= 1;

        const menu = document.createElement('ul');
        menu.className = 'chip-menu';
        menu.style.cssText = 'position:fixed;z-index:200;';
        const rect = anchor.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.right - 200}px`;

        menu.innerHTML = `
            <li><button data-menu="edit-role" ${s.isMe ? 'disabled title="You cannot change your own role"' : ''}>Edit role</button></li>
            <li><button data-menu="reset-password">Reset password</button></li>
            <li><button data-menu="suspend">${s.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button></li>
            <li><button data-menu="remove" ${s.isMe || isLastManager ? 'disabled title="' + (s.isMe ? 'You cannot remove yourself' : 'Cannot remove the last manager') + '"' : ''}>Remove</button></li>
        `;
        document.body.appendChild(menu);

        menu.querySelectorAll('button').forEach((b) => {
            b.addEventListener('click', () => {
                closeAllMenus();
                const action = b.dataset.menu;
                if (action === 'suspend' && s.status !== 'suspended') {
                    openConfirm('suspend-staff', `Suspend ${s.name}?`, s);
                } else if (action === 'suspend') {
                    openConfirm('reactivate-staff', `Reactivate ${s.name}?`, s);
                } else if (action === 'remove') {
                    openConfirm('remove-staff', `Remove ${s.name} from the staff console?`, s);
                } else if (action === 'edit-role') {
                    openConfirm('edit-role', `Change role for ${s.name}?`, s);
                } else if (action === 'reset-password') {
                    openConfirm('reset-password', `Reset password for ${s.name}?`, s);
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

    renderStaff();

    $('#settingsSearch')?.addEventListener('input', (e) => {
        state.staffSearch = e.target.value.trim();
        renderStaff();
    });

    /* ==========================================
       PENDING INVITES
       ========================================== */
    function renderInvites() {
        const list = $('#inviteList');
        if (!list) return;
        list.innerHTML = INVITES.map((inv) => `
            <li class="invite-item">
                <div class="invite-main">
                    <span class="invite-email">${inv.email}</span>
                    <span class="invite-meta">${inv.role} · Invited ${inv.sent} · Expires ${inv.expiresAt}</span>
                </div>
                <div class="invite-actions">
                    <button class="btn btn-outline btn-sm" data-invite-action="resend" data-id="${inv.id}">Resend</button>
                    <button class="btn btn-ghost btn-sm" data-invite-action="revoke" data-id="${inv.id}">Revoke</button>
                </div>
            </li>
        `).join('');

        $$('[data-invite-action]', list).forEach((b) => {
            b.addEventListener('click', () => {
                const action = b.dataset.inviteAction;
                if (action === 'revoke') {
                    openConfirm('revoke-invite', 'Revoke this invite? The recipient will not be able to join.');
                } else {
                    toast('success', 'Invite resent', 'The recipient will receive a new email.');
                }
            });
        });
    }
    renderInvites();

    /* ==========================================
       INVITE MODAL
       ========================================== */
    const inviteOverlay = $('#inviteOverlay');
    function openInvite() {
        $('#inviteEmail').value = '';
        $('#inviteEmailErr').textContent = '';
        $('#inviteEmail').closest('.form-group').classList.remove('error');
        $('#inviteRole').value = 'Front desk';
        $('#inviteStart').value = '';
        inviteOverlay.hidden = false;
        requestAnimationFrame(() => inviteOverlay.classList.add('open'));
        setTimeout(() => $('#inviteEmail').focus(), 100);
    }
    function closeInvite() {
        inviteOverlay.classList.remove('open');
        setTimeout(() => { inviteOverlay.hidden = true; }, 200);
    }

    $('#inviteBtn')?.addEventListener('click', openInvite);
    $('#inviteClose')?.addEventListener('click', closeInvite);
    $('#inviteCancel')?.addEventListener('click', closeInvite);
    inviteOverlay?.addEventListener('click', (e) => { if (e.target === inviteOverlay) closeInvite(); });

    $('#inviteSubmit')?.addEventListener('click', () => {
        const email = $('#inviteEmail').value.trim();
        const group = $('#inviteEmail').closest('.form-group');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            group.classList.add('error');
            $('#inviteEmailErr').textContent = 'Please enter a valid email address.';
            return;
        }
        group.classList.remove('error');
        INVITES.push({ id: Date.now(), email, role: $('#inviteRole').value, expiresAt: 'Oct 18, 2026', sent: 'Today' });
        renderInvites();
        closeInvite();
        toast('success', 'Invite sent', `An invite has been sent to ${email}.`);
        logChange('Ravi Batra', `Invited staff · ${email}`, '—', $('#inviteRole').value, 'New staff onboarding');
    });

    /* ==========================================
       PERMISSION MATRIX
       ========================================== */
    function renderMatrix() {
        const body = $('#matrixBody');
        if (!body) return;

        body.innerHTML = state.matrix.map((perm) => `
            <tr>
                <th scope="row">${perm.label}</th>
                ${ROLE_COLUMNS.map((role) => {
                    const granted = perm.roles[role];
                    const isLocked = role === 'manager'; // Cannot revoke manager perms here
                    return `
                        <td class="perm-cell">
                            <button
                                class="perm-check ${granted ? 'granted' : ''} ${isLocked ? 'locked' : ''}"
                                data-perm="${perm.key}"
                                data-role="${role}"
                                ${isLocked ? 'aria-disabled="true" title="Manager permissions are always granted"' : ''}
                                aria-label="${perm.label} for ${ROLE_LABELS[role]}: ${granted ? 'granted' : 'not granted'}">
                                ${granted ? '✓' : '—'}
                            </button>
                            <span class="perm-label">${granted ? 'Allowed' : 'Denied'}</span>
                        </td>
                    `;
                }).join('')}
            </tr>
        `).join('');

        $$('.perm-check', body).forEach((btn) => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('locked')) {
                    toast('error', 'Locked', 'Manager permissions cannot be revoked.');
                    return;
                }
                const permKey = btn.dataset.perm;
                const role = btn.dataset.role;
                const perm = state.matrix.find((p) => p.key === permKey);
                if (!perm) return;
                perm.roles[role] = !perm.roles[role];
                btn.classList.toggle('granted', perm.roles[role]);
                btn.textContent = perm.roles[role] ? '✓' : '—';
                btn.setAttribute('aria-label', `${perm.label} for ${ROLE_LABELS[role]}: ${perm.roles[role] ? 'granted' : 'not granted'}`);
                btn.nextElementSibling.textContent = perm.roles[role] ? 'Allowed' : 'Denied';

                checkMatrixDirty();
            });
        });
    }

    function checkMatrixDirty() {
        const dirty = JSON.stringify(state.matrix) !== JSON.stringify(PERMISSIONS);
        state.matrixDirty = dirty;
        $('#matrixDirtyHint').textContent = dirty ? 'You have unsaved changes to permissions' : 'No changes';
        $('#matrixDirtyHint').classList.toggle('dirty', dirty);
        $('#matrixSave').disabled = !dirty;
        $('#matrixDiscard').disabled = !dirty;
    }

    $('#matrixDiscard')?.addEventListener('click', () => {
        state.matrix = JSON.parse(JSON.stringify(PERMISSIONS));
        renderMatrix();
        checkMatrixDirty();
        toast('success', 'Discarded', 'Permission changes have been reverted.');
    });

    $('#matrixSave')?.addEventListener('click', () => {
        // Apply changes
        PERMISSIONS.forEach((p, i) => { p.roles = { ...state.matrix[i].roles }; });
        checkMatrixDirty();
        toast('success', 'Permissions updated', 'Changes applied. Affected staff may need to sign in again.');
        logChange('Ravi Batra', 'Roles & permissions', 'Multiple permissions updated', 'See matrix', 'Policy update');
    });

    renderMatrix();
    checkMatrixDirty();

    /* ==========================================
       CHANGE HISTORY
       ========================================== */
    function renderHistory() {
        const body = $('#historyBody');
        if (!body) return;
        body.innerHTML = HISTORY.map((h) => `
            <tr>
                <td>${h.staff}</td>
                <td>${h.setting}</td>
                <td class="muted hide-sm">${h.oldVal}</td>
                <td>${h.newVal}</td>
                <td class="muted hide-md">${h.reason}</td>
                <td class="muted hide-sm">${h.time}</td>
            </tr>
        `).join('');
    }
    renderHistory();

    function logChange(staff, setting, oldVal, newVal, reason) {
        HISTORY.unshift({ staff, setting, oldVal, newVal, reason, time: 'Today · ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) });
        HISTORY.pop();
        renderHistory();
    }

    /* ==========================================
       ROOM TYPES
       ========================================== */
    function renderRoomTypes() {
        const body = $('#roomTypesBody');
        if (!body) return;
        body.innerHTML = ROOM_TYPES.map((rt) => `
            <tr>
                <td><strong>${rt.type}</strong></td>
                <td>Max ${rt.capacity} guests</td>
                <td class="hide-md muted">${rt.amenities}</td>
                <td class="col-actions">
                    <button class="btn btn-ghost btn-sm" data-edit-room-type="${rt.id}">Edit</button>
                </td>
            </tr>
        `).join('');

        $$('[data-edit-room-type]', body).forEach((b) => {
            b.addEventListener('click', () => {
                toast('success', 'Edit room type', 'Opening room type editor…');
            });
        });
    }
    renderRoomTypes();

    $('#addRoomType')?.addEventListener('click', () => {
        toast('success', 'New room type', 'Opening room type editor…');
    });

    /* ==========================================
       NOTIFICATION TEMPLATES
       ========================================== */
    const TEMPLATES = {
        checkin: {
            subject: 'Welcome to Haven, {guest_name}!',
            body: 'Hi {guest_name},\n\nYour room {room} is ready. Check-in begins at {checkin_time}.\nWe\'re glad you\'re here.\n\n— Haven',
            previewSubject: 'Welcome to Haven, Sofia!',
            previewBody: 'Hi Sofia,<br><br>Your room 201 is ready. Check-in begins at 3:00 PM.<br>We\'re glad you\'re here.<br><br>— Haven'
        },
        overdue: {
            subject: 'Friendly reminder: check-out was {checkout_time}',
            body: 'Hi {guest_name},\n\nOur records show your expected check-out was {checkout_time}. Please let us know if you\'d like to extend your stay.\n\n— Haven',
            previewSubject: 'Friendly reminder: check-out was Oct 9',
            previewBody: 'Hi Sofia,<br><br>Our records show your expected check-out was Oct 9, 2026 · 11:00 AM. Please let us know if you\'d like to extend your stay.<br><br>— Haven'
        },
        status: {
            subject: 'Your {request_type} request is now {status}',
            body: 'Hi {guest_name},\n\nGood news — your {request_type} request is now {status}. We\'ll keep you posted.\n\n— Haven',
            previewSubject: 'Your Housekeeping request is now Done',
            previewBody: 'Hi Sofia,<br><br>Good news — your Housekeeping request is now Done. We\'ll keep you posted.<br><br>— Haven'
        }
    };

    $$('.template-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            state.activeTemplate = tab.dataset.template;
            $$('.template-tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-selected', String(active));
            });
            const tpl = TEMPLATES[state.activeTemplate];
            $('#templateSubject').value = tpl.subject;
            $('#templateBody').value = tpl.body;
            updatePreview();
        });
    });

    function updatePreview() {
        const tpl = TEMPLATES[state.activeTemplate];
        $('#previewSubject').textContent = tpl.previewSubject;
        $('#previewBody').innerHTML = tpl.previewBody;
    }
    updatePreview();

    $('#templateSubject')?.addEventListener('input', (e) => {
        $('#previewSubject').textContent = e.target.value.replace(/\{guest_name\}/g, 'Sofia');
    });
    $('#templateBody')?.addEventListener('input', (e) => {
        $('#previewBody').innerHTML = e.target.value
            .replace(/\{guest_name\}/g, 'Sofia')
            .replace(/\{room\}/g, '201')
            .replace(/\{checkin_time\}/g, '3:00 PM')
            .replace(/\{checkout_time\}/g, 'Oct 9, 2026 · 11:00 AM')
            .replace(/\{request_type\}/g, 'Housekeeping')
            .replace(/\{status\}/g, 'Done')
            .replace(/\n/g, '<br>');
    });

    $('#sendTest')?.addEventListener('click', () => {
        toast('success', 'Test sent', 'A test message was sent to ravi@haven.app.');
    });

    $('#restoreDefaults')?.addEventListener('click', () => {
        openConfirm('restore-defaults', 'Restore all templates to their default text? Your custom edits will be lost.');
    });

    /* ==========================================
       STICKY SAVE BAR + FORM DIRTY TRACKING
       ========================================== */
    const saveBar = $('#saveBar');
    const formIds = ['hotelForm', 'requestsForm', 'overdueForm', 'securityForm'];

    formIds.forEach((id) => {
        const form = document.getElementById(id);
        if (!form) return;
        form.addEventListener('input', () => {
            state.dirtyForms.add(id);
            updateSaveBar();
        });
    });

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
        state.dirtyForms.clear();
        updateSaveBar();
        toast('success', 'Saved', 'Your settings changes have been saved.');
        logChange('Ravi Batra', 'Multiple settings', '—', 'Updated', 'Configuration change');
    });

    $('#discardAll')?.addEventListener('click', () => {
        state.dirtyForms.clear();
        updateSaveBar();
        toast('success', 'Discarded', 'Your unsaved changes have been discarded.');
    });

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
        if (state.dirtyForms.size > 0) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    /* ==========================================
       CONFIRM MODAL
       ========================================== */
    const confirmOverlay = $('#confirmOverlay');

    function openConfirm(action, text, staff = null) {
        state.confirmAction = { action, staff };
        $('#confirmTitle').textContent = action === 'remove-staff' ? 'Remove staff'
            : action === 'suspend-staff' ? 'Suspend staff'
            : action === 'reactivate-staff' ? 'Reactivate staff'
            : action === 'edit-role' ? 'Edit role'
            : action === 'reset-password' ? 'Reset password'
            : action === 'revoke-invite' ? 'Revoke invite'
            : action === 'restore-defaults' ? 'Restore templates'
            : 'Confirm';
        $('#confirmText').innerHTML = text;
        $('#confirmWord').value = '';
        $('#confirmReason').value = '';
        $('#confirmWordErr').textContent = '';
        $('#confirmReasonErr').textContent = '';
        confirmOverlay.hidden = false;
        requestAnimationFrame(() => confirmOverlay.classList.add('open'));
        setTimeout(() => $('#confirmWord').focus(), 100);
    }
    function closeConfirm() {
        confirmOverlay.classList.remove('open');
        setTimeout(() => { confirmOverlay.hidden = true; }, 200);
    }

    $('#confirmClose')?.addEventListener('click', closeConfirm);
    $('#confirmCancel')?.addEventListener('click', closeConfirm);
    confirmOverlay?.addEventListener('click', (e) => { if (e.target === confirmOverlay) closeConfirm(); });

    $('#confirmSubmit')?.addEventListener('click', () => {
        const word = $('#confirmWord').value.trim();
        const reason = $('#confirmReason').value.trim();
        let ok = true;
        if (word !== 'CONFIRM') {
            $('#confirmWordErr').textContent = 'Please type CONFIRM exactly.';
            ok = false;
        }
        if (reason.length < 5) {
            $('#confirmReasonErr').textContent = 'Please provide a reason (min 5 characters).';
            ok = false;
        }
        if (!ok) return;

        const { action, staff } = state.confirmAction;
        if (action === 'remove-staff') {
            const i = STAFF.findIndex((s) => s.id === staff.id);
            if (i > -1) STAFF.splice(i, 1);
            renderStaff();
            toast('success', 'Staff removed', `${staff.name} has been removed.`);
            logChange('Ravi Batra', `Staff removed · ${staff.name}`, staff.role, '—', reason);
        } else if (action === 'suspend-staff') {
            staff.status = 'suspended';
            renderStaff();
            toast('success', 'Staff suspended', `${staff.name} can no longer sign in.`);
            logChange('Ravi Batra', `Staff suspended · ${staff.name}`, 'Active', 'Suspended', reason);
        } else if (action === 'reactivate-staff') {
            staff.status = 'active';
            renderStaff();
            toast('success', 'Staff reactivated', `${staff.name} can sign in again.`);
            logChange('Ravi Batra', `Staff reactivated · ${staff.name}`, 'Suspended', 'Active', reason);
        } else if (action === 'edit-role') {
            toast('success', 'Role updated', `${staff.name}'s role will be updated.`);
            logChange('Ravi Batra', `Role change · ${staff.name}`, staff.role, 'New role', reason);
        } else if (action === 'reset-password') {
            toast('success', 'Password reset', `${staff.name} will receive a reset link.`);
            logChange('Ravi Batra', `Password reset · ${staff.name}`, '—', 'Reset sent', reason);
        } else if (action === 'revoke-invite') {
            toast('success', 'Invite revoked', 'The invite can no longer be used.');
        } else if (action === 'restore-defaults') {
            TEMPLATES.checkin = { subject: 'Welcome to Haven, {guest_name}!', body: 'Hi {guest_name},\n\nYour room {room} is ready. Check-in begins at {checkin_time}.\nWe\'re glad you\'re here.\n\n— Haven', previewSubject: 'Welcome to Haven, Sofia!', previewBody: 'Hi Sofia,<br><br>Your room 201 is ready. Check-in begins at 3:00 PM.<br>We\'re glad you\'re here.<br><br>— Haven' };
            const tpl = TEMPLATES[state.activeTemplate];
            $('#templateSubject').value = tpl.subject;
            $('#templateBody').value = tpl.body;
            updatePreview();
            toast('success', 'Templates restored', 'All templates have been reset to defaults.');
            logChange('Ravi Batra', 'Notification templates', 'Custom', 'Default', reason);
        }
        closeConfirm();
    });

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

        if (e.key === 'Escape') {
            closeSidebar();
            closeInvite();
            closeConfirm();
            closeAllMenus();
        }
        if (e.key === '/' && !typing) {
            e.preventDefault();
            $('#settingsSearch')?.focus();
        }
    });
});