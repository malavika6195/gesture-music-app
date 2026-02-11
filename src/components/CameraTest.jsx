import React from 'react';
import Webcam from 'react-webcam';

const CameraTest = () => (
  <div style={{border: '2px solid red', padding: '10px', color: 'white'}}>
    <h3>Camera Debug Mode</h3>
    <Webcam 
      onUserMedia={() => console.log("Camera Connected!")} 
      onUserMediaError={(err) => console.log("Camera Error: ", err)}
    />
  </div>
);

export default CameraTest;
