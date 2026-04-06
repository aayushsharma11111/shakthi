const sosBtn = document.getElementById('sos-btn');
const pulseRing = document.querySelector('.pulse-ring');
const statusMessage = document.getElementById('status-message');
const cancelBtn = document.getElementById('cancel-btn');
const soundToggle = document.getElementById('sound-toggle');
const progressCircle = document.querySelector('.progress-ring__circle');
const progressSvg = document.querySelector('.progress-ring');

let countdownInterval;
let timeLeft = 5;
let isAlertActive = false;
let isCountingDown = false;
let soundEnabled = true;

// Audio Context for Siren
let audioCtx;
let oscillatorInterval;
let gainNode;

// Progress circle setup
const radius = progressCircle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;

progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = circumference;

function setProgress(percent) {
    const offset = circumference - percent / 100 * circumference;
    progressCircle.style.strokeDashoffset = offset;
}

// Ensure AudioContext is ready upon user interaction
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSiren() {
    if (!soundEnabled) return;
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 0.3; // Volume

    oscillatorInterval = setInterval(() => {
        const osc = audioCtx.createOscillator();
        osc.type = 'square';
        // Alternating high and low pitch like a harsh siren
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.2);
        
        osc.connect(gainNode);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    }, 400);
}

function stopSiren() {
    if (oscillatorInterval) {
        clearInterval(oscillatorInterval);
        oscillatorInterval = null;
    }
}

function startVibration() {
    if (navigator.vibrate) {
        // Vibrate repeatedly: vibrate 500ms, pause 250ms
        navigator.vibrate([500, 250, 500, 250, 500, 250, 500, 250, 500, 250, 500, 250, 500, 250, 500]);
    }
}

function stopVibration() {
    if (navigator.vibrate) {
        navigator.vibrate(0);
    }
}

function startSOS() {
    if (isAlertActive || isCountingDown) return;
    
    initAudio(); // Initialize audio context on first interaction
    
    isCountingDown = true;
    timeLeft = 5;
    
    // UI Updates
    sosBtn.classList.add('counting-down');
    pulseRing.classList.add('hide');
    cancelBtn.classList.add('show');
    progressSvg.classList.add('show');
    
    statusMessage.textContent = `Sending alert in ${timeLeft}...`;
    statusMessage.className = 'status-message warning';
    sosBtn.textContent = timeLeft;
    setProgress(100);

    countdownInterval = setInterval(() => {
        timeLeft--;
        
        if (timeLeft > 0) {
            sosBtn.textContent = timeLeft;
            statusMessage.textContent = `Sending alert in ${timeLeft}...`;
            setProgress((timeLeft / 5) * 100);
        } else {
            sendAlert();
        }
    }, 1000);
}

function cancelSOS() {
    if (!isCountingDown && !isAlertActive) return;

    // Stop countdown and alert
    clearInterval(countdownInterval);
    isCountingDown = false;
    isAlertActive = false;
    
    stopSiren();
    stopVibration();

    // Reset UI
    document.body.classList.remove('alert-active');
    sosBtn.classList.remove('counting-down', 'alert-sent');
    sosBtn.textContent = 'SOS';
    pulseRing.classList.remove('hide');
    cancelBtn.classList.remove('show');
    progressSvg.classList.remove('show');
    
    statusMessage.textContent = 'Alert Cancelled';
    statusMessage.className = 'status-message success';
    setProgress(100);

    // Reset message after 3 seconds
    setTimeout(() => {
        if (!isCountingDown && !isAlertActive) {
            statusMessage.textContent = 'Tap to send emergency alert';
            statusMessage.className = 'status-message';
        }
    }, 3000);
}

function sendAlert() {
    clearInterval(countdownInterval);
    isCountingDown = false;
    isAlertActive = true;
    
    // Trigger multimedia
    playSiren();
    startVibration();

    // UI Updates
    document.body.classList.add('alert-active');
    sosBtn.classList.remove('counting-down');
    sosBtn.classList.add('alert-sent');
    sosBtn.innerHTML = '🚨';
    
    progressSvg.classList.remove('show');
    cancelBtn.textContent = 'Stop Alert';
    
    statusMessage.textContent = '🚨 EMERGENCY ALERT SENT! 🚨';
    statusMessage.className = 'status-message danger';
}

// Event Listeners
sosBtn.addEventListener('click', () => {
    if (!isCountingDown && !isAlertActive) {
        startSOS();
    }
});

cancelBtn.addEventListener('click', () => {
    cancelSOS();
    cancelBtn.textContent = 'Cancel Alert'; // Reset text just in case
});

soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        soundToggle.innerHTML = '🔔';
        soundToggle.title = "Mute Sound";
    } else {
        soundToggle.innerHTML = '🔕';
        soundToggle.title = "Enable Sound";
        if (isAlertActive) stopSiren();
    }
});
