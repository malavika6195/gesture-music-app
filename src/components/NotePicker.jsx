import React from 'react';

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const octaves = [3, 4, 5];

const NotePicker = ({ fingerAssignments, setFingerAssignments }) => {
  const fingers = ['Index', 'Middle', 'Ring', 'Pinky'];

  const updateAssignment = (fingerIndex, note) => {
    const newAssignments = [...fingerAssignments];
    newAssignments[fingerIndex] = note;
    setFingerAssignments(newAssignments);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Note Assignment</h2>
      {fingers.map((finger, i) => (
        <div key={finger} style={styles.fingerRow}>
          <span style={styles.fingerLabel}>{finger}:</span>
          <select 
            value={fingerAssignments[i]} 
            onChange={(e) => updateAssignment(i, e.target.value)}
            style={styles.select}
          >
            {octaves.map(octave => 
              notes.map(note => (
                <option key={note + octave} value={note + octave}>
                  {note}{octave}
                </option>
              ))
            )}
          </select>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: { padding: '20px', background: '#181818', color: 'white', overflowY: 'auto' },
  title: { fontSize: '1.2rem', marginBottom: '1.5rem', color: '#1DB954' },
  fingerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '10px', background: '#282828', borderRadius: '8px' },
  fingerLabel: { fontWeight: 'bold' },
  select: { background: '#333', color: 'white', border: 'none', padding: '5px', borderRadius: '4px' }
};

export default NotePicker;
