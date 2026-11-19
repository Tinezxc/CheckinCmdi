/* ==========================================================
   CMDI STAFF NOTIFICATIONS
   Uses the authenticated user's own notifications rows.
   No demo/localStorage notifications are generated.
   ========================================================== */
(() => {
    'use strict';

    const db = window.supabaseClient;
    const button = document.getElementById('notifBtn');
    const menu = document.getElementById('notifMenu');
    const list = menu?.querySelector('.notif-menu-list');
    const badge = button?.querySelector('.icon-badge');
    const markAllButton = menu?.querySelector('.notif-menu-header .link-muted');

    if (!db || !button || !menu || !list) return;

    let userId = null;
    let channel = null;
    let notifications = [];
    let loading = false;

    const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);

    function relativeTime(value) {
        const ms = Date.now() - new Date(value).getTime();
        if (!Number.isFinite(ms)) return '';
        const minutes = Math.max(0, Math.floor(ms / 60000));
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hr ago`;
        return `${Math.floor(hours / 24)} d ago`;
    }

    function render() {
        const unread = notifications.filter(item => !item.is_read).length;
        if (badge) {
            badge.textContent = unread > 9 ? '9+' : String(unread);
            badge.hidden = unread === 0;
        }
        button.setAttribute(
            'aria-label',
            unread ? `Notifications, ${unread} unread` : 'Notifications, none unread'
        );
        if (markAllButton) markAllButton.disabled = unread === 0;

        if (!notifications.length) {
            list.innerHTML = '<li class="notif-empty" style="justify-content:center;padding:28px 16px;color:var(--text-3);">No notifications yet</li>';
            return;
        }

        list.innerHTML = notifications.map(item => `
            <li class="${item.is_read ? '' : 'unread'}" data-notification-id="${esc(item.id)}" tabindex="0">
                <span class="notif-dot ${item.is_read ? 'empty' : ''}"></span>
                <div>
                    <p>${esc(item.title)}</p>
                    <p>${esc(item.message)}</p>
                    <span>${esc(relativeTime(item.created_at))}</span>
                </div>
            </li>
        `).join('');
    }

    async function loadNotifications() {
        if (!userId || loading) return;
        loading = true;
        try {
            const { data, error } = await db
                .from('notifications')
                .select('id,user_id,title,message,is_read,created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(30);

            if (error) throw error;
            notifications = Array.isArray(data) ? data : [];
            render();
        } catch (error) {
            console.error('Could not load staff notifications:', error);
            list.innerHTML = '<li class="notif-empty" style="justify-content:center;padding:28px 16px;color:var(--text-3);">Notifications could not be loaded</li>';
        } finally {
            loading = false;
        }
    }

    async function markRead(id) {
        if (!userId) return;
        const { error } = await db
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', userId);
        if (error) {
            console.error('Could not mark notification as read:', error);
            return;
        }
        const item = notifications.find(notification => String(notification.id) === String(id));
        if (item) item.is_read = true;
        render();
    }

    async function markAllRead() {
        if (!userId) return;
        const { error } = await db
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error) {
            console.error('Could not mark all notifications as read:', error);
            return;
        }
        notifications = notifications.map(item => ({ ...item, is_read: true }));
        render();
    }

    async function init() {
        if (window.RBAC?.ready) await window.RBAC.ready;
        if (window.RBAC?.realRole && !window.RBAC.realRole()) return;

        const { data: sessionData, error: sessionError } = await db.auth.getSession();
        if (sessionError || !sessionData?.session?.user) return;
        userId = sessionData.session.user.id;

        await loadNotifications();

        channel = db.channel(`cmdi-staff-notifications-${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, () => loadNotifications())
            .subscribe(status => {
                if (status === 'CHANNEL_ERROR') {
                    console.warn('Staff notification realtime channel reported an error.');
                }
            });

        button.addEventListener('click', event => {
            event.stopPropagation();
            menu.hidden = !menu.hidden;
            if (!menu.hidden) loadNotifications();
        });

        markAllButton?.addEventListener('click', event => {
            event.stopPropagation();
            markAllRead();
        });

        list.addEventListener('click', event => {
            const row = event.target.closest('[data-notification-id]');
            if (!row) return;
            markRead(row.dataset.notificationId);
        });

        list.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const row = event.target.closest('[data-notification-id]');
            if (!row) return;
            event.preventDefault();
            markRead(row.dataset.notificationId);
        });

        document.addEventListener('click', event => {
            if (!menu.hidden && !event.target.closest('.topbar-icon-wrap')) {
                menu.hidden = true;
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') menu.hidden = true;
        });

        window.addEventListener('beforeunload', () => {
            if (channel) db.removeChannel(channel);
        });

        // Fallback refresh if Realtime temporarily disconnects.
        setInterval(() => loadNotifications(), 60000);
    }

    init().catch(error => console.error('Notification initialization failed:', error));
})();
