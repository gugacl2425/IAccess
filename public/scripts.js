// Este script usa Google Identity Services para OAuth2
function handleCredentialResponse(response) {
  fetch('http://localhost:4000/auth/google/token', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: response.credential })
  })
    .then(res => {
      if (!res.ok) throw new Error('Token inválido');
      return res.json();
    })
    .then(() => {
      window.location.href = 'home.html';
    })
    .catch(err => {
      console.error('Error al verificar token:', err);
      alert('Error al iniciar sesión con Google');
    });
}

export default function initGoogleOAuth() {
  if (!window.google?.accounts?.id) return;
  google.accounts.id.initialize({
    client_id: process.env.GOOGLE_CLIENT_ID || 'TU_CLIENT_ID',
    callback: handleCredentialResponse
  });
  google.accounts.id.renderButton(
    document.getElementById('google-signin-button'),
    { type: 'icon', theme: 'outline', size: 'large' }
  );
  google.accounts.id.prompt();
}

// Inicializa al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  import('./oauth.js').then(module => module.default());
});