class JitsiService {
  constructor() {
    this.api = null;
    this.isRecording = false;
    this.recordingUrl = null;
  }

  async initializeMeeting(roomName, userInfo, options = {}) {
    return new Promise((resolve, reject) => {
      // Load Jitsi Meet API script if not already loaded
      if (!window.JitsiMeetExternalAPI) {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.onload = () => this.createMeeting(roomName, userInfo, options, resolve, reject);
        script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
        document.head.appendChild(script);
      } else {
        this.createMeeting(roomName, userInfo, options, resolve, reject);
      }
    });
  }

  createMeeting(roomName, userInfo, options, resolve, reject) {
    try {
      const domain = 'meet.jit.si';
      const jitsiOptions = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: options.parentNode || document.getElementById('jitsi-container'),
        configOverwrite: {
          startWithAudioMuted: options.startWithAudioMuted || false,
          startWithVideoMuted: options.startWithVideoMuted || false,
          enableWelcomePage: false,
          enableClosePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          constraints: {
            video: {
              height: { ideal: 720, max: 1080, min: 240 },
              width: { ideal: 1280, max: 1920, min: 320 }
            }
          },
          toolbarButtons: [
            'microphone', 'camera', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat', 'recording',
            'settings', 'raisehand', 'videoquality', 'filmstrip',
            'invite', 'tileview', 'participants-pane'
          ],
          resolution: 720,
          enableLayerSuspension: true
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          TOOLBAR_ALWAYS_VISIBLE: false,
          TOOLBAR_TIMEOUT: 4000,
          DEFAULT_BACKGROUND: '#000000',
          DISABLE_VIDEO_BACKGROUND: false,
          INITIAL_TOOLBAR_TIMEOUT: 20000,
          VIDEO_LAYOUT_FIT: 'both',
          VERTICAL_FILMSTRIP: true
        },
        userInfo: {
          displayName: userInfo.name,
          email: userInfo.email || `${userInfo.id}@example.com`
        }
      };

      this.api = new window.JitsiMeetExternalAPI(domain, jitsiOptions);

      // Set up event listeners
      this.setupEventListeners(resolve, reject);

      // Set moderator if instructor
      if (userInfo.role === 'instructor') {
        this.api.addEventListener('videoConferenceJoined', () => {
          this.api.executeCommand('toggleLobby', true);
        });
      }

    } catch (error) {
      reject(error);
    }
  }

  setupEventListeners(resolve, reject) {
    this.api.addEventListener('videoConferenceJoined', (event) => {
      resolve(this.api);
    });

    this.api.addEventListener('videoConferenceLeft', (event) => {
      console.log('Left conference:', event);
    });

    this.api.addEventListener('participantJoined', (event) => {
      console.log('Participant joined:', event);
    });

    this.api.addEventListener('participantLeft', (event) => {
      console.log('Participant left:', event);
    });

    this.api.addEventListener('recordingStatusChanged', (event) => {
      this.isRecording = event.on;
      if (event.on) {
        console.log('Recording started');
      } else if (event.recordingUrl) {
        this.recordingUrl = event.recordingUrl;
        console.log('Recording stopped, URL:', event.recordingUrl);
        this.uploadRecordingToCloudinary(event.recordingUrl);
      }
    });

    // Handle errors
    this.api.addEventListener('cameraError', (event) => {
      console.warn('Camera error, continuing with audio only:', event);
    });

    this.api.addEventListener('micError', (event) => {
      console.warn('Microphone error:', event);
    });

    // Timeout fallback
    setTimeout(() => {
      if (!this.api._room) {
        resolve(this.api);
      }
    }, 5000);
  }

  async startRecording() {
    if (this.api) {
      this.api.executeCommand('startRecording', {
        mode: 'file'
      });
    }
  }

  async stopRecording() {
    if (this.api) {
      this.api.executeCommand('stopRecording');
    }
  }

  async uploadRecordingToCloudinary(recordingUrl) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/live-classes/upload-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recordingUrl,
          meetingId: this.roomName
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('Recording uploaded to Cloudinary:', data.cloudinaryUrl);
        return data.cloudinaryUrl;
      }
    } catch (error) {
      console.error('Failed to upload recording:', error);
    }
  }

  sendChatMessage(message) {
    if (this.api) {
      this.api.executeCommand('sendChatMessage', message);
    }
  }

  toggleAudio() {
    if (this.api) {
      this.api.executeCommand('toggleAudio');
    }
  }

  toggleVideo() {
    if (this.api) {
      this.api.executeCommand('toggleVideo');
    }
  }

  hangUp() {
    if (this.api) {
      this.api.executeCommand('hangup');
    }
  }

  dispose() {
    if (this.api) {
      this.api.dispose();
      this.api = null;
    }
  }
}

export default JitsiService;