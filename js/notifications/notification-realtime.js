window.NotificationRealtime = {
    channel: null,

    // Simulan makinig sa mga bagong notifications
    subscribe(userId, onNewNotification) {
        this.channel = window.supabaseClient
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('New notification arrived:', payload.new);
                    onNewNotification(payload.new);
                }
            )
            .subscribe();
    },

    // Isara ang connection kapag umalis sa page
    unsubscribe() {
        if (this.channel) {
            window.supabaseClient.removeChannel(this.channel);
            this.channel = null;
        }
    }
};