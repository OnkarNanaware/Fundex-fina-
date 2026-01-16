import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Trash2, CheckCheck } from 'lucide-react';
import API from '../services/api';
import './NotificationDropdown.css';

export default function NotificationDropdown({ darkMode }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Remove emojis from text
    const removeEmojis = (text) => {
        return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
    };

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            console.log('🔔 Fetching notifications...');
            console.log('🔑 Token:', localStorage.getItem('token') ? 'Present' : 'Missing');

            const response = await API.get('/notifications', {
                params: { limit: 20 }
            });

            console.log('📥 Notifications API Response:', response.data);
            console.log('📊 Notifications count:', response.data.data?.length || 0);

            if (response.data.success) {
                setNotifications(response.data.data);
                setUnreadCount(response.data.unreadCount);
                console.log('✅ Notifications loaded successfully:', response.data.data.length);
            } else {
                console.warn('⚠️ API returned success: false');
            }
        } catch (error) {
            console.error('❌ Failed to fetch notifications:', error);
            console.error('Error details:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            console.log('🔔 Fetching unread count...');
            const response = await API.get('/notifications/unread-count');
            console.log('📥 Unread count response:', response.data);

            if (response.data.success) {
                setUnreadCount(response.data.count);
                console.log('✅ Unread count:', response.data.count);
            }
        } catch (error) {
            console.error('❌ Failed to fetch unread count:', error);
            console.error('Error details:', error.response?.data || error.message);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await API.patch(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId ? { ...notif, isRead: true } : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await API.patch('/notifications/mark-all-read');
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        try {
            await API.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
            fetchUnreadCount();
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    // Toggle dropdown
    const toggleDropdown = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Fetch unread count on mount and periodically
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Get notification icon based on type
    const getNotificationIcon = (type) => {
        const iconMap = {
            donation_thank_you: '🙏',
            task_added: '📋',
            expense_submitted: '💰',
            new_donation: '💵',
            fund_request_received: '💼',
            task_added_admin: '📋',
            expense_submitted_admin: '💰',
            fund_request_approved: '✅',
            fund_request_rejected: '❌',
            expense_approved: '✅',
            expense_rejected: '❌',
            volunteer_approved: '🎉',
            volunteer_rejected: '📝',
            campaign_created: '🚀',
            campaign_updated: '🔄'
        };
        return iconMap[type] || '🔔';
    };

    // Format time ago
    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="notification-dropdown-container" ref={dropdownRef}>
            <button
                className={`notification-bell-btn ${darkMode ? 'dark' : 'light'}`}
                onClick={toggleDropdown}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className={`notification-dropdown ${darkMode ? 'dark' : 'light'}`}>
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {notifications.length > 0 && unreadCount > 0 && (
                            <button
                                className="mark-all-read-btn"
                                onClick={markAllAsRead}
                                title="Mark all as read"
                            >
                                <CheckCheck size={16} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {loading ? (
                            <div className="notification-loading">
                                <div className="spinner"></div>
                                <p>Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">
                                <Bell size={48} />
                                <p>No notifications yet</p>
                                <span>We'll notify you when something new arrives</span>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                    onClick={() => !notification.isRead && markAsRead(notification._id)}
                                >
                                    <div className="notification-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    <div className="notification-content">
                                        <div className="notification-title">
                                            {removeEmojis(notification.title)}
                                            {!notification.isRead && <span className="unread-dot"></span>}
                                        </div>
                                        <div className="notification-message">
                                            {removeEmojis(notification.message)}
                                        </div>
                                        <div className="notification-time">
                                            {formatTimeAgo(notification.createdAt)}
                                        </div>
                                    </div>

                                    <div className="notification-actions">
                                        {!notification.isRead && (
                                            <button
                                                className="notification-action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification._id);
                                                }}
                                                title="Mark as read"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                        <button
                                            className="notification-action-btn delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification._id);
                                            }}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <button
                                className="view-all-btn"
                                onClick={() => {
                                    navigate('/notifications');
                                    setIsOpen(false);
                                }}
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
