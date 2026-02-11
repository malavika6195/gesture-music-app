import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as Tone from 'tone';
import { useHandTracking } from './hooks/useHandTracking';

// Helper to generate a range of musical notes
const generateNotes = (startOctave, endOctave) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const generated = [];
  for (let octave = startOctave; octave <= endOctave; octave++) {
    notes.forEach(note => generated.push(note + octave));
  }
  return generated;
};

const availableNotes = generateNotes(3, 5); // C3 to B5
const availableInstruments = ['Synth', 'Piano', 'Guitar']; // Updated instruments

const DEBOUNCE_TIME_MS = 50; // Time in ms to wait before releasing a note (reduced for responsiveness)

// Comprehensive Piano Samples from Salamander Grand Piano
const pianoSamples = {
  urls: {
    A0: "A0.mp3", C1: "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3", A1: "A1.mp3",
    C2: "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3", A2: "A2.mp3",
    C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", A3: "A3.mp3",
    C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3", A4: "A4.mp3",
    C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3", A5: "A5.mp3",
    C6: "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3", A6: "A6.mp3",
    C7: "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3", A7: "A7.mp3",
    C8: "C8.mp3"
  },
  baseUrl: "https://tonejs.github.io/audio/salamander/"
};

function App() {
  const webcamRef = useRef(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [status, setStatus] = useState("Show your hand");
  const [fingerAssignments, setFingerAssignments] = useState(['C4', 'E4', 'G4', 'B4']);
  const [currentInstrumentType, setCurrentInstrumentType] = useState('Synth'); // Default instrument
  const [isInstrumentLoading, setIsInstrumentLoading] = useState(false); // New loading state
  const [volumeDb, setVolumeDb] = useState(Tone.Destination.volume.value.toFixed(1)); // State for displaying volume
  const [rawHandZ, setRawHandZ] = useState(0); // New state for raw hand Z value
  
  // --- Volume Control Refs ---
  // Initial guesses for Z (the code will auto-adjust these)
  const dynamicMinZ = useRef(2.0); 
  const dynamicMaxZ = useRef(9.0);
  // Set RAMP_TIME to 0.15 for a "smooth" feel. 
  // Higher = more gradual/laggy, Lower = snappier/jittery.
  const RAMP_TIME = useRef(0.15); 

  const activeNotes = useRef(new Set());
  const releaseTimers = useRef({}); // To store debounce timers for each note
  const polySynthRef = useRef(null); // Ref to hold the Tone.PolySynth instance

  // Effect to initialize/re-initialize the Tone.PolySynth when instrument type changes
  useEffect(() => {
    const initializePolySynth = async () => {
      setIsInstrumentLoading(true); // Start loading
      if (polySynthRef.current) {
        polySynthRef.current.dispose(); // Dispose previous synth instance
      }

      let newSynth;
      const synthOptions = {
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.5,
          release: 0.05,
        }
      };

      try {
        switch (currentInstrumentType) {
          case 'AMSynth':
            newSynth = new Tone.PolySynth(Tone.AMSynth, synthOptions);
            break;
          case 'FMSynth':
            newSynth = new Tone.PolySynth(Tone.FMSynth, synthOptions);
            break;
          case 'DuoSynth':
            newSynth = new Tone.PolySynth(Tone.DuoSynth, synthOptions);
            break;
          case 'MembraneSynth':
            newSynth = new Tone.PolySynth(Tone.MembraneSynth, { voice: { ...synthOptions.envelope, pitchDecay: 0.05, octaves: 10, oscillator: { type: 'sine' } } });
            break;
          case 'PluckSynth':
            newSynth = new Tone.PolySynth(Tone.PluckSynth, { voice: { ...synthOptions.envelope, attackNoise: 1, dampening: 4000, resonance: 0.9 } });
            break;
          case 'Piano':
            newSynth = new Tone.PolySynth(Tone.Sampler, {
              voice: {
                urls: pianoSamples.urls,
                release: 1, // Samplers typically have longer release, adjust as needed
                baseUrl: pianoSamples.baseUrl,
              }
            });
            await newSynth.loaded; // Wait for samples to load
            break;
          case 'Guitar': // Using PluckSynth to mimic guitar sound without external samples
            newSynth = new Tone.PolySynth(Tone.PluckSynth, {
              voice: {
                attackNoise: 1,
                dampening: 4000,
                resonance: 0.9,
                envelope: {
                  attack: 0.02,
                  decay: 0.4,
                  sustain: 0.1,
                  release: 0.1,
                },
              }
            });
            break;
          case 'Synth':
          default:
            newSynth = new Tone.PolySynth(Tone.Synth, synthOptions);
            break;
        }

        newSynth.toDestination();
        polySynthRef.current = newSynth;
      } catch (error) {
        console.error("Error initializing synth:", error);
        newSynth = new Tone.PolySynth(Tone.Synth, synthOptions); // Fallback to default
        newSynth.toDestination();
        polySynthRef.current = newSynth;
      } finally {
        setIsInstrumentLoading(false); // End loading
      }
    };

    initializePolySynth();

    return () => {
      if (polySynthRef.current) {
        polySynthRef.current.dispose();
      }
    };
  }, [currentInstrumentType]);

  const startApp = async () => {
    await Tone.start();
    setIsAudioReady(true);
  };

  const handleNoteChange = (index, newNote) => {
    setFingerAssignments(prevAssignments => {
      const newAssignments = [...prevAssignments];
      newAssignments[index] = newNote;
      return newAssignments;
    });
  };

  const handleInstrumentChange = (e) => {
    setCurrentInstrumentType(e.target.value);
    if (activeNotes.current.size > 0) {
      activeNotes.current.clear();
      for (const note in releaseTimers.current) {
        clearTimeout(releaseTimers.current[note]);
      }
      releaseTimers.current = {};
    }
  };


  const handleHandResults = useCallback((results) => {
    if (!isAudioReady || isInstrumentLoading) {
      return;
    }

    if (!results?.landmarks?.length) {
      setStatus("No Hand Detected");
      if (activeNotes.current.size > 0) {
        if (polySynthRef.current) {
          polySynthRef.current.releaseAll();
        }
        activeNotes.current.clear();
        for (const note in releaseTimers.current) {
          clearTimeout(releaseTimers.current[note]);
        }
        releaseTimers.current = {};
      }
      Tone.Destination.volume.rampTo(-60, RAMP_TIME.current); // Use RAMP_TIME from ref
      setVolumeDb(Tone.Destination.volume.value.toFixed(1));
      setRawHandZ(0); // Reset raw Z display
      return;
    }
    
    const handLandmarks = results.landmarks[0];

    // --- Volume Control Logic (Proximity) ---
    // 1. Get current Z
    const handZ = handLandmarks[0].z; 
    setRawHandZ(handZ.toFixed(3));

    // 2. AUTO-CALIBRATION 
    // If your hand goes past the current limits, the limits expand.
    if (handZ < dynamicMinZ.current) dynamicMinZ.current = handZ;
    if (handZ > dynamicMaxZ.current) dynamicMaxZ.current = handZ;

    // 3. NORMALIZE (0 to 1)
    // We calculate where the hand is relative to the calibrated range.
    let normalizedProximity = 1 - Math.max(0, Math.min(1, (handZ - dynamicMinZ.current) / (dynamicMaxZ.current - dynamicMinZ.current)));

    // 4. GRADUAL CURVE (Exponential)
    // Human ears don't hear volume linearly. Squaring the value makes 
    // the fade-in and fade-out feel much smoother to our ears.
    const curvedProximity = Math.pow(normalizedProximity, 2);

    // 5. MAP TO DECIBELS
    const minVolumeDb = -60; 
    const maxVolumeDb = 0; 
    const newVolumeDb = minVolumeDb + (curvedProximity * (maxVolumeDb - minVolumeDb));

    // 6. EXECUTE SMOOTH RAMP
    // The 'rampTo' ensures the volume slides gradually to the target.
    Tone.Destination.volume.rampTo(newVolumeDb, RAMP_TIME.current);

    setVolumeDb(newVolumeDb.toFixed(1));


    // --- Note Playing Logic ---
    setStatus("Tracking Active");
    const landmarks = handLandmarks;
    const fingersDetectedThisFrame = new Set();

    [8, 12, 16, 20].forEach((tipIdx, i) => {
      const tip = landmarks[tipIdx];
      const base = landmarks[tipIdx - 2];
      const note = fingerAssignments[i];

      if (tip.y < base.y - 0.1) {
        fingersDetectedThisFrame.add(note);
        if (releaseTimers.current[note]) {
          clearTimeout(releaseTimers.current[note]);
          delete releaseTimers.current[note];
        }
        if (!activeNotes.current.has(note)) {
          if (polySynthRef.current) {
            polySynthRef.current.triggerAttack(note);
            activeNotes.current.add(note);
          }
        }
      }
    });

    activeNotes.current.forEach(note => {
      if (!fingersDetectedThisFrame.has(note)) {
        if (!releaseTimers.current[note]) {
          releaseTimers.current[note] = setTimeout(() => {
            if (polySynthRef.current) {
              polySynthRef.current.triggerRelease(note);
            }
            activeNotes.current.delete(note);
            delete releaseTimers.current[note];
          }, DEBOUNCE_TIME_MS);
        }
      }
    });
  }, [isAudioReady, isInstrumentLoading, fingerAssignments, polySynthRef]);

  useHandTracking(webcamRef, handleHandResults);

  return (
    <div style={{ background: '#121212', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      {!isAudioReady ? (
        <div style={{ textAlign: 'center', padding: '50px', background: '#181818', borderRadius: '20px', border: '1px solid #333' }}>
          <h1>Saptaswara Gesture App</h1>
          <button onClick={startApp} style={{ padding: '15px 30px', background: '#1DB954', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>
            START ENGINE
          </button>
        </div>
      ) : (
        <>
          <h2 style={{ color: status === "Tracking Active" ? "#1DB954" : "orange" }}>{status}</h2>
          <div style={{ border: '5px solid #333', borderRadius: '15px', overflow: 'hidden' }}>
            <Webcam ref={webcamRef} audio={false} style={{ width: '640px', height: '480px' }} />
          </div>
          
          {/* Instrument Selection */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ marginRight: '10px' }}>Instrument:</label>
            <select
              value={currentInstrumentType}
              onChange={handleInstrumentChange}
              style={{
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid #555',
                backgroundColor: '#333',
                color: 'white',
                fontSize: '1rem',
              }}
            >
              {availableInstruments.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          {/* Instrument loading indicator */}
          {isInstrumentLoading && <p style={{ color: 'yellow', marginTop: '10px' }}>Loading Instrument samples...</p>}
          
          {/* Volume display */}
          <p style={{marginTop: '10px'}}>Volume: {volumeDb} dB</p>
          {/* Raw Hand Z display for calibration */}
          <p style={{marginTop: '5px'}}>Raw Z: {rawHandZ}</p>

          {/* Note Assignment */}
          <div style={{ display: 'flex', marginTop: '20px', gap: '10px' }}>
            {fingerAssignments.map((note, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label style={{ marginBottom: '5px' }}>Finger {index + 1}</label>
                <select
                  value={note}
                  onChange={(e) => handleNoteChange(index, e.target.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '5px',
                    border: '1px solid #555',
                    backgroundColor: '#333',
                    color: 'white',
                    fontSize: '1rem',
                  }}
                >
                  {availableNotes.map(availNote => (
                    <option key={availNote} value={availNote}>{availNote}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p style={{marginTop: '20px'}}>Raised fingers will play assigned notes.</p>
        </>
      )}
    </div>
  );
}

export default App;
