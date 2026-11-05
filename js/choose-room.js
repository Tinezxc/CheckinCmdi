document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
    if (sessionError || !session) { window.location.href = 'index.html'; return; }

    let selectedRoom = null;
    const roomGrid = document.getElementById('roomGrid');
    const confirmBtn = document.getElementById('confirmRoomBtn');

    const { data: rooms } = await window.supabaseClient
        .from('rooms')
        .select('*')
        .eq('status', 'vacant-clean');

    if (rooms && rooms.length > 0) {
        roomGrid.innerHTML = '';
        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';
            card.innerHTML = `
                <div class="room-number">${room.room_number}</div>
                <div class="room-info">Floor ${room.floor} · Max ${room.capacity} guests</div>
                <div class="room-status status-available">Available</div>
            `;
            card.addEventListener('click', () => {
                document.querySelectorAll('.room-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedRoom = room;
                confirmBtn.disabled = false;
            });
            roomGrid.appendChild(card);
        });
    }

    confirmBtn.addEventListener('click', async () => {
        if (!selectedRoom) return;
        
        confirmBtn.textContent = 'Sending to staff...';
        confirmBtn.disabled = true;

        // I-save bilang pending_room
        const { error } = await window.supabaseClient
            .from('profiles')
            .update({ pending_room: selectedRoom.room_number })
            .eq('id', session.user.id);

        if (error) {
            alert("Error: " + error.message);
            confirmBtn.textContent = 'Confirm Selection';
            confirmBtn.disabled = false;
        } else {
            // BALIK SA DASHBOARD (Kung saan makikita ang 25% progress)
            window.location.href = 'client-dashboard.html';
        }
    });
});