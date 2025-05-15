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
          <h1>Dashboard</h1>
          <p>Bienvenido al dashboard de IAccess.</p>
        `;
        break;

      case 'settings':
  main.innerHTML = `<p>Cargando settings…</p>`;
  fetch('/profile', { credentials: 'include', cache: 'no-store' })
    .then(res => { if (!res.ok) throw new Error('No autorizado'); return res.json(); })
    .then(({ user }) => {
      main.innerHTML = `
        <h1>Settings</h1>
        <p>Cambia tu nombre de usuario:</p>
        <form id="name-form" class="mt-3">
          <div class="mb-3">
            <label for="name" class="form-label">Nuevo nombre:</label>
            <input
              type="text" id="name" name="name"
              class="form-control" value="${user.name||''}" required
            />
          </div>
          <button type="submit" class="btn btn-primary">Guardar</button>
        </form>
        <div id="name-msg" class="mt-2"></div>
      `;

      // Ahora interceptamos el submit
      const form = document.getElementById('name-form');
      const msg  = document.getElementById('name-msg');
      form.addEventListener('submit', async e => {
        e.preventDefault();
        msg.textContent = 'Guardando…';
        msg.className = 'text-muted';

        const newName = form.name.value.trim();
        try {
          const res = await fetch('/settings/name', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
          });
          const body = await res.json();
          if (res.ok && body.success) {
            msg.textContent = 'Nombre actualizado correctamente.';
            msg.className = 'text-success';
          } else {
            throw new Error(body.error || 'Falló la actualización');
          }
        } catch (err) {
          msg.textContent = 'Error: ' + err.message;
          msg.className = 'text-danger';
        }
      });
    })
    .catch(err => {
      main.innerHTML = `<p class="text-danger">Error al cargar settings: ${err.message}</p>`;
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
        main.innerHTML = '<h1>IAccess</h1>';
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
