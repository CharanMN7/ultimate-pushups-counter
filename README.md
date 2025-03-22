# Ultimate Push-Ups Counter

A machine learning-based application that counts and classifies push-ups in real-time using computer vision.

## Features

- Real-time push-up counting using the device's camera
- Automatic detection of push-up types:
  - Regular push-ups
  - Diamond push-ups
  - Wide arm push-ups
  - Pike push-ups
  - More variations
- Results screen showing total count and type distribution

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Python, FastAPI, WebSockets
- **Machine Learning**: MediaPipe, OpenCV

## Setup and Installation

### Prerequisites

- Node.js 18+
- Python 3.8+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   // or
   pip3 install -r requirements.tsx
   ```

5. Run the backend server:
   ```
   python run.py
   // or
   python3 run.py
   ```

The backend will be available at `http://localhost:8000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`.

## Usage

1. Open the app in your browser at `http://localhost:3000`
2. Position your device so that your full body is visible in the frame
3. Click "Start Recording" and begin doing push-ups
4. The app will count your push-ups and identify the type in real-time
5. When you're done, click "Stop Recording" to see your results
 
