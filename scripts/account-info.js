// public/scripts/account-info.js
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/profile", {
      credentials: 'include',
      cache: 'no-store'
    });
    if (!res.ok) throw new Error("No autenticado");
    const { user } = await res.json();


    document.getElementById("user-name").textContent = user.name;
    document.getElementById("user-email").textContent = user.email || "–";
    document.getElementById("user-name-header").textContent = user.name;

    const picHeader = document.getElementById("user-picture-header");
    const picMain   = document.getElementById("user-picture");
    if (user.picture) {
      picHeader.src = user.picture;
      picMain.src   = user.picture;
    } else {
      picHeader.src = "/images/default-avatar.jpg";
      if (picMain) picMain.style.display = "none";
    }

    document.getElementById("logout-btn").addEventListener("click", () => {
      fetch("/logout", {
        method: "POST",
        credentials: 'include'
      }).then(() => {
        window.location.href = "/login";
      });
    });

  } catch (err) {
    console.warn("No se pudo obtener perfil:", err);
  }
});
