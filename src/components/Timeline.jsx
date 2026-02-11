import React, { useState, useEffect } from 'react';
import * as Tone from 'tone';

const Timeline = ({ recordedNotes }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlayback = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    
    if (isPlaying) {
      Tone.Transport.stop();
    } else {
      Tone.Transport.start();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div style={styles.timelineContainer}>
      <div style={styles.controls}>
        <button onClick={togglePlayback} style={styles.playBtn}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>
      <div style={styles.scrollArea}>
        <div style={styles.track}>
          {recordedNotes.map((note, i) => (
            <div key={i} style={{...styles.noteBlock, left: `${i * 40}px`}}>
              {note}
            </div>
          ))}
          {/* Visual Playhead */}
          <div style={{...styles.playhead, left: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  timelineContainer: { display: 'flex', height: '100%', background: '#181818', borderTop: '2px solid #333', padding: '10px' },
  controls: { width: '100px', display: 'flex', alignItems: 'center' },
  playBtn: { padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#1DB954', color: 'white', cursor: 'pointer' },
  scrollArea: { flex: 1, overflowX: 'scroll', position: 'relative', marginSide: '20px', background: '#121212', borderRadius: '8px' },
  track: { width: '2000px', height: '100%', position: 'relative' },
  noteBlock: { position: 'absolute', top: '20%', height: '60%', width: '35px', background: '#1DB954', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' },
  playhead: { position: 'absolute', top: 0, bottom: 0, width: '2px', background: 'white', zIndex: 10 }
};

export default Timeline;
