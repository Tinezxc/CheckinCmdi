document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Session
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
    if (sessionError || !session) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Fetch Profile Data
    const { data: p, error } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (error || !p) {
        console.error("Error fetching accommodation data:", error);
        return;
    }

    // 3. Update UI with Real Data
    const initials = (p.full_name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    // Sidebar
    document.querySelectorAll('[data-bind="initials"]').forEach(el => el.textContent = initials);
    document.querySelectorAll('[data-bind="name"]').forEach(el => el.textContent = p.full_name || 'Guest');
    document.querySelectorAll('[data-bind="regId"]').forEach(el => el.textContent = p.reg_id || 'Pending');

    // Page Header (Dorm Info)
    const roomNum = p.room || 'Unassigned';
    document.getElementById('dormTitle').textContent = roomNum !== 'Unassigned' ? `Dorm ${roomNum}` : 'No Room Assigned';
    document.getElementById('dormSub').textContent = p.room ? `Floor ${p.room.charAt(0)} · Shared dormitory` : 'Please contact front desk';

    // Stay Details
    document.getElementById('factCheckIn').textContent = p.check_in ? new Date(p.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    document.getElementById('factCheckOut').textContent = 'TBD'; // You can add check_out column later
    document.getElementById('factStatus').textContent = p.room ? 'Checked in' : 'Not checked in';
    
    // Dorm Details
    document.getElementById('dormFloor').textContent = p.room ? `Floor ${p.room.charAt(0)}` : '—';
    document.getElementById('dormCapacity').textContent = p.capacity || '5 Trainees'; // Will use database capacity soon

    // Status Pill
    const statusLabel = document.getElementById('statusLabel');
    if (p.room) {
        statusLabel.textContent = 'Checked in';
        statusLabel.className = 'status ok';
    } else {
        statusLabel.textContent = 'Not checked in';
        statusLabel.className = 'status warn';
    }
});