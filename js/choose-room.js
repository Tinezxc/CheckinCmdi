/* ==========================================================
   CMDI / HAVEN - CHOOSE ROOM
   Individual Booking + Group Booking

   Requires:
     - window.supabaseClient from js/supabase-client.js
     - Supabase RPC: get_room_availability
     - Edge Function: dynamic-responder

   Important behavior:
     - Group booking requires a leader with no existing room
       request or assignment.
     - All invited users must be existing verified CMDI clients.
     - All members must accept before the leader can confirm.
     - Group hold expires after 30 minutes (database enforced).
     - After cancel/expiry, the page returns to room selection
       and clears the saved group ID so a stale CANCELLED panel
       does not reappear on the next visit.
   ========================================================== */

(() => {
    'use strict';

    const db = window.supabaseClient;

    const roomGrid = document.getElementById('roomGrid');
    const confirmBtn = document.getElementById('confirmRoomBtn');
    const footerActions = document.getElementById('footerActions');
    const roomArea = document.getElementById('roomArea');
    const groupSetup = document.getElementById('groupSetup');
    const groupStatusPanel = document.getElementById('groupStatusPanel');
    const pageNotice = document.getElementById('pageNotice');

    // Compact room-details drawer elements.
    const roomDrawer = document.getElementById('roomDrawer');
    const drawerBackdrop = document.getElementById('drawerBackdrop');
    const closeRoomDrawerBtn = document.getElementById('closeRoomDrawerBtn');
    const drawerBookingSection = document.getElementById('drawerBookingSection');
    const selectedRoomSummary = document.getElementById('selectedRoomSummary');
    const reopenGroupDrawerBtn = document.getElementById('reopenGroupDrawerBtn');

    const individualModeBtn = document.getElementById('individualModeBtn');
    const groupModeBtn = document.getElementById('groupModeBtn');
    const inviteeEmailsInput = document.getElementById('inviteeEmails'); // Hidden CSV/newline field used by existing validation/API code.
    const recipientEntry = document.getElementById('recipientEntry');
    const inviteeEmailEntry = document.getElementById('inviteeEmailEntry');
    const inviteeEmailChips = document.getElementById('inviteeEmailChips');
    const addInviteeEmailBtn = document.getElementById('addInviteeEmailBtn');
    const inviteeCount = document.getElementById('inviteeCount');
    const groupMemberCount = document.getElementById('groupMemberCount');
    const groupInputError = document.getElementById('groupInputError');
    const groupSummary = document.getElementById('groupSummary');

    const refreshGroupStatusBtn = document.getElementById('refreshGroupStatusBtn');
    const confirmGroupBtn = document.getElementById('confirmGroupBtn');
    const cancelGroupBtn = document.getElementById('cancelGroupBtn');
    const sendReplacementBtn = document.getElementById('sendReplacementBtn');
    const replacementArea = document.getElementById('replacementArea');
    const replacementEmail = document.getElementById('replacementEmail');
    const replacementMessage = document.getElementById('replacementMessage');

    const EDGE_FUNCTION = 'dynamic-responder';
    const ACTIVE_GROUP_KEY = 'cmdi_active_group_booking_id';
    const GENDER_LABEL = { male: 'Men', female: 'Women' };
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let session = null;
    let myGender = null;
    let pendingRoom = null;
    let assignedRoom = null;
    let selectedRoom = null;
    let inviteeEmailList = [];
    let bookingMode = 'individual';
    let activeGroupId = null;
    let groupRefreshTimer = null;
    let countdownTimer = null;
    let groupHoldExpiresAt = null;
    let isReturningToRooms = false;
    let skeleton = { show() {}, hide() {} };

    /* ----------------------------------------------------------
       BASIC HELPERS
       ---------------------------------------------------------- */

    function normalizeGender(value) {
        const v = String(value || '').trim().toLowerCase();
        if (['male', 'm', 'man'].includes(v)) return 'male';
        if (['female', 'f', 'woman'].includes(v)) return 'female';
        return null;
    }

    async function loadSkeleton() {
        const paths = [
            './utils/skeleton-loading.js',
            './skeleton-loading.js',
            './utils/skeletonloading.js'
        ];

        for (const path of paths) {
            try {
                const mod = await import(path);
                if (typeof mod.showSkeleton === 'function' && typeof mod.hideSkeleton === 'function') {
                    skeleton = {
                        show: mod.showSkeleton,
                        hide: mod.hideSkeleton
                    };
                    return;
                }
            } catch (_) {
                // The skeleton loader is optional; continue without it.
            }
        }
    }

    function showNotice(message, kind = 'error') {
        if (!pageNotice) return;
        pageNotice.textContent = message;
        pageNotice.className = `notice notice-${kind}`;
        pageNotice.classList.remove('hidden');
    }

    function clearNotice() {
        if (!pageNotice) return;
        pageNotice.textContent = '';
        pageNotice.classList.add('hidden');
    }

    function renderInlineNotice(message, kind = 'error') {
        const div = document.createElement('div');
        div.className = `notice notice-${kind}`;
        div.textContent = message;
        roomGrid.appendChild(div);
    }

    function stopGroupTimers() {
        if (groupRefreshTimer) clearInterval(groupRefreshTimer);
        if (countdownTimer) clearInterval(countdownTimer);
        groupRefreshTimer = null;
        countdownTimer = null;
    }

    function removeSavedGroupReference() {
        try {
            sessionStorage.removeItem(ACTIVE_GROUP_KEY);
        } catch (error) {
            console.warn('Could not clear saved group ID:', error);
        }

        try {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('group_booking_id');
            window.history.replaceState({}, document.title, cleanUrl.toString());
        } catch (error) {
            console.warn('Could not remove group ID from URL:', error);
        }
    }

    /* ----------------------------------------------------------
       COMPACT ROOM DETAILS DRAWER
       ---------------------------------------------------------- */

    function openRoomDrawer() {
        if (!roomDrawer || !drawerBackdrop) return;

        roomDrawer.classList.add('open');
        drawerBackdrop.classList.add('visible');
        document.body.classList.add('drawer-open');
        roomDrawer.setAttribute('aria-hidden', 'false');

        if (reopenGroupDrawerBtn) {
            reopenGroupDrawerBtn.classList.add('hidden');
        }

        window.requestAnimationFrame(() => {
            closeRoomDrawerBtn?.focus();
        });
    }

    function closeRoomDrawer() {
        if (!roomDrawer || !drawerBackdrop) return;

        roomDrawer.classList.remove('open');
        drawerBackdrop.classList.remove('visible');
        document.body.classList.remove('drawer-open');
        roomDrawer.setAttribute('aria-hidden', 'true');

        // Keep a way to reopen the active group status after closing the drawer.
        if (reopenGroupDrawerBtn) {
            reopenGroupDrawerBtn.classList.toggle('hidden', !activeGroupId);
        }
    }

    function updateSelectedRoomSummary() {
        if (!selectedRoomSummary) return;

        selectedRoomSummary.replaceChildren();

        if (!selectedRoom) {
            const empty = document.createElement('div');
            empty.className = 'selected-room-empty';

            const icon = document.createElement('span');
            icon.className = 'empty-room-icon';
            icon.textContent = '⌂';

            const title = document.createElement('strong');
            title.textContent = 'Select a room';

            const description = document.createElement('p');
            description.textContent = 'Room details and booking options will appear here.';

            empty.append(icon, title, description);
            selectedRoomSummary.appendChild(empty);
            return;
        }

        const freeBeds = Math.max(
            0,
            Number(selectedRoom.capacity) - Number(selectedRoom.occupants)
        );

        const state = getRoomState(selectedRoom);

        const top = document.createElement('div');
        top.className = 'selected-room-top';

        const identity = document.createElement('div');
        identity.className = 'selected-room-identity';

        const kicker = document.createElement('span');
        kicker.className = 'drawer-room-kicker';
        kicker.textContent = 'SELECTED ROOM';

        const number = document.createElement('strong');
        number.className = 'drawer-room-number';
        number.textContent = String(selectedRoom.room_number);

        identity.append(kicker, number);

        const badge = document.createElement('span');
        badge.className = `room-status ${state.cls}`;
        badge.textContent = state.label;

        top.append(identity, badge);

        const description = document.createElement('p');
        description.className = 'drawer-room-info';
        description.textContent = `Floor ${selectedRoom.floor} · ${selectedRoom.type || 'Standard Shared Room'}`;

        const capacity = document.createElement('div');
        capacity.className = 'drawer-capacity-row';

        const freeText = document.createElement('strong');
        freeText.textContent = `${freeBeds} ${freeBeds === 1 ? 'bed' : 'beds'} available`;

        const totalText = document.createElement('span');
        totalText.textContent = `${selectedRoom.capacity} total beds`;

        capacity.append(freeText, totalText);

        const dots = createBedDots(selectedRoom);
        dots.classList.add('drawer-bed-dots');

        selectedRoomSummary.append(top, description, capacity, dots);
    }

    function parseInviteeEmails() {
        return [...inviteeEmailList];
    }

    function syncInviteeEmailField() {
        if (inviteeEmailsInput) {
            inviteeEmailsInput.value = inviteeEmailList.join('\n');
        }
    }

    function renderInviteeEmailChips() {
        if (!inviteeEmailChips) return;

        inviteeEmailChips.replaceChildren();

        inviteeEmailList.forEach((email, index) => {
            const chip = document.createElement('span');
            chip.className = 'recipient-chip';

            const label = document.createElement('span');
            label.className = 'recipient-chip-email';
            label.textContent = email;
            label.title = email;

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'recipient-chip-remove';
            remove.textContent = '×';
            remove.setAttribute('aria-label', `Remove ${email}`);
            remove.addEventListener('click', () => {
                inviteeEmailList.splice(index, 1);
                syncInviteeEmailField();
                renderInviteeEmailChips();
                updateGroupSummary();
                inviteeEmailEntry?.focus();
            });

            chip.append(label, remove);
            inviteeEmailChips.appendChild(chip);
        });

        syncInviteeEmailField();

        if (inviteeCount) {
            inviteeCount.textContent =
                `${inviteeEmailList.length} ${inviteeEmailList.length === 1 ? 'friend' : 'friends'} added`;
        }

        if (groupMemberCount) {
            const total = inviteeEmailList.length + 1;
            groupMemberCount.textContent =
                `${total} ${total === 1 ? 'member' : 'members'} total`;
        }
    }

    function clearInviteeEmails() {
        inviteeEmailList = [];
        if (inviteeEmailEntry) inviteeEmailEntry.value = '';
        if (inviteeEmailsInput) inviteeEmailsInput.value = '';
        renderInviteeEmailChips();
        if (groupInputError) groupInputError.textContent = '';
    }

    function addInviteeEmailsFromEntry() {
        if (!inviteeEmailEntry) return;

        const rawValue = inviteeEmailEntry.value.trim();
        if (!rawValue) return;

        // Supports one address at a time, or multiple pasted addresses.
        const candidates = rawValue
            .split(/[\n,;]+/)
            .map(value => value.trim().toLowerCase())
            .filter(Boolean);

        let added = 0;
        let problem = '';
        const leaderEmail = String(session?.user?.email || '').trim().toLowerCase();

        for (const email of candidates) {
            if (!EMAIL_RE.test(email)) {
                problem = `Invalid email address: ${email}`;
                continue;
            }

            if (leaderEmail && email === leaderEmail) {
                problem = 'You cannot invite your own email address.';
                continue;
            }

            if (inviteeEmailList.includes(email)) {
                problem = `${email} has already been added.`;
                continue;
            }

            if (inviteeEmailList.length >= 9) {
                problem = 'You can invite up to 9 friends.';
                break;
            }

            inviteeEmailList.push(email);
            added++;
        }

        inviteeEmailEntry.value = '';
        renderInviteeEmailChips();

        if (added > 0 || !problem) {
            updateGroupSummary();
        }

        // Keep a useful warning after summary validation has run.
        if (problem && groupInputError) {
            groupInputError.textContent = problem;
        }

        inviteeEmailEntry.focus();
    }

    /* ----------------------------------------------------------
       BOOKING MODE AND INPUT VALIDATION
       ---------------------------------------------------------- */

    function canCreateGroup() {
        return Boolean(myGender) && !pendingRoom && !assignedRoom;
    }

    function syncModeAvailability() {
        if (!individualModeBtn || !groupModeBtn) return;

        individualModeBtn.disabled = !myGender;
        groupModeBtn.disabled = !canCreateGroup();

        if (!myGender) {
            individualModeBtn.title = 'Your profile needs a valid gender. Contact the front desk.';
            groupModeBtn.title = 'Your profile needs a valid gender. Contact the front desk.';
        } else if (pendingRoom || assignedRoom) {
            groupModeBtn.title = 'Cancel or resolve your existing room request/assignment before creating a group.';
        } else {
            individualModeBtn.title = '';
            groupModeBtn.title = '';
        }
    }

    function validateGroupInputs() {
        const emails = parseInviteeEmails();

        if (bookingMode !== 'group') {
            return { ok: true, emails };
        }

        if (!canCreateGroup()) {
            return {
                ok: false,
                emails,
                message: 'You already have a room request or assignment, or your profile is not eligible for group booking.'
            };
        }

        if (!emails.length) {
            return {
                ok: false,
                emails,
                message: 'Enter at least one existing CMDI friend email address.'
            };
        }

        if (emails.some(email => !EMAIL_RE.test(email))) {
            return {
                ok: false,
                emails,
                message: 'One or more email addresses are invalid.'
            };
        }

        if (new Set(emails).size !== emails.length) {
            return {
                ok: false,
                emails,
                message: 'Remove duplicate email addresses before continuing.'
            };
        }

        if (emails.length > 9) {
            return {
                ok: false,
                emails,
                message: 'You can invite up to 9 friends.'
            };
        }

        if (!selectedRoom) {
            return {
                ok: false,
                emails,
                message: 'Select a room before creating your group.'
            };
        }

        const groupSize = emails.length + 1;
        const freeBeds = Number(selectedRoom.capacity) - Number(selectedRoom.occupants);

        if (groupSize > Number(selectedRoom.capacity)) {
            return {
                ok: false,
                emails,
                message: `This room can hold only ${selectedRoom.capacity} members in total, including you.`
            };
        }

        if (groupSize > freeBeds) {
            return {
                ok: false,
                emails,
                message: `This room has only ${freeBeds} free bed(s). Your group needs ${groupSize}.`
            };
        }

        const leaderEmail = String(session?.user?.email || '').trim().toLowerCase();
        if (leaderEmail && emails.includes(leaderEmail)) {
            return {
                ok: false,
                emails,
                message: 'You cannot invite your own email address.'
            };
        }

        groupSummary.textContent =
            `Group size: ${groupSize} member(s) (you + ${emails.length} invited). ` +
            `Room ${selectedRoom.room_number} has ${freeBeds} free bed(s). ` +
            'A 30-minute temporary hold starts when the group is created.';

        return { ok: true, emails };
    }

    function updateGroupSummary() {
        if (bookingMode !== 'group') return;

        const result = validateGroupInputs();
        if (!result.ok && groupInputError) {
            groupInputError.textContent = result.message;
        } else if (groupInputError) {
            groupInputError.textContent = '';
        }

        updateConfirmButton();
    }

    function updateConfirmButton() {
        if (!confirmBtn) return;

        if (!selectedRoom) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = bookingMode === 'group'
                ? 'Create Group & Send Invites'
                : 'Confirm Selection';
            return;
        }

        if (bookingMode === 'individual') {
            confirmBtn.disabled = !myGender;
            confirmBtn.textContent = 'Confirm Selection';
            return;
        }

        const validation = validateGroupInputs();
        confirmBtn.disabled = !validation.ok;
        confirmBtn.textContent = 'Create Group & Send Invites';
    }

    function setBookingMode(mode) {
        if (mode === 'group' && !canCreateGroup()) {
            showNotice(
                pendingRoom || assignedRoom
                    ? 'You already have a room request or assignment. Resolve it with the front desk before creating a group booking.'
                    : 'Your profile is not eligible for group booking. Please contact the front desk.',
                'info'
            );
            mode = 'individual';
        }

        bookingMode = mode;
        individualModeBtn.classList.toggle('active', mode === 'individual');
        groupModeBtn.classList.toggle('active', mode === 'group');
        individualModeBtn.setAttribute('aria-pressed', String(mode === 'individual'));
        groupModeBtn.setAttribute('aria-pressed', String(mode === 'group'));
        groupSetup.classList.toggle('hidden', mode !== 'group');

        if (groupInputError) groupInputError.textContent = '';
        if (mode === 'individual') clearNotice();

        syncModeAvailability();
        updateGroupSummary();
        updateConfirmButton();
    }

    /* ----------------------------------------------------------
       ROOM AVAILABILITY AND RENDERING
       ---------------------------------------------------------- */

    function getRoomState(room) {
        const taken = Number(room.occupants || 0);
        const capacity = Number(room.capacity || 0);
        const roomGender = room.room_gender;
        const isMine = pendingRoom && String(room.room_number) === String(pendingRoom);

        if (isMine) {
            return { label: 'Your request', cls: 'status-available', selectable: false };
        }

        if (taken >= capacity) {
            return { label: 'Full', cls: 'status-full', selectable: false };
        }

        if (!myGender) {
            return { label: 'Set sex first', cls: 'status-full', selectable: false };
        }

        if (taken > 0 && roomGender && roomGender !== myGender) {
            return {
                label: `${GENDER_LABEL[roomGender] || 'Other'} only`,
                cls: roomGender === 'male' ? 'status-men' : 'status-women',
                selectable: false
            };
        }

        if (taken > 0 && roomGender) {
            return {
                label: `Available · ${GENDER_LABEL[roomGender] || 'Shared'} only`,
                cls: roomGender === 'male' ? 'status-men' : 'status-women',
                selectable: true
            };
        }

        return { label: 'Available', cls: 'status-available', selectable: true };
    }

    function createBedDots(room) {
        const wrap = document.createElement('div');
        wrap.className = 'room-beds';

        const capacity = Math.max(0, Math.min(20, Number(room.capacity) || 0));
        const occupants = Math.max(0, Number(room.occupants) || 0);

        for (let i = 0; i < capacity; i++) {
            const dot = document.createElement('span');
            dot.className = 'bed-dot' + (i < occupants ? ' taken' : '');
            wrap.appendChild(dot);
        }

        return wrap;
    }

    function renderRooms(rooms) {
        roomGrid.replaceChildren();
        const floors = new Map();

        rooms.forEach(room => {
            const floor = Number(room.floor);
            if (!floors.has(floor)) floors.set(floor, []);
            floors.get(floor).push(room);
        });

        [...floors.keys()].sort((a, b) => a - b).forEach(floor => {
            const list = floors.get(floor);
            const open = list.filter(room => getRoomState(room).selectable).length;

            const heading = document.createElement('div');
            heading.className = 'floor-heading';

            const title = document.createElement('span');
            title.textContent = `Floor ${floor}`;

            const count = document.createElement('small');
            count.textContent = `${open} of ${list.length} rooms open to you`;

            heading.append(title, count);
            roomGrid.appendChild(heading);

            list.forEach(room => {
                const state = getRoomState(room);
                const free = Math.max(0, Number(room.capacity) - Number(room.occupants));

                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'room-card' + (state.selectable ? '' : ' unavailable');
                card.disabled = !state.selectable || Boolean(activeGroupId);
                card.setAttribute(
                    'aria-pressed',
                    String(selectedRoom?.room_number === room.room_number)
                );

                if (selectedRoom?.room_number === room.room_number) {
                    card.classList.add('selected');
                }

                const number = document.createElement('span');
                number.className = 'room-number';
                number.textContent = String(room.room_number);

                const info = document.createElement('span');
                info.className = 'room-info';
                info.textContent = `Floor ${room.floor} · ${free} of ${room.capacity} beds free`;

                const status = document.createElement('span');
                status.className = `room-status ${state.cls}`;
                status.textContent = state.label;

                card.append(number, info, createBedDots(room), status);

                if (state.selectable) {
                    card.addEventListener('click', () => {
                        selectedRoom = room;
                        renderRooms(rooms);
                        updateSelectedRoomSummary();
                        updateGroupSummary();
                        updateConfirmButton();
                        openRoomDrawer();
                    });
                }

                roomGrid.appendChild(card);
            });
        });
    }

    async function loadRooms(noticeMessage) {
        selectedRoom = null;
        confirmBtn.disabled = true;
        skeleton.show(roomGrid, { count: 6, type: 'cards' });

        const { data: rooms, error } = await db.rpc('get_room_availability');

        skeleton.hide(roomGrid);
        roomGrid.replaceChildren();

        if (noticeMessage) renderInlineNotice(noticeMessage, 'error');

        if (pendingRoom) {
            renderInlineNotice(
                `You already requested Room ${pendingRoom}. You may select another room for an individual booking, or contact the front desk to resolve the existing request.`,
                'info'
            );
        }

        if (assignedRoom) {
            renderInlineNotice(
                `You already have Room ${assignedRoom} assigned. Please use your dashboard or contact the front desk.`,
                'info'
            );
        }

        if (!myGender) {
            renderInlineNotice(
                'Your profile has no valid gender set, so a room cannot be requested. Please contact the front desk.',
                'error'
            );
        }

        if (error) {
            let message = 'Could not load rooms: ' + error.message;
            if (/function|schema cache|does not exist/i.test(error.message)) {
                message += ' — check that get_room_availability() is installed in Supabase.';
            }
            renderInlineNotice(message, 'error');
            return;
        }

        if (!Array.isArray(rooms) || rooms.length === 0) {
            renderInlineNotice(
                'No rooms are currently available to display. Please contact the front desk.',
                'error'
            );
            return;
        }

        renderRooms(rooms);
        updateSelectedRoomSummary();
        updateGroupSummary();
        updateConfirmButton();
    }

    /* ----------------------------------------------------------
       EDGE FUNCTION CALLS
       ---------------------------------------------------------- */

    async function invokeEdge(action, payload = {}) {
        const { data, error } = await db.functions.invoke(EDGE_FUNCTION, {
            body: { action, ...payload }
        });

        if (error) {
            let serverMessage = '';
            try {
                if (error.context && typeof error.context.clone === 'function') {
                    const response = await error.context.clone().json();
                    serverMessage = response?.error || response?.message || '';
                }
            } catch (_) {
                // The response may not contain JSON.
            }

            throw new Error(
                serverMessage || error.message || 'Could not contact the CMDI server.'
            );
        }

        if (!data) {
            throw new Error('The CMDI server returned an empty response.');
        }

        if (data.ok !== true) {
            throw new Error(edgeErrorMessage(data));
        }

        return data;
    }

    function edgeErrorMessage(data) {
        const code = String(data?.code || '');
        const map = {
            invalid_credentials: 'Your login session is invalid. Please sign in again.',
            invalid_invitation: 'This invitation link is invalid. Ask the group leader for a new invitation.',
            group_unavailable: 'This group booking is no longer available.',
            insufficient_beds: 'There are not enough free beds for the entire group.',
            wrong_account: 'This invitation belongs to another CMDI account.',
            email_mismatch: 'The invited email does not match the signed-in CMDI account.',
            already_in_group: 'One of the invited accounts already belongs to another active group.',
            already_has_room: 'One of the invited accounts already has a room request or assignment.'
        };

        return map[code] || data?.error || data?.message || 'The request could not be completed.';
    }

    /* ----------------------------------------------------------
       INDIVIDUAL BOOKING
       ---------------------------------------------------------- */

    async function submitIndividualBooking() {
        if (!selectedRoom) {
            throw new Error('Please select a room first.');
        }

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Sending to staff...';

        const { error } = await db
            .from('profiles')
            .update({ pending_room: String(selectedRoom.room_number) })
            .eq('id', session.user.id);

        if (error) throw error;

        window.location.assign('client-dashboard.html');
    }

    /* ----------------------------------------------------------
       GROUP BOOKING CREATION
       ---------------------------------------------------------- */

    async function submitGroupBooking() {
        const validation = validateGroupInputs();

        if (!validation.ok) {
            if (groupInputError) groupInputError.textContent = validation.message;
            throw new Error(validation.message);
        }

        if (!canCreateGroup()) {
            throw new Error(
                'Your account already has a room request or assignment. Resolve it before creating a group.'
            );
        }

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Creating group and sending invitations...';
        if (groupInputError) groupInputError.textContent = '';

        const result = await invokeEdge('create_group_booking', {
            room_number: String(selectedRoom.room_number),
            invitee_emails: validation.emails
        });

        if (!result.group_booking_id) {
            throw new Error('The server did not return a group booking reference.');
        }

        activeGroupId = result.group_booking_id;
        groupHoldExpiresAt = result.hold_expires_at || null;

        // Save the active group so the leader can return to its status panel.
        try {
            sessionStorage.setItem(ACTIVE_GROUP_KEY, activeGroupId);
            const statusUrl = new URL(window.location.href);
            statusUrl.searchParams.set('group_booking_id', activeGroupId);
            window.history.replaceState({}, document.title, statusUrl.toString());
        } catch (error) {
            console.warn('Could not save active group reference:', error);
        }

        showGroupStatus(result);
        await refreshGroupStatus();
    }

    function showGroupStatus(createResult) {
        // Keep the room grid behind the drawer; show group progress in the drawer.
        drawerBookingSection.classList.add('hidden');
        individualModeBtn.disabled = true;
        groupModeBtn.disabled = true;
        groupStatusPanel.classList.remove('hidden');
        openRoomDrawer();

        document.getElementById('statusRoomNumber').textContent =
            createResult.room_number || selectedRoom?.room_number || '—';
        document.getElementById('statusGroupSize').textContent =
            createResult.group_size ? `${createResult.group_size} members` : '—';

        document.getElementById('groupCreatedMessage').textContent =
            createResult.code === 'group_created_email_failed'
                ? 'The group hold was created, but email delivery could not be confirmed. Review the manual invitation links below and share each link only with its intended CMDI member.'
                : `Your group was created. ${Number(createResult.invitations_sent || 0)} invitation email(s) were confirmed by the mail service.`;

        // Show manual links only when the email bridge reports a delivery problem.
        const manualInvitations = Array.isArray(createResult.invitations)
            ? createResult.invitations.filter(item => item.invitation_link)
            : [];

        const manualPanel = document.getElementById('manualLinksPanel');
        const manualList = document.getElementById('manualInvitationLinks');

        if (manualPanel && manualList) {
            manualList.replaceChildren();

            manualInvitations.forEach(invitation => {
                const row = document.createElement('div');
                row.className = 'manual-link-row';

                const label = document.createElement('span');
                label.textContent = invitation.email || 'Invited CMDI member';

                const link = document.createElement('a');
                link.href = invitation.invitation_link;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = 'Open invitation';

                row.append(label, link);
                manualList.appendChild(row);
            });

            manualPanel.classList.toggle('hidden', manualInvitations.length === 0);
        }

        if (Array.isArray(createResult.invitations) && createResult.invitations.length) {
            const list = document.getElementById('groupMemberList');
            list.replaceChildren();

            createResult.invitations.forEach(invitation => {
                const row = document.createElement('div');
                row.className = 'member-row';

                const identity = document.createElement('div');
                identity.className = 'member-name';

                const email = document.createElement('strong');
                email.textContent = invitation.email || 'Invited CMDI member';

                const note = document.createElement('small');
                note.textContent = invitation.status === 'email_failed'
                    ? 'Email delivery not confirmed'
                    : 'Invitation email requested';

                identity.append(email, note);
                row.appendChild(identity);

                const state = document.createElement('span');
                state.className = 'member-state';
                state.textContent = invitation.status === 'email_failed' ? 'Check email' : 'Pending';
                row.appendChild(state);

                list.appendChild(row);
            });
        }

        startCountdown();
        stopRefreshOnly();
        groupRefreshTimer = setInterval(() => {
            refreshGroupStatus().catch(error => {
                console.error('Automatic group status refresh failed:', error);
            });
        }, 15000);
    }

    function stopRefreshOnly() {
        if (groupRefreshTimer) clearInterval(groupRefreshTimer);
        groupRefreshTimer = null;
    }

    /* ----------------------------------------------------------
       GROUP STATUS AND COUNTDOWN
       ---------------------------------------------------------- */

    async function refreshGroupStatus() {
        if (!activeGroupId || isReturningToRooms) return;

        const result = await invokeEdge('get_group_booking', {
            group_booking_id: activeGroupId
        });

        const status = String(result.status || '').toLowerCase();

        // IMPORTANT FIX:
        // A cancelled or expired group should not leave a stale status panel.
        // Clear its saved ID and immediately restore the room list.
        if (status === 'cancelled' || status === 'expired') {
            await returnToRoomSelection(status);
            return;
        }

        renderGroupStatus(result);
    }

    function renderGroupStatus(result) {
        const status = String(result.status || 'inviting').toLowerCase();
        const badge = document.getElementById('groupStatusBadge');

        badge.textContent = status.toUpperCase();
        badge.className = 'status-badge ' + status;

        document.getElementById('statusRoomNumber').textContent = result.room_number || '—';
        document.getElementById('statusGroupSize').textContent =
            result.group_size ? `${result.group_size} members` : '—';

        if (result.hold_expires_at) {
            groupHoldExpiresAt = result.hold_expires_at;
            startCountdown();
        }

        const members = Array.isArray(result.members) ? result.members : [];
        const list = document.getElementById('groupMemberList');
        list.replaceChildren();

        if (!members.length) {
            const empty = document.createElement('p');
            empty.className = 'muted-text';
            empty.textContent = 'No member details were returned.';
            list.appendChild(empty);
        } else {
            members.forEach(member => {
                const row = document.createElement('div');
                row.className = 'member-row';

                const identity = document.createElement('div');
                identity.className = 'member-name';

                const name = document.createElement('strong');
                name.textContent = member.full_name ||
                    (member.member_role === 'leader' ? 'You (Group Leader)' : 'CMDI Member');

                const email = document.createElement('small');
                email.textContent = member.invited_email ||
                    (member.member_role === 'leader' ? 'Group leader' : 'Invited member');

                identity.append(name, email);

                const memberState = document.createElement('span');
                memberState.className = 'member-state ' + String(member.status || '').toLowerCase();
                memberState.textContent = String(member.status || 'unknown').replaceAll('_', ' ');

                row.append(identity, memberState);
                list.appendChild(row);
            });
        }

        const accepted = Number(result.accepted_members || 0);
        const pending = Number(result.pending_members || 0);
        const declined = Number(result.declined_members || 0);

        document.getElementById('groupCreatedMessage').textContent =
            `${accepted} accepted · ${pending} pending · ${declined} declined. All members must accept before you can confirm.`;

        confirmGroupBtn.classList.toggle('hidden', status !== 'ready');
        confirmGroupBtn.disabled = status !== 'ready';

        cancelGroupBtn.classList.toggle('hidden', !['inviting', 'ready'].includes(status));

        const replacementNeeded =
            status === 'inviting' &&
            declined > 0 &&
            (accepted + pending) < Number(result.group_size || 0);

        replacementArea.classList.toggle('hidden', !replacementNeeded);

        if (status === 'confirmed') {
            document.getElementById('groupCreatedMessage').textContent =
                `Group booking confirmed for Room ${result.room_number || '—'}. The group members' room requests have been submitted to staff.`;
            cancelGroupBtn.classList.add('hidden');
            replacementArea.classList.add('hidden');
            confirmGroupBtn.classList.add('hidden');
            stopGroupTimers();
        }

        // Keep terminal status handling centralized in refreshGroupStatus().
        // A cancelled/expired status is redirected to room selection there.
    }

    function startCountdown() {
        if (countdownTimer) clearInterval(countdownTimer);

        const display = document.getElementById('statusCountdown');

        const update = () => {
            if (!groupHoldExpiresAt) {
                display.textContent = 'Not available';
                return;
            }

            const remaining = new Date(groupHoldExpiresAt).getTime() - Date.now();

            if (remaining <= 0) {
                display.textContent = 'Expired';
                refreshGroupStatus().catch(error => {
                    console.error('Could not verify expired group status:', error);
                });
                if (countdownTimer) clearInterval(countdownTimer);
                countdownTimer = null;
                return;
            }

            const totalSeconds = Math.floor(remaining / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            display.textContent = `${minutes}:${String(seconds).padStart(2, '0')} remaining`;
        };

        update();
        countdownTimer = setInterval(update, 1000);
    }

    /* ----------------------------------------------------------
       IMPORTANT FIX: RETURN TO ROOM SELECTION AFTER CANCEL/EXPIRY
       ---------------------------------------------------------- */

    async function returnToRoomSelection(reason) {
        if (isReturningToRooms) return;
        isReturningToRooms = true;

        // Stop polling before clearing the group state.
        stopGroupTimers();

        // Forget this group in the current page and in session storage.
        activeGroupId = null;
        groupHoldExpiresAt = null;
        removeSavedGroupReference();

        // Hide group status, restore the room grid, and close the drawer.
        groupStatusPanel.classList.add('hidden');
        drawerBookingSection.classList.remove('hidden');
        roomArea.classList.remove('hidden');
        footerActions.classList.remove('hidden');
        selectedRoom = null;
        closeRoomDrawer();

        // Reset UI controls and group-specific inputs.
        individualModeBtn.disabled = false;
        groupModeBtn.disabled = false;
        clearInviteeEmails();
        replacementEmail.value = '';
        if (groupInputError) groupInputError.textContent = '';
        if (replacementMessage) replacementMessage.textContent = '';
        if (document.getElementById('statusMessage')) {
            document.getElementById('statusMessage').textContent = '';
        }
        if (document.getElementById('manualLinksPanel')) {
            document.getElementById('manualLinksPanel').classList.add('hidden');
        }
        if (document.getElementById('manualInvitationLinks')) {
            document.getElementById('manualInvitationLinks').replaceChildren();
        }
        document.getElementById('groupMemberList').replaceChildren();

        // Reset to Individual mode first. Group mode is re-enabled only
        // if the latest profile has no room request/assignment.
        bookingMode = 'individual';
        individualModeBtn.classList.add('active');
        groupModeBtn.classList.remove('active');
        individualModeBtn.setAttribute('aria-pressed', 'true');
        groupModeBtn.setAttribute('aria-pressed', 'false');
        groupSetup.classList.add('hidden');
        updateSelectedRoomSummary();

        try {
            // Reload the actual account state. A pre-existing individual
            // request must remain intact; cancelling a group must not erase it.
            const { data: profile, error } = await db
                .from('profiles')
                .select('gender, room, pending_room, assigned_room')
                .eq('id', session.user.id)
                .single();

            if (error) throw error;

            myGender = normalizeGender(profile.gender);
            pendingRoom = profile.pending_room || null;
            assignedRoom = profile.assigned_room || null;

            syncModeAvailability();

            // Reload room availability from Supabase after the hold is released.
            await loadRooms();

            clearNotice();
            showNotice(
                reason === 'expired'
                    ? 'Your group booking expired. The temporary room hold has been released. You can choose a room again.'
                    : 'Group booking cancelled successfully. The temporary room hold has been released. You can choose a room again.',
                'success'
            );

        } catch (error) {
            console.error('Could not restore room selection after group cancellation:', error);
            showNotice(
                'The group is no longer active, but room availability could not be refreshed. Please reload this page. ' +
                (error.message || ''),
                'error'
            );
        } finally {
            isReturningToRooms = false;
            updateConfirmButton();
        }
    }

    /* ----------------------------------------------------------
       GROUP CONFIRM / CANCEL / REPLACEMENT INVITATION
       ---------------------------------------------------------- */

    async function confirmGroup() {
        if (!activeGroupId) return;

        confirmGroupBtn.disabled = true;
        confirmGroupBtn.textContent = 'Confirming...';
        document.getElementById('statusMessage').textContent = '';

        try {
            const result = await invokeEdge('confirm_group_booking', {
                group_booking_id: activeGroupId
            });

            document.getElementById('groupCreatedMessage').textContent =
                `Group booking confirmed for Room ${result.room_number || document.getElementById('statusRoomNumber').textContent}. ` +
                `${result.members_assigned || 0} member(s) submitted to staff.`;

            await refreshGroupStatus();

        } catch (error) {
            document.getElementById('statusMessage').textContent =
                error.message || 'Could not confirm the group booking.';
        } finally {
            if (activeGroupId) {
                confirmGroupBtn.disabled = false;
                confirmGroupBtn.textContent = 'Confirm Group Booking';
            }
        }
    }

    async function cancelGroup() {
        if (!activeGroupId) return;

        const confirmed = window.confirm(
            'Cancel this group booking? The temporary room hold will be released.'
        );
        if (!confirmed) return;

        cancelGroupBtn.disabled = true;
        cancelGroupBtn.textContent = 'Cancelling...';

        try {
            await invokeEdge('cancel_group_booking', {
                group_booking_id: activeGroupId
            });

            // This call detects status=cancelled, clears the saved group ID,
            // hides the status panel, and reloads the room selection.
            await refreshGroupStatus();

        } catch (error) {
            document.getElementById('statusMessage').textContent =
                error.message || 'Could not cancel the group booking.';
        } finally {
            if (activeGroupId) {
                cancelGroupBtn.disabled = false;
                cancelGroupBtn.textContent = 'Cancel Group Booking';
            }
        }
    }

    async function addReplacementInvitation() {
        const email = String(replacementEmail.value || '').trim().toLowerCase();
        replacementMessage.textContent = '';

        if (!EMAIL_RE.test(email)) {
            replacementMessage.textContent = 'Enter a valid email address.';
            return;
        }

        if (!activeGroupId) {
            replacementMessage.textContent = 'There is no active group booking.';
            return;
        }

        sendReplacementBtn.disabled = true;
        sendReplacementBtn.textContent = 'Sending...';

        try {
            const result = await invokeEdge('add_group_invitation', {
                group_booking_id: activeGroupId,
                invitee_email: email
            });

            replacementMessage.textContent = result.code === 'replacement_invitation_sent'
                ? `Invitation email sent to ${email}.`
                : `Invitation created for ${email}. Email delivery may need follow-up.`;

            replacementEmail.value = '';
            await refreshGroupStatus();

        } catch (error) {
            replacementMessage.textContent =
                error.message || 'Could not send the replacement invitation.';
        } finally {
            sendReplacementBtn.disabled = false;
            sendReplacementBtn.textContent = 'Send invite';
        }
    }

    /* ----------------------------------------------------------
       INITIALIZATION / RESTORE ACTIVE GROUP
       ---------------------------------------------------------- */

    async function init() {
        try {
            if (!db) {
                throw new Error(
                    'Supabase is not connected. Check js/supabase-client.js and the browser console.'
                );
            }

            await loadSkeleton();

            const { data: sessionData, error: sessionError } = await db.auth.getSession();
            if (sessionError || !sessionData?.session) {
                window.location.replace('index.html');
                return;
            }

            session = sessionData.session;

            const { data: profile, error: profileError } = await db
                .from('profiles')
                .select('gender, room, pending_room, assigned_room')
                .eq('id', session.user.id)
                .maybeSingle();

            if (profileError) throw profileError;
            if (!profile) {
                throw new Error('Your CMDI profile could not be found. Contact the front desk.');
            }

            // Clients who already have an assigned room should use their dashboard.
            if (profile.room || profile.assigned_room) {
                window.location.replace('client-dashboard.html');
                return;
            }

            myGender = normalizeGender(profile.gender);
            pendingRoom = profile.pending_room || null;
            assignedRoom = profile.assigned_room || null;

            syncModeAvailability();

            // Restore an active group from the URL or session storage.
            // A stale cancelled/expired group is handled by refreshGroupStatus(),
            // which clears the reference and returns to room selection.
            let savedGroupId = new URLSearchParams(window.location.search)
                .get('group_booking_id');

            if (!savedGroupId) {
                try {
                    savedGroupId = sessionStorage.getItem(ACTIVE_GROUP_KEY);
                } catch (_) {
                    savedGroupId = null;
                }
            }

            if (savedGroupId && /^[0-9a-f-]{36}$/i.test(savedGroupId)) {
                activeGroupId = savedGroupId;

                drawerBookingSection.classList.add('hidden');
                individualModeBtn.disabled = true;
                groupModeBtn.disabled = true;
                groupStatusPanel.classList.remove('hidden');
                openRoomDrawer();

                await refreshGroupStatus();

                // Start polling only if refresh did not clear a cancelled/expired group.
                if (activeGroupId && !groupRefreshTimer) {
                    groupRefreshTimer = setInterval(() => {
                        refreshGroupStatus().catch(error => {
                            console.error('Automatic group status refresh failed:', error);
                        });
                    }, 15000);
                }

                return;
            }

            // Remove malformed/stale URL or session references.
            if (savedGroupId) removeSavedGroupReference();

            await loadRooms();

        } catch (error) {
            console.error('Choose Room initialization error:', error);
            roomGrid.replaceChildren();
            renderInlineNotice(
                error.message || 'Something went wrong while loading rooms.',
                'error'
            );
        }
    }

    /* ----------------------------------------------------------
       EVENT LISTENERS
       ---------------------------------------------------------- */

    individualModeBtn.addEventListener('click', () => setBookingMode('individual'));
    groupModeBtn.addEventListener('click', () => setBookingMode('group'));

    closeRoomDrawerBtn.addEventListener('click', closeRoomDrawer);
    drawerBackdrop.addEventListener('click', closeRoomDrawer);

    reopenGroupDrawerBtn.addEventListener('click', () => {
        if (activeGroupId) openRoomDrawer();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && roomDrawer.classList.contains('open')) {
            closeRoomDrawer();
        }
    });

    recipientEntry.addEventListener('click', event => {
        if (event.target === recipientEntry) {
            inviteeEmailEntry.focus();
        }
    });

    addInviteeEmailBtn.addEventListener('click', addInviteeEmailsFromEntry);

    inviteeEmailEntry.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
            event.preventDefault();
            addInviteeEmailsFromEntry();
        }

        if (event.key === 'Backspace' && !inviteeEmailEntry.value && inviteeEmailList.length) {
            inviteeEmailList.pop();
            renderInviteeEmailChips();
            updateGroupSummary();
        }
    });

    inviteeEmailEntry.addEventListener('paste', event => {
        const pasted = event.clipboardData?.getData('text') || '';
        if (/[\n,;]/.test(pasted)) {
            event.preventDefault();
            inviteeEmailEntry.value = pasted;
            addInviteeEmailsFromEntry();
        }
    });

    inviteeEmailEntry.addEventListener('blur', () => {
        // Do not silently commit incomplete text; Enter or Add confirms a chip.
        if (inviteeEmailEntry.value.trim() && groupInputError) {
            groupInputError.textContent = 'Press Enter or Add to include this email address.';
        }
    });

    confirmBtn.addEventListener('click', async () => {
        clearNotice();

        try {
            if (bookingMode === 'group') {
                await submitGroupBooking();
            } else {
                await submitIndividualBooking();
            }
        } catch (error) {
            console.error('Room booking submission error:', error);
            showNotice(error.message || 'The room request could not be submitted.', 'error');
        } finally {
            if (groupStatusPanel.classList.contains('hidden')) {
                updateConfirmButton();
            }
        }
    });

    refreshGroupStatusBtn.addEventListener('click', async () => {
        refreshGroupStatusBtn.disabled = true;
        refreshGroupStatusBtn.textContent = 'Refreshing...';

        try {
            await refreshGroupStatus();
            if (document.getElementById('statusMessage')) {
                document.getElementById('statusMessage').textContent = '';
            }
        } catch (error) {
            const message = document.getElementById('statusMessage');
            if (message) {
                message.textContent = error.message || 'Could not refresh group status.';
            }
        } finally {
            if (refreshGroupStatusBtn.isConnected) {
                refreshGroupStatusBtn.disabled = false;
                refreshGroupStatusBtn.textContent = 'Refresh status';
            }
        }
    });

    confirmGroupBtn.addEventListener('click', confirmGroup);
    cancelGroupBtn.addEventListener('click', cancelGroup);
    sendReplacementBtn.addEventListener('click', addReplacementInvitation);

    window.addEventListener('beforeunload', stopGroupTimers);

    renderInviteeEmailChips();
    init();
})();
