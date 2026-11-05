window.AuthGuard = {
    async requireAuth(allowedRoles = ['client', 'staff', 'admin']) {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error || !session) {
            window.location.href = 'index.html';
            return null;
        }

        const { data: profile } = await window.supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        const userRole = (profile?.role || 'client').toLowerCase();

        if (!allowedRoles.includes(userRole)) {
            alert("Access Denied: You do not have permission to view this page.");
            if (userRole === 'admin') window.location.href = 'admin-dashboard.html';
            else if (userRole === 'staff') window.location.href = 'staff-dashboard.html';
            else window.location.href = 'client-dashboard.html';
            return null;
        }

        return session;
    }
};