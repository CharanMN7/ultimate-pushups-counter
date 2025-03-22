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

  // Calculate percentage for each type
  const getPercentage = (count: number) => {
    if (pushupCount === 0) return 0;
    return Math.round((count / pushupCount) * 100);
  };

  // Get dominant pushup type
  const dominantType = sortedTypes.length > 0 ? sortedTypes[0][0] : 'none';

  // Color mapping for pushup types
  const typeColors: Record<string, string> = {
    'regular': 'bg-blue-500',
    'diamond': 'bg-purple-500',
    'wide arm': 'bg-green-500',
    'pike': 'bg-orange-500',
    'very wide arm': 'bg-red-500',
    'none': 'bg-gray-500'
  };

  // Feedback based on pushup count
  const getFeedback = () => {
    if (pushupCount === 0) return "No push-ups detected. Make sure your body is fully visible in the frame.";
    if (pushupCount < 5) return "Good start! Try to do more next time.";
    if (pushupCount < 10) return "Nice job! You're making progress.";
    if (pushupCount < 20) return "Great workout! You're getting stronger.";
    if (pushupCount < 30) return "Impressive! You're building serious strength.";
    return "Outstanding! You're a push-up champion!";
  };

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-bold mb-6">Workout Results</h2>

      <div className="bg-blue-900 rounded-full p-6 mb-8 w-40 h-40 flex items-center justify-center">
        <div>
          <div className="text-4xl font-bold">{pushupCount}</div>
          <div className="text-md opacity-80">Push-ups</div>
        </div>
      </div>

      <div className="mb-8 text-xl">
        {getFeedback()}
      </div>

      {pushupCount > 0 && (
        <div className="w-full max-w-md mb-8">
          <h3 className="text-xl font-bold mb-4">Push-up Types</h3>

          <div className="space-y-3">
            {sortedTypes.map(([type, count]) => (
              <div key={type} className="bg-blue-900 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <div className="font-semibold capitalize">{type}</div>
                  <div>{count} ({getPercentage(count)}%)</div>
                </div>
                <div className="w-full bg-blue-950 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${typeColors[type] || 'bg-blue-500'}`}
                    style={{ width: `${getPercentage(count)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pushupCount > 0 && dominantType !== 'none' && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">Primary Push-up Type</h3>
          <div className="text-2xl capitalize">{dominantType}</div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Try Again
        </button>

        <Link
          href="/"
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Home
        </Link>
      </div>
    </div>
  );
} 