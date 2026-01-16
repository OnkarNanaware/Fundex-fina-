import { useState } from 'react';
import API from '../services/api';
import './TestNotificationButton.css';

export default function TestNotificationButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const createTestNotification = async () => {
        setLoading(true);
        setMessage('');

        try {
            const response = await API.post('/test/test-notification');

            if (response.data.success) {
                setMessage('✅ Test notification created! Wait 30 seconds or refresh the page.');
                console.log('✅ Notification created:', response.data.notification);
            } else {
                setMessage('❌ Failed to create notification');
            }
        } catch (error) {
            console.error('Error creating test notification:', error);
            setMessage('❌ Error: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="test-notification-button-container">
            <button
                className="test-notification-button"
                onClick={createTestNotification}
                disabled={loading}
            >
                {loading ? '⏳ Creating...' : '🧪 Create Test Notification'}
            </button>
            {message && <div className="test-notification-message">{message}</div>}
        </div>
    );
}
