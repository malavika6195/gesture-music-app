import { useEffect, useRef } from 'react';
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export const useHandTracking = (webcamRef, onResults) => {
  const landmarkerRef = useRef(null);
  const animationFrameId = useRef(null); // Add this back for proper cleanup

  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1, // Changed back to 1 for single-hand tracking
          minHandDetectionConfidence: 0.3,
          minTrackingConfidence: 0.3,
          minPresenceConfidence: 0.3
        });
        animationFrameId.current = requestAnimationFrame(animate);
      } catch (error) {
        console.error("MediaPipe Init Error:", error);
      }
    };

    const animate = () => {
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        const startTimeMs = performance.now();
        const results = landmarkerRef.current.detectForVideo(webcamRef.current.video, startTimeMs);
        onResults(results);
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    initLandmarker();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, [webcamRef, onResults]);
};
