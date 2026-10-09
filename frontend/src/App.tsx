import { useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useWebcam } from './hooks/useWebcam';
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
  const { isConnected, dashboardState, sendFrame } = useWebSocket();
  
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

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
        onStart={startCapture} 
        onStop={stopCapture} 
      />
      
      <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Webcam */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <WebcamView 
              videoRef={videoRef} 
              isCapturing={isCapturing} 
              faceDetected={currentDashboard.face_detected}
              faces={currentDashboard.faces}
            />
          </div>

          {/* Right Column - Status */}
          <div className="w-full lg:w-[400px] flex flex-col gap-4 shrink-0">
            <TelemetryBar telemetry={currentDashboard.telemetry} faceCount={currentDashboard.faces?.length} />
            <TrustGauge 
              trustScore={currentDashboard.trust_score} 
              riskLevel={currentDashboard.risk_level} 
              signals={currentDashboard.signals}
              faceDetected={currentDashboard.face_detected}
            />
            <SignalCards signals={currentDashboard.signals} />
            <BlinkRatePanel telemetry={currentDashboard.telemetry} s4Signal={currentDashboard.signals.find(s => s.signal === 'S4')} />
            <SessionStats dashboardState={dashboardState} />
          </div>
        </div>

        {/* Bottom Row - Heatmap and Occlusion Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* HeatmapPanel and OcclusionGraph go here - added by Task 3 */}
          <div></div>
          <div></div>
        </div>
      </main>

      {/* Analytics Section */}
      <div className="p-6 flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto w-full justify-center">
        <HeatmapPanel heatmap={currentDashboard.heatmap} />
        <OcclusionGraph occlusionZones={currentDashboard.occlusion_zones} />
      </div>

      {/* Overlays */}
      <AlertPanel alert={currentDashboard.alert} />
      <ChallengeModal challenge={currentDashboard.challenge} />
    </div>
  );
}

export default App;
