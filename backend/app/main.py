from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import base64
import cv2
import numpy as np
import mediapipe as mp
import logging
from .pushup_detector import PushupDetector

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS - make sure to allow WebSocket connections
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

@app.get("/health")
async def health_check():
    """Health check endpoint for testing the server"""
    return {"status": "healthy"}

@app.get("/reset")
async def reset_counter():
    """Reset the pushup counter"""
    global pushup_detector
    pushup_detector = PushupDetector()  # Create a fresh instance
    return {"status": "counter reset"}

@app.websocket("/ws/process-video")
async def process_video(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection accepted")
    
    # Reset the counter for each new connection
    global pushup_detector
    pushup_detector = PushupDetector()
    logger.info("Pushup counter reset for new session")
    
    try:
        while True:
            # Receive frame from frontend
            data = await websocket.receive_text()
            
            # Parse the JSON data
            frame_data = json.loads(data)
            
            # Process the base64 encoded image
            if "image" in frame_data:
                # Decode base64 image
                try:
                    base64_image = frame_data["image"].split(",")[1] if "," in frame_data["image"] else frame_data["image"]
                    img_bytes = base64.b64decode(base64_image)
                    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
                    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                    
                    if frame is None:
                        logger.error("Failed to decode image")
                        await websocket.send_json({"error": "Failed to decode image"})
                        continue
                    
                    # Check if we should reset the counter
                    if frame_data.get("reset", False):
                        pushup_detector = PushupDetector()
                        logger.info("Counter reset requested by client")
                    
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
                except Exception as e:
                    logger.error(f"Error processing frame: {str(e)}")
                    await websocket.send_json({"error": f"Error processing frame: {str(e)}"})
            else:
                await websocket.send_json({"error": "No image data received"})
    
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"Error processing video frame: {str(e)}")
        try:
            await websocket.send_json({"error": str(e)})
        except:
            logger.error("Could not send error to client, connection might be closed") 