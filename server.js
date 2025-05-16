require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const db = require('./scripts/db');           // <— Para deserializeUser
const authRoutes = require('./routes/auth.js');
const bcrypt = require('bcrypt');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

const app = express();

// 1) Inicializa Passport strategies
require('./strategies/googleStrategy');
require('./strategies/localStrategy');

// 2) Serialización / deserialización
passport.serializeUser((user, done) => {
  done(null, user.id); // guardamos solo el ID
});
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.query(
      'SELECT id, email, name, picture FROM users WHERE id = ?',
      [id]
    );
    done(null, rows[0] || false);
  } catch (err) {
    done(err);
  }
});

// 3) Middlewares para parsear body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4) Configura sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'y:Srt~SU4hpX>-B',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, sameSite: 'lax', maxAge: 86400000 }
}));

// 5) Inicializa Passport
app.use(passport.initialize());
app.use(passport.session());


// 7) Middleware de protección
function ensureAuth(req, res, next) {
  console.log('>>> ensureAuth:', {
    isAuthenticated: req.isAuthenticated(),
    user: req.user
  });
  if (req.isAuthenticated() || req.user) return next();
  return res.redirect('/login');
}


// 6) Rutas de autenticación
app.use('/auth', authRoutes);



// 8) Archivos estáticos
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 9) Rutas públicas
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'templates', 'home.html'))
);
app.get('/login', (req, res) =>
  res.sendFile(path.join(__dirname, 'templates', 'login.html'))
);
app.get('/register', (req, res) =>
  res.sendFile(path.join(__dirname, 'templates', 'register.html'))
);
app.get('/handsign-login', (req, res) =>
  res.sendFile(path.join(__dirname, 'templates', 'HandSignLogin.html'))
);
app.get('/home', (req, res) =>
  res.sendFile(path.join(__dirname, 'templates', 'home.html'))
);
app.get('/account', (req, res) =>
  res.sendFile(path.join(__dirname, 'templates', 'account.html'))
);

// 10) Rutas protegidas
app.get('/settings', ensureAuth, (req, res) =>
  res.sendFile(path.join(__dirname, 'templates', 'settings.html'))
);
app.get('/profile', ensureAuth, (req, res) => {
  // Evitar cache en el navegador y proxies
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.json({ user: req.user });
});




app.post('/settings/name', ensureAuth, async (req, res, next) => {
  const userId = req.user.id;
  const newName = req.body.name && req.body.name.trim();
  if (!newName) {
    return res.status(400).json({ error: 'Nombre vacío' });
  }
  try {
    await db.query('UPDATE users SET name = ? WHERE id = ?', [newName, userId]);
    req.user.name = newName;
    // Devuelve JSON en lugar de redirect
    return res.json({ success: true, name: newName });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar nombre' });
  }
});

// 10.3) Generar código de 6 caracteres y guardarlo en sesión
app.post('/settings/password-reset-request', ensureAuth, (req, res) => {
  // Genera un código alfanumérico de 6 caracteres
  const code = [...Array(6)].map(() => (
    Math.random().toString(36).charAt(2)
  )).join('').toUpperCase();

  // Guárdalo en la sesión del usuario
  req.session.resetCode = code;
  // Opcional: también guarda un timestamp para caducidad
  req.session.resetAt   = Date.now();

  // Devuelve JSON con el código
  res.json({ success: true, code });
});

// 10.4) Verificar código y cambiar contraseña
app.post('/settings/password-reset-verify', ensureAuth, async (req, res, next) => {
  const { code, newPassword } = req.body;

  // Comprueba que haya un código en sesión y que no caduque en 15 min
  if (!req.session.resetCode ||
      req.session.resetCode !== code.toUpperCase() ||
      Date.now() - (req.session.resetAt||0) > 15*60*1000
  ) {
    return res.status(400).json({ error: 'Código inválido o caducado' });
  }

  // Borra el código para no reutilizarlo
  delete req.session.resetCode;
  delete req.session.resetAt;

  try {
    // Hashea la nueva contraseña
    const hash = await bcrypt.hash(newPassword, 10);
    // Actualiza en la base de datos
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [
      hash, req.user.id
    ]);
    return res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (err) {
    return next(err);
  }
});





// 11) Logout
app.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  });
});

// 12) Inicia servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
