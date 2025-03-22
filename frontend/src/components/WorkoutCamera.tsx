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
  const [cameraReady, setCameraReady] = useState(false);

  // Setup WebSocket connection
  useEffect(() => {
    // Use environment variable for WebSocket URL with fallback
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/process-video';
    console.log("Connecting to WebSocket:", wsUrl);
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
        console.log("Setting up camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

        console.log("Camera stream obtained:", stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video to be loaded
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            videoRef.current?.play();
            setCameraReady(true);

            if (videoRef.current && canvasRef.current) {
              // Set canvas dimensions to match video
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              console.log(`Canvas size set to ${canvasRef.current.width}x${canvasRef.current.height}`);
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
    if (!socket || !isConnected || !videoRef.current || !canvasRef.current || !cameraReady) {
      console.log("Not sending frames because:", {
        socketExists: !!socket,
        isConnected,
        videoExists: !!videoRef.current,
        canvasExists: !!canvasRef.current,
        cameraReady
      });
      return;
    }

    console.log("Starting to send video frames");
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
          try {
            const imageData = canvasRef.current.toDataURL('image/jpeg', 0.7);
            socket.send(JSON.stringify({ image: imageData }));
          } catch (err) {
            console.error("Error sending frame:", err);
          }
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
  }, [socket, isConnected, cameraReady]);

  return (
    <div className="flex flex-col items-center">
      {error && (
        <div className="mb-4 p-3 bg-red-500 text-white rounded-lg">
          {error}
        </div>
      )}

      <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-lg bg-black">
        {/* Video element to capture webcam - now visible */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
        />

        {/* Canvas to display processed frames - positioned on top of video */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />

        {/* Connection status indicator */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>

        {/* Camera status indicator */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold ${cameraReady ? 'bg-green-500' : 'bg-yellow-500'
          }`}>
          {cameraReady ? 'Camera Ready' : 'Camera Initializing...'}
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-300">
        Make sure your full body is visible in the frame for best results.
        <br />
        {!cameraReady && "If you see a black screen, please check your camera permissions."}
      </div>
    </div>
  );
} 