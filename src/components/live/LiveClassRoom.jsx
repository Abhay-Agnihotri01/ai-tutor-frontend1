import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Camera, CameraOff, Mic, MicOff, PhoneOff, Users, MessageCircle, 
  X, Monitor, MonitorOff, Send, Copy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LiveClassService from '../../services/LiveClassService';
import toast from 'react-hot-toast';

const LiveClassRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [liveClass, setLiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState(new Map());
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());
  const liveClassService = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    initializeLiveClass();
    return () => cleanup();
  }, [meetingId, user]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const initializeLiveClass = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live-classes/${meetingId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Live class not found');
      
      const data = await response.json();
      setLiveClass(data.liveClass);
      
      liveClassService.current = new LiveClassService();
      setupServiceCallbacks();
      
      await liveClassService.current.initialize();
      
      const userInfo = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role || 'student'
      };
      
      const stream = await liveClassService.current.joinRoom(meetingId, userInfo);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setConnected(true);
      toast.success('Connected to live class');
      
    } catch (error) {
      toast.error(error.message || 'Failed to join live class');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const setupServiceCallbacks = () => {
    const service = liveClassService.current;
    
    service.onParticipantJoined = (participantId, userInfo) => {
      setParticipants(prev => {
        const newMap = new Map(prev);
        newMap.set(participantId, userInfo);
        return newMap;
      });
      if (participantId !== user.id) {
        toast.success(`${userInfo.name} joined the class`);
      }
    };
    
    service.onParticipantLeft = (participantId) => {
      const participant = participants.get(participantId);
      setParticipants(prev => {
        const newMap = new Map(prev);
        newMap.delete(participantId);
        return newMap;
      });
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(participantId);
        return newMap;
      });
      
      if (participant) {
        toast(`${participant.name} left the class`, { icon: '👋' });
      }
    };
    
    service.onRemoteStream = (participantId, stream) => {
      setRemoteStreams(prev => new Map(prev.set(participantId, stream)));
      
      setTimeout(() => {
        const videoElement = remoteVideoRefs.current.get(participantId);
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }, 100);
    };
    
    service.onChatMessage = (message) => {
      setChatMessages(prev => {
        // Check for exact duplicates by ID only
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
      
      if (!showChat && message.userId !== user.id) {
        setUnreadCount(prev => prev + 1);
      }
    };
    
    service.onConnectionStateChange = (state) => {
      setConnected(state === 'connected');
    };
    
    service.onError = (error) => {
      toast.error(error);
    };
  };

  const cleanup = () => {
    if (liveClassService.current) {
      liveClassService.current.leaveRoom();
    }
  };

  const toggleCamera = () => {
    if (liveClassService.current) {
      const newState = liveClassService.current.toggleCamera();
      setIsCameraOn(newState);
    }
  };

  const toggleMic = () => {
    if (liveClassService.current) {
      const newState = liveClassService.current.toggleMic();
      setIsMicOn(newState);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !liveClassService.current) return;
    
    liveClassService.current.sendChatMessage(newMessage);
    setNewMessage('');
  };

  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setUnreadCount(0);
    }
  };

  const leaveClass = () => {
    cleanup();
    navigate('/dashboard');
  };

  const copyMeetingLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    toast.success('Meeting link copied to clipboard');
  };

  const getGridClass = () => {
    const totalParticipants = participants.size;
    
    if (totalParticipants === 1) return 'grid-cols-1';
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-2';
    if (totalParticipants <= 6) return 'grid-cols-2 md:grid-cols-3';
    if (totalParticipants <= 9) return 'grid-cols-3';
    return 'grid-cols-3 md:grid-cols-4';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Joining live class...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold">{liveClass?.title}</h1>
            <p className="text-sm text-gray-400">
              {participants.size} participant{participants.size !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className={`flex items-center space-x-1 text-sm px-2 py-1 rounded ${
            connected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={copyMeetingLink}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Copy meeting link"
          >
            <Copy size={18} />
          </button>
          
          <button
            onClick={toggleChat}
            className="relative p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            title="Toggle chat"
          >
            <MessageCircle size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className={`flex-1 p-4 ${showChat ? 'pr-0' : ''}`}>
          <div className={`grid gap-3 h-full ${getGridClass()}`}>


            {/* All Participants */}
            {Array.from(participants.entries()).map(([participantId, participant]) => {
              const isCurrentUser = participantId === user.id;
              return (
                <div key={participantId} className="relative bg-gray-800 rounded-lg overflow-hidden group">
                  <video
                    ref={el => {
                      if (el) {
                        if (isCurrentUser) {
                          // Use local stream for current user
                          if (localStream) {
                            el.srcObject = localStream;
                          }
                        } else {
                          // Use remote stream for other participants
                          remoteVideoRefs.current.set(participantId, el);
                          const stream = remoteStreams.get(participantId);
                          if (stream) {
                            el.srcObject = stream;
                          }
                        }
                      }
                    }}
                    autoPlay
                    muted={isCurrentUser}
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {(!participant.isCameraOn || (isCurrentUser && !isCameraOn)) && (
                    <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Users size={32} className="text-gray-400" />
                        </div>
                        <p className="text-sm font-medium">{isCurrentUser ? 'You' : participant.name}</p>
                        <p className="text-xs text-gray-400">Camera off</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-sm">
                    {isCurrentUser ? 'You' : participant.name}
                    {participant.role === 'instructor' && (
                      <span className="ml-1 text-xs bg-green-600 px-1 rounded">Instructor</span>
                    )}
                  </div>
                  
                  {(!participant.isMicOn || (isCurrentUser && !isMicOn)) && (
                    <div className="absolute top-2 left-2 bg-red-600 p-1 rounded">
                      <MicOff size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold">Chat ({chatMessages.length})</h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((msg, index) => (
                    <div key={`${msg.id}-${index}`} className={`${msg.userId === user.id ? 'text-right' : ''}`}>
                      <div className={`inline-block max-w-xs px-3 py-2 rounded-lg ${
                        msg.userId === user.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-100'
                      }`}>
                        {msg.userId !== user.id && (
                          <div className="font-medium text-blue-400 mb-1 text-sm">
                            {msg.userName}
                            {msg.userRole === 'instructor' && (
                              <span className="ml-1 text-xs bg-green-600 px-1 rounded">Instructor</span>
                            )}
                          </div>
                        )}
                        <div className="text-sm">{msg.message}</div>
                        <div className={`text-xs mt-1 ${
                          msg.userId === user.id ? 'text-blue-200' : 'text-gray-400'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  disabled={!connected}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !connected}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full transition-colors ${
              isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          
          <button
            onClick={toggleCamera}
            className={`p-3 rounded-full transition-colors ${
              isCameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
          </button>
          
          <button
            onClick={leaveClass}
            className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            title="Leave class"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveClassRoom;