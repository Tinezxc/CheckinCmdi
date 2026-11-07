/* ==========================================================
   HAVEN — Choose Room (floors, occupancy, gender rule)
   Works as a normal <script> OR type="module" — no top-level import,
   and any failure is shown on the page instead of staying on "Loading...".
   ========================================================== */
(function () {
    const db = window.supabaseClient;
    const roomGrid = document.getElementById('roomGrid');
    const confirmBtn = document.getElementById('confirmRoomBtn');

    let session = null;
    let myGender = null;      // 'male' | 'female' | null
    let selectedRoom = null;

    const GENDER_LABEL = { male: 'Men', female: 'Women' };

    // Optional skeleton loader — if the file can't be found we just skip it
    let skeleton = { show() {}, hide() {} };
    async function loadSkeleton() {
        try {
            const mod = await import('./utils/skeletonloading.js');
            skeleton = { show: mod.showSkeleton, hide: mod.hideSkeleton };
        } catch (e) {
            console.warn('Skeleton loader not available, continuing without it.', e);
        }
    }

    function normalizeGender(value) {
        const v = String(value || '').trim().toLowerCase();
        if (['male', 'm', 'man'].includes(v)) return 'male';
        if (['female', 'f', 'woman'].includes(v)) return 'female';
        return null;
    }

    function renderNotice(message) {
        const div = document.createElement('div');
        div.className = 'notice notice-error';
        div.textContent = message;
        roomGrid.appendChild(div);
    }

    // What a room looks like for THIS user
    function getRoomState(room) {
        const taken = room.occupants;
        const roomGender = room.room_gender; // gender of whoever is already inside (null if empty)

        if (taken >= room.capacity) {
            return { label: 'Full', cls: 'status-full', selectable: false };
        }
        if (!myGender) {
            return { label: 'Set gender first', cls: 'status-full', selectable: false };
        }
        if (taken > 0 && roomGender && roomGender !== myGender) {
            return {
                label: `${GENDER_LABEL[roomGender]} only`,
                cls: roomGender === 'male' ? 'status-men' : 'status-women',
                selectable: false
            };
        }
        if (taken > 0 && roomGender) {
            return {
                label: `Available · ${GENDER_LABEL[roomGender]} only`,
                cls: roomGender === 'male' ? 'status-men' : 'status-women',
                selectable: true
            };
        }
        return { label: 'Available', cls: 'status-available', selectable: true };
    }

    function bedDots(room) {
        let html = '';
        for (let i = 0; i < room.capacity; i++) {
            html += `<span class="bed-dot${i < room.occupants ? ' taken' : ''}"></span>`;
        }
        return `<div class="room-beds">${html}</div>`;
    }

    function renderRooms(rooms) {
        const floors = {};
        rooms.forEach(r => { (floors[r.floor] = floors[r.floor] || []).push(r); });

        Object.keys(floors).sort((a, b) => a - b).forEach(floor => {
            const list = floors[floor];
            const open = list.filter(r => getRoomState(r).selectable).length;

            const heading = document.createElement('div');
            heading.className = 'floor-heading';
            heading.innerHTML = `<span>Floor ${floor}</span><small>${open} of ${list.length} rooms open to you</small>`;
            roomGrid.appendChild(heading);

            list.forEach(room => {
                const state = getRoomState(room);
                const free = room.capacity - room.occupants;

                const card = document.createElement('div');
                card.className = 'room-card' + (state.selectable ? '' : ' unavailable');
                card.innerHTML = `
                    <div class="room-number">${room.room_number}</div>
                    <div class="room-info">Floor ${room.floor} · ${free} of ${room.capacity} beds free</div>
                    ${bedDots(room)}
                    <div class="room-status ${state.cls}">${state.label}</div>
                `;

                if (state.selectable) {
                    card.addEventListener('click', () => {
                        document.querySelectorAll('.room-card').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        selectedRoom = room;
                        confirmBtn.disabled = false;
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
        roomGrid.innerHTML = '';

        if (noticeMessage) renderNotice(noticeMessage);

        if (!myGender) {
            renderNotice('Your profile has no gender set, so a room can\'t be assigned yet. Please contact the front desk.');
        }

        if (error) {
            let msg = 'Could not load rooms: ' + error.message;
            if (/function|schema cache|does not exist/i.test(error.message)) {
                msg += ' — run room-occupancy.sql in the Supabase SQL Editor first.';
            }
            renderNotice(msg);
            return;
        }
        if (!rooms || rooms.length === 0) {
            renderNotice('No rooms to show. Check that the rooms table has rows with status "vacant-clean".');
            return;
        }
        renderRooms(rooms);
    }

    async function init() {
        try {
            if (!db) {
                throw new Error('Supabase is not connected. Open the browser Console (F12) and check that js/supabase-client.js loads without errors.');
            }
            await loadSkeleton();

            const { data: { session: s }, error: sessionError } = await db.auth.getSession();
            if (sessionError || !s) { window.location.href = 'index.html'; return; }
            session = s;

            const { data: profile } = await db
                .from('profiles')
                .select('gender')
                .eq('id', session.user.id)
                .single();
            myGender = normalizeGender(profile && profile.gender);

            await loadRooms();
        } catch (err) {
            console.error('Choose room error:', err);
            roomGrid.innerHTML = '';
            renderNotice(err.message || 'Something went wrong while loading rooms.');
        }
    }

    confirmBtn.addEventListener('click', async () => {
        if (!selectedRoom) return;

        confirmBtn.textContent = 'Sending to staff...';
        confirmBtn.disabled = true;

        // The database trigger re-checks capacity + gender, so this can't be bypassed from the browser
        const { error } = await db
            .from('profiles')
            .update({ pending_room: selectedRoom.room_number })
            .eq('id', session.user.id);

        if (error) {
            confirmBtn.textContent = 'Confirm Selection';
            await loadRooms(error.message); // refresh: someone may have just taken the last bed
        } else {
            window.location.href = 'client-dashboard.html';
        }
    });

    init();
})();