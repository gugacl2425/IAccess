window.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("google_user") || "{}");
  
    if (!user || !user.name) {
      window.location.href = "home.html";
      return;
    }
  

    const picHeader = document.getElementById("user-picture-header");
    const nameHeader = document.getElementById("user-name-header");
  
    if (user.picture) {
      picHeader.src = user.picture;
    } else {
      picHeader.src = "/images/default-avatar.jpg"; 
    }
    nameHeader.textContent = user.name;
  
    document.getElementById("user-name").textContent = user.name;
    document.getElementById("user-email").textContent = user.email || "–";
    const picMain = document.getElementById("user-picture");
    if (user.picture) {
      picMain.src = user.picture;
    } else {
      picMain.style.display = "none";
    }
  

    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "home.html";
    });
  });
  