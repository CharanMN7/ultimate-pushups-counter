import cv2
import numpy as np
import mediapipe as mp
import math

class PushupDetector:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Push-up counting variables
        self.counter = 0
        self.stage = None  # "up" or "down"
        self.pushup_type = "none"
        
        # Track the lowest position during a push-up
        self.min_angle = 180
        
    def calculate_angle(self, a, b, c):
        """
        Calculate the angle between three points.
        """
        a = np.array(a)  # First point (shoulder)
        b = np.array(b)  # Mid point (elbow)
        c = np.array(c)  # End point (wrist)
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
            
        return angle
    
    def calculate_distance(self, a, b):
        """
        Calculate the Euclidean distance between two points.
        """
        a = np.array(a)
        b = np.array(b)
        return np.sqrt(np.sum((a - b) ** 2))
    
    def determine_pushup_type(self, landmarks):
        """
        Determine the type of push-up based on hand and shoulder positions.
        """
        # Extract relevant landmarks
        left_shoulder = [landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, 
                         landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
        right_shoulder = [landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, 
                          landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
        left_wrist = [landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].x, 
                      landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].y]
        right_wrist = [landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST.value].x, 
                       landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
        
        # Calculate distances
        shoulder_distance = self.calculate_distance(left_shoulder, right_shoulder)
        wrist_distance = self.calculate_distance(left_wrist, right_wrist)
        
        # Normalize wrist distance relative to shoulder distance
        # This helps account for different camera distances/body sizes
        wrist_shoulder_ratio = wrist_distance / shoulder_distance if shoulder_distance > 0 else 0
        
        # Determine push-up type based on hand position
        if wrist_shoulder_ratio < 0.5:
            return "diamond"
        elif wrist_shoulder_ratio < 0.8:
            return "regular"
        elif wrist_shoulder_ratio < 1.5:
            return "wide arm"
        else:
            # Check if it's a pike push-up (more vertical position)
            hip_angle = self.calculate_angle(
                [landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, 
                 landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].y],
                [landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value].x, 
                 landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value].y],
                [landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE.value].x, 
                 landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE.value].y]
            )
            
            if hip_angle < 100:  # More vertical position
                return "pike"
            else:
                return "very wide arm"
    
    def process_frame(self, frame):
        """
        Process a video frame, detect pose, count push-ups, and determine push-up type.
        """
        # Convert the BGR image to RGB
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process the image and get pose landmarks
        results = self.pose.process(image_rgb)
        
        # Convert back to BGR for rendering
        annotated_image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
        
        # Draw pose landmarks on the image
        if results.pose_landmarks:
            self.mp_drawing.draw_landmarks(
                annotated_image,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing_styles.get_default_pose_landmarks_style()
            )
            
            # Extract landmarks
            landmarks = results.pose_landmarks.landmark
            
            # Get coordinates for left and right sides
            left_shoulder = [landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, 
                            landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            left_elbow = [landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value].x, 
                         landmarks[self.mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            left_wrist = [landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].x, 
                         landmarks[self.mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            
            right_shoulder = [landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, 
                             landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            right_elbow = [landmarks[self.mp_pose.PoseLandmark.RIGHT_ELBOW.value].x, 
                          landmarks[self.mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            right_wrist = [landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST.value].x, 
                          landmarks[self.mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
            
            # Calculate elbow angles
            left_angle = self.calculate_angle(left_shoulder, left_elbow, left_wrist)
            right_angle = self.calculate_angle(right_shoulder, right_elbow, right_wrist)
            
            # Average angle of both arms
            avg_angle = (left_angle + right_angle) / 2
            
            # Determine pushup type when in down position
            if avg_angle < 110:  # Using down position to determine type
                self.pushup_type = self.determine_pushup_type(landmarks)
                
                # Track the lowest position
                if avg_angle < self.min_angle:
                    self.min_angle = avg_angle
            
            # Visualize angles on frame
            cv2.putText(annotated_image, f"Angle: {int(avg_angle)}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Push-up counter logic
            if avg_angle > 150:
                if self.stage == 'down' and self.min_angle < 110:  # Confirm we had a valid down position
                    self.counter += 1
                    self.stage = 'up'
                    self.min_angle = 180  # Reset for next pushup
                elif self.stage != 'up':
                    self.stage = 'up'
            elif avg_angle < 110:
                if self.stage == 'up':
                    self.stage = 'down'
            
            # Display pushup count and type
            cv2.putText(annotated_image, f"Count: {self.counter}", 
                       (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(annotated_image, f"Type: {self.pushup_type}", 
                       (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(annotated_image, f"Stage: {self.stage}", 
                       (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
        return self.counter, self.pushup_type, annotated_image 