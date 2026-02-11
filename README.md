# Gesture Control App

## Project Description
The Gesture Control App is an innovative web-based music controller that allows users to play musical notes using hand gestures. Utilizing webcam-based hand tracking via MediaPipe, the application detects finger movements to trigger notes and controls the overall volume based on hand proximity to the camera. This project aims to provide a unique and intuitive way to interact with music, blending web technologies with real-time gesture recognition.

## Features
-   **Multi-threaded Hand Tracking (Web Worker):** Real-time detection of hand and finger movements using MediaPipe's HandLandmarker running efficiently on a Web Worker.
-   **Note Playback:** Trigger musical notes by raising individual fingers.
-   **Configurable Notes:** Assign specific musical notes (C3 to B5) to each of the four fingers (Index, Middle, Ring, Pinky).
-   **Dynamic Instrument Selection:** Choose from various Tone.js instruments (Synth, Piano, Guitar, AMSynth, FMSynth, DuoSynth, MembraneSynth, PluckSynth).
-   **Proximity-based Volume Control:** Adjust the master volume by moving the hand closer to or farther from the webcam.
-   **Gradual Volume Transitions:** Smooth volume changes using Tone.js's `rampTo` method for a natural audio experience.
-   **Dynamic Z-axis Calibration:** The volume control automatically adapts its min/max depth range based on observed hand movement, reducing the need for manual setup.
-   **Audio Feedback:** Status messages for hand detection and instrument loading.

## Tech Stack
-   **Frontend:** React (JavaScript/TypeScript)
-   **Build Tool:** Vite 8 (Beta)
-   **Gesture Recognition:** MediaPipe HandLandmarker (`@mediapipe/tasks-vision`)
-   **Audio Synthesis:** Tone.js (`tone`)
-   **Webcam Integration:** `react-webcam`
-   **Multi-threading:** Web Workers

## Setup Instructions

### 1. Clone the repository (if applicable)
```bash
# Assuming you have a git repository
# git clone <repository-url>
# cd gesture-music-app
```

### 2. Install Dependencies
Navigate to the project root directory (`gesture-music-app`) and install the required npm packages:
```bash
npm install
# or
yarn install
```

### 3. Running the Development Server
To start the application in development mode:
```bash
npm run dev
# or
yarn dev
```
The application will typically open in your browser at `http://localhost:5173` (or another port if 5173 is in use).

### 4. Build for Production
To build the application for production:
```bash
npm run build
# or
yarn build
```
The production-ready files will be generated in the `dist` directory.

## Usage Guide

1. **Start the App:** Open the Gesture Control App in your browser. You will see a "START ENGINE" button. Click it to enable webcam access and initialize the audio context.
2.  **Webcam Access:** Grant permission for the browser to access your webcam.
3.  **Hand Tracking:** Position your dominant hand in front of the webcam. The "Status" display should change to "Tracking Active".
4.  **Play Notes:** Raise your individual fingers (Index, Middle, Ring, Pinky) to play the assigned notes.
5.  **Volume Control (Proximity):** Move your hand closer to or farther from the camera to control the master volume.
    *   **Closer to Camera:** Volume increases (up to 0dB).
    *   **Farther from Camera:** Volume decreases (down to -60dB, silent).
6.  **Instrument Selection:** Use the "Instrument" dropdown menu to choose different sound types (Synth, Piano, Guitar, etc.). Note that Piano and Guitar use `Tone.Sampler` which requires loading samples (provided by a public CDN in this prototype).
7.  **Note Assignment:** Use the "Finger X" dropdowns to change which musical note is played by each finger.

## Configuration & Customization

### Volume Control Calibration
The volume control uses dynamic auto-calibration for `minZ` and `maxZ` based on your hand's observed movement range. If you find the volume response not ideal, you might manually adjust these values:
-   **`minZ` and `maxZ`:** These values (in `src/App.jsx`) define the closest and farthest Z-coordinates MediaPipe detects for your hand. The `Raw Z:` display in the UI can help you find your personal range. Move your hand to the closest point where you want max volume, note the `Raw Z` value, and set it as `dynamicMinZ.current`. Do the same for the farthest point and set it as `dynamicMaxZ.current`.
-   **`RAMP_TIME`:** Adjust this value (in `src/App.jsx`) to control how gradually the volume changes. Higher values make it smoother/laggy, lower values make it snappier/jittery.
-   **`curvedProximity`:** The current implementation uses `Math.pow(normalizedProximity, 2)` for a natural, exponential volume curve. You can experiment with different powers (e.g., `Math.pow(normalizedProximity, 3)`) or linear mapping (`normalizedProximity`) if you prefer a different feel.

### Instrument Samples
For 'Piano' and 'Guitar' instruments, the app uses `Tone.Sampler` with placeholder samples from a public CDN (`tonejs.github.io/audio/salamander/`). For a full and realistic sound across all pitches, you would need to:
1.  **Acquire a comprehensive set of audio samples** for the desired instrument.
2.  **Host these samples** (e.g., in the `public` folder of your project or on a CDN).
3.  **Update the `urls` and `baseUrl` properties** within the `Tone.PolySynth(Tone.Sampler, { voice: { ... } })` configuration for 'Piano' and 'Guitar' in `src/App.jsx` to point to your sample files.

### Finger Detection Sensitivity
-   **`tip.y < base.y - 0.1`:** This threshold in `handleHandResults` (`src/App.jsx`) determines how much a fingertip needs to be raised relative to its base to trigger a note. A smaller number (e.g., `-0.05`) makes it more sensitive; a larger number (e.g., `-0.2`) makes it less sensitive.
-   **`DEBOUNCE_TIME_MS`:** Adjust this value (in `src/App.jsx`) to control the delay before a note is released after a finger is put down. A lower value makes it more responsive to rapid movements, but may introduce staccato if the hand tracking is noisy.

## Troubleshooting
-   **Blank Screen/Errors:** Check your browser's developer console (F12) for JavaScript errors. Ensure all npm dependencies are installed (`npm install`).
-   **Hand Not Detected:** Ensure your webcam is working and you've granted access. Check lighting conditions.
-   **Volume Stuck/Not Responding:** Observe the `Raw Z:` value in the UI. Move your hand to its closest and farthest positions, and use those Z-values to manually set `dynamicMinZ` and `dynamicMaxZ` in `src/App.jsx` if the auto-calibration isn't adapting well enough initially.
-   **No Sound:** Ensure your browser tab is active and not muted. Click the "START ENGINE" button. Check console for Tone.js audio context errors.

---
Developed by Malavika Sreesandesh, Master's student in Web Engineering at TU Chemnitz, using Gemini CLI.
