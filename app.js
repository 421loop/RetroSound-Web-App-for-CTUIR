// Elements
const permissionScreen = document.getElementById('permissionScreen');
const mainApp = document.getElementById('mainApp');

// Functions
function startListening() {
  permissionScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  console.log('Listening started...');
}

function saveLast30Seconds() {
  alert('Saved the last 30 seconds!');
}
