import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, Check, Trash2, CheckCheck, Filter } from 'lucide-react';
import API from '../services/api';
import './NotificationsPage.css';

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await API.get('/notifications', {
                params: { limit: 100 }
            });

            if (response.data.success) {
                setNotifications(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await API.patch(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId ? { ...notif, isRead: true } : notif
                )
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await API.patch('/notifications/mark-all-read');
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true }))
            );
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await API.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const removeEmojis = (text) => {
        return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

        return date.toLocaleDateString();
    };

    const getFilteredNotifications = () => {
        if (filter === 'unread') return notifications.filter(n => !n.isRead);
        if (filter === 'read') return notifications.filter(n => n.isRead);
        return notifications;
    };

    const filteredNotifications = getFilteredNotifications();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="notifications-page">
            <div className="notifications-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                    Back
                </button>
                <h1>Notifications</h1>
                {unreadCount > 0 && (
                    <button className="mark-all-read-btn" onClick={markAllAsRead}>
                        <CheckCheck size={18} />
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="notifications-filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({notifications.length})
                </button>
                <button
                    className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    Unread ({unreadCount})
                </button>
                <button
                    className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                    onClick={() => setFilter('read')}
                >
                    Read ({notifications.length - unreadCount})
                </button>
            </div>

            <div className="notifications-list">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading notifications...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="empty-state">
                        <Bell size={64} />
                        <h3>No notifications</h3>
                        <p>
                            {filter === 'unread'
                                ? "You're all caught up!"
                                : filter === 'read'
                                    ? "No read notifications"
                                    : "We'll notify you when something new arrives"}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification._id}
                            className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                        >
                            <div className="notification-card-content">
                                <div className="notification-card-header">
                                    <h3>{removeEmojis(notification.title)}</h3>
                                    {!notification.isRead && <span className="unread-badge">New</span>}
                                </div>
                                <p className="notification-card-message">
                                    {removeEmojis(notification.message)}
                                </p>
                                <div className="notification-card-meta">
                                    <span className="notification-time">
                                        {formatTimeAgo(notification.createdAt)}
                                    </span>
                                    <span className="notification-type">
                                        {notification.type.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                            <div className="notification-card-actions">
                                {!notification.isRead && (
                                    <button
                                        className="action-btn mark-read"
                                        onClick={() => markAsRead(notification._id)}
                                        title="Mark as read"
                                    >
                                        <Check size={18} />
                                    </button>
                                )}
                                <button
                                    className="action-btn delete"
                                    onClick={() => deleteNotification(notification._id)}
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
