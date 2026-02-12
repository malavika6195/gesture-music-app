// src/workers/handTrackingWorker.js
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let handLandmarker = null;
let offscreenCanvas = null; // Global variable to store the OffscreenCanvas
let supportsOffscreenCanvas = false; // Global flag for OffscreenCanvas support

self.onmessage = async (event) => {
  const { type, payload, offscreenCanvas: receivedOffscreenCanvas, supportsOffscreenCanvas: receivedSupportsOffscreenCanvas } = event.data; // Updated destructuring

  switch (type) {
    case 'init':
      console.log("Worker: Received init message.");
      try {
        supportsOffscreenCanvas = receivedSupportsOffscreenCanvas; // Store the flag
        console.log(`Worker: supportsOffscreenCanvas is ${supportsOffscreenCanvas}`);

        if (supportsOffscreenCanvas) {
          if (receivedOffscreenCanvas) { // Access via new name
            offscreenCanvas = receivedOffscreenCanvas; // Store the OffscreenCanvas
            console.log("Worker: OffscreenCanvas received.");
          } else {
            console.error("Worker: OffscreenCanvas not provided during init, despite support being indicated.");
            self.postMessage({ type: 'error', error: "OffscreenCanvas not provided." });
            return;
          }
        }

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.3,
          minTrackingConfidence: 0.3,
          minPresenceConfidence: 0.3
        });
        console.log("Worker: HandLandmarker initialized.");
        self.postMessage({ type: 'ready' });
      } catch (error) {
        console.error("Worker: Error initializing HandLandmarker:", error);
        self.postMessage({ type: 'error', error: error.message });
      }
      break;

    case 'videoFrameReady': // For OffscreenCanvas flow
      if (supportsOffscreenCanvas) {
        if (handLandmarker && offscreenCanvas) {
          try {
            const results = handLandmarker.detectForVideo(offscreenCanvas, performance.now());
            self.postMessage({ type: 'results', results });
          } catch (error) {
            console.error("Worker: Error detecting hands from OffscreenCanvas:", error);
            self.postMessage({ type: 'error', error: error.message });
          }
        } else if (!handLandmarker) {
          console.warn("Worker: HandLandmarker not initialized when receiving frameReady signal.");
        } else if (!offscreenCanvas) {
          console.warn("Worker: OffscreenCanvas not available when receiving frameReady signal.");
        }
      } else {
        console.warn("Worker: Received 'videoFrameReady' but OffscreenCanvas is NOT supported. This message should not be sent.");
      }
      break;

    case 'videoFrame': // For ImageBitmap fallback flow
      if (!supportsOffscreenCanvas) {
        if (handLandmarker && payload instanceof ImageBitmap) {
          try {
            const results = handLandmarker.detectForVideo(payload, performance.now());
            self.postMessage({ type: 'results', results });
          } catch (error) {
            console.error("Worker: Error detecting hands from ImageBitmap:", error);
            self.postMessage({ type: 'error', error: error.message });
          } finally {
            payload.close(); // Important: close the ImageBitmap to free up memory
          }
        } else if (!handLandmarker) {
          console.warn("Worker: HandLandmarker not initialized when receiving ImageBitmap.");
          if (payload instanceof ImageBitmap) payload.close(); // Close payload even if not processed
        } else if (!(payload instanceof ImageBitmap)) {
           console.error("Worker: Received 'videoFrame' but payload is not an ImageBitmap.");
        }
      } else {
        console.warn("Worker: Received 'videoFrame' but OffscreenCanvas is supported. This message should not be sent.");
        if (payload instanceof ImageBitmap) payload.close();
      }
      break;

    case 'close':
      console.log("Worker: Received close message. Closing HandLandmarker.");
      if (handLandmarker) {
        handLandmarker.close();
        handLandmarker = null;
      }
      self.postMessage({ type: 'closed' });
      break;

    default:
      console.warn("Worker: Unknown message type received:", type);
  }
};
