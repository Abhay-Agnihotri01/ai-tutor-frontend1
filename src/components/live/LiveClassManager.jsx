import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, Play, Edit, Trash2, Plus, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import LiveClassScheduler from './LiveClassScheduler';

const LiveClassManager = ({ courseId }) => {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduler, setShowScheduler] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  useEffect(() => {
    fetchLiveClasses();
  }, [courseId]);

  const fetchLiveClasses = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live-classes/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLiveClasses(data.liveClasses || []);
      }
    } catch (error) {
      console.error('Error fetching live classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const startClass = async (classId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live-classes/${classId}/start`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        toast.success('Live class started!');
        fetchLiveClasses();
      }
    } catch (error) {
      toast.error('Failed to start live class');
    }
  };

  const endClass = async (classId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live-classes/${classId}/end`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        toast.success('Live class ended');
        fetchLiveClasses();
      }
    } catch (error) {
      toast.error('Failed to end live class');
    }
  };

  const deleteClass = async (classId) => {
    if (!confirm('Are you sure you want to delete this live class?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live-classes/${classId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        toast.success('Live class deleted');
        fetchLiveClasses();
      }
    } catch (error) {
      toast.error('Failed to delete live class');
    }
  };

  const joinClass = (liveClass) => {
    const url = `/instructor/live-class/${liveClass.meetingId}`;
    window.open(url, '_blank');
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'text-red-500 bg-red-100 dark:bg-red-900';
      case 'scheduled': return 'text-blue-500 bg-blue-100 dark:bg-blue-900';
      case 'ended': return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 theme-bg-secondary rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold theme-text-primary flex items-center">
          <Video className="w-6 h-6 mr-2 text-red-500" />
          Live Classes Management
        </h3>
        <Button
          onClick={() => setShowScheduler(true)}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule New Class
        </Button>
      </div>

      {liveClasses.length === 0 ? (
        <div className="text-center py-12 theme-bg-secondary rounded-lg">
          <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium theme-text-primary mb-2">No Live Classes Yet</h4>
          <p className="theme-text-secondary mb-4">Schedule your first live class to engage with students in real-time</p>
          <Button onClick={() => setShowScheduler(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Live Class
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {liveClasses.map((liveClass) => {
            const { date, time } = formatDateTime(liveClass.scheduledAt);
            const isLive = liveClass.status === 'live';
            const isScheduled = liveClass.status === 'scheduled';
            const isEnded = liveClass.status === 'ended';
            const participantCount = liveClass.participants?.filter(p => p.isPresent).length || 0;

            return (
              <div key={liveClass.id} className="theme-card p-6 rounded-lg border theme-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium theme-text-primary">{liveClass.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(liveClass.status)}`}>
                        {isLive ? '🔴 LIVE' : liveClass.status.toUpperCase()}
                      </span>
                    </div>

                    {liveClass.description && (
                      <p className="text-sm theme-text-secondary mb-3">{liveClass.description}</p>
                    )}

                    <div className="flex items-center space-x-6 text-sm theme-text-muted">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {date}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {time} ({liveClass.duration}min)
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {participantCount}/{liveClass.maxParticipants}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {isScheduled && (
                      <>
                        <Button
                          onClick={() => startClass(liveClass.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                        <Button
                          onClick={() => setEditingClass(liveClass)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    {isLive && (
                      <>
                        <Button
                          onClick={() => joinClass(liveClass)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Join Live
                        </Button>
                        <Button
                          onClick={() => endClass(liveClass.id)}
                          variant="outline"
                          size="sm"
                        >
                          End Class
                        </Button>
                      </>
                    )}

                    {isEnded && liveClass.recordingUrl && (
                      <Button
                        onClick={() => window.open(liveClass.recordingUrl, '_blank')}
                        variant="outline"
                        size="sm"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Recording
                      </Button>
                    )}

                    <Button
                      onClick={() => deleteClass(liveClass.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Participants List */}
                {participantCount > 0 && (
                  <div className="mt-4 pt-4 border-t theme-border">
                    <h5 className="text-sm font-medium theme-text-primary mb-2">
                      Current Participants ({participantCount})
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {liveClass.participants
                        ?.filter(p => p.isPresent)
                        .slice(0, 5)
                        .map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center space-x-2 bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs"
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{participant.user?.firstName} {participant.user?.lastName}</span>
                          </div>
                        ))}
                      {participantCount > 5 && (
                        <span className="text-xs theme-text-muted">
                          +{participantCount - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule/Edit Modal */}
      <LiveClassScheduler
        isOpen={showScheduler || !!editingClass}
        onClose={() => {
          setShowScheduler(false);
          setEditingClass(null);
        }}
        courseId={courseId}
        editingClass={editingClass}
        onScheduled={() => {
          fetchLiveClasses();
          setShowScheduler(false);
          setEditingClass(null);
        }}
      />
    </div>
  );
};

export default LiveClassManager;