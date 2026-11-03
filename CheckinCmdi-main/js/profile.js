document.addEventListener('DOMContentLoaded', async () => {
    
    // ... keep your UI logic (sidebars, toasts, masks, etc.)

    async function loadProfile() {
        // Get current logged-in user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            window.location.href = 'index.html'; // Not logged in
            return;
        }

        // Fetch profile from database
        const { data: p, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !p) {
            console.error("Profile not found");
            return;
        }

        // --- HYDRATE THE UI ---
        // Update avatars
        const ini = initialsOf(p.full_name);
        ['mobileAvatar', 'chipAvatar', 'topAvatar', 'avatarLarge'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.textContent = ini || '—';
        });

        // Update sidebar
        document.getElementById('chipName').textContent = p.full_name || 'Guest';
        document.getElementById('chipRole').textContent = p.guest_id ? `Guest · ${p.guest_id}` : 'Guest';
        
        // Update header
        document.getElementById('profileTitle').textContent = p.full_name || 'Guest';

        // Update fields
        const setField = (name, value, isDate) => {
            const el = document.querySelector(`.field-value[data-name="${name}"]`);
            if (!el) return;
            const empty = value == null || value === '';
            el.textContent = empty ? '—' : (isDate ? formatLongDate(value) : value);
            el.classList.toggle('muted', empty);
        };

        setField('fullname', p.full_name);
        setField('email', user.email.replace('@haven.local', '')); // Demo trick
        setField('phone', p.phone);
        setField('institution', p.institution);
        setField('branch', p.branch);
        
        // Summary
        document.querySelector('[data-summary="institution"]').textContent = p.institution || '—';
        document.querySelector('[data-summary="branch"]').textContent = p.branch || '—';
        document.querySelector('[data-summary="room"]').textContent = p.room || '—';
        document.querySelector('[data-summary="checkIn"]').textContent = p.check_in ? formatDisplayDate(p.check_in) : '—';

        // QR Code
        const qrBtn = document.getElementById('qrBtn');
        if (qrBtn && p.guest_id) {
            qrBtn.hidden = false;
            qrBtn.dataset.guestId = p.guest_id;
            qrBtn.dataset.guestName = p.full_name || '';
        }

        // Populate edit forms
        const form = document.querySelector('form.edit-mode');
        if (form) {
            form.fullname.value = p.full_name || '';
            form.phone.value = p.phone || '';
            form.institution.value = p.institution || '';
            form.branch.value = p.branch || '';
        }

    }

    // Run it
    await loadProfile();

    // ... keep the rest of your UI code (edit mode, save, etc.)
});