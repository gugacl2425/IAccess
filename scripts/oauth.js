function handleCredentialResponse(response) {
  fetch("http://localhost:4000/verify-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: response.credential })
  })
  .then(res => {
    if (!res.ok) throw new Error("Token inválido");
    return res.json();
  })
  .then(data => {
    localStorage.setItem("google_token", response.credential);
    localStorage.setItem("google_user", JSON.stringify(data.user));
    window.location.href = "account.html";
  });
}

window.onload = () => {
  google.accounts.id.initialize({
    client_id: "1033663439401-ba1dh9l4c09v7fsoh2kknoa7fv459bvu.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("google-signin-button"),
    {
      type: "icon",
      shape: "circle",
      theme: "outline",
      size: "large"
    }
  );

  google.accounts.id.prompt();
};
