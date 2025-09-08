// src/components/AddEmployeeModal.jsx
import { useEffect, useRef, useState } from 'react'
import WebcamCapture from './WebcamCapture'
import './AddEmployeeModal.css'

export default function AddEmployeeModal({ open, onClose, onSave }) {
  const [useWebcam, setUseWebcam] = useState(true)
  const [photo, setPhoto] = useState('')
  const [form, setForm] = useState({ name:'', empCode:'', department:'', active: true })
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setUseWebcam(true)
      setPhoto('')
      setForm({ name:'', empCode:'', department:'', active: true })
    }
  }, [open])

  if (!open) return null

  const handleUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result)
    reader.readAsDataURL(file)
  }

  const save = () => {
    if (!form.name || !form.empCode) {
      alert('Name and Employee ID required')
      return
    }
    onSave({ ...form, photo })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h3>Add Employee</h3>
          <button className="btn ghost" onClick={onClose}>✖</button>
        </div>

        <div className="modal-body">
          <div className="two-col">
            <div className="left">
              <div className="field"><label>Name</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              <div className="field"><label>Employee ID</label><input className="input" value={form.empCode} onChange={e=>setForm(f=>({...f,empCode:e.target.value}))}/></div>
              <div className="field"><label>Department</label><input className="input" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}/></div>
              <div className="field row"><label>Status</label>
                <select value={form.active ? '1':'0'} onChange={e=>setForm(f=>({...f,active:e.target.value==='1'}))}>
                  <option value="1">Active</option><option value="0">Inactive</option>
                </select>
              </div>
            </div>

            <div className="right">
              <div className="tabs">
                <button className={`tab ${useWebcam ? 'active':''}`} onClick={()=>setUseWebcam(true)}>Use Webcam</button>
                <button className={`tab ${!useWebcam ? 'active':''}`} onClick={()=>setUseWebcam(false)}>Upload Image</button>
              </div>

              <div className="capture-area">
                {useWebcam ? <WebcamCapture onCapture={(dataUrl)=>setPhoto(dataUrl)} /> : (
                  <div className="upload-box">
                    <input type="file" accept="image/*" ref={fileRef} onChange={handleUpload}/>
                  </div>
                )}
              </div>

              {photo && (
                <div className="preview">
                  <div className="preview-title">Captured/Uploaded Photo</div>
                  <img src={photo} alt="preview" className="preview-img"/>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={save}>Save Employee</button>
        </div>
      </div>
    </div>
  )
}
