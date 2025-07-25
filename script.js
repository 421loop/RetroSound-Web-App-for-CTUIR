// Audio recording variables
let mediaRecorder;
let audioChunks = [];
let audioBuffer = [];
let isRecording = false;
let audioContext;
let stream;

// Elements
const permissionScreen = document.getElementById('permissionScreen');
const mainApp = document.getElementById('mainApp');

// Functions
async function startListening() {
    console.log('Starting audio capture...');
    
    try {
        // Request microphone permission
        stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            } 
        });
        
        // Create MediaRecorder
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        
        // Set up continuous recording in chunks
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioBuffer.push({
                    data: event.data,
                    timestamp: Date.now()
                });
                
                // Keep only last 30 seconds of audio
                const thirtySecondsAgo = Date.now() - 30000;
                audioBuffer = audioBuffer.filter(chunk => chunk.timestamp > thirtySecondsAgo);
            }
        };
        
        // Start recording in 1-second intervals
        mediaRecorder.start(1000);
        isRecording = true;
        
        // Switch to main app view
        permissionScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        console.log('Audio recording started successfully!');
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions and try again.');
    }
}

function saveLast30Seconds() {
    if (!isRecording || audioBuffer.length === 0) {
        alert('No audio recorded yet. Please wait a moment and try again.');
        return;
    }
    
    console.log('Saving last 30 seconds...');
    
    // Combine all audio chunks from the buffer
    const audioBlob = new Blob(
        audioBuffer.map(chunk => chunk.data), 
        { type: 'audio/webm;codecs=opus' }
    );
    
    // Create download link
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    a.href = url;
    a.download = `retrosound-${timestamp}.webm`;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    console.log('Audio saved successfully!');
    
    // Show success feedback
    const originalText = document.querySelector('.button-text').textContent;
    document.querySelector('.button-text').textContent = 'Saved!';
    document.querySelector('.button-icon').textContent = '✅';
    
    setTimeout(() => {
        document.querySelector('.button-text').textContent = originalText;
        document.querySelector('.button-icon').textContent = '💾';
    }, 2000);
}

// Cleanup function
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    isRecording = false;
}

// Handle page unload
window.addEventListener('beforeunload', stopRecording);

console.log('RetroSound loaded successfully');
