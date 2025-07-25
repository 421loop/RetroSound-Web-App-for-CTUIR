// Elements
const permissionScreen = document.getElementById('permissionScreen');
const mainApp = document.getElementById('mainApp');

// Functions
function startListening() {
    console.log('startListening called');
    permissionScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    console.log('Listening started...');
}

function saveLast30Seconds() {
    console.log('saveLast30Seconds called');
    alert('Saved the last 30 seconds!');
}

console.log('RetroSound loaded successfully');
