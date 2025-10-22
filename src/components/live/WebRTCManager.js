class WebRTCManager {
  constructor() {
    this.localStream = null;
    this.peers = new Map(); // userId -> RTCPeerConnection
    this.remoteStreams = new Map(); // userId -> MediaStream
    this.onRemoteStreamCallback = null;
    this.onPeerDisconnectedCallback = null;
    
    // Simple signaling via polling (in production, use WebSocket)
    this.signalingInterval = null;
    this.meetingId = null;
    this.userId = null;
  }

  async initialize(meetingId, userId) {
    this.meetingId = meetingId;
    this.userId = userId;
    
    // Start signaling
    this.startSignaling();
  }

  async getLocalStream() {
    if (!this.localStream) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });
      } catch (error) {
        console.error('Failed to get local stream:', error);
        throw error;
      }
    }
    return this.localStream;
  }

  async createPeerConnection(remoteUserId) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote stream from:', remoteUserId);
      const remoteStream = event.streams[0];
      this.remoteStreams.set(remoteUserId, remoteStream);
      
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(remoteUserId, remoteStream);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(remoteUserId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.removePeer(remoteUserId);
      }
    };

    this.peers.set(remoteUserId, pc);
    return pc;
  }

  async createOffer(remoteUserId) {
    const pc = await this.createPeerConnection(remoteUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    this.sendSignal(remoteUserId, {
      type: 'offer',
      offer: offer
    });
  }

  async handleOffer(remoteUserId, offer) {
    const pc = await this.createPeerConnection(remoteUserId);
    await pc.setRemoteDescription(offer);
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    this.sendSignal(remoteUserId, {
      type: 'answer',
      answer: answer
    });
  }

  async handleAnswer(remoteUserId, answer) {
    const pc = this.peers.get(remoteUserId);
    if (pc) {
      await pc.setRemoteDescription(answer);
    }
  }

  async handleIceCandidate(remoteUserId, candidate) {
    const pc = this.peers.get(remoteUserId);
    if (pc) {
      await pc.addIceCandidate(candidate);
    }
  }

  async sendSignal(targetUserId, signal) {
    try {
      await fetch('http://localhost:5000/api/live-classes/signal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meetingId: this.meetingId,
          fromUserId: this.userId,
          toUserId: targetUserId,
          signal: signal
        })
      });
    } catch (error) {
      console.error('Failed to send signal:', error);
    }
  }

  startSignaling() {
    // Poll for signals every 2 seconds
    this.signalingInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/live-classes/signals/${this.meetingId}/${this.userId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          for (const signal of data.signals || []) {
            await this.handleSignal(signal);
          }
        }
      } catch (error) {
        console.error('Signaling error:', error);
      }
    }, 2000);
  }

  async handleSignal(signalData) {
    const { fromUserId, signal } = signalData;
    
    switch (signal.type) {
      case 'offer':
        await this.handleOffer(fromUserId, signal.offer);
        break;
      case 'answer':
        await this.handleAnswer(fromUserId, signal.answer);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(fromUserId, signal.candidate);
        break;
    }
  }

  removePeer(userId) {
    const pc = this.peers.get(userId);
    if (pc) {
      pc.close();
      this.peers.delete(userId);
    }
    
    this.remoteStreams.delete(userId);
    
    if (this.onPeerDisconnectedCallback) {
      this.onPeerDisconnectedCallback(userId);
    }
  }

  onRemoteStream(callback) {
    this.onRemoteStreamCallback = callback;
  }

  onPeerDisconnected(callback) {
    this.onPeerDisconnectedCallback = callback;
  }

  async connectToParticipants(participantIds) {
    for (const participantId of participantIds) {
      if (participantId !== this.userId && !this.peers.has(participantId)) {
        await this.createOffer(participantId);
      }
    }
  }

  cleanup() {
    if (this.signalingInterval) {
      clearInterval(this.signalingInterval);
    }
    
    this.peers.forEach(pc => pc.close());
    this.peers.clear();
    this.remoteStreams.clear();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
}

export default WebRTCManager;