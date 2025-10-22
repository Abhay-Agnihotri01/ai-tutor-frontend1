class WebRTCService {
  constructor() {
    this.socket = null;
    this.localStream = null;
    this.screenStream = null;
    this.peers = new Map();
    this.userId = null;
    this.userType = null;
    this.roomId = null;
    this.isScreenSharing = false;
    this.onRemoteStream = null;
    this.onUserJoined = null;
    this.onUserLeft = null;
    this.onCameraToggle = null;
    this.onScreenShare = null;
    this.onChatMessage = null;
    this.onConnectionStateChange = null;
  }

  async initialize(userId, userType) {
    this.userId = userId;
    this.userType = userType;
    
    try {
      const { io } = await import('socket.io-client');
      this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });
      
      this.setupSocketListeners();
      
      // Wait for socket to connect
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 10000);
        
        if (this.socket.connected) {
          clearTimeout(timeout);
          resolve();
        } else {
          this.socket.on('connect', () => {
            clearTimeout(timeout);
            resolve();
          });
          
          this.socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        }
      });
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      throw new Error('Socket.IO not available. Please install socket.io-client.');
    }
  }

  setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
      this.onConnectionStateChange?.('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      this.onConnectionStateChange?.('disconnected');
    });

    this.socket.on('user-joined', ({ userId: newUserId, userType: newUserType, userName }) => {
      if (newUserId !== this.userId) {
        console.log(`New user joined: ${newUserId}`);
        this.createPeerConnection(newUserId, false); // Don't create offer for new users, they will create offer to us
        this.onUserJoined?.(newUserId, newUserType, userName);
      }
    });

    this.socket.on('existing-participants', (participants) => {
      console.log('Existing participants:', participants);
      participants.forEach(({ userId: participantId, userType, userName }) => {
        if (participantId !== this.userId) {
          console.log(`Creating peer connection for existing participant: ${participantId}`);
          this.createPeerConnection(participantId, true); // Create offer for existing participants
          // Notify about existing participant
          if (this.onUserJoined) {
            this.onUserJoined(participantId, userType, userName);
          }
        }
      });
    });

    this.socket.on('offer', async ({ offer, fromUserId }) => {
      try {
        const peer = this.peers.get(fromUserId);
        if (peer) {
          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          
          this.socket.emit('answer', {
            answer: answer,
            targetUserId: fromUserId
          });
        }
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    this.socket.on('answer', async ({ answer, fromUserId }) => {
      try {
        const peer = this.peers.get(fromUserId);
        if (peer) {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    this.socket.on('ice-candidate', async ({ candidate, fromUserId }) => {
      try {
        const peer = this.peers.get(fromUserId);
        if (peer && candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    this.socket.on('user-left', ({ userId: leftUserId }) => {
      this.removePeer(leftUserId);
      this.onUserLeft?.(leftUserId);
    });

    this.socket.on('user-camera-toggle', ({ userId: toggleUserId, isOn }) => {
      this.onCameraToggle?.(toggleUserId, isOn);
    });

    this.socket.on('user-screen-share', ({ userId: shareUserId, isSharing }) => {
      this.onScreenShare?.(shareUserId, isSharing);
    });

    this.socket.on('chat-message', (message) => {
      this.onChatMessage?.(message);
    });
  }

  async joinRoom(roomId, userName) {
    this.roomId = roomId;
    console.log(`Joining room ${roomId} as ${userName} (${this.userId})`);
    
    // Clean up any existing streams first
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    try {
      // Check available devices first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some(device => device.kind === 'videoinput');
      const hasAudio = devices.some(device => device.kind === 'audioinput');
      
      let constraints = {};
      if (hasVideo) {
        constraints.video = { width: 640, height: 480 };
      }
      if (hasAudio) {
        constraints.audio = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        };
      }
      
      // If no devices available, throw error
      if (!hasVideo && !hasAudio) {
        throw new Error('No camera or microphone devices found');
      }
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (this.socket && this.socket.connected) {
        console.log(`Emitting join-room for ${this.userId} in room ${roomId}`);
        this.socket.emit('join-room', {
          roomId,
          userId: this.userId,
          userType: this.userType,
          userName
        });
      } else {
        console.warn('Socket not connected when trying to join room');
      }
      
      return this.localStream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      
      // Try audio-only fallback
      if (error.name === 'NotReadableError' || error.name === 'OverconstrainedError') {
        try {
          console.log('Trying audio-only fallback...');
          this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          if (this.socket && this.socket.connected) {
            this.socket.emit('join-room', {
              roomId,
              userId: this.userId,
              userType: this.userType,
              userName
            });
          }
          
          return this.localStream;
        } catch (audioError) {
          console.error('Audio-only fallback failed:', audioError);
        }
      }
      
      if (error.name === 'NotReadableError') {
        throw new Error('Camera/microphone is being used by another application. Please close other apps and try again.');
      } else if (error.name === 'NotAllowedError') {
        throw new Error('Camera/microphone access denied. Please allow permissions and refresh the page.');
      } else {
        throw new Error('Failed to access camera/microphone. Please check your device and try again.');
      }
    }
  }

  createPeerConnection(targetUserId, shouldCreateOffer) {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    });

    peer.ontrack = (event) => {
      console.log(`Received remote stream from ${targetUserId}:`, event.streams[0]);
      const [remoteStream] = event.streams;
      if (remoteStream && this.onRemoteStream) {
        this.onRemoteStream(targetUserId, remoteStream);
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          targetUserId
        });
      }
    };

    peer.onconnectionstatechange = () => {
      console.log(`Peer connection state with ${targetUserId}:`, peer.connectionState);
      if (peer.connectionState === 'connected') {
        console.log(`Successfully connected to ${targetUserId}`);
      } else if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
        setTimeout(() => {
          if (peer.connectionState === 'failed') {
            this.removePeer(targetUserId);
          }
        }, 5000);
      }
    };

    this.peers.set(targetUserId, peer);

    // Add local stream tracks after setting up peer
    const currentStream = this.isScreenSharing ? this.screenStream : this.localStream;
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        console.log(`Adding ${track.kind} track to peer ${targetUserId}`);
        peer.addTrack(track, currentStream);
      });
    }

    if (shouldCreateOffer) {
      // Small delay to ensure tracks are added
      setTimeout(() => {
        this.createOffer(targetUserId);
      }, 100);
    }

    return peer;
  }

  async createOffer(targetUserId) {
    const peer = this.peers.get(targetUserId);
    if (peer) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      
      this.socket.emit('offer', {
        offer: offer,
        targetUserId
      });
    }
  }

  removePeer(userId) {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.close();
      this.peers.delete(userId);
    }
  }

  toggleCamera(isOn) {
    if (this.localStream && !this.isScreenSharing) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isOn;
        this.socket.emit('toggle-camera', { isOn });
      }
    }
  }

  toggleMic(isOn) {
    const currentStream = this.isScreenSharing ? this.screenStream : this.localStream;
    if (currentStream) {
      const audioTrack = currentStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isOn;
      }
    }
  }

  async startScreenShare() {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080 },
        audio: true
      });

      this.isScreenSharing = true;
      
      // Replace video track in all peer connections
      const videoTrack = this.screenStream.getVideoTracks()[0];
      this.peers.forEach(async (peer) => {
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      this.socket.emit('toggle-screen-share', { isSharing: true });
      return this.screenStream;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      throw error;
    }
  }

  async stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    this.isScreenSharing = false;

    // Replace back to camera
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      this.peers.forEach(async (peer) => {
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      });
    }

    this.socket.emit('toggle-screen-share', { isSharing: false });
  }

  sendChatMessage(message) {
    if (this.socket) {
      this.socket.emit('chat-message', {
        roomId: this.roomId,
        message
      });
    }
  }

  disconnect() {
    // Close all peer connections
    this.peers.forEach(peer => {
      try {
        peer.close();
      } catch (e) {
        console.warn('Error closing peer:', e);
      }
    });
    this.peers.clear();
    
    // Stop all media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping screen track:', e);
        }
      });
      this.screenStream = null;
    }
    
    // Disconnect socket
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch (e) {
        console.warn('Error disconnecting socket:', e);
      }
      this.socket = null;
    }

    this.isScreenSharing = false;
  }
}

export default WebRTCService;