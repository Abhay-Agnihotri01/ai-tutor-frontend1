import { io } from 'socket.io-client';

class LiveClassService {
  constructor() {
    this.socket = null;
    this.localStream = null;
    this.screenStream = null;
    this.peers = new Map();
    this.participants = new Map();
    this.roomId = null;
    this.userId = null;
    this.userInfo = null;
    this.isScreenSharing = false;
    this.isCameraOn = true;
    this.isMicOn = true;
    
    // Event callbacks
    this.onParticipantJoined = null;
    this.onParticipantLeft = null;
    this.onRemoteStream = null;
    this.onChatMessage = null;
    this.onConnectionStateChange = null;
    this.onError = null;
  }

  async initialize() {
    try {
      this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.setupSocketListeners();
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
        
        this.socket.on('connect', () => {
          clearTimeout(timeout);
          this.onConnectionStateChange?.('connected');
          resolve();
        });
        
        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
    } catch (error) {
      this.onError?.('Failed to connect to server');
      throw error;
    }
  }

  setupSocketListeners() {
    this.socket.on('disconnect', () => {
      this.onConnectionStateChange?.('disconnected');
    });

    this.socket.on('user-joined', ({ userId, userType, userName }) => {
      const userInfo = { id: userId, name: userName, role: userType };
      this.participants.set(userId, userInfo);
      this.onParticipantJoined?.(userId, userInfo);
      
      if (userId !== this.userId) {
        this.createPeerConnection(userId, true);
      }
    });

    this.socket.on('existing-participants', (participants) => {
      participants.forEach(({ userId, userType, userName }) => {
        const userInfo = { id: userId, name: userName, role: userType };
        this.participants.set(userId, userInfo);
        this.onParticipantJoined?.(userId, userInfo);
        
        if (userId !== this.userId) {
          this.createPeerConnection(userId, false);
        }
      });
    });

    this.socket.on('user-left', ({ userId }) => {
      this.participants.delete(userId);
      this.removePeer(userId);
      this.onParticipantLeft?.(userId);
    });

    this.socket.on('webrtc-offer', async ({ offer, from }) => {
      await this.handleOffer(offer, from);
    });

    this.socket.on('webrtc-answer', async ({ answer, from }) => {
      await this.handleAnswer(answer, from);
    });

    this.socket.on('webrtc-ice-candidate', async ({ candidate, from }) => {
      await this.handleIceCandidate(candidate, from);
    });

    this.socket.on('participant-media-state', ({ participantId, mediaState }) => {
      const participant = this.participants.get(participantId);
      if (participant) {
        this.participants.set(participantId, { ...participant, ...mediaState });
        this.onParticipantJoined?.(participantId, { ...participant, ...mediaState });
      }
    });

    this.socket.on('chat-message', (message) => {
      this.onChatMessage?.(message);
    });
  }

  async joinRoom(roomId, userInfo) {
    this.roomId = roomId;
    this.userId = userInfo.id;
    this.userInfo = userInfo;

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      // Join room via socket
      this.socket.emit('join-room', {
        roomId,
        userId: userInfo.id,
        userType: userInfo.role,
        userName: userInfo.name
      });

      return this.localStream;
    } catch (error) {
      // Fallback to audio only
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.isCameraOn = false;
        
        this.socket.emit('join-room', {
          roomId,
          userId: userInfo.id,
          userType: userInfo.role,
          userName: userInfo.name
        });

        return this.localStream;
      } catch (audioError) {
        throw new Error('Unable to access camera or microphone');
      }
    }
  }

  createPeerConnection(participantId, shouldCreateOffer) {
    console.log(`Creating peer connection for ${participantId}, shouldCreateOffer: ${shouldCreateOffer}`);
    
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peer = new RTCPeerConnection(config);
    this.peers.set(participantId, peer);

    // Handle remote stream FIRST
    peer.ontrack = (event) => {
      console.log(`Received remote stream from ${participantId}:`, event.streams[0]);
      const [remoteStream] = event.streams;
      if (remoteStream) {
        this.onRemoteStream?.(participantId, remoteStream);
      }
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${participantId}`);
        this.socket.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          to: participantId
        });
      }
    };

    // Handle connection state changes
    peer.onconnectionstatechange = () => {
      console.log(`Peer connection state with ${participantId}: ${peer.connectionState}`);
      if (peer.connectionState === 'connected') {
        console.log(`Successfully connected to ${participantId}`);
      } else if (peer.connectionState === 'failed') {
        console.log(`Connection failed with ${participantId}, retrying...`);
        this.removePeer(participantId);
        setTimeout(() => {
          if (!this.peers.has(participantId)) {
            this.createPeerConnection(participantId, true);
          }
        }, 2000);
      }
    };

    // Add local stream tracks AFTER setting up handlers
    if (this.localStream) {
      console.log(`Adding ${this.localStream.getTracks().length} tracks to peer ${participantId}`);
      this.localStream.getTracks().forEach(track => {
        console.log(`Adding ${track.kind} track to ${participantId}`);
        peer.addTrack(track, this.localStream);
      });
    } else {
      console.warn(`No local stream available when creating peer for ${participantId}`);
    }

    if (shouldCreateOffer) {
      setTimeout(() => {
        this.createOffer(participantId);
      }, 100);
    }
  }

  async createOffer(participantId) {
    const peer = this.peers.get(participantId);
    if (!peer) {
      console.error(`No peer found for ${participantId}`);
      return;
    }

    try {
      console.log(`Creating offer for ${participantId}`);
      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peer.setLocalDescription(offer);
      
      console.log(`Sending offer to ${participantId}`);
      this.socket.emit('webrtc-offer', {
        offer,
        to: participantId
      });
    } catch (error) {
      console.error(`Error creating offer for ${participantId}:`, error);
    }
  }

  async handleOffer(offer, from) {
    const peer = this.peers.get(from);
    if (!peer) {
      console.error(`No peer found for offer from ${from}`);
      return;
    }

    try {
      console.log(`Handling offer from ${from}`);
      await peer.setRemoteDescription(offer);
      
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      
      console.log(`Sending answer to ${from}`);
      this.socket.emit('webrtc-answer', {
        answer,
        to: from
      });
    } catch (error) {
      console.error(`Error handling offer from ${from}:`, error);
    }
  }

  async handleAnswer(answer, from) {
    const peer = this.peers.get(from);
    if (!peer) {
      console.error(`No peer found for answer from ${from}`);
      return;
    }

    try {
      console.log(`Handling answer from ${from}`);
      await peer.setRemoteDescription(answer);
      console.log(`Answer processed successfully from ${from}`);
    } catch (error) {
      console.error(`Error handling answer from ${from}:`, error);
    }
  }

  async handleIceCandidate(candidate, from) {
    const peer = this.peers.get(from);
    if (!peer) return;

    try {
      await peer.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  removePeer(participantId) {
    const peer = this.peers.get(participantId);
    if (peer) {
      peer.close();
      this.peers.delete(participantId);
    }
  }

  toggleCamera() {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      this.isCameraOn = !this.isCameraOn;
      videoTrack.enabled = this.isCameraOn;
      
      this.socket.emit('media-state-change', {
        isCameraOn: this.isCameraOn
      });
    }
    return this.isCameraOn;
  }

  toggleMic() {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      this.isMicOn = !this.isMicOn;
      audioTrack.enabled = this.isMicOn;
      
      this.socket.emit('media-state-change', {
        isMicOn: this.isMicOn
      });
    }
    return this.isMicOn;
  }

  async startScreenShare() {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const videoTrack = this.screenStream.getVideoTracks()[0];
      
      // Replace video track in all peer connections
      this.peers.forEach(async (peer) => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });

      this.isScreenSharing = true;
      
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      this.socket.emit('media-state-change', {
        isScreenSharing: true
      });

      return this.screenStream;
    } catch (error) {
      throw new Error('Failed to start screen sharing');
    }
  }

  async stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      
      // Replace back to camera
      this.peers.forEach(async (peer) => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      });
    }

    this.isScreenSharing = false;
    
    this.socket.emit('media-state-change', {
      isScreenSharing: false
    });
  }

  sendChatMessage(message) {
    if (!this.socket || !message.trim()) return;

    const chatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      userName: this.userInfo.name,
      userRole: this.userInfo.role,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    this.socket.emit('chat-message', {
      roomId: this.roomId,
      message: chatMessage
    });

    // Don't return the message - it will be added when received back from server
  }

  leaveRoom() {
    // Close all peer connections
    this.peers.forEach(peer => peer.close());
    this.peers.clear();
    this.participants.clear();

    // Stop all media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }

    // Leave room via socket
    if (this.socket) {
      this.socket.emit('leave-room', { roomId: this.roomId });
      this.socket.disconnect();
      this.socket = null;
    }

    this.roomId = null;
    this.userId = null;
    this.userInfo = null;
  }

  getParticipants() {
    return Array.from(this.participants.entries()).map(([id, info]) => ({
      id,
      ...info
    }));
  }
}

export default LiveClassService;