import GestureDetector from './gestureModule.js';

// Elementos del DOM
const video         = document.getElementById('video');
const canvas        = document.getElementById('canvas');
const captureBtn    = document.getElementById('capture-btn');
const nextBtn       = document.getElementById('next-btn');
const submitBtn     = document.getElementById('submit-btn');
const stepLabel     = document.getElementById('step');
const emojis        = [
  document.getElementById('emoji-0'),
  document.getElementById('emoji-1'),
  document.getElementById('emoji-2')
];
const gestureSeqIn  = document.getElementById('gestureSequence');

// Mapeo de label → { id numérico, emoji }
const GESTURES = {
  'Closed_Fist':   { id: 1, emoji: '✊' },
  'Open_Palm':     { id: 2, emoji: '🖐️' },
  'Pointing_Up':   { id: 3, emoji: '☝️' },
  'Thumb_Down':    { id: 4, emoji: '👎' },
  'Thumb_Up':      { id: 5, emoji: '👍' },
  'Victory':       { id: 6, emoji: '✌️' },
  'ILoveYou':      { id: 7, emoji: '🤟' }
};
// Valor para gesto no reconocido
const UNKNOWN = { id: 0, emoji: '❓' };

let detector;
let current = UNKNOWN;
let sequence = [];
let step = 0;

async function init() {
  detector = new GestureDetector(video, canvas);
  await detector.init();
  await detector.startCamera();

  // Cuando detecta un gesto, guarda la última etiqueta válida
  detector.onGesture((label, score) => {
    current = GESTURES[label] || UNKNOWN;
    // Habilita captura si supera umbral, por ejemplo >0.8
    if (current.id !== 0 && score > 0.8) {
      captureBtn.disabled = false;
    }
  });
}

// Actualiza interfaz en cada paso
function updateUI() {
  stepLabel.textContent = step + 1;
  emojis.forEach((el, i) => {
    if (sequence[i] != null) {
      // busca el gesto correspondiente
      const entry = Object.values(GESTURES).find(g => g.id === sequence[i]) || UNKNOWN;
      el.textContent = entry.emoji;
    } else {
      el.textContent = '—';
    }
  });
  captureBtn.disabled = false;
  nextBtn.disabled    = true;
  submitBtn.disabled  = (step < 3);
}

captureBtn.addEventListener('click', () => {
  // Guarda el id numérico en la secuencia
  sequence[step] = current.id;
  updateUI();
  captureBtn.disabled = true;
  nextBtn.disabled    = false;
});

nextBtn.addEventListener('click', () => {
  step++;
  current = UNKNOWN;
  if (step < 3) {
    updateUI();
  } else {
    // Secuencia completa
    gestureSeqIn.value = JSON.stringify(sequence);
    submitBtn.disabled = false;
    // Oculta controles
    captureBtn.style.display = 'none';
    nextBtn.style.display    = 'none';
  }
});

submitBtn.addEventListener('click', async () => {
  // Validaciones básicas
  const email = document.getElementById('email').value.trim();
  if (!email) {
    return alert('Por favor, introduce tu correo.');
  }
  if (sequence.length !== 3) {
    return alert('Debes capturar los 3 gestos antes de iniciar sesión.');
  }

  try {
    const res = await fetch('/auth/HandSignLogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        gestureSequence: JSON.stringify(sequence)
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      // Redirige al éxito
      window.location.href = data.redirect;
    } else {
      // Muestra error
      alert(data.error || 'Error en el inicio por gestos.');
      // Reinicia para volver a intentarlo
      step = 0;
      sequence = [];
      init().then(updateUI);
    }
  } catch (err) {
    console.error(err);
    alert('Error de red, inténtalo de nuevo.');
  }
});

// Arranca detector y UI
init().then(updateUI);
