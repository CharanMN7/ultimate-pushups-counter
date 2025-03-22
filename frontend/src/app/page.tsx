import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-white text-gray-900">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-red-600 tracking-tight">ULTIMATE PUSH-UPS COUNTER</h1>
        <p className="text-xl md:text-2xl mb-12 font-bold">
          CRUSH YOUR GOALS | TRACK YOUR PROGRESS | DOMINATE YOUR WORKOUT
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          <div className="bg-gray-100 p-6 rounded-lg shadow-lg border-l-4 border-red-500">
            <h2 className="text-2xl font-bold mb-3 text-red-600">POWER FEATURES</h2>
            <ul className="text-left space-y-4">
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">REAL-TIME COUNTING</span>
              </li>
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">ADVANCED FORM TRACKING</span>
              </li>
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">DETAILED WORKOUT ANALYSIS</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-100 p-6 rounded-lg shadow-lg border-l-4 border-red-500">
            <h2 className="text-2xl font-bold mb-3 text-red-600">WHY IT WORKS</h2>
            <ul className="text-left space-y-4">
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">AI-POWERED PRECISION</span>
              </li>
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">PERFORMANCE METRICS</span>
              </li>
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">INSTANT FEEDBACK</span>
              </li>
            </ul>
          </div>
        </div>

        <Link
          href="/workout"
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-lg text-xl transition-colors duration-200 transform hover:scale-105 shadow-lg"
        >
          START CRUSHING IT NOW!
        </Link>
      </div>
    </main>
  );
}
