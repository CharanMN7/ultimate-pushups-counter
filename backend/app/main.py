from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import base64
import cv2
import numpy as np
import mediapipe as mp
from .pushup_detector import PushupDetector

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize pushup detector
pushup_detector = PushupDetector()

@app.get("/")
async def root():
    return {"message": "Pushup Counter API is running"}

@app.websocket("/ws/process-video")
async def process_video(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # Receive frame from frontend
            data = await websocket.receive_text()
            
            # Parse the JSON data
            frame_data = json.loads(data)
            
            # Process the base64 encoded image
            if "image" in frame_data:
                # Decode base64 image
                base64_image = frame_data["image"].split(",")[1] if "," in frame_data["image"] else frame_data["image"]
                img_bytes = base64.b64decode(base64_image)
                img_array = np.frombuffer(img_bytes, dtype=np.uint8)
                frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                
                # Process the frame with the pushup detector
                count, pushup_type, frame_with_keypoints = pushup_detector.process_frame(frame)
                
                # Encode the processed frame to send back
                _, buffer = cv2.imencode('.jpg', frame_with_keypoints)
                encoded_frame = base64.b64encode(buffer).decode('utf-8')
                
                # Send the results back to the client
                await websocket.send_json({
                    "count": count,
                    "pushup_type": pushup_type,
                    "processed_image": f"data:image/jpeg;base64,{encoded_frame}"
                })
            else:
                await websocket.send_json({"error": "No image data received"})
    
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error processing video frame: {str(e)}")
        await websocket.send_json({"error": str(e)}) 