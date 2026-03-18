export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private websocket: WebSocket | null = null;

  constructor(private roomId: string) {
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.websocket) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          roomId: this.roomId,
          senderId: 'user',
          data: event.candidate,
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
    };
  }

  private sendSignalingMessage(message: any) {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'signaling',
        data: message,
      }));
    }
  }

  async initializeWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        resolve();
      };

      this.websocket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'signaling') {
            await this.handleSignalingMessage(message.data);
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      };

      this.websocket.onerror = (error) => {
        reject(error);
      };
    });
  }

  private async handleSignalingMessage(message: any) {
    if (!this.peerConnection) return;

    switch (message.type) {
      case 'offer':
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.data));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        this.sendSignalingMessage({
          type: 'answer',
          roomId: this.roomId,
          senderId: 'user',
          data: answer,
        });
        break;

      case 'answer':
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.data));
        break;

      case 'ice-candidate':
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.data));
        break;
    }
  }

  async getUserMedia(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw error;
    }
  }

  async createOffer(): Promise<void> {
    if (!this.peerConnection) return;

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    this.sendSignalingMessage({
      type: 'offer',
      roomId: this.roomId,
      senderId: 'user',
      data: offer,
    });
  }

  joinRoom(): void {
    this.sendSignalingMessage({
      type: 'join-room',
      roomId: this.roomId,
      senderId: 'user',
      data: null,
    });
  }

  leaveRoom(): void {
    this.sendSignalingMessage({
      type: 'leave-room',
      roomId: this.roomId,
      senderId: 'user',
      data: null,
    });

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    if (this.peerConnection) {
      this.peerConnection.close();
    }

    if (this.websocket) {
      this.websocket.close();
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  toggleMicrophone(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }

  toggleCamera(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }
}
