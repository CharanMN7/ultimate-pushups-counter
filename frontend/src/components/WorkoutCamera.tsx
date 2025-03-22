'use client';

import { useState, useEffect, useRef } from 'react';

interface WorkoutCameraProps {
  onPushupCounted: (count: number, type: string) => void;
}

export default function WorkoutCamera({ onPushupCounted }: WorkoutCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastCount, setLastCount] = useState(0);
  const [lastType, setLastType] = useState('none');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup WebSocket connection
  useEffect(() => {
    // Use environment variable for WebSocket URL with fallback
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/process-video';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      setError(null);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Failed to connect to the server. Please try again later.');
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          console.error('Server error:', data.error);
          setError(`Server error: ${data.error}`);
        } else {
          // Update push-up count and type if they've changed
          if (data.count !== lastCount || data.pushup_type !== lastType) {
            setLastCount(data.count);
            setLastType(data.pushup_type);

            if (data.count > 0 && data.pushup_type !== 'none') {
              onPushupCounted(data.count, data.pushup_type);
            }
          }

          // Display the processed image with landmarks
          if (data.processed_image && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
              };
              img.src = data.processed_image;
            }
          }
        }
      } catch (err) {
        console.error('Error processing server message:', err);
      }
    };

    setSocket(ws);

    // Cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [onPushupCounted]);

  // Initialize webcam
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video to be loaded
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current && canvasRef.current) {
              // Set canvas dimensions to match video
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Failed to access camera. Please allow camera permissions and try again.');
      }
    };

    setupCamera();

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Send video frames to server
  useEffect(() => {
    if (!socket || !isConnected || !videoRef.current || !canvasRef.current) return;

    let animationFrameId: number;
    const sendFrame = () => {
      if (socket.readyState === WebSocket.OPEN && videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Draw the current video frame on the canvas
          ctx.drawImage(
            videoRef.current,
            0, 0,
            canvasRef.current.width,
            canvasRef.current.height
          );

          // Convert to base64 and send to server
          const imageData = canvasRef.current.toDataURL('image/jpeg', 0.7);
          socket.send(JSON.stringify({ image: imageData }));
        }
      }

      // Continue the loop
      animationFrameId = requestAnimationFrame(sendFrame);
    };

    // Start the frame sending loop
    animationFrameId = requestAnimationFrame(sendFrame);

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [socket, isConnected]);

  return (
    <div className="flex flex-col items-center">
      {error && (
        <div className="mb-4 p-3 bg-red-500 text-white rounded-lg">
          {error}
        </div>
      )}

      <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-lg bg-black">
        {/* Hidden video element to capture webcam */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
        />

        {/* Canvas to display processed frames */}
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
        />

        {/* Connection status indicator */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-300">
        Make sure your full body is visible in the frame for best results.
      </div>
    </div>
  );
} 