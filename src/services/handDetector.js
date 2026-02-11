import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let handLandmarker = undefined;
let runningMode = 'VIDEO'; // Or 'IMAGE' depending on usage

export const createHandLandmarker = async (modelAssetPath = '/hand_landmarker.task') => {
  if (handLandmarker) {
    return handLandmarker;
  }

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: modelAssetPath,
      delegate: 'GPU' // Or 'CPU'
    },
    runningMode: runningMode,
    numHands: 2
  });

  return handLandmarker;
};

export const detectHands = async (videoElement) => {
  if (!handLandmarker) {
    console.error('HandLandmarker is not initialized.');
    return null;
  }

  if (runningMode === 'IMAGE') {
    runningMode = 'VIDEO';
    await handLandmarker.setOptions({ runningMode: 'VIDEO' });
  }

  const detections = handLandmarker.detectForVideo(videoElement, performance.now());
  return detections;
};

export const setRunningMode = async (mode) => {
  if (handLandmarker && runningMode !== mode) {
    runningMode = mode;
    await handLandmarker.setOptions({ runningMode: mode });
  }
};
