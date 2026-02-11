import { useRef } from 'react';
import { motion } from 'framer-motion';
import useGesture from '../hooks/useGesture';
import './DraggableCard.css'; // Create this CSS file if specific styles are needed

const DraggableCard = ({ children }) => {
  const { x, controls, onPanSessionStart, onPan, onPanEnd } = useGesture();
  const constraintsRef = useRef(null);

  return (
    <div ref={constraintsRef} className="card-container">
      <motion.div
        drag="x"
        style={{ x }}
        animate={controls}
        onPanSessionStart={onPanSessionStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        dragConstraints={constraintsRef}
        className="draggable-card"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default DraggableCard;
