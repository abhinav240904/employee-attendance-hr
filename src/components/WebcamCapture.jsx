// src/components/WebcamCapture.jsx
import { useCallback, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import './WebcamCapture.css'

export default function WebcamCapture({ onCapture }) {
  const webcamRef = useRef(null)
  const [facingMode, setFacingMode] = useState('user')

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) onCapture(imageSrc)
  }, [onCapture])

  return (
    <div className="webcam-wrap">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode }}
        className="webcam"
      />
      <div className="webcam-actions">
        <button className="btn" onClick={capture}>📸 Capture</button>
        <button
          className="btn secondary"
          onClick={() => setFacingMode(m => (m === 'user' ? { exact: 'environment' } : 'user'))}
        >
          🔁 Switch
        </button>
      </div>
    </div>
  )
}
