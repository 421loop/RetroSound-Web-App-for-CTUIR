// Core configuration
let bufferDuration = 30; // Change this to modify buffer duration (30 = 30 seconds, 60 = 1 minute)

// Global state
let mediaRecorder = null
let audioStream = null
let isListening = false
let audioBuffer = []
let recordings = []

// DOM elements
const permissionScreen = document.getElementById('permissionScreen')
const mainApp = document.getElementById('mainApp')
const statusDot = document.getElementById('statusDot')
const statusText = document.getElementById('statusText')
const guidanceText = document.getElementById('guidanceText')
const recordButton = document.getElementById('recordButton')
const errorMessage = document.getElementById('errorMessage')
const recordingsList = document.getElementById('recordingsList')
const notification = document.getElementById('notification')

async function requestMicrophonePermission() {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      },
    })

    permissionScreen.style.display = 'none'
    mainApp.style.display = 'block'
    showNotification('Microphone access granted!')

    initAudioRecording()
  } catch (error) {
    const message =
      error.name === 'NotAllowedError'
        ? 'Microphone access denied. Please allow access in browser settings.'
        : `Error: ${error.message}`
    showError(message)
  }
}

function initAudioRecording() {
  mediaRecorder = new MediaRecorder(audioStream, {
    mimeType: 'audio/webm;codecs=opus',
  })

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioBuffer.push({
        data: event.data,
        timestamp: Date.now(),
      })

      // Maintain rolling buffer of specified duration
      const cutoffTime = Date.now() - bufferDuration * 1000
      audioBuffer = audioBuffer.filter((chunk) => chunk.timestamp > cutoffTime)
    }
  }

  // Automatically start listening
  startListening()
}

function handleButtonPress() {
  if (isListening) {
    saveRecording()
  }
}

function startListening() {
  mediaRecorder.start(100) // Record in 100ms chunks
  isListening = true

  updateStatus('listening', 'Listening continuously...')
  updateButton('💾', 'Save Last 30s')
  recordButton.classList.add('listening')
  recordButton.disabled = false

  showNotification('Now listening continuously - press button to save recordings')
}

function saveRecording() {
  if (audioBuffer.length === 0) {
    showError('No audio data to save')
    return
  }

  // Temporarily disable button and show saving state
  recordButton.disabled = true
  updateStatus('recording', 'Saving recording...')
  recordButton.classList.remove('listening')
  recordButton.classList.add('recording')

  const recordingData = audioBuffer.map((chunk) => chunk.data)
  const blob = new Blob(recordingData, { type: 'audio/webm;codecs=opus' })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `recording_${timestamp}.webm`

  const recording = {
    id: Date.now(),
    name: filename,
    blob: blob,
    timestamp: new Date(),
    duration: bufferDuration,
  }

  recordings.unshift(recording)
  updateRecordingsList()

  showNotification('Recording saved! Continue listening...')

  // Reset to listening state after brief delay
  setTimeout(() => {
    updateStatus('listening', 'Listening continuously...')
    updateButton('💾', 'Save Last 30s')
    recordButton.classList.remove('recording')
    recordButton.classList.add('listening')
    recordButton.disabled = false
  }, 1000)
}

function updateStatus(status, text) {
  statusDot.className = `status-dot ${status}`
  statusText.textContent = text
}

function updateButton(icon, text) {
  recordButton.innerHTML = `
    <div class="button-icon">${icon}</div>
    <div class="button-text">${text}</div>
  `
}

function updateRecordingsList() {
  recordingsList.innerHTML = ''

  recordings.forEach((recording) => {
    const item = document.createElement('div')
    item.className = 'recording-item'
    item.innerHTML = `
      <div class="recording-info">
        <div class="recording-name">${recording.name}</div>
        <div class="recording-time">${recording.timestamp.toLocaleString()}</div>
      </div>
      <button class="download-btn" onclick="downloadRecording(${recording.id})">
        Download
      </button>
    `
    recordingsList.appendChild(item)
  })
}

function downloadRecording(id) {
  const recording = recordings.find((r) => r.id === id)
  if (!recording) return

  const url = URL
