import { useRef, useEffect } from 'react';
import { useMotionValue, useAnimation } from 'framer-motion';

const swipeConfidenceThreshold = 10000;

const useGesture = () => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const constraintsRef = useRef(null);

  const onPanSessionStart = (event, info) => {
    // Optional: Add logic here if needed at the start of a pan session
  };

  const onPan = (event, info) => {
    // Optional: Add logic here if needed during a pan
  };

  const onPanEnd = (event, info) => {
    const swipe = info.velocity.x * info.offset.x;

    if (swipe < -swipeConfidenceThreshold) {
      // Swiped left
      controls.start({ x: '-100vw' }).then(() => {
        x.set(0); // Reset for next item
        // Optionally trigger a callback for left swipe
      });
    } else if (swipe > swipeConfidenceThreshold) {
      // Swiped right
      controls.start({ x: '100vw' }).then(() => {
        x.set(0); // Reset for next item
        // Optionally trigger a callback for right swipe
      });
    } else {
      // Not a confident swipe, animate back to center
      controls.start({ x: 0 });
    }
  };

  return { x, controls, constraintsRef, onPanSessionStart, onPan, onPanEnd };
};

export default useGesture;
