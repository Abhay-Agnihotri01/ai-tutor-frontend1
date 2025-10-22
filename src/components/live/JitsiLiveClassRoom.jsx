import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Clock, Video, VideoOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import JitsiService from '../../services/JitsiService';
import toast from 'react-hot-toast';

const JitsiLiveClassRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liveClass, setLiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const jitsiService = useRef(null);
  const jitsiContainer = useRef(null);

  useEffect(() => {
    fetchLiveClass();
    return () => cleanup();
  }, [meetingId]);

  const fetchLiveClass = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/live-classes/${meetingId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Live class not found');
      
      const data = await response.json();
      setLiveClass(data.liveClass);
      
      await initializeJitsi(data.liveClass);
      
    } catch (error) {
      toast.error(error.message || 'Failed to load live class');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const initializeJitsi = async (classData) => {
    try {
      jitsiService.current = new JitsiService();
      
      const userInfo = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role
      };

      const options = {
        parentNode: jitsiContainer.current,
        startWithAudioMuted: false,
        startWithVideoMuted: true // Start with video muted to avoid camera conflicts
      };

      await jitsiService.current.initializeMeeting(meetingId, userInfo, options);
      
      // Auto-start recording for instructors
      if (user.role === 'instructor' && classData.isRecorded) {
        setTimeout(() => {
          startRecording();
        }, 3000);
      }
      
      toast.success('Connected to live class');
      
      // Show camera permission tip
      setTimeout(() => {
        toast('Click the camera button to enable video', {
          icon: '📹',
          duration: 3000
        });
      }, 2000);
      
    } catch (error) {
      toast.error('Failed to initialize video conference');
    }
  };

  const startRecording = async () => {
    if (jitsiService.current && user.role === 'instructor') {
      try {
        await jitsiService.current.startRecording();
        setIsRecording(true);
        toast.success('Recording started');
      } catch (error) {
        toast.error('Failed to start recording');
      }
    }
  };

  const stopRecording = async () => {
    if (jitsiService.current && user.role === 'instructor') {
      try {
        await jitsiService.current.stopRecording();
        setIsRecording(false);
        toast.success('Recording stopped');
      } catch (error) {
        toast.error('Failed to stop recording');
      }
    }
  };

  const cleanup = () => {
    if (jitsiService.current) {
      jitsiService.current.dispose();
    }
  };

  const handleLeave = () => {
    cleanup();
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading live class...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLeave}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Leave class"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h1 className="text-lg font-semibold">{liveClass?.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>{new Date(liveClass?.scheduledAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock size={14} />
                <span>{liveClass?.duration} minutes</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users size={14} />
                <span>{liveClass?.participants?.length || 0} participants</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructor Controls */}
        {user.role === 'instructor' && liveClass?.isRecorded && (
          <div className="flex items-center space-x-2">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <VideoOff size={16} />
                <span>Stop Recording</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Video size={16} />
                <span>Start Recording</span>
              </button>
            )}
            
            {isRecording && (
              <div className="flex items-center space-x-1 text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Recording</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Jitsi Meet Container */}
      <div className="flex-1 relative">
        <div 
          ref={jitsiContainer}
          id="jitsi-container"
          className="w-full h-full"
        />
      </div>

      {/* Class Info Footer */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div>
            Meeting ID: <span className="font-mono text-white">{meetingId}</span>
          </div>
          <div>
            {liveClass?.description && (
              <span>{liveClass.description}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JitsiLiveClassRoom;