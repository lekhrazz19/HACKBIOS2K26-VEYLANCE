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
    sourceType,
    isMirrored,
    startCapture, 
    stopCapture,
    switchSource,
    error: mediaError
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
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-blue-500/30">
      <StatusBar 
        isConnected={isConnected} 
        isCapturing={isCapturing} 
        isAudioActive={isCapturing}
        sourceType={sourceType}
        onSelectSource={switchSource}
        onStart={() => startCapture(sourceType)} 
        onStop={stopCapture} 
      />

      {/* Permission / Media Error Toast */}
      {mediaError && (
        <div className="bg-amber-500/15 border-b border-amber-500/40 px-6 py-2.5 text-xs font-medium text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{mediaError}</span>
          </div>
          <span className="text-[10px] uppercase font-mono text-amber-300/80">Check Permissions</span>
        </div>
      )}
      
      <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1720px] mx-auto w-full">
        {/* Layer 1: High-Density Telemetry Ribbon */}
        <TelemetryBar 
          telemetry={currentDashboard.telemetry} 
          faceCount={currentDashboard.faces?.length} 
        />

        {/* Layer 2: Main Biometric & Forensic Inspection Suite */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Visual & Biometric Forensics Suite (7 of 12 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
            {/* Live Camera / Google Meet Screen Share Feed */}
            <WebcamView 
              videoRef={videoRef} 
              isCapturing={isCapturing} 
              faceDetected={currentDashboard.face_detected}
              faces={currentDashboard.faces}
              trustScore={currentDashboard.trust_score}
              riskLevel={currentDashboard.risk_level}
              sourceType={sourceType}
              onSelectSource={switchSource}
              onStartCapture={() => startCapture(sourceType)}
              onStopCapture={stopCapture}
              isMirrored={isMirrored}
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
