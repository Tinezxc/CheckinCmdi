
/* ==========================================================
   CMDI / HAVEN - CHOOSE ROOM
   Individual Booking + Group Booking

   Requires:
     - window.supabaseClient
     - get_room_availability RPC
     - dynamic-responder Edge Function

   Features:
     - Individual booking
     - Group booking
     - Existing CMDI accounts only
     - 30-minute temporary room hold
     - Gmail invitation status
     - Accept/decline tracking
     - Replacement invitations
     - Group confirmation
     - Automatic room list restoration after cancellation
       or expiration
   ========================================================== */

(() => {
    'use strict';

    const db = window.supabaseClient;
    const EDGE_FUNCTION = 'dynamic-responder';
    const ACTIVE_GROUP_KEY = 'cmdi_active_group_booking_id';
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const GENDER_LABEL = { male: 'Men', female: 'Women' };

    const el = {
        roomGrid: document.getElementById('roomGrid'),
        confirmRoomBtn: document.getElementById('confirmRoomBtn'),
        footerActions: document.getElementById('footerActions'),
        roomArea: document.getElementById('roomArea'),
        groupSetup: document.getElementById('groupSetup'),
        groupStatusPanel: document.getElementById('groupStatusPanel'),
        pageNotice: document.getElementById('pageNotice'),

        individualModeBtn: document.getElementById('individualModeBtn'),
        groupModeBtn: document.getElementById('groupModeBtn'),
        inviteeEmails: document.getElementById('inviteeEmails'),
        groupInputError: document.getElementById('groupInputError'),
        groupSummary: document.getElementById('groupSummary'),

        refreshGroupStatusBtn: document.getElementById('refreshGroupStatusBtn'),
        confirmGroupBtn: document.getElementById('confirmGroupBtn'),
        cancelGroupBtn: document.getElementById('cancelGroupBtn'),
        sendReplacementBtn: document.getElementById('sendReplacementBtn'),

        replacementArea: document.getElementById('replacementArea'),
        replacementEmail: document.getElementById('replacementEmail'),
        replacementMessage: document.getElementById('replacementMessage'),

        manualLinksPanel: document.getElementById('manualLinksPanel'),
        manualInvitationLinks: document.getElementById('manualInvitationLinks'),
        groupMemberList: document.getElementById('groupMemberList'),

        statusRoomNumber: document.getElementById('statusRoomNumber'),
        statusGroupSize: document.getElementById('statusGroupSize'),
        groupCreatedMessage: document.getElementById('groupCreatedMessage'),
        groupStatusBadge: document.getElementById('groupStatusBadge'),
        statusCountdown: document.getElementById('statusCountdown'),
        statusMessage: document.getElementById('statusMessage')
    };

    let session = null;
    let myGender = null;
    let pendingRoom = null;
    let assignedRoom = null;
    let selectedRoom = null;

    let bookingMode = 'individual';
    let activeGroupId = null;
    let groupHoldExpiresAt = null;

    let groupRefreshTimer = null;
    let countdownTimer = null;
    let returningToRooms = false;

    let skeleton = { show() {}, hide() {} };


    /* ==========================================================
       BASIC HELPERS
       ========================================================== */

    function normalizeGender(value) {
        const valueText = String(value || '').trim().toLowerCase();

        if (['male', 'm', 'man'].includes(valueText)) {
            return 'male';
        }

        if (['female', 'f', 'woman'].includes(valueText)) {
            return 'female';
        }

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

                if (
                    typeof mod.showSkeleton === 'function' &&
                    typeof mod.hideSkeleton === 'function'
                ) {
                    skeleton = {
                        show: mod.showSkeleton,
                        hide: mod.hideSkeleton
                    };

                    return;
                }

            } catch (_) {
                // Skeleton loader is optional.
            }
        }
    }


    function showNotice(message, kind = 'error') {
        if (!el.pageNotice) return;

        el.pageNotice.textContent = message;
        el.pageNotice.className = `notice notice-${kind}`;
        el.pageNotice.classList.remove('hidden');
    }


    function clearNotice() {
        if (!el.pageNotice) return;

        el.pageNotice.textContent = '';
        el.pageNotice.classList.add('hidden');
    }


    function inlineNotice(message, kind = 'error') {
        const node = document.createElement('div');

        node.className = `notice notice-${kind}`;
        node.textContent = message;

        el.roomGrid.appendChild(node);
    }


    function stopGroupTimers() {
        if (groupRefreshTimer) {
            clearInterval(groupRefreshTimer);
        }

        if (countdownTimer) {
            clearInterval(countdownTimer);
        }

        groupRefreshTimer = null;
        countdownTimer = null;
    }


    function clearSavedGroupReference() {
        try {
            sessionStorage.removeItem(ACTIVE_GROUP_KEY);
        } catch (error) {
            console.warn('Could not clear saved group ID:', error);
        }

        try {
            const url = new URL(window.location.href);

            url.searchParams.delete('group_booking_id');

            window.history.replaceState(
                {},
                document.title,
                url.toString()
            );

        } catch (error) {
            console.warn('Could not remove group ID from URL:', error);
        }
    }


    function parseInviteeEmails() {
        return String(el.inviteeEmails.value || '')
            .split(/[\n,;]+/)
            .map(value => value.trim().toLowerCase())
            .filter(Boolean);
    }


    /* ==========================================================
       BOOKING MODE AND INPUT VALIDATION
       ========================================================== */

    function canCreateGroup() {
        return Boolean(myGender) &&
            !pendingRoom &&
            !assignedRoom;
    }


    function syncModeAvailability() {
        el.individualModeBtn.disabled = !myGender;
        el.groupModeBtn.disabled = !canCreateGroup();

        if (pendingRoom || assignedRoom) {
            el.groupModeBtn.title =
                'Resolve your existing room request or assignment before creating a group.';
        } else {
            el.groupModeBtn.title = '';
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
                message:
                    'You already have a room request or assignment, or your profile is not eligible for group booking.'
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

        const freeBeds =
            Number(selectedRoom.capacity) -
            Number(selectedRoom.occupants);

        if (groupSize > Number(selectedRoom.capacity)) {
            return {
                ok: false,
                emails,
                message:
                    `This room can hold only ${selectedRoom.capacity} members in total, including you.`
            };
        }

        if (groupSize > freeBeds) {
            return {
                ok: false,
                emails,
                message:
                    `This room has only ${freeBeds} free bed(s). Your group needs ${groupSize}.`
            };
        }

        const leaderEmail =
            String(session?.user?.email || '')
                .trim()
                .toLowerCase();

        if (leaderEmail && emails.includes(leaderEmail)) {
            return {
                ok: false,
                emails,
                message: 'You cannot invite your own email address.'
            };
        }

        return { ok: true, emails };
    }


    function updateGroupSummary() {
        if (bookingMode !== 'group') return;

        const result = validateGroupInputs();

        if (!result.ok) {
            el.groupInputError.textContent = result.message;

            if (!selectedRoom && result.emails.length) {
                el.groupSummary.textContent =
                    `Group size: ${result.emails.length + 1} member(s). Select a room to check capacity.`;
            }

        } else {
            el.groupInputError.textContent = '';

            const freeBeds =
                Number(selectedRoom.capacity) -
                Number(selectedRoom.occupants);

            el.groupSummary.textContent =
                `Group size: ${result.emails.length + 1} member(s) (you + ${result.emails.length} invited). ` +
                `Room ${selectedRoom.room_number} has ${freeBeds} free bed(s). ` +
                'A 30-minute temporary hold starts when the group is created.';
        }

        updateConfirmButton();
    }


    function updateConfirmButton() {
        if (!selectedRoom) {
            el.confirmRoomBtn.disabled = true;

            el.confirmRoomBtn.textContent =
                bookingMode === 'group'
                    ? 'Create Group & Send Invites'
                    : 'Confirm Selection';

            return;
        }

        if (bookingMode === 'individual') {
            el.confirmRoomBtn.disabled = !myGender;
            el.confirmRoomBtn.textContent = 'Confirm Selection';
            return;
        }

        const validation = validateGroupInputs();

        el.confirmRoomBtn.disabled = !validation.ok;
        el.confirmRoomBtn.textContent = 'Create Group & Send Invites';
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

        el.individualModeBtn.classList.toggle(
            'active',
            mode === 'individual'
        );

        el.groupModeBtn.classList.toggle(
            'active',
            mode === 'group'
        );

        el.individualModeBtn.setAttribute(
            'aria-pressed',
            String(mode === 'individual')
        );

        el.groupModeBtn.setAttribute(
            'aria-pressed',
            String(mode === 'group')
        );

        el.groupSetup.classList.toggle(
            'hidden',
            mode !== 'group'
        );

        el.groupInputError.textContent = '';

        if (mode === 'individual') {
            clearNotice();
        }

        syncModeAvailability();
        updateGroupSummary();
        updateConfirmButton();
    }


    /* ==========================================================
       ROOM AVAILABILITY
       ========================================================== */

    function getRoomState(room) {
        const occupants = Number(room.occupants || 0);
        const capacity = Number(room.capacity || 0);
        const roomGender = room.room_gender;

        const isMine =
            pendingRoom &&
            String(room.room_number) === String(pendingRoom);

        if (isMine) {
            return {
                label: 'Your request',
                cls: 'status-available',
                selectable: false
            };
        }

        if (occupants >= capacity) {
            return {
                label: 'Full',
                cls: 'status-full',
                selectable: false
            };
        }

        if (!myGender) {
            return {
                label: 'Set sex first',
                cls: 'status-full',
                selectable: false
            };
        }

        if (
            occupants > 0 &&
            roomGender &&
            roomGender !== myGender
        ) {
            return {
                label: `${GENDER_LABEL[roomGender] || 'Other'} only`,
                cls: roomGender === 'male'
                    ? 'status-men'
                    : 'status-women',
                selectable: false
            };
        }

        if (occupants > 0 && roomGender) {
            return {
                label: `Available · ${GENDER_LABEL[roomGender] || 'Shared'} only`,
                cls: roomGender === 'male'
                    ? 'status-men'
                    : 'status-women',
                selectable: true
            };
        }

        return {
            label: 'Available',
            cls: 'status-available',
            selectable: true
        };
    }


    function makeBedDots(room) {
        const wrapper = document.createElement('div');
        wrapper.className = 'room-beds';

        const capacity = Math.max(
            0,
            Math.min(20, Number(room.capacity) || 0)
        );

        const occupants = Math.max(
            0,
            Number(room.occupants) || 0
        );

        for (let i = 0; i < capacity; i++) {
            const dot = document.createElement('span');

            dot.className =
                'bed-dot' + (i < occupants ? ' taken' : '');

            wrapper.appendChild(dot);
        }

        return wrapper;
    }


    function renderRooms(rooms) {
        el.roomGrid.replaceChildren();

        const floors = new Map();

        rooms.forEach(room => {
            const floor = Number(room.floor);

            if (!floors.has(floor)) {
                floors.set(floor, []);
            }

            floors.get(floor).push(room);
        });

        [...floors.keys()]
            .sort((a, b) => a - b)
            .forEach(floor => {

                const floorRooms = floors.get(floor);

                const openCount = floorRooms.filter(
                    room => getRoomState(room).selectable
                ).length;

                const heading = document.createElement('div');
                heading.className = 'floor-heading';

                const title = document.createElement('span');
                title.textContent = `Floor ${floor}`;

                const count = document.createElement('small');
                count.textContent =
                    `${openCount} of ${floorRooms.length} rooms open to you`;

                heading.append(title, count);

                el.roomGrid.appendChild(heading);

                floorRooms.forEach(room => {
                    const state = getRoomState(room);

                    const freeBeds =
                        Math.max(
                            0,
                            Number(room.capacity) -
                            Number(room.occupants)
                        );

                    const card = document.createElement('button');

                    card.type = 'button';

                    card.className =
                        'room-card' +
                        (state.selectable ? '' : ' unavailable');

                    card.disabled = !state.selectable;

                    card.setAttribute(
                        'aria-pressed',
                        String(
                            selectedRoom?.room_number === room.room_number
                        )
                    );

                    if (
                        selectedRoom?.room_number === room.room_number
                    ) {
                        card.classList.add('selected');
                    }

                    const number = document.createElement('span');
                    number.className = 'room-number';
                    number.textContent = String(room.room_number);

                    const info = document.createElement('span');
                    info.className = 'room-info';

                    info.textContent =
                        `Floor ${room.floor} · ${freeBeds} of ${room.capacity} beds free`;

                    const status = document.createElement('span');

                    status.className =
                        `room-status ${state.cls}`;

                    status.textContent = state.label;

                    card.append(
                        number,
                        info,
                        makeBedDots(room),
                        status
                    );

                    if (state.selectable) {
                        card.addEventListener('click', () => {
                            selectedRoom = room;

                            renderRooms(rooms);
                            updateGroupSummary();
                            updateConfirmButton();
                        });
                    }

                    el.roomGrid.appendChild(card);
                });
            });
    }


    async function loadRooms(noticeMessage) {
        selectedRoom = null;
        el.confirmRoomBtn.disabled = true;

        skeleton.show(
            el.roomGrid,
            { count: 6, type: 'cards' }
        );

        const {
            data: rooms,
            error
        } = await db.rpc('get_room_availability');

        skeleton.hide(el.roomGrid);
        el.roomGrid.replaceChildren();

        if (noticeMessage) {
            inlineNotice(noticeMessage, 'error');
        }

        if (pendingRoom) {
            inlineNotice(
                `You already requested Room ${pendingRoom}. Contact the front desk to resolve the existing request before creating a group.`,
                'info'
            );
        }

        if (assignedRoom) {
            inlineNotice(
                `You already have Room ${assignedRoom} assigned. Please use your dashboard or contact the front desk.`,
                'info'
            );
        }

        if (!myGender) {
            inlineNotice(
                'Your profile has no valid gender set. Please contact the front desk.',
                'error'
            );
        }

        if (error) {
            let message = 'Could not load rooms: ' + error.message;

            if (
                /function|schema cache|does not exist/i.test(error.message)
            ) {
                message +=
                    ' — check that get_room_availability() is installed in Supabase.';
            }

            inlineNotice(message, 'error');
            return;
        }

        if (!Array.isArray(rooms) || rooms.length === 0) {
            inlineNotice(
                'No rooms are currently available to display. Please contact the front desk.',
                'error'
            );

            return;
        }

        renderRooms(rooms);
        updateGroupSummary();
        updateConfirmButton();
    }


    /* ==========================================================
       EDGE FUNCTION CALLS
       ========================================================== */

    async function invokeEdge(action, payload = {}) {
        const {
            data,
            error
        } = await db.functions.invoke(EDGE_FUNCTION, {
            body: {
                action,
                ...payload
            }
        });

        if (error) {
            let serverMessage = '';

            try {
                if (
                    error.context &&
                    typeof error.context.clone === 'function'
                ) {
                    const response =
                        await error.context.clone().json();

                    serverMessage =
                        response?.error ||
                        response?.message ||
                        '';
                }
            } catch (_) {}

            throw new Error(
                serverMessage ||
                error.message ||
                'Could not contact the CMDI server.'
            );
        }

        if (!data) {
            throw new Error(
                'The CMDI server returned an empty response.'
            );
        }

        if (data.ok !== true) {
            throw new Error(edgeErrorMessage(data));
        }

        return data;
    }


    function edgeErrorMessage(data) {
        const code = String(data?.code || '');

        const messages = {
            invalid_credentials:
                'Your login session is invalid. Please sign in again.',

            invalid_invitation:
                'This invitation link is invalid. Ask the group leader for a new invitation.',

            group_unavailable:
                'This group booking is no longer available.',

            insufficient_beds:
                'There are not enough free beds for the entire group.',

            wrong_account:
                'This invitation belongs to another CMDI account.',

            email_mismatch:
                'The invited email does not match the signed-in CMDI account.',

            already_in_group:
                'One of the invited accounts already belongs to another active group.',

            already_has_room:
                'One of the invited accounts already has a room request or assignment.'
        };

        return messages[code] ||
            data?.error ||
            data?.message ||
            'The request could not be completed.';
    }


    /* ==========================================================
       INDIVIDUAL BOOKING
       ========================================================== */

    async function submitIndividualBooking() {
        if (!selectedRoom) {
            throw new Error('Please select a room first.');
        }

        el.confirmRoomBtn.disabled = true;
        el.confirmRoomBtn.textContent = 'Sending to staff...';

        const { error } = await db
            .from('profiles')
            .update({
                pending_room: String(selectedRoom.room_number)
            })
            .eq('id', session.user.id);

        if (error) throw error;

        window.location.assign('client-dashboard.html');
    }


    /* ==========================================================
       GROUP BOOKING CREATION
       ========================================================== */

    async function submitGroupBooking() {
        const validation = validateGroupInputs();

        if (!validation.ok) {
            el.groupInputError.textContent = validation.message;
            throw new Error(validation.message);
        }

        if (!canCreateGroup()) {
            throw new Error(
                'Your account already has a room request or assignment. Resolve it before creating a group.'
            );
        }

        el.confirmRoomBtn.disabled = true;

        el.confirmRoomBtn.textContent =
            'Creating group and sending invitations...';

        el.groupInputError.textContent = '';

        const result = await invokeEdge(
            'create_group_booking',
            {
                room_number: String(selectedRoom.room_number),
                invitee_emails: validation.emails
            }
        );

        if (!result.group_booking_id) {
            throw new Error(
                'The server did not return a group booking reference.'
            );
        }

        activeGroupId = result.group_booking_id;
        groupHoldExpiresAt = result.hold_expires_at || null;

        try {
            sessionStorage.setItem(
                ACTIVE_GROUP_KEY,
                activeGroupId
            );

            const url = new URL(window.location.href);

            url.searchParams.set(
                'group_booking_id',
                activeGroupId
            );

            window.history.replaceState(
                {},
                document.title,
                url.toString()
            );

        } catch (error) {
            console.warn(
                'Could not save active group reference:',
                error
            );
        }

        showGroupStatus(result);
        await refreshGroupStatus();
    }


    function showGroupStatus(createResult) {
        el.roomArea.classList.add('hidden');
        el.groupSetup.classList.add('hidden');
        el.footerActions.classList.add('hidden');

        el.individualModeBtn.disabled = true;
        el.groupModeBtn.disabled = true;

        el.groupStatusPanel.classList.remove('hidden');

        el.statusRoomNumber.textContent =
            createResult.room_number ||
            selectedRoom?.room_number ||
            '—';

        el.statusGroupSize.textContent =
            createResult.group_size
                ? `${createResult.group_size} members`
                : '—';

        el.groupCreatedMessage.textContent =
            createResult.code === 'group_created_email_failed'
                ? 'The group hold was created, but email delivery could not be confirmed. Review the manual invitation links below and share each link only with its intended CMDI member.'
                : `Your group was created. ${Number(createResult.invitations_sent || 0)} invitation email(s) were confirmed by the mail service.`;

        const manualInvitations =
            Array.isArray(createResult.invitations)
                ? createResult.invitations.filter(
                    item => item.invitation_link
                )
                : [];

        el.manualInvitationLinks.replaceChildren();

        manualInvitations.forEach(invitation => {
            const row = document.createElement('div');
            row.className = 'manual-link-row';

            const label = document.createElement('span');
            label.textContent =
                invitation.email || 'Invited CMDI member';

            const link = document.createElement('a');

            link.href = invitation.invitation_link;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Open invitation';

            row.append(label, link);

            el.manualInvitationLinks.appendChild(row);
        });

        el.manualLinksPanel.classList.toggle(
            'hidden',
            manualInvitations.length === 0
        );

        if (
            Array.isArray(createResult.invitations) &&
            createResult.invitations.length
        ) {
            el.groupMemberList.replaceChildren();

            createResult.invitations.forEach(invitation => {
                const row = document.createElement('div');
                row.className = 'member-row';

                const identity = document.createElement('div');
                identity.className = 'member-name';

                const email = document.createElement('strong');
                email.textContent =
                    invitation.email || 'Invited CMDI member';

                const note = document.createElement('small');

                note.textContent =
                    invitation.status === 'email_failed'
                        ? 'Email delivery not confirmed'
                        : 'Invitation email requested';

                identity.append(email, note);

                const state = document.createElement('span');
                state.className = 'member-state';

                state.textContent =
                    invitation.status === 'email_failed'
                        ? 'Check email'
                        : 'Pending';

                row.append(identity, state);

                el.groupMemberList.appendChild(row);
            });
        }

        startCountdown();
        stopRefreshOnly();

        groupRefreshTimer = setInterval(() => {
            refreshGroupStatus().catch(error => {
                console.error(
                    'Automatic group status refresh failed:',
                    error
                );
            });
        }, 15000);
    }


    function stopRefreshOnly() {
        if (groupRefreshTimer) {
            clearInterval(groupRefreshTimer);
        }

        groupRefreshTimer = null;
    }


    /* ==========================================================
       GROUP STATUS
       ========================================================== */

    async function refreshGroupStatus() {
        if (!activeGroupId || returningToRooms) return;

        const result = await invokeEdge(
            'get_group_booking',
            {
                group_booking_id: activeGroupId
            }
        );

        const status =
            String(result.status || '').toLowerCase();

        // CRITICAL FIX:
        // Never display a stale CANCELLED or EXPIRED panel.
        if (
            status === 'cancelled' ||
            status === 'expired'
        ) {
            await returnToRoomSelection(status);
            return;
        }

        renderGroupStatus(result);
    }


    function renderGroupStatus(result) {
        const status =
            String(result.status || 'inviting').toLowerCase();

        el.groupStatusBadge.textContent = status.toUpperCase();

        el.groupStatusBadge.className =
            'status-badge ' + status;

        el.statusRoomNumber.textContent =
            result.room_number || '—';

        el.statusGroupSize.textContent =
            result.group_size
                ? `${result.group_size} members`
                : '—';

        if (result.hold_expires_at) {
            groupHoldExpiresAt = result.hold_expires_at;
            startCountdown();
        }

        const members =
            Array.isArray(result.members)
                ? result.members
                : [];

        el.groupMemberList.replaceChildren();

        if (!members.length) {
            const empty = document.createElement('p');

            empty.className = 'muted-text';
            empty.textContent =
                'No member details were returned.';

            el.groupMemberList.appendChild(empty);

        } else {
            members.forEach(member => {
                const row = document.createElement('div');
                row.className = 'member-row';

                const identity = document.createElement('div');
                identity.className = 'member-name';

                const name = document.createElement('strong');

                name.textContent =
                    member.full_name ||
                    (
                        member.member_role === 'leader'
                            ? 'You (Group Leader)'
                            : 'CMDI Member'
                    );

                const email = document.createElement('small');

                email.textContent =
                    member.invited_email ||
                    (
                        member.member_role === 'leader'
                            ? 'Group leader'
                            : 'Invited member'
                    );

                identity.append(name, email);

                const state = document.createElement('span');

                state.className =
                    'member-state ' +
                    String(member.status || '').toLowerCase();

                state.textContent =
                    String(member.status || 'unknown')
                        .replaceAll('_', ' ');

                row.append(identity, state);

                el.groupMemberList.appendChild(row);
            });
        }

        const accepted =
            Number(result.accepted_members || 0);

        const pending =
            Number(result.pending_members || 0);

        const declined =
            Number(result.declined_members || 0);

        el.groupCreatedMessage.textContent =
            `${accepted} accepted · ${pending} pending · ${declined} declined. All members must accept before you can confirm.`;

        el.confirmGroupBtn.classList.toggle(
            'hidden',
            status !== 'ready'
        );

        el.confirmGroupBtn.disabled =
            status !== 'ready';

        el.cancelGroupBtn.classList.toggle(
            'hidden',
            !['inviting', 'ready'].includes(status)
        );

        const replacementNeeded =
            status === 'inviting' &&
            declined > 0 &&
            (accepted + pending) <
                Number(result.group_size || 0);

        el.replacementArea.classList.toggle(
            'hidden',
            !replacementNeeded
        );

        if (status === 'confirmed') {
            el.groupCreatedMessage.textContent =
                `Group booking confirmed for Room ${result.room_number || '—'}. The group members' room requests have been submitted to staff.`;

            el.cancelGroupBtn.classList.add('hidden');
            el.replacementArea.classList.add('hidden');
            el.confirmGroupBtn.classList.add('hidden');

            stopGroupTimers();
        }
    }


    /* ==========================================================
       30-MINUTE COUNTDOWN
       ========================================================== */

    function startCountdown() {
        if (countdownTimer) {
            clearInterval(countdownTimer);
        }

        const update = () => {
            if (!groupHoldExpiresAt) {
                el.statusCountdown.textContent =
                    'Not available';

                return;
            }

            const remaining =
                new Date(groupHoldExpiresAt).getTime() -
                Date.now();

            if (remaining <= 0) {
                el.statusCountdown.textContent = 'Expired';

                refreshGroupStatus().catch(error => {
                    console.error(
                        'Could not verify expired group status:',
                        error
                    );
                });

                if (countdownTimer) {
                    clearInterval(countdownTimer);
                }

                countdownTimer = null;
                return;
            }

            const totalSeconds =
                Math.floor(remaining / 1000);

            const minutes =
                Math.floor(totalSeconds / 60);

            const seconds =
                totalSeconds % 60;

            el.statusCountdown.textContent =
                `${minutes}:${String(seconds).padStart(2, '0')} remaining`;
        };

        update();

        countdownTimer = setInterval(update, 1000);
    }


    /* ==========================================================
       IMPORTANT FIX:
       RETURN TO ROOM SELECTION AFTER CANCEL / EXPIRATION
       ========================================================== */

    async function returnToRoomSelection(reason) {
        if (returningToRooms) return;

        returningToRooms = true;

        // 1. Stop old group timers.
        stopGroupTimers();

        // 2. Clear current group reference.
        activeGroupId = null;
        groupHoldExpiresAt = null;

        // 3. Remove saved group ID and URL parameter.
        clearSavedGroupReference();

        // 4. Hide group status panel.
        el.groupStatusPanel.classList.add('hidden');

        // 5. Restore room selection area.
        el.roomArea.classList.remove('hidden');
        el.footerActions.classList.remove('hidden');

        // 6. Clear group-only inputs and messages.
        el.inviteeEmails.value = '';
        el.groupInputError.textContent = '';

        el.replacementEmail.value = '';
        el.replacementMessage.textContent = '';

        el.statusMessage.textContent = '';

        el.manualLinksPanel.classList.add('hidden');

        el.manualInvitationLinks.replaceChildren();
        el.groupMemberList.replaceChildren();

        // 7. Return to Individual Booking mode.
        bookingMode = 'individual';

        el.individualModeBtn.classList.add('active');
        el.groupModeBtn.classList.remove('active');

        el.individualModeBtn.setAttribute(
            'aria-pressed',
            'true'
        );

        el.groupModeBtn.setAttribute(
            'aria-pressed',
            'false'
        );

        el.groupSetup.classList.add('hidden');

        try {
            // 8. Reload actual profile state.
            // Do not erase a separate individual request.
            const {
                data: profile,
                error
            } = await db
                .from('profiles')
                .select(
                    'gender, room, pending_room, assigned_room'
                )
                .eq('id', session.user.id)
                .single();

            if (error) throw error;

            myGender = normalizeGender(profile.gender);

            pendingRoom = profile.pending_room || null;

            assignedRoom = profile.assigned_room || null;

            syncModeAvailability();

            // 9. Reload room availability from Supabase.
            await loadRooms();

            // 10. Display the result.
            clearNotice();

            showNotice(
                reason === 'expired'
                    ? 'Your group booking expired. The temporary hold has been released. You can choose a room again.'
                    : 'Group booking cancelled successfully. The temporary hold has been released. You can choose a room again.',
                'success'
            );

        } catch (error) {
            console.error(
                'Could not restore room selection:',
                error
            );

            showNotice(
                'The group is no longer active, but room availability could not be refreshed. Reload this page. ' +
                (error.message || ''),
                'error'
            );

        } finally {
            returningToRooms = false;
            updateConfirmButton();
        }
    }


    /* ==========================================================
       CONFIRM GROUP BOOKING
       ========================================================== */

    async function confirmGroup() {
        if (!activeGroupId) return;

        el.confirmGroupBtn.disabled = true;
        el.confirmGroupBtn.textContent = 'Confirming...';

        el.statusMessage.textContent = '';

        try {
            const result = await invokeEdge(
                'confirm_group_booking',
                {
                    group_booking_id: activeGroupId
                }
            );

            el.groupCreatedMessage.textContent =
                `Group booking confirmed for Room ${result.room_number || el.statusRoomNumber.textContent}. ` +
                `${result.members_assigned || 0} member(s) submitted to staff.`;

            await refreshGroupStatus();

        } catch (error) {
            el.statusMessage.textContent =
                error.message ||
                'Could not confirm the group booking.';

        } finally {
            if (activeGroupId) {
                el.confirmGroupBtn.disabled = false;

                el.confirmGroupBtn.textContent =
                    'Confirm Group Booking';
            }
        }
    }


    /* ==========================================================
       CANCEL GROUP BOOKING
       ========================================================== */

    async function cancelGroup() {
        if (!activeGroupId) return;

        const confirmed = window.confirm(
            'Cancel this group booking? The temporary room hold will be released.'
        );

        if (!confirmed) return;

        el.cancelGroupBtn.disabled = true;
        el.cancelGroupBtn.textContent = 'Cancelling...';

        try {
            await invokeEdge(
                'cancel_group_booking',
                {
                    group_booking_id: activeGroupId
                }
            );

            // Follow-up lookup detects cancelled status.
            // It then clears the saved ID and restores room selection.
            await refreshGroupStatus();

        } catch (error) {
            el.statusMessage.textContent =
                error.message ||
                'Could not cancel the group booking.';

        } finally {
            if (activeGroupId) {
                el.cancelGroupBtn.disabled = false;

                el.cancelGroupBtn.textContent =
                    'Cancel Group Booking';
            }
        }
    }


    /* ==========================================================
       REPLACEMENT INVITATION
       ========================================================== */

    async function addReplacementInvitation() {
        const email =
            String(el.replacementEmail.value || '')
                .trim()
                .toLowerCase();

        el.replacementMessage.textContent = '';

        if (!EMAIL_RE.test(email)) {
            el.replacementMessage.textContent =
                'Enter a valid email address.';

            return;
        }

        if (!activeGroupId) {
            el.replacementMessage.textContent =
                'There is no active group booking.';

            return;
        }

        el.sendReplacementBtn.disabled = true;
        el.sendReplacementBtn.textContent = 'Sending...';

        try {
            const result = await invokeEdge(
                'add_group_invitation',
                {
                    group_booking_id: activeGroupId,
                    invitee_email: email
                }
            );

            el.replacementMessage.textContent =
                result.code === 'replacement_invitation_sent'
                    ? `Invitation email sent to ${email}.`
                    : `Invitation created for ${email}. Email delivery may need follow-up.`;

            el.replacementEmail.value = '';

            await refreshGroupStatus();

        } catch (error) {
            el.replacementMessage.textContent =
                error.message ||
                'Could not send the replacement invitation.';

        } finally {
            el.sendReplacementBtn.disabled = false;
            el.sendReplacementBtn.textContent = 'Send invite';
        }
    }


    /* ==========================================================
       INITIALIZATION
       ========================================================== */

    async function init() {
        try {
            if (!db) {
                throw new Error(
                    'Supabase is not connected. Check js/supabase-client.js and the browser console.'
                );
            }

            await loadSkeleton();

            const {
                data: sessionData,
                error: sessionError
            } = await db.auth.getSession();

            if (sessionError || !sessionData?.session) {
                window.location.replace('index.html');
                return;
            }

            session = sessionData.session;

            const {
                data: profile,
                error: profileError
            } = await db
                .from('profiles')
                .select(
                    'gender, room, pending_room, assigned_room'
                )
                .eq('id', session.user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            if (!profile) {
                throw new Error(
                    'Your CMDI profile could not be found. Contact the front desk.'
                );
            }

            // Already assigned clients should use their dashboard.
            if (profile.room || profile.assigned_room) {
                window.location.replace('client-dashboard.html');
                return;
            }

            myGender = normalizeGender(profile.gender);
            pendingRoom = profile.pending_room || null;
            assignedRoom = profile.assigned_room || null;

            syncModeAvailability();

            // Restore active group from URL or session storage.
            let savedGroupId =
                new URLSearchParams(window.location.search)
                    .get('group_booking_id');

            if (!savedGroupId) {
                try {
                    savedGroupId =
                        sessionStorage.getItem(ACTIVE_GROUP_KEY);
                } catch (_) {
                    savedGroupId = null;
                }
            }

            if (
                savedGroupId &&
                /^[0-9a-f-]{36}$/i.test(savedGroupId)
            ) {
                activeGroupId = savedGroupId;

                el.roomArea.classList.add('hidden');
                el.groupSetup.classList.add('hidden');
                el.footerActions.classList.add('hidden');

                el.individualModeBtn.disabled = true;
                el.groupModeBtn.disabled = true;

                el.groupStatusPanel.classList.remove('hidden');

                // If this group is cancelled or expired,
                // refreshGroupStatus automatically restores rooms.
                await refreshGroupStatus();

                if (activeGroupId && !groupRefreshTimer) {
                    groupRefreshTimer = setInterval(() => {
                        refreshGroupStatus().catch(error => {
                            console.error(
                                'Automatic group status refresh failed:',
                                error
                            );
                        });
                    }, 15000);
                }

                return;
            }

            if (savedGroupId) {
                clearSavedGroupReference();
            }

            await loadRooms();

        } catch (error) {
            console.error(
                'Choose Room initialization error:',
                error
            );

            el.roomGrid.replaceChildren();

            inlineNotice(
                error.message ||
                'Something went wrong while loading rooms.',
                'error'
            );
        }
    }


    /* ==========================================================
       EVENT LISTENERS
       ========================================================== */

    el.individualModeBtn.addEventListener(
        'click',
        () => setBookingMode('individual')
    );

    el.groupModeBtn.addEventListener(
        'click',
        () => setBookingMode('group')
    );

    el.inviteeEmails.addEventListener(
        'input',
        updateGroupSummary
    );


    el.confirmRoomBtn.addEventListener('click', async () => {
        clearNotice();

        try {
            if (bookingMode === 'group') {
                await submitGroupBooking();
            } else {
                await submitIndividualBooking();
            }

        } catch (error) {
            console.error(
                'Room booking submission error:',
                error
            );

            showNotice(
                error.message ||
                'The room request could not be submitted.',
                'error'
            );

        } finally {
            if (
                el.groupStatusPanel.classList.contains('hidden')
            ) {
                updateConfirmButton();
            }
        }
    });


    el.refreshGroupStatusBtn.addEventListener(
        'click',
        async () => {
            el.refreshGroupStatusBtn.disabled = true;
            el.refreshGroupStatusBtn.textContent = 'Refreshing...';

            try {
                await refreshGroupStatus();
                el.statusMessage.textContent = '';

            } catch (error) {
                el.statusMessage.textContent =
                    error.message ||
                    'Could not refresh group status.';

            } finally {
                if (el.refreshGroupStatusBtn.isConnected) {
                    el.refreshGroupStatusBtn.disabled = false;
                    el.refreshGroupStatusBtn.textContent = 'Refresh status';
                }
            }
        }
    );


    el.confirmGroupBtn.addEventListener(
        'click',
        confirmGroup
    );

    el.cancelGroupBtn.addEventListener(
        'click',
        cancelGroup
    );

    el.sendReplacementBtn.addEventListener(
        'click',
        addReplacementInvitation
    );

    window.addEventListener(
        'beforeunload',
        stopGroupTimers
    );


    /* ==========================================================
       START
       ========================================================== */

    init();

})();
