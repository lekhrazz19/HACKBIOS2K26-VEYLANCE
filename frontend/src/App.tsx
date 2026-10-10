import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useWebcam } from './hooks/useWebcam';
import { useAudio } from './hooks/useAudio';
import { useSimulation } from './hooks/useSimulation';
import { StatusBar } from './components/StatusBar';
import { VideoMetadataStrip } from './components/VideoMetadataStrip';
import { WebcamView } from './components/WebcamView';
import { IntegrityOcularPanel } from './components/IntegrityOcularPanel';
import { SignalCards } from './components/SignalCards';
import { SpatialAnalytics } from './components/SpatialAnalytics';
import { CoreSessionCounters } from './components/CoreSessionCounters';
import { SessionStats } from './components/SessionStats';
import { AlertPanel } from './components/AlertPanel';
import { ChallengeModal } from './components/ChallengeModal';

function App() {
  const { isConnected, dashboardState, sendFrame, setAudioGetter, sessionKey } = useWebSocket();
  
  const { start: startAudio, stop: stopAudio, getRMS } = useAudio();

  const {
    isSimulating,
    activeScenario,
    startSimulation,
    stopSimulation,
    setActiveScenario,
    simulatedState
  } = useSimulation();

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
    if (isConnected && !isSimulating) {
      sendFrame(blob);
    }
  });

  // Session counters lifted to sync CoreSessionCounters and SessionStats
  const [framesAnalyzed, setFramesAnalyzed] = useState(0);
  const [alertsTriggered, setAlertsTriggered] = useState(0);
  const [sessionDurationSec, setSessionDurationSec] = useState(0);
  const [sessionStartTime] = useState(() => new Date().toLocaleTimeString());
  const [lastRisk, setLastRisk] = useState<string | null>(null);

  useEffect(() => {
    setFramesAnalyzed(0);
    setAlertsTriggered(0);
    setSessionDurationSec(0);
    setLastRisk(null);
  }, [sessionKey, activeScenario]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDurationSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fallbackDashboard = {
    timestamp: Date.now(),
    session_id: 'STANDBY',
    trust_score: 100,
    risk_level: 'HIGH_TRUST' as const,
    face_detected: false,
    signals: [],
    alert: null,
    challenge: null,
    faces: [],
    heatmap: [],
    occlusion_zones: [],
    telemetry: undefined
  };

  const currentDashboard = isSimulating 
    ? (simulatedState || fallbackDashboard)
    : (dashboardState || fallbackDashboard);

  useEffect(() => {
    if (currentDashboard && (isCapturing || isSimulating)) {
      setFramesAnalyzed(prev => prev + 1);
      if (currentDashboard.risk_level === 'ALERT' && lastRisk !== 'ALERT') {
        setAlertsTriggered(prev => prev + 1);
      }
      setLastRisk(currentDashboard.risk_level);
    }
  }, [currentDashboard, isCapturing, isSimulating, lastRisk]);

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

  const toggleSimulation = () => {
    if (isSimulating) {
      stopSimulation();
    } else {
      if (isCapturing) stopCapture();
      startSimulation('baseline');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800">
      {/* 1. Unified Clean Header Bar */}
      <StatusBar 
        isConnected={isConnected} 
        isCapturing={isCapturing} 
        isAudioActive={isCapturing}
        sourceType={sourceType}
        onSelectSource={switchSource}
        onStart={() => {
          if (isSimulating) stopSimulation();
          startCapture(sourceType);
        }} 
        onStop={stopCapture}
        audioRms={currentDashboard.telemetry?.audio_rms}
        s5Correlation={currentDashboard.telemetry?.s5_correlation}
        isSimulating={isSimulating}
        activeScenario={activeScenario}
        onToggleSimulation={toggleSimulation}
        onSelectScenario={setActiveScenario}
      />

      {/* Permission / Media Error Toast */}
      {mediaError && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 text-xs font-medium text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{mediaError}</span>
          </div>
          <span className="text-[10px] uppercase font-mono text-amber-400/80">Check Permissions</span>
        </div>
      )}
      
      <main className="flex-1 p-4 sm:p-5 flex flex-col gap-4 max-w-[1720px] mx-auto w-full">
        {/* MAIN SECTION (TOP): 60% Video Viewport vs 40% Integrity & Signals Exact Height Alignment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* Left Viewport (60% width -> 7 of 12 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-2 min-w-0">
            {/* Lightweight metadata strip directly above video */}
            <VideoMetadataStrip 
              telemetry={currentDashboard.telemetry} 
              faceCount={currentDashboard.faces?.length} 
            />

            {/* Video Viewport (16:9 feed determines height cleanly) */}
            <WebcamView 
              videoRef={videoRef} 
              isCapturing={isCapturing} 
              faceDetected={currentDashboard.face_detected}
              faces={currentDashboard.faces}
              trustScore={currentDashboard.trust_score}
              riskLevel={currentDashboard.risk_level}
              sourceType={sourceType}
              onSelectSource={switchSource}
              onStartCapture={() => {
                if (isSimulating) stopSimulation();
                startCapture(sourceType);
              }}
              onStopCapture={stopCapture}
              isMirrored={isMirrored}
              isSimulating={isSimulating}
              activeScenario={activeScenario}
            />
          </div>

          {/* Right Panel (40% width -> 5 of 12 cols on desktop): Matched Exact Height Grid */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3 min-w-0">
            {/* Panel 1: Integrity & Dynamics (~38% of height) */}
            <div className="h-[38%] min-h-[175px]">
              <IntegrityOcularPanel 
                trustScore={currentDashboard.trust_score} 
                riskLevel={currentDashboard.risk_level} 
                signals={currentDashboard.signals}
                faceDetected={currentDashboard.face_detected}
                telemetry={currentDashboard.telemetry}
              />
            </div>

            {/* Panel 2: Biometric Audit Signals (~62% of height) */}
            <div className="h-[60%] min-h-[265px] flex-1">
              <SignalCards signals={currentDashboard.signals} />
            </div>
          </div>
        </div>

        {/* SECONDARY SECTION (BOTTOM): Rigid Clamped 3-Column Footer Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 h-[260px] max-h-[260px] min-h-[260px] overflow-hidden">
          {/* Col 1: Spatial Diagnostics (Heatmap / Occlusion Radar Toggle) */}
          <div className="h-full min-h-0 min-w-0">
            <SpatialAnalytics 
              heatmap={currentDashboard.heatmap}
              occlusionZones={currentDashboard.occlusion_zones}
            />
          </div>

          {/* Col 2: Core Session Counters */}
          <div className="h-full min-h-0 min-w-0">
            <CoreSessionCounters 
              framesAnalyzed={framesAnalyzed}
              alertsTriggered={alertsTriggered}
              sessionDurationSec={sessionDurationSec}
            />
          </div>

          {/* Col 3: Clean Transition Feed with Pinned Audit Trigger */}
          <div className="h-full min-h-0 min-w-0">
            <SessionStats 
              dashboardState={currentDashboard} 
              sessionKey={isSimulating ? activeScenario : sessionKey}
              framesAnalyzed={framesAnalyzed}
              alertsTriggered={alertsTriggered}
              sessionDurationSec={sessionDurationSec}
              sessionStartTime={sessionStartTime}
            />
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
