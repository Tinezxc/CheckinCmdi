(() => {
    'use strict';

    const FUNCTION_NAME = 'dynamic-responder';
    const TOKEN_PARAM = 'token';

    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        const db = window.supabaseClient;
        const token = new URLSearchParams(window.location.search).get(TOKEN_PARAM);

        const views = {
            loading: document.getElementById('loadingState'),
            login: document.getElementById('loginState'),
            error: document.getElementById('errorState'),
            invitation: document.getElementById('invitationState'),
            result: document.getElementById('resultState')
        };

        const acceptBtn = document.getElementById('acceptBtn');
        const declineBtn = document.getElementById('declineBtn');
        const actionMessage = document.getElementById('actionMessage');

        function showView(name) {
            Object.entries(views).forEach(([key, element]) => {
                if (element) element.classList.toggle('hidden', key !== name);
            });
        }

        function showError(title, message) {
            document.getElementById('errorTitle').textContent = title;
            document.getElementById('errorMessage').textContent = message;
            showView('error');
        }

        function showResult(title, message, success = true) {
            document.getElementById('resultTitle').textContent = title;
            document.getElementById('resultMessage').textContent = message;
            const icon = document.getElementById('resultIcon');
            icon.textContent = success ? '✓' : '!';
            icon.className = 'state-icon ' + (success ? 'success-icon' : 'error-icon');
            showView('result');
        }

        function setBusy(busy, activeButton) {
            acceptBtn.disabled = busy;
            declineBtn.disabled = busy;
            if (busy && activeButton) {
                activeButton.dataset.originalText = activeButton.textContent;
                activeButton.textContent = activeButton === acceptBtn ? 'Accepting...' : 'Declining...';
            } else {
                acceptBtn.textContent = 'Accept Invitation';
                declineBtn.textContent = 'Decline Invitation';
            }
        }

        async function invoke(action, body) {
            const { data, error } = await db.functions.invoke(FUNCTION_NAME, {
                body: { action, ...body }
            });
            if (error) {
                let detail = '';
                try {
                    const context = error.context;
                    if (context && typeof context.clone === 'function') {
                        const responseBody = await context.clone().json();
                        detail = responseBody?.error || responseBody?.message || '';
                    }
                } catch (_) {}
                throw new Error(detail || error.message || 'Could not contact the CMDI server.');
            }
            if (!data || data.ok !== true) {
                throw new Error(messageForCode(data?.code, data?.error));
            }
            return data;
        }

        if (!token || token.length < 20 || token.length > 200) {
            showError('Invalid invitation link', 'The invitation link is missing or invalid. Please open the complete link from your CMDI invitation email.');
            return;
        }

        if (!db) {
            showError('Connection unavailable', 'The CMDI authentication service could not be loaded. Refresh the page or contact the front desk.');
            return;
        }

        try {
            const { data: sessionData, error: sessionError } = await db.auth.getSession();
            if (sessionError) throw sessionError;

            if (!sessionData?.session) {
                sessionStorage.setItem('cmdi_pending_group_invitation', token);
                showView('login');
                return;
            }

            const invitation = await invoke('get_group_invitation', { token });

            document.getElementById('leaderName').textContent = invitation.leader_name || 'CMDI Member';
            document.getElementById('roomNumber').textContent = invitation.room_number || 'To be confirmed';
            document.getElementById('floorNumber').textContent = invitation.floor ? `Floor ${invitation.floor}` : '—';
            document.getElementById('groupSize').textContent = invitation.group_size ? `${invitation.group_size} members` : '—';
            document.getElementById('holdExpiry').textContent = formatDate(invitation.hold_expires_at);

            // Remove the one-time token from the visible URL after validation.
            // The token remains only in this page's memory for the accept/decline request.
            try {
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (_) {}

            showView('invitation');

            acceptBtn.addEventListener('click', () => respond('accept_group_invitation', token, acceptBtn));
            declineBtn.addEventListener('click', () => respond('decline_group_invitation', token, declineBtn));

        } catch (error) {
            console.error('Group invitation lookup failed:', error);
            showError('Invitation unavailable', messageForError(error));
        }

        async function respond(action, rawToken, activeButton) {
            actionMessage.textContent = '';
            setBusy(true, activeButton);

            try {
                const result = await invoke(action, { token: rawToken });

                if (action === 'accept_group_invitation') {
                    const allAccepted = result.group_status === 'ready';
                    showResult(
                        'Invitation accepted',
                        allAccepted
                            ? 'You accepted the invitation. All group members have accepted. The group leader can now confirm the reservation.'
                            : 'You accepted the invitation. Waiting for the remaining group members to respond.'
                    );
                } else {
                    showResult(
                        'Invitation declined',
                        'Your response has been recorded. The group leader may invite another CMDI member to fill the available slot.'
                    );
                }
            } catch (error) {
                console.error('Group invitation response failed:', error);
                actionMessage.textContent = messageForError(error);
                setBusy(false);
            }
        }
    }

    function formatDate(value) {
        if (!value) return 'Not available';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Not available';
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    }

    function messageForCode(code, fallback) {
        const messages = {
            invalid_invitation: 'This invitation link is invalid. Ask the group leader to send a new invitation.',
            wrong_account: 'This invitation belongs to another CMDI account. Sign out and log in using the invited email address, then reopen the email link.',
            email_mismatch: 'Your signed-in account does not match the email address invited by the group leader.',
            email_not_verified: 'Your CMDI email must be verified before you can accept this invitation.',
            expired: 'This invitation or its 30-minute room hold has expired. Ask the group leader to create a new group invitation.',
            pending: 'This invitation is still pending.',
            accepted: 'You have already accepted this invitation. The group leader can check the group status.',
            already_accepted: 'You have already accepted this invitation. The group leader can check the group status.',
            declined: 'This invitation has already been declined.',
            cancelled: 'This invitation has been cancelled.',
            group_unavailable: 'This group is no longer accepting invitations.',
            gender_mismatch: 'Your profile does not meet this room’s eligibility requirements. Please contact the front desk.',
            already_has_room: 'Your account already has a room request or assignment.',
            already_in_group: 'Your account already belongs to another active group booking.',
            account_unavailable: 'Your CMDI account is not eligible for this invitation.'
        };
        return messages[code] || fallback || 'The request could not be completed. Please try again or contact the front desk.';
    }

    function messageForError(error) {
        const text = String(error?.message || '');
        if (/wrong_account|invited account|another CMDI account/i.test(text)) {
            return 'This invitation belongs to another CMDI account. Sign in using the invited email address and reopen the invitation email.';
        }
        if (/expired/i.test(text)) {
            return 'This invitation has expired. Ask the group leader to send a new invitation.';
        }
        if (/login otp|verified login|session/i.test(text)) {
            return 'Your verified CMDI login session is required. Return to Login, complete the 6-digit Login OTP, then reopen the invitation email.';
        }
        return text || 'This invitation could not be loaded. Please try again.';
    }
})();
