// public/scripts/sidebar.js
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.sidebar-actions button[view]');
  const main = document.querySelector('main.content');

  // Función para cambiar la vista
  function loadView(view) {
    // Marcar botón activo
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('view') === view);
    });

    // Renderizar contenido
   switch (view) {
    case 'dashboard':
      main.innerHTML = `
        <div class="view-container dashboard-view">
          <h1>Dashboard</h1>
          <p>Bienvenido al dashboard de IAccess.</p>
        </div>
      `;
      break;

      case 'settings':
    main.innerHTML = `<div class="view-container settings-view"><p>Cargando settings…</p></div>`;
  // Primero cargamos el perfil
  fetch('/profile', { credentials:'include', cache:'no-store' })
    .then(r => { if(!r.ok) throw new Error('No autorizado'); return r.json(); })
    .then(({ user }) => {
      main.innerHTML = `
        <div class="view-container settings-view">
        <h1>Settings</h1>
        <p>Tu email: <strong>${user.email}</strong></p>

        <!-- Cambiar nombre -->
        <form id="name-form" class="mt-3">
          <div class="mb-3">
            <label class="form-label">Nombre:</label>
            <input type="text" name="name" class="form-control" value="${user.name||''}" required>
          </div>
          <button type="submit" class="btn btn-primary">Guardar nombre</button>
        </form>
        <div id="name-msg" class="mt-2"></div>

        <hr class="my-4">

        <!-- Reset de contraseña -->
        <button id="request-code" class="btn btn-secondary">Cambiar Contraseña</button>
        <div id="request-msg" class="mt-2"></div>

        <form id="reset-form" class="mt-3" style="display:none;">
          <div class="mb-3">
            <label class="form-label">Código recibido:</label>
            <input type="text" name="code" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Nueva contraseña:</label>
            <input type="password" name="newPassword" class="form-control" required>
          </div>
          <button type="submit" class="btn btn-danger">Cambiar contraseña</button>
        </form>
        <div id="reset-msg" class="mt-2"></div>
        </div>
      `;

      // 2.1) Nombre
      document.getElementById('name-form').addEventListener('submit', async e => {
        e.preventDefault();
        const msg = document.getElementById('name-msg');
        msg.textContent = 'Guardando…'; msg.className='text-muted';
        try {
          const res = await fetch('/settings/name', {
            method:'POST', credentials:'include',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ name: e.target.name.value.trim() })
          });
          const j = await res.json();
          if (res.ok && j.success) {
            msg.textContent = 'Nombre actualizado.'; msg.className='text-success';
          } else throw new Error(j.error||'Error');
        } catch(err) {
          msg.textContent = err.message; msg.className='text-danger';
        }
      });

      // 2.2) Enviar código de reset
  // Dentro de case 'settings', tras pintar el formulario:
document.getElementById('request-code').addEventListener('click', async () => {
  const btn = document.getElementById('request-code');
  const msg = document.getElementById('request-msg');
  btn.disabled = true;
  msg.textContent = 'Generando código…';

  try {
    // 1) Genera el código y lo guarda en sesión
    const res = await fetch('/settings/password-reset-request', {
      method: 'POST',
      credentials: 'include'
    });
    const { code } = await res.json();
    if (!res.ok) throw new Error('Error generando código');

    // 2) Calcula la hora de expiración (15 min desde ahora)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const timeString = expiresAt.toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit'
    });

    // 3) Envía el email vía EmailJS
    await emailjs.send(
      'service_bvl77il',           // tu Service ID
      'template_ia_access_otp',    // tu Template ID
      {
        email: user.email,      // si tu template usa {{to_email}}
        passcode: code,            // variable {{passcode}}
        time:     timeString       // variable {{time}}
      }
    );

    msg.textContent = 'Código enviado por correo.';
    msg.className   = 'text-success';
    document.getElementById('reset-form').style.display = 'block';

  } catch (err) {
    console.error(err);
    msg.textContent = 'Error enviando correo: ' + err.message;
    msg.className   = 'text-danger';
  } finally {
    btn.disabled = false;
  }
});


      // 2.3) Verificar código + nueva contraseña
      document.getElementById('reset-form').addEventListener('submit', async e => {
        e.preventDefault();
        const msg = document.getElementById('reset-msg');
        msg.textContent = 'Procesando…'; msg.className='text-muted';
        try {
          const res = await fetch('/settings/password-reset-verify', {
            method:'POST', credentials:'include',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              code: e.target.code.value.trim(),
              newPassword: e.target.newPassword.value
            })
          });
          const j = await res.json();
          if (res.ok && j.success) {
            msg.textContent = j.message; msg.className='text-success';
          } else throw new Error(j.error||'Error');
        } catch(err) {
          msg.textContent = err.message; msg.className='text-danger';
        }
      });
    })
    .catch(err => {
      main.innerHTML = `<p class="text-danger">Error: ${err.message}</p>`;
    });
  break;



      case 'logout':
        // Logout: envía petición y redirige al login
        fetch('/logout', {
          method: 'POST',
          credentials: 'include'
        }).then(() => {
          window.location.href = '/home';
        });
        return;

      default:
    main.innerHTML = `
      <div class="view-container">
        <h1>IAccess</h1>
      </div>
    `;
    }
  }

  // Asociar evento click a cada botón
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('view');
      loadView(view);
    });
  });

  // Cargar vista por defecto (por ejemplo, dashboard)
  loadView('dashboard');
});
