// public/scripts/dynamic-ui.js
export default async function renderUI() {
  const container = document.getElementById('app');

  let user = null;
  try {
    const res = await fetch('/profile', { credentials: 'include' });
    if (res.ok) {
      ({ user } = await res.json());
    }
  } catch {
    /* ignore */
  }

  if (user) {
    // INTERFAZ LOGUEADO
    container.innerHTML = `
      <header class="site-header">
        <div class="header-title">IAccess</div>
        <nav class="header-nav">
          <div class="user-header-info dropdown">
            <img id="user-picture-header" src="${user.picture || '/images/default.png'}"
                 class="rounded-circle dropdown-toggle" style="width:40px;height:40px;cursor:pointer;"
                 data-bs-toggle="dropdown" aria-expanded="false"/>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><h6 class="dropdown-header" id="user-name-header">${user.name}</h6></li>
              <li><a class="dropdown-item" href="/settings">Settings</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item" id="logout-btn">Logout</button></li>
            </ul>
          </div>
        </nav>
      </header>
    `;
    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
      await fetch('/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.reload();
    });

  } else {
    // INTERFAZ NO LOGUEADO
    container.innerHTML = `
      <header class="site-header">
        <div class="header-title">IAccess</div>
        <nav class="header-nav">

        <button id="google-popup-btn" class="btn btn-outline-danger me-2">
            <i class="bi bi-google me-1"></i> Entrar con Google
        </button>

          <button class="btn-handsign">HandSign Login</button>
          <button class="btn-alt" onclick="location.href='/login'">Login</button>
          <button class="btn-alt" onclick="location.href='/register'">Register</button>
        </nav>
      </header>
    `;
    document.getElementById('google-popup-btn').addEventListener('click', () => {
      const oauthURL = window.GOOGLE_LOGIN_URI || '/auth/google';
      const width = 500, height = 600;
      const left = (window.screen.width - width) / 2;
      const top  = (window.screen.height - height) / 2;

      const popup = window.open(
        oauthURL,
        'google_oauth',
        `width=${width},height=${height},top=${top},left=${left},resizable,scrollbars`
      );

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          window.location.reload();
        }
      }, 500);
    });
  }
}

renderUI();
