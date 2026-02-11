import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { createHandLandmarker, detectHands, setRunningMode } from '../services/handDetector'; // Import the service

const HandTracker = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const handLandmarkerRef = useRef(null); // To store the initialized handLandmarker instance
  const animationFrameId = useRef(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  const onUserMedia = useCallback(() => {
    setWebcamReady(true);
  }, []);

  // Function to draw landmarks on the canvas
  const drawLandmarks = (landmarks, ctx, videoWidth, videoHeight) => {
    if (!landmarks || landmarks.length === 0) return;

    ctx.clearRect(0, 0, videoWidth, videoHeight);
    ctx.lineWidth = 2;

    landmarks.forEach(handLandmarks => {
      // Draw connections (simplified for brevity, you'd typically define connections)
      // For now, let's just draw points
      handLandmarks.forEach(landmark => {
        ctx.beginPath();
        ctx.arc(landmark.x * videoWidth, landmark.y * videoHeight, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.stroke();
      });
    });
  };

  const predictWebcam = useCallback(async () => {
    if (!webcamRef.current || !canvasRef.current || !handLandmarkerRef.current) {
      animationFrameId.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === 4 && webcamReady && modelLoaded) {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Set canvas dimensions to match video
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Flip the canvas horizontally since the webcam is mirrored
      ctx.translate(videoWidth, 0);
      ctx.scale(-1, 1);

      let startTimeMs = performance.now();
      const detections = await detectHands(video);

      if (detections && detections.landmarks) {
        drawLandmarks(detections.landmarks, ctx, videoWidth, videoHeight);
      }
    }

    animationFrameId.current = requestAnimationFrame(predictWebcam);
  }, [webcamReady, modelLoaded]);

  useEffect(() => {
    const initializeHandTracker = async () => {
      try {
        const landmarker = await createHandLandmarker();
        handLandmarkerRef.current = landmarker;
        setModelLoaded(true);
        // Ensure running mode is set to VIDEO
        await setRunningMode('VIDEO');
        console.log('HandLandmarker model loaded.');
      } catch (error) {
        console.error('Error loading HandLandmarker model:', error);
      }
    };

    initializeHandTracker();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // Clean up handLandmarker if necessary (though MediaPipe's API doesn't always expose a dispose method easily)
    };
  }, []);

  useEffect(() => {
    if (webcamReady && modelLoaded) {
      animationFrameId.current = requestAnimationFrame(predictWebcam);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [webcamReady, modelLoaded, predictWebcam]);


  return (
    <div style={{ position: 'relative', width: '640px', height: '480px', margin: 'auto' }}>
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored={true}
        onUserMedia={onUserMedia}
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 'auto',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 9,
          width: 640,
          height: 480,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 'auto',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 10,
          width: 640,
          height: 480,
        }}
      />
      {!modelLoaded && <p>Loading HandLandmarker model...</p>}
      {modelLoaded && !webcamReady && <p>Waiting for webcam...</p>}
    </div>
  );
};

export default HandTracker;
