import React, { useState, useEffect } from 'react';
import { Send, Users, History, BarChart3, Mail, MessageSquare, Calendar, Video, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const NotificationCenter = ({ courseId, courseName }) => {
  const [activeTab, setActiveTab] = useState('send');
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Send message form
  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (courseId) {
      fetchStudents();
      fetchHistory();
      fetchAnalytics();
    }
  }, [courseId]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/students/${courseId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/history?courseId=${courseId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/analytics?courseId=${courseId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageForm.subject.trim() || !messageForm.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          courseId,
          subject: messageForm.subject,
          message: messageForm.message
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setMessageForm({ subject: '', message: '' });
        fetchHistory();
        fetchAnalytics();
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_video': return <Video size={16} className="text-blue-500" />;
      case 'live_class': return <Calendar size={16} className="text-green-500" />;
      case 'new_assignment': return <FileText size={16} className="text-orange-500" />;
      case 'custom_message': return <MessageSquare size={16} className="text-purple-500" />;
      default: return <Mail size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notification Center</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Send messages and updates to {students.length} enrolled students in "{courseName}"
          </p>
        </div>
        
        <div className="flex space-x-0">
          {[
            { id: 'send', label: 'Send Message', icon: Send },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'history', label: 'History', icon: History },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Send Message Tab */}
        {activeTab === 'send' && (
          <form onSubmit={sendMessage} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={messageForm.subject}
                onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter message subject..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={messageForm.message}
                onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message to students..."
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                This message will be sent to {students.length} enrolled students
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                <span>{loading ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Enrolled Students ({students.length})</h3>
            </div>
            <div className="space-y-3">
              {students.map(student => (
                <div key={student.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {student.firstName?.[0]}{student.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{student.email}</p>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No students enrolled in this course yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notification History</h3>
            </div>
            <div className="space-y-3">
              {history.map(notification => (
                <div key={notification.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{notification.subject}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Sent {new Date(notification.sentAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No notifications sent yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Total Sent</h4>
                <p className="text-2xl font-bold text-blue-600">{analytics.totalSent}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">This Month</h4>
                <p className="text-2xl font-bold text-green-600">
                  {Object.values(analytics.byDay).reduce((a, b) => a + b, 0)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900">Students Reached</h4>
                <p className="text-2xl font-bold text-purple-600">{students.length}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Notifications by Type</h4>
              <div className="space-y-2">
                {Object.entries(analytics.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center space-x-2">
                      {getNotificationIcon(type)}
                      <span className="capitalize text-gray-900 dark:text-white">{type.replace('_', ' ')}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;