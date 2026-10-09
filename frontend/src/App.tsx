import { useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useWebcam } from './hooks/useWebcam';
import { useAudio } from './hooks/useAudio';
import { StatusBar } from './components/StatusBar';
import { WebcamView } from './components/WebcamView';
import { TrustGauge } from './components/TrustGauge';
import { SignalCards } from './components/SignalCards';
import { AlertPanel } from './components/AlertPanel';
import { ChallengeModal } from './components/ChallengeModal';
import { HeatmapPanel } from './components/HeatmapPanel';
import { OcclusionGraph } from './components/OcclusionGraph';
import { TelemetryBar } from './components/TelemetryBar';
import { SessionStats } from './components/SessionStats';
import { BlinkRatePanel } from './components/BlinkRatePanel';

function App() {
  const { isConnected, dashboardState, sendFrame, setAudioGetter, sessionKey } = useWebSocket();
  
  const { start: startAudio, stop: stopAudio, getRMS } = useAudio();

  const { 
    videoRef, 
    isCapturing, 
    startCapture, 
    stopCapture 
  } = useWebcam((blob) => {
    if (isConnected) {
      sendFrame(blob);
    }
  });

  useEffect(() => {
    if (isCapturing) {
      startAudio();
      setAudioGetter(getRMS);
    } else {
      stopAudio();
      setAudioGetter(() => null);
    }
  }, [isCapturing, startAudio, stopAudio, getRMS, setAudioGetter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
      stopAudio();
    };
  }, [stopCapture, stopAudio]);

  const fallbackDashboard = {
    trust_score: 100,
    risk_level: 'HIGH_TRUST' as const,
    face_detected: false,
    signals: [],
    alert: null,
    challenge: null,
    faces: [],
    heatmap: [],
    occlusion_zones: [],
    telemetry: undefined,
    faces_count: 0
  };

  const currentDashboard = dashboardState || fallbackDashboard;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans selection:bg-blue-500/30">
      <StatusBar 
        isConnected={isConnected} 
        isCapturing={isCapturing} 
        isAudioActive={isCapturing}
        onStart={startCapture} 
        onStop={stopCapture} 
      />
      
      <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1680px] mx-auto w-full">
        {/* Layer 1: High-Density Telemetry Bar */}
        <TelemetryBar 
          telemetry={currentDashboard.telemetry} 
          faceCount={currentDashboard.faces?.length} 
        />

        {/* Layer 2: Main Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Visual & Biometric Forensics Suite (7 of 12 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
            {/* Live Camera Feed with Active Target Square Box */}
            <WebcamView 
              videoRef={videoRef} 
              isCapturing={isCapturing} 
              faceDetected={currentDashboard.face_detected}
              faces={currentDashboard.faces}
              trustScore={currentDashboard.trust_score}
              riskLevel={currentDashboard.risk_level}
            />

            {/* Forensics Layer: Anomaly Heatmap & Zone Radar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HeatmapPanel heatmap={currentDashboard.heatmap} />
              <OcclusionGraph occlusionZones={currentDashboard.occlusion_zones} />
            </div>
          </div>

          {/* Right Analytical & Security Intelligence Suite (5 of 12 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-5 min-w-0">
            {/* Trust Gauge & Integrity Breakdown */}
            <TrustGauge 
              trustScore={currentDashboard.trust_score} 
              riskLevel={currentDashboard.risk_level} 
              signals={currentDashboard.signals}
              faceDetected={currentDashboard.face_detected}
            />

            {/* S4 Eye Blink Dynamics & EAR Baseline Analytics */}
            <BlinkRatePanel 
              telemetry={currentDashboard.telemetry} 
              s4Signal={currentDashboard.signals.find(s => s.signal === 'S4')} 
            />

            {/* Multi-Signal Verification Cards (S1-S5) */}
            <SignalCards signals={currentDashboard.signals} />

            {/* Session Verification Timeline & Audit Stats */}
            <SessionStats dashboardState={dashboardState} sessionKey={sessionKey} />
          </div>
        </div>
      </main>

      {/* Security Overlays */}
      <AlertPanel alert={currentDashboard.alert} />
      <ChallengeModal challenge={currentDashboard.challenge} />
    </div>
  );
}

export default App;
