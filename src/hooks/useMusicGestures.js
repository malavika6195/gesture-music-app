import { useEffect, useRef } from 'react';
import * as Tone from 'tone';

export const useMusicGestures = (landmarks, fingerNotes) => {
  const synth = useRef(null);
  const lastY = useRef(0);

  useEffect(() => {
    synth.current = new Tone.PolySynth(Tone.Synth).toDestination();
    return () => synth.current.dispose();
  }, []);

  useEffect(() => {
    if (!landmarks || landmarks.length === 0) return;

    // Finger landmarks: Index(8), Middle(12), Ring(16), Pinky(20)
    const fingerIndices = [8, 12, 16, 20];
    
    fingerIndices.forEach((index, i) => {
      const tip = landmarks[index];
      const base = landmarks[index - 2]; // MCP joint

      // Trigger note if finger is "up" (y is lower in screen space)
      if (tip.y < base.y - 0.1) {
        const note = fingerNotes[i];
        
        // Pitch control: Vertical swipe logic
        const pitchShift = tip.y < lastY.current ? 12 : 0; // Octave jump if moving up
        synth.current.triggerAttackRelease(note, "8n");
      }
    });

    lastY.current = landmarks[8].y;
  }, [landmarks, fingerNotes]);
};
