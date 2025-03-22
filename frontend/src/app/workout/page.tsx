'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import WorkoutCamera from '@/components/WorkoutCamera';
import WorkoutResults from '@/components/WorkoutResults';

export default function WorkoutPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [pushupCount, setPushupCount] = useState(0);
  const [pushupTypes, setPushupTypes] = useState<Record<string, number>>({});
  const [sessionId, setSessionId] = useState(Date.now()); // Unique ID for each recording session

  // Reset all workout data
  const resetWorkout = () => {
    setPushupCount(0);
    setPushupTypes({});
    // Generate a new session ID to force component remounting
    setSessionId(Date.now());
  };

  const handleStartRecording = () => {
    // Reset everything before starting
    resetWorkout();
    setIsRecording(true);
    setIsFinished(false);

    // Reset the backend counter via API
    fetch('http://localhost:8000/reset')
      .catch(err => console.error("Failed to reset counter:", err));
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsFinished(true);
  };

  const handlePushupCounted = (count: number, type: string) => {
    // Only update if count has increased
    if (count > pushupCount && type !== 'none') {
      setPushupCount(count);
      setPushupTypes(prev => {
        const updatedTypes = { ...prev };
        updatedTypes[type] = (updatedTypes[type] || 0) + 1;
        return updatedTypes;
      });
    }
  };

  const handleRetry = () => {
    resetWorkout();
    setIsFinished(false);
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      setIsRecording(false);
      // Also reset the counter on the backend when navigating away
      fetch('http://localhost:8000/reset').catch(() => { });
    };
  }, []);

  // Reset counter when page is refreshed
  useEffect(() => {
    resetWorkout();
    fetch('http://localhost:8000/reset').catch(() => { });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-white text-gray-900">
      <div className="max-w-5xl w-full">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-600">Ultimate Push-ups Counter</h1>
          <Link
            href="/"
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            Home
          </Link>
        </header>

        <div className="bg-gray-100 rounded-lg shadow-lg p-6 mb-6 border-l-4 border-red-500">
          {!isRecording && !isFinished && (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-6 text-red-600">Ready to start your workout?</h2>
              <p className="mb-8 text-lg">
                Position your device so your full body is visible in the frame.
                <br />
                The camera should be placed at head level for best results.
              </p>
              <button
                onClick={handleStartRecording}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200 shadow-md"
              >
                Start Recording
              </button>
            </div>
          )}

          {isRecording && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-red-600">Recording...</h2>
                <div className="flex items-center gap-4">
                  <div className="bg-gray-200 px-4 py-2 rounded-lg font-bold text-gray-900">
                    <span className="font-bold">{pushupCount}</span> Push-ups
                  </div>
                  <button
                    onClick={handleStopRecording}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Stop
                  </button>
                </div>
              </div>
              {/* Use key to force component remounting with each new session */}
              <WorkoutCamera
                key={sessionId}
                onPushupCounted={handlePushupCounted}
                isRecording={isRecording}
              />
            </div>
          )}

          {isFinished && (
            <WorkoutResults
              pushupCount={pushupCount}
              pushupTypes={pushupTypes}
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>
    </main>
  );
} 