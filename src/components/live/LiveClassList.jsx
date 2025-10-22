import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';

const LiveClassList = ({ courseId }) => {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } else if (response.status === 500) {
        // Table doesn't exist yet, silently handle
        setLiveClasses([]);
      }
    } catch (error) {
      // Silently handle errors for now
      setLiveClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const joinClass = (liveClass) => {
    const url = `/student/live-class/${liveClass.meetingId}`;
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
          <div key={i} className="h-24 theme-bg-secondary rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (liveClasses.length === 0) {
    return (
      <div className="text-center py-8 theme-text-muted">
        <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No live classes scheduled yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold theme-text-primary flex items-center">
        <Video className="w-5 h-5 mr-2 text-red-500" />
        Live Classes
      </h3>

      {liveClasses.map((liveClass) => {
        const { date, time } = formatDateTime(liveClass.scheduledAt);
        const isLive = liveClass.status === 'live';
        const canJoin = liveClass.status === 'live' || liveClass.status === 'scheduled';

        return (
          <div key={liveClass.id} className="theme-card p-4 rounded-lg border theme-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium theme-text-primary">{liveClass.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(liveClass.status)}`}>
                    {isLive ? '🔴 LIVE' : liveClass.status.toUpperCase()}
                  </span>
                </div>

                {liveClass.description && (
                  <p className="text-sm theme-text-secondary mb-3">{liveClass.description}</p>
                )}

                <div className="flex items-center space-x-4 text-sm theme-text-muted">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {date}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {time} ({liveClass.duration}min)
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {liveClass.participants?.filter(p => p.isPresent).length || 0}/{liveClass.maxParticipants}
                  </div>
                </div>
              </div>

              <div className="ml-4">
                {canJoin && (
                  <Button
                    onClick={() => joinClass(liveClass)}
                    size="sm"
                    className={isLive ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    {isLive ? 'Join Live' : 'Join Class'}
                  </Button>
                )}
                
                {liveClass.status === 'ended' && liveClass.recordingUrl && (
                  <Button
                    onClick={() => window.open(liveClass.recordingUrl, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Watch Recording
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LiveClassList;