import { Mic, MicOff, Video, VideoOff, Languages, Monitor, Settings, PhoneOff, ArrowUpDown } from "lucide-react";

interface CallControlsProps {
  isMicMuted: boolean;
  isVideoOff: boolean;
  isTranslationActive: boolean;
  isConnected: boolean;
  isServiceAvailable: boolean;
  onMicToggle: () => void;
  onVideoToggle: () => void;
  onTranslationToggle: () => void;
  onLanguageSwap?: () => void;
  onSettingsOpen: () => void;
  onEndCall: () => void;
}

export default function CallControls({
  isMicMuted,
  isVideoOff,
  isTranslationActive,
  isConnected,
  isServiceAvailable,
  onMicToggle,
  onVideoToggle,
  onTranslationToggle,
  onLanguageSwap,
  onSettingsOpen,
  onEndCall,
}: CallControlsProps) {
  return (
    <div className="bg-card border-t border-border px-6 py-4" data-testid="call-controls">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center space-x-4">
          {/* Microphone Control */}
          <button
            className={`control-button w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMicMuted 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/80' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            onClick={onMicToggle}
            data-testid="button-microphone"
          >
            {isMicMuted ? <MicOff className="text-xl" /> : <Mic className="text-xl" />}
          </button>
          
          {/* Camera Control */}
          <button
            className={`control-button w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isVideoOff 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/80' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            onClick={onVideoToggle}
            data-testid="button-camera"
          >
            {isVideoOff ? <VideoOff className="text-xl" /> : <Video className="text-xl" />}
          </button>
          
          {/* LANGUAGES BUTTON - ALWAYS VISIBLE */}
          <button
            className="control-button w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all border-4 bg-orange-500 text-white hover:bg-orange-600 border-orange-300"
            onClick={async () => {
              console.log("🚀 LANGUAGES BUTTON CLICKED!");
              console.log("Translation active before:", isTranslationActive);
              
              // Ask for microphone permission first
              try {
                console.log("🎤 Requesting microphone permission...");
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log("✅ Microphone permission granted!");
                
                // Stop the stream immediately, we just needed permission
                stream.getTracks().forEach(track => track.stop());
                
                // Now toggle translation
                onTranslationToggle();
              } catch (error) {
                console.error("❌ Microphone permission denied:", error);
                alert("Please allow microphone access for translation to work!");
              }
            }}
            data-testid="button-translation"
            title="Click to Toggle Translation"
            style={{ 
              minWidth: '64px', 
              minHeight: '64px',
              boxShadow: '0 4px 12px rgba(251, 146, 60, 0.4)',
              transform: 'scale(1.1)'
            }}
          >
            <Languages className="text-2xl mb-1" />
            <span className="text-xs font-bold">🌐</span>
          </button>
          
          {/* Language Swap Button */}
          {onLanguageSwap && (
            <button
              className="control-button w-14 h-14 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-all"
              onClick={onLanguageSwap}
              data-testid="button-language-swap"
              title="Swap your language and partner's language"
            >
              <ArrowUpDown className="text-xl" />
            </button>
          )}
          
          {/* Screen Share */}
          <button
            className="control-button w-14 h-14 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center hover:bg-secondary/80 transition-all"
            data-testid="button-screen-share"
          >
            <Monitor className="text-xl" />
          </button>
          
          {/* Settings */}
          <button
            className="control-button w-14 h-14 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center hover:bg-secondary/80 transition-all"
            onClick={onSettingsOpen}
            data-testid="button-settings-control"
          >
            <Settings className="text-xl" />
          </button>
          
          {/* End Call */}
          <button
            className="control-button w-14 h-14 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-all"
            onClick={onEndCall}
            data-testid="button-end-call-control"
          >
            <PhoneOff className="text-xl" />
          </button>
        </div>
        
        {/* Translation Status */}
        <div className="flex items-center justify-center mt-4 space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isServiceAvailable ? 'bg-success' : 'bg-destructive'}`}></div>
            <span data-testid="status-speech-api">Web Speech API</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isServiceAvailable ? 'bg-success' : 'bg-destructive'}`}></div>
            <span data-testid="status-translation-api">LibreTranslate API</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isTranslationActive ? 'bg-success' : 'bg-muted'}`}></div>
            <span data-testid="status-translation-active">
              Translation {isTranslationActive ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`}></div>
            <span data-testid="status-webrtc">Video {isConnected ? 'Connected' : 'Connecting'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
