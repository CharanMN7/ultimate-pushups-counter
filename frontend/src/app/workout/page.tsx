'use client';

import { useState } from 'react';
import Link from 'next/link';
import WorkoutCamera from '@/components/WorkoutCamera';
import WorkoutResults from '@/components/WorkoutResults';

export default function WorkoutPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [pushupCount, setPushupCount] = useState(0);
  const [pushupTypes, setPushupTypes] = useState<Record<string, number>>({});

  const handleStartRecording = () => {
    setPushupCount(0);
    setPushupTypes({});
    setIsRecording(true);
    setIsFinished(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsFinished(true);
  };

  const handlePushupCounted = (count: number, type: string) => {
    setPushupCount(count);
    setPushupTypes(prev => {
      const updatedTypes = { ...prev };
      updatedTypes[type] = (updatedTypes[type] || 0) + 1;
      return updatedTypes;
    });
  };

  const handleRetry = () => {
    setIsFinished(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gradient-to-b from-blue-900 to-blue-700 text-white">
      <div className="max-w-5xl w-full">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Ultimate Push-ups Counter</h1>
          <Link
            href="/"
            className="text-white hover:text-blue-200 transition-colors"
          >
            Home
          </Link>
        </header>

        <div className="bg-blue-800 rounded-lg shadow-lg p-6 mb-6">
          {!isRecording && !isFinished && (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-6">Ready to start your workout?</h2>
              <p className="mb-8 text-lg">
                Position your device so your full body is visible in the frame.
                <br />
                The camera should be placed at head level for best results.
              </p>
              <button
                onClick={handleStartRecording}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200"
              >
                Start Recording
              </button>
            </div>
          )}

          {isRecording && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Recording...</h2>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-900 px-4 py-2 rounded-lg">
                    <span className="font-bold">{pushupCount}</span> Push-ups
                  </div>
                  <button
                    onClick={handleStopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Stop
                  </button>
                </div>
              </div>
              <WorkoutCamera
                onPushupCounted={handlePushupCounted}
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