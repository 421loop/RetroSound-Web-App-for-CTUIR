// Core configuration
let bufferDuration = 30; // Change this to modify buffer duration (30 = 30 seconds, 60 = 1 minute)

// Global state
let mediaRecorder = null;
let audioStream = null;
let isListening = false;
let audioBuffer = [];
let recordings = [];

// DOM elements
const permissionScreen = document.getElementById('permissionScreen');
const mainApp = document.getElementById('mainApp');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const guidanceText = document.getElementById('guidanceText');
const recordButton = document.getElementById('recordButton');
const errorMessage = document.getElementById('errorMessage');
const recordingsList = document.getElementById('recordingsList');
const notification = document.getElementById('notification');

async function requestMicrophonePermission() {
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 16000
            }
        });
        
        permissionScreen.style.display = 'none';
        mainApp.style.display = 'block';
        showNotification('Microphone access granted!');
        
        initAudioRecording();
        
    } catch (error) {
        const message = error.name === 'NotAllowedError' 
            ? 'Microphone access denied. Please allow access in browser settings.'
            : `Error: ${error.message}`;
        showError(message);
    }
}

function initAudioRecording() {
    mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus'
    });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            audioBuffer.push({
                data: event.data,
                timestamp: Date.now()
            });
            
            // Maintain rolling buffer of specified duration
            const cutoffTime = Date.now() - (bufferDuration * 1000);
            audioBuffer = audioBuffer.filter(chunk => chunk.timestamp > cutoffTime);
        }
    };

    startListening();
}

/* Add all other JavaScript functions here */
/* ... */
