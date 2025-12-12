import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioSrc: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioSrc }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    // Reset when src changes
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [audioSrc]);

  const initAudio = () => {
    if (!audioRef.current || !canvasRef.current || sourceRef.current) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    
    const source = audioCtx.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    sourceRef.current = source;
    analyserRef.current = analyser;

    draw();
  };

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationRef.current = requestAnimationFrame(render);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#111827'; // match bg-gray-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient color based on height
        const r = barHeight + 25 * (i / bufferLength);
        const g = 250 * (i / bufferLength);
        const b = 50;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    render();
  };

  return (
    <div className="w-full">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={100} 
        className="w-full h-24 rounded-t-lg bg-gray-900 mb-0 block"
      />
      <audio 
        ref={audioRef} 
        src={audioSrc} 
        controls 
        className="w-full rounded-b-lg"
        onPlay={() => {
            // Initialize context on user interaction (play) to allow auto-play policies
            initAudio();
        }}
        crossOrigin="anonymous"
      />
    </div>
  );
};
