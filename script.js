// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const permissionScreen = document.getElementById('permissionScreen');
    const mainApp = document.getElementById('mainApp');
    const enableBtn = document.getElementById('enableBtn');
    const recordBtn = document.getElementById('recordBtn');

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

    // Event listeners
    enableBtn.addEventListener('click', startListening);
    recordBtn.addEventListener('click', saveLast30Seconds);

    console.log('RetroSound loaded successfully');
    console.log('Elements found:', {
        permissionScreen: !!permissionScreen,
        mainApp: !!mainApp,
        enableBtn: !!enableBtn,
        recordBtn: !!recordBtn
    });
});
