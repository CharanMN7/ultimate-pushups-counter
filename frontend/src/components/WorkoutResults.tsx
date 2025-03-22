'use client';

import Link from 'next/link';

interface WorkoutResultsProps {
  pushupCount: number;
  pushupTypes: Record<string, number>;
  onRetry: () => void;
}

export default function WorkoutResults({ pushupCount, pushupTypes, onRetry }: WorkoutResultsProps) {
  // Get pushup types sorted by count (descending)
  const sortedTypes = Object.entries(pushupTypes)
    .filter(([type]) => type !== 'none')
    .sort((a, b) => b[1] - a[1]);

  // Calculate total count of all types (this may differ from pushupCount)
  const totalTypeCount = sortedTypes.reduce((acc, [, count]) => acc + count, 0);

  // Calculate percentage for each type
  const getPercentage = (count: number) => {
    if (totalTypeCount === 0) return 0;
    return Math.round((count / totalTypeCount) * 100);
  };

  // Get dominant pushup type
  const dominantType = sortedTypes.length > 0 ? sortedTypes[0][0] : 'none';

  // Feedback based on pushup count
  const getFeedback = () => {
    if (pushupCount === 0) return "No push-ups detected. Make sure your body is fully visible in the frame.";
    if (pushupCount < 5) return "Good start! Try to do more next time.";
    if (pushupCount < 10) return "Nice job! You're making progress.";
    if (pushupCount < 20) return "Great workout! You're getting stronger.";
    if (pushupCount < 30) return "Impressive! You're building serious strength.";
    return "Outstanding! You're a push-up champion!";
  };

  // Handler for retry button to ensure we start fresh
  const handleRetry = () => {
    // Call the parent's onRetry callback
    onRetry();
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-bold mb-6 text-red-600">Workout Results</h2>

      <div className="bg-gray-200 rounded-full p-6 mb-8 w-40 h-40 flex items-center justify-center shadow-md border-2 border-red-500">
        <div>
          <div className="text-4xl font-bold text-gray-900">{pushupCount}</div>
          <div className="text-md text-gray-700">Push-ups</div>
        </div>
      </div>

      <div className="mb-8 text-xl text-gray-800">
        {getFeedback()}
      </div>

      {pushupCount > 0 && (
        <div className="w-full max-w-md mb-8">
          <h3 className="text-xl font-bold mb-4 text-red-600">Push-up Types</h3>

          <div className="space-y-3">
            {sortedTypes.map(([type, count]) => {
              const percentage = getPercentage(count);
              return (
                <div key={type} className="bg-gray-100 rounded-lg p-3 shadow-sm border-l-4 border-red-500">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-semibold capitalize text-gray-800">{type}</div>
                    <div className="font-bold text-gray-700">{count} reps ({percentage}%)</div>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-red-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pushupCount > 0 && dominantType !== 'none' && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2 text-red-600">Primary Push-up Type</h3>
          <div className="text-2xl capitalize text-gray-800">{dominantType}</div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleRetry}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md"
        >
          Try Again
        </button>

        <Link
          href="/"
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md"
        >
          Home
        </Link>
      </div>
    </div>
  );
} 