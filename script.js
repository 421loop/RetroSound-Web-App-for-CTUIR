// Audio recording variables
let mediaRecorder;
let audioChunks = [];
let audioBuffer = [];
let isRecording = false;
let stream;
let audioContext;
let recordingStartTime;

// Elements
const permissionScreen = document.getElementById('permissionScreen');
const mainApp = document.getElementById('mainApp');

// MP3 Conversion Function
function convertToMp3(audioBuffer) {
    return new Promise((resolve) => {
        const mp3encoder = new lamejs.Mp3Encoder(1, 44100, 128); // mono, 44.1kHz, 128kbps
        const mp3Data = [];
        
        const samples = new Int16Array(audioBuffer);
        const sampleBlockSize = 1152; // MP3 frame size
        
        for (let i = 0; i < samples.length; i += sampleBlockSize) {
            const sampleChunk = samples.subarray(i, i + sampleBlockSize);
            const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }
        
        // Flush remaining data
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
        
        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        resolve(blob);
    });
}

// Convert WebM to PCM for MP3 encoding
function webmToPcm(webmBlob) {
    return new Promise((resolve, reject) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const fileReader = new FileReader();
        
        fileReader.onload = function(e) {
            audioContext.decodeAudioData(e.target.result)
                .then(audioBuffer => {
                    // Get PCM data (convert to mono if stereo)
                    const pcmData = audioBuffer.getChannelData(0);
                    
                    // Convert Float32Array to Int16Array for MP3 encoder
                    const samples = new Int16Array(pcmData.length);
                    for (let i = 0; i < pcmData.length; i++) {
                        samples[i] = Math.max(-1, Math.min(1, pcmData[i])) * 0x7FFF;
                    }
                    
                    resolve(samples);
                })
                .catch(reject);
        };
        
        fileReader.onerror = reject;
        fileReader.readAsArrayBuffer(webmBlob);
    });
}

// Functions
async function startListening() {
    console.log('Starting audio capture...');
    
    try {
        // Request microphone permission
        stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                sampleRate: 44100
            } 
        });
        
        // Create MediaRecorder with better settings
        const options = {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000
        };
        
        mediaRecorder = new MediaRecorder(stream, options);
        recordingStartTime = Date.now();
        
        // Set up continuous recording
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                const timestamp = Date.now();
                audioBuffer.push({
                    data: event.data,
                    timestamp: timestamp
                });
                
                // Keep only last 35 seconds of audio (extra buffer for safety)
                const bufferTime = 35000;
                const cutoffTime = timestamp - bufferTime;
                audioBuffer = audioBuffer.filter(chunk => chunk.timestamp > cutoffTime);
                
                console.log(`Audio buffer: ${audioBuffer.length} chunks, covering ${Math.round((timestamp - audioBuffer[0]?.timestamp || 0) / 1000)}s`);
            }
        };
        
        // Record in smaller chunks more frequently for better buffering
        mediaRecorder.start(250); // 250ms chunks for smoother buffer
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

async function saveLast30Seconds() {
    if (!isRecording || audioBuffer.length === 0) {
        alert('No audio recorded yet. Please wait a moment and try again.');
        return;
    }
    
    console.log('Saving last 30 seconds as MP3...');
    
    // Show conversion feedback
    const originalText = document.querySelector('.button-text').textContent;
    const originalIcon = document.querySelector('.button-icon').textContent;
    document.querySelector('.button-text').textContent = 'Converting...';
    document.querySelector('.button-icon').textContent = '⚙️';
    
    try {
        // Get chunks from last 30 seconds
        const now = Date.now();
        const thirtySecondsAgo = now - 30000;
        const last30SecondsChunks = audioBuffer.filter(chunk => chunk.timestamp > thirtySecondsAgo);
        
        if (last30SecondsChunks.length === 0) {
            alert('Not enough audio recorded yet. Please wait a bit longer.');
            return;
        }
        
        console.log(`Converting ${last30SecondsChunks.length} chunks covering ${Math.round((now - last30SecondsChunks[0].timestamp) / 1000)} seconds`);
        
        // Combine audio chunks
        const webmBlob = new Blob(
            last30SecondsChunks.map(chunk => chunk.data), 
            { type: 'audio/webm;codecs=opus' }
        );
        
        // Convert WebM to PCM
        const pcmData = await webmToPcm(webmBlob);
        
        // Convert PCM to MP3
        const mp3Blob = await convertToMp3(pcmData);
        
        // Create download link
        const url = URL.createObjectURL(mp3Blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                         new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        
        a.href = url;
        a.download = `retrosound-recording-${timestamp}.mp3`;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the URL
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        console.log('MP3 saved successfully!');
        
        // Show success feedback
        document.querySelector('.button-text').textContent = 'Saved!';
        document.querySelector('.button-icon').textContent = '✅';
        
        setTimeout(() => {
            document.querySelector('.button-text').textContent = originalText;
            document.querySelector('.button-icon').textContent = originalIcon;
        }, 2000);
        
    } catch (error) {
        console.error('Error converting to MP3:', error);
        alert('Error converting audio to MP3. Please try again.');
        
        // Reset button
        document.querySelector('.button-text').textContent = originalText;
        document.querySelector('.button-icon').textContent = originalIcon;
    }
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
