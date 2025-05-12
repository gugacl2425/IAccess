// ../scripts/oauth.js

function handleCredentialResponse(response) {
  fetch("http://localhost:4000/verify-token", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: response.credential })
  })
    .then(res => {
      if (!res.ok) throw new Error("Token inválido");
      return res.json();
    })
    .then(data => {
      window.location.href = "home.html";
    })
    .catch(err => {
      console.error("Error al verificar token:", err);
      alert("Error al iniciar sesión con Google");
    });
}

export default function initGoogleOAuth() {
  if (!window.google?.accounts?.id) return;
  const btnContainer = document.getElementById("google-signin-button");
  if (!btnContainer) return;

  google.accounts.id.initialize({
    client_id: "1033663439401-ba1dh9l4c09v7fsoh2kknoa7fv459bvu.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    btnContainer,
    { type: "icon", shape: "circle", theme: "outline", size: "large" }
  );

  google.accounts.id.prompt();
}
