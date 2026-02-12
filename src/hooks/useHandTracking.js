// src/hooks/useHandTracking.js
import { useEffect, useRef, useLayoutEffect } from 'react'; // Import useLayoutEffect

export const useHandTracking = (webcamRef, onResults) => {
  const workerRef = useRef(null);
  const animationFrameId = useRef(null);
  const isWorkerReady = useRef(false);
  const offscreenCanvasCtxRef = useRef(null); // Ref for the main thread's canvas context
  const videoWidth = 640; 
  const videoHeight = 480;

  // Ref to hold the latest onResults callback without triggering effect re-run
  const onResultsRef = useRef(onResults);
  useLayoutEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);


  useEffect(() => {
    console.log("useHandTracking: useEffect triggered.");
    if (!webcamRef.current) {
      console.warn("useHandTracking: webcamRef.current is null on effect start.");
      return;
    }

    const videoElement = webcamRef.current.video;
    if (!videoElement) {
      console.warn("useHandTracking: videoElement is null.");
      return;
    }

    let supportsOffscreenCanvas = false;
    let offscreen;
    let mainThreadCanvas = null;

    const handleVideoLoad = () => {
      console.log("useHandTracking: Video loadedmetadata. Dimensions:", videoElement.videoWidth, videoElement.videoHeight);
    };
    videoElement.addEventListener('loadedmetadata', handleVideoLoad);


    supportsOffscreenCanvas = 'transferControlToOffscreen' in HTMLCanvasElement.prototype;

    if (supportsOffscreenCanvas) {
      console.log("useHandTracking: OffscreenCanvas is supported.");
      mainThreadCanvas = document.createElement('canvas');
      mainThreadCanvas.width = videoWidth;
      mainThreadCanvas.height = videoHeight;
      offscreenCanvasCtxRef.current = mainThreadCanvas.getContext('2d', { willReadFrequently: true });
      offscreen = mainThreadCanvas.transferControlToOffscreen();
    } else {
      console.warn("useHandTracking: OffscreenCanvas is NOT supported. Falling back to ImageBitmap transfer.");
    }

    workerRef.current = new Worker(new URL('../workers/handTrackingWorker.js', import.meta.url));

    workerRef.current.onmessage = (event) => {
      const { type, results, error } = event.data;
      switch (type) {
        case 'ready':
          console.log("HandTrackingWorker is ready.");
          isWorkerReady.current = true;
          animationFrameId.current = requestAnimationFrame(animate);
          break;
        case 'results':
          // Use the ref to call the latest onResults callback
          if (onResultsRef.current) {
            onResultsRef.current(results);
          }
          break;
        case 'error':
          console.error("Worker error:", error);
          break;
        case 'closed':
          console.log("HandTrackingWorker closed.");
          isWorkerReady.current = false;
          break;
        default:
          console.warn("Unknown message from worker:", event.data);
      }
    };

    workerRef.current.onerror = (error) => {
      console.error("Web Worker encountered an error:", error);
    };

    // Send init message to worker, conditionally passing OffscreenCanvas
    if (supportsOffscreenCanvas) {
      console.log("useHandTracking: Sending init message with OffscreenCanvas to worker.");
      workerRef.current.postMessage({ type: 'init', offscreenCanvas: offscreen, supportsOffscreenCanvas }, [offscreen]);
    } else {
      console.log("useHandTracking: Sending init message (ImageBitmap fallback) to worker.");
      workerRef.current.postMessage({ type: 'init', supportsOffscreenCanvas });
    }
    

    const animate = async () => {
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4 || !isWorkerReady.current || video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }

      if (supportsOffscreenCanvas) {
        if (offscreenCanvasCtxRef.current) {
          offscreenCanvasCtxRef.current.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          workerRef.current.postMessage({ type: 'videoFrameReady' });
        } else {
          console.error("useHandTracking: offscreenCanvasCtxRef.current is null in animate loop for OffscreenCanvas.");
        }
      } else {
        try {
          const imageBitmap = await createImageBitmap(video);
          workerRef.current.postMessage({ type: 'videoFrame', payload: imageBitmap }, [imageBitmap]);
        } catch (error) {
          console.error("useHandTracking: Error creating ImageBitmap:", error);
        }
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    return () => {
      console.log("useHandTracking: Cleanup triggered. Terminating worker and cancelling animation frame.");
      videoElement.removeEventListener('loadedmetadata', handleVideoLoad);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'close' });
        workerRef.current.terminate();
      }
    };
  }, [webcamRef]); // Removed onResults from dependencies
};
