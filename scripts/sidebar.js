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
        main.innerHTML = `
          <h1>Settings</h1>
          <p>Aquí puedes cambiar tus ajustes de usuario.</p>
          <!-- Si necesitas, carga más HTML o llama a otros scripts -->
        `;
        break;

      case 'logout':
        // Logout: envía petición y redirige al login
        fetch('/logout', {
          method: 'POST',
          credentials: 'include'
        }).then(() => {
          window.location.href = '/login';
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
