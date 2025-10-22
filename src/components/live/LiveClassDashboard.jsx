import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, Play, Bell, BellOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

const LiveClassDashboard = () => {
  const { user } = useAuth();
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(new Set());

  useEffect(() => {
    fetchLiveClasses();
    const interval = setInterval(fetchLiveClasses, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check for classes starting soon
    const checkUpcomingClasses = () => {
      const now = new Date();
      upcomingClasses.forEach(liveClass => {
        const classTime = new Date(liveClass.scheduledAt);
        const timeDiff = classTime.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeDiff / (1000 * 60));

        // Notify 5 minutes before class
        if (minutesUntil === 5 && !notifications.has(liveClass.id)) {
          toast(`Live class "${liveClass.title}" starts in 5 minutes!`, {
            icon: '🔔',
            duration: 10000
          });
          setNotifications(prev => new Set(prev).add(liveClass.id));
        }
      });
    };

    const interval = setInterval(checkUpcomingClasses, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [upcomingClasses, notifications]);

  const fetchLiveClasses = async () => {
    try {
      // Get all courses user is enrolled in or instructing
      const coursesResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/courses`, {
        headers: { 'Authorization': `Bearer ${localStorage.getToken('token')}` }
      });

      if (!coursesResponse.ok) return;

      const coursesData = await coursesResponse.json();
      const userCourses = coursesData.courses?.filter(course => 
        course.instructorId === user.id || course.isEnrolled
      ) || [];

      // Fetch live classes for all user courses
      const allClasses = [];
      for (const course of userCourses) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live-classes/course/${course.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });

          if (response.ok) {
            const data = await response.json();
            const classesWithCourse = (data.liveClasses || []).map(liveClass => ({
              ...liveClass,
              course: { id: course.id, title: course.title }
            }));
            allClasses.push(...classesWithCourse);
          }
        } catch (error) {
          console.error(`Error fetching classes for course ${course.id}:`, error);
        }
      }

      // Separate live and upcoming classes
      const now = new Date();
      const live = allClasses.filter(c => c.status === 'live');
      const upcoming = allClasses
        .filter(c => c.status === 'scheduled' && new Date(c.scheduledAt) > now)
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
        .slice(0, 5); // Show next 5 upcoming classes

      setLiveClasses(live);
      setUpcomingClasses(upcoming);
    } catch (error) {
      console.error('Error fetching live classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinClass = (liveClass) => {
    const isInstructor = liveClass.course && user?.id === liveClass.instructorId;
    const url = isInstructor 
      ? `/instructor/live-class/${liveClass.meetingId}`
      : `/student/live-class/${liveClass.meetingId}`;
    window.open(url, '_blank');
  };

  const formatTimeUntil = (scheduledAt) => {
    const now = new Date();
    const classTime = new Date(scheduledAt);
    const diff = classTime.getTime() - now.getTime();
    
    if (diff < 0) return 'Started';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Classes */}
      {liveClasses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold theme-text-primary mb-4 flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            Live Now ({liveClasses.length})
          </h3>
          <div className="space-y-3">
            {liveClasses.map((liveClass) => (
              <div key={liveClass.id} className="theme-card p-4 rounded-lg border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium theme-text-primary">{liveClass.title}</h4>
                    <p className="text-sm theme-text-secondary">{liveClass.course.title}</p>
                    <div className="flex items-center space-x-4 text-xs theme-text-muted mt-1">
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {liveClass.participants?.filter(p => p.isPresent).length || 0} participants
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {liveClass.duration}min
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => joinClass(liveClass)}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 animate-pulse"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Join Live
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Classes */}
      <div>
        <h3 className="text-lg font-semibold theme-text-primary mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-500" />
          Upcoming Classes
        </h3>
        
        {upcomingClasses.length === 0 ? (
          <div className="text-center py-8 theme-bg-secondary rounded-lg">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="theme-text-muted">No upcoming live classes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingClasses.map((liveClass) => {
              const { date, time } = formatDateTime(liveClass.scheduledAt);
              const timeUntil = formatTimeUntil(liveClass.scheduledAt);
              const isStartingSoon = new Date(liveClass.scheduledAt).getTime() - new Date().getTime() < 15 * 60 * 1000; // 15 minutes

              return (
                <div 
                  key={liveClass.id} 
                  className={`theme-card p-4 rounded-lg border-l-4 ${
                    isStartingSoon ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-blue-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium theme-text-primary">{liveClass.title}</h4>
                        {isStartingSoon && (
                          <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full animate-pulse">
                            Starting Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm theme-text-secondary mb-1">{liveClass.course.title}</p>
                      <div className="flex items-center space-x-4 text-xs theme-text-muted">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {date}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {time}
                        </span>
                        <span className="flex items-center font-medium">
                          Starts in {timeUntil}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isStartingSoon && (
                        <Button
                          onClick={() => joinClass(liveClass)}
                          size="sm"
                          variant="outline"
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Join
                        </Button>
                      )}
                      <button
                        onClick={() => {
                          if (notifications.has(liveClass.id)) {
                            setNotifications(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(liveClass.id);
                              return newSet;
                            });
                            toast.success('Notification disabled');
                          } else {
                            setNotifications(prev => new Set(prev).add(liveClass.id));
                            toast.success('You\'ll be notified 5 minutes before class');
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          notifications.has(liveClass.id)
                            ? 'text-blue-600 bg-blue-100 dark:bg-blue-900'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={notifications.has(liveClass.id) ? 'Disable notification' : 'Enable notification'}
                      >
                        {notifications.has(liveClass.id) ? (
                          <Bell className="w-4 h-4" />
                        ) : (
                          <BellOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveClassDashboard;