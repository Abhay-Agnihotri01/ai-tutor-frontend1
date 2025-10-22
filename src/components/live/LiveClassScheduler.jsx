import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';

const LiveClassScheduler = ({ isOpen, onClose, courseId, chapterId, editingClass, onScheduled }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    maxParticipants: 100,
    isRecorded: false
  });
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingClass) {
      const scheduledDate = new Date(editingClass.scheduledAt);
      const localDateTime = new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
      
      setFormData({
        title: editingClass.title || '',
        description: editingClass.description || '',
        scheduledAt: localDateTime,
        duration: editingClass.duration || 60,
        maxParticipants: editingClass.maxParticipants || 100,
        isRecorded: editingClass.isRecorded || false
      });
    } else {
      setFormData({
        title: '',
        description: '',
        scheduledAt: '',
        duration: 60,
        maxParticipants: 100,
        isRecorded: false
      });
    }
  }, [editingClass]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter class title');
      return;
    }

    if (!formData.scheduledAt) {
      toast.error('Please select date and time');
      return;
    }

    const scheduledDate = new Date(formData.scheduledAt);
    if (scheduledDate <= new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    setLoading(true);

    try {
      const url = editingClass 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live-classes/${editingClass.id}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live-classes`;
      
      const method = editingClass ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          courseId,
          chapterId
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(editingClass ? 'Live class updated successfully!' : 'Live class scheduled successfully!');
        onScheduled?.(data.liveClass);
        onClose();
      } else {
        throw new Error(editingClass ? 'Failed to update live class' : 'Failed to schedule live class');
      }
    } catch (error) {
      toast.error(editingClass ? 'Failed to update live class' : 'Failed to schedule live class');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="theme-card p-6 rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold theme-text-primary flex items-center">
            <Video className="w-5 h-5 mr-2 text-red-500" />
            {editingClass ? 'Edit Live Class' : 'Schedule Live Class'}
          </h3>
          <button
            onClick={onClose}
            className="theme-text-muted hover:theme-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium theme-text-primary mb-2">
              Class Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter class title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium theme-text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="What will you cover in this live class?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium theme-text-primary mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
              className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Duration (minutes)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Max Participants
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 theme-bg-secondary theme-text-primary border theme-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min={1}
                max={500}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecorded"
              checked={formData.isRecorded}
              onChange={(e) => setFormData(prev => ({ ...prev, isRecorded: e.target.checked }))}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isRecorded" className="ml-2 text-sm theme-text-primary">
              Record this live class for later viewing
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading 
                ? (editingClass ? 'Updating...' : 'Scheduling...') 
                : (editingClass ? 'Update Class' : 'Schedule Class')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LiveClassScheduler;