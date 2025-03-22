'use client';

import { useState, useEffect, useRef } from 'react';

interface WorkoutCameraProps {
  onPushupCounted: (count: number, type: string) => void;
  isRecording: boolean;
}

export default function WorkoutCamera({ onPushupCounted, isRecording }: WorkoutCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastCount, setLastCount] = useState(0);
  const [lastType, setLastType] = useState('none');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const isFirstFrameRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Stop camera function
  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        console.log("Stopping track:", track.kind);
        track.stop();
      });
      streamRef.current = null;
      setCameraReady(false);

      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      console.log("Camera stopped");
    }
  };

  // WebSocket connection setup with reconnection logic
  const setupWebSocket = () => {
    if (!isRecording) return null;

    // Use environment variable for WebSocket URL with fallback
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/process-video';
    console.log("Connecting to WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0; // Reset attempts counter on successful connection
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed', event);
      setIsConnected(false);

      // Only attempt reconnect if we're still recording and haven't exceeded max attempts
      if (isRecording && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);

        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * (2 ** (reconnectAttemptsRef.current - 1)), 16000);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isRecording) {
            const newWs = setupWebSocket();
            if (newWs) setSocket(newWs);
          }
        }, delay);
      } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setError('Unable to maintain connection to the server. Please refresh the page and try again.');
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Connection error. Please check if the server is running.');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          console.error('Server error:', data.error);
          setError(`Server error: ${data.error}`);
        } else {
          // Clear any error that might have been displayed
          if (error) setError(null);

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
                // Clear canvas first
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);

                // Draw a continuous tracking indicator
                ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                ctx.font = 'bold 16px Arial';
                ctx.fillText('Tracking Active', 10, canvasRef.current!.height - 20);
              };
              img.src = data.processed_image;
            }
          }
        }
      } catch (err) {
        console.error('Error processing server message:', err);
      }
    };

    return ws;
  };

  // Reset counter when component remounts
  useEffect(() => {
    if (isRecording) {
      // Reset our internal state
      setLastCount(0);
      setLastType('none');
      isFirstFrameRef.current = true;

      // Also make a reset request to the backend
      fetch('http://localhost:8000/reset')
        .then(response => response.json())
        .then(data => {
          console.log("Counter reset response:", data);
        })
        .catch(err => {
          console.error("Failed to reset counter:", err);
        });
    }
  }, [isRecording]);

  // Monitor isRecording prop changes
  useEffect(() => {
    if (!isRecording) {
      // If recording is stopped, also stop the camera
      stopCamera();

      // Clean up WebSocket connection
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }

      // Clear any reconnection timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }
  }, [isRecording, socket]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!isRecording) return;

    const ws = setupWebSocket();
    if (ws) setSocket(ws);

    // Cleanup function
    return () => {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isRecording]);

  // Initialize webcam
  useEffect(() => {
    if (!isRecording) return;

    const setupCamera = async () => {
      try {
        console.log("Setting up camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }  // Request higher framerate
          },
          audio: false
        });

        console.log("Camera stream obtained:", stream);
        // Store the stream reference for later cleanup
        streamRef.current = stream;

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

    // Cleanup function when component unmounts
    return () => {
      stopCamera();
    };
  }, [isRecording]);

  // Send video frames to server
  useEffect(() => {
    if (!socket || !isConnected || !videoRef.current || !canvasRef.current || !cameraReady || !isRecording) {
      console.log("Not sending frames because:", {
        socketExists: !!socket,
        isConnected,
        videoExists: !!videoRef.current,
        canvasExists: !!canvasRef.current,
        cameraReady,
        isRecording
      });
      return;
    }

    console.log("Starting to send video frames");

    let animationFrameId: number;
    let isProcessingFrame = false;
    const frameInterval = 100; // Send a frame every 100ms (10 FPS) - reduced to be more reliable
    let lastFrameTime = 0;

    const sendFrame = (timestamp: number) => {
      // Only send a new frame if we're not already processing and if enough time has passed
      if (!isProcessingFrame && (timestamp - lastFrameTime > frameInterval) && socket.readyState === WebSocket.OPEN && videoRef.current && canvasRef.current) {
        isProcessingFrame = true;
        lastFrameTime = timestamp;

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          try {
            // Draw the current video frame on the canvas
            ctx.drawImage(
              videoRef.current,
              0, 0,
              canvasRef.current.width,
              canvasRef.current.height
            );

            // Convert to base64 and send to server
            const imageData = canvasRef.current.toDataURL('image/jpeg', 0.7);

            // For first frame only, send reset flag
            if (isFirstFrameRef.current) {
              socket.send(JSON.stringify({
                image: imageData,
                reset: true
              }));
              isFirstFrameRef.current = false;
            } else {
              socket.send(JSON.stringify({ image: imageData }));
            }

            // Add visual feedback that frame was sent
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(canvasRef.current.width - 20, 10, 10, 10);

            // Handle the response in the onmessage event
            isProcessingFrame = false;
          } catch (err) {
            console.error('Error sending frame:', err);
            isProcessingFrame = false;
          }
        } else {
          isProcessingFrame = false;
        }
      }

      // Continue the animation loop if still recording
      if (isRecording) {
        animationFrameId = requestAnimationFrame(sendFrame);
      }
    };

    // Start the animation loop
    animationFrameId = requestAnimationFrame(sendFrame);

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [socket, isConnected, cameraReady, isRecording]);

  // UI rendering
  return (
    <div className="relative overflow-hidden rounded-lg bg-white w-full border border-gray-200 shadow-md">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20 p-4">
          <div className="bg-red-600 p-4 rounded-lg max-w-md text-center text-white">
            <h3 className="text-xl font-bold mb-2">Error</h3>
            <p>{error}</p>
            {error.includes('server') && (
              <button
                onClick={() => window.location.reload()}
                className="mt-3 bg-white text-red-700 px-4 py-2 rounded font-semibold hover:bg-gray-200 transition-colors"
              >
                Refresh Page
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative aspect-video">
        {/* This video element is hidden but used to get camera stream */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
        />

        {/* Canvas where we display the processed frames */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
        />

        {/* Connection status indicator */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${isConnected ? 'bg-green-500' : 'bg-red-600'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>

        {/* Loading state if camera not ready */}
        {isRecording && !cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-white text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-white border-t-transparent rounded-full mb-2"></div>
              <p>Initializing camera...</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-100 text-gray-800 border-t border-gray-200">
        <p className="font-semibold text-red-600">
          Position instructions:
        </p>
        <ul className="text-sm list-disc pl-5 mt-1">
          <li>Make sure your full body is visible in the frame</li>
          <li>Camera should be at a side angle to see your pushup form</li>
          <li>Ensure good lighting for best tracking</li>
        </ul>
      </div>
    </div>
  );
} 