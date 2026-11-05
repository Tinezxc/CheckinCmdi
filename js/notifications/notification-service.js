window.NotificationService = {
    // Kunin lahat ng notifications ng isang user
    async getNotifications(userId) {
        const { data, error } = await window.supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
        return data;
    },

    // Markahan ang isang notification bilang "read"
    async markAsRead(notificationId) {
        await window.supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
    },

    // Markahan lahat ng notifications bilang "read"
    async markAllAsRead(userId) {
        await window.supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId);
    }
};