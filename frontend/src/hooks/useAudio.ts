import { useRef, useCallback, useEffect, useState } from 'react';

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);
      setIsActive(true);
    } catch (e) {
      console.warn('Mic not available — S5 will be inactive:', e);
      setIsActive(false);
    }
  }, []);

  const stop = useCallback(() => {
    sourceRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsActive(false);
  }, []);

  const getRMS = useCallback((): number | null => {
    if (!analyserRef.current || !isActive) return null;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(data);
    // Compute RMS (0.0 to 1.0)
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const norm = (data[i] - 128) / 128;
      sum += norm * norm;
    }
    return Math.sqrt(sum / data.length);
  }, [isActive]);

  useEffect(() => () => stop(), [stop]);

  return { isActive, start, stop, getRMS };
}
