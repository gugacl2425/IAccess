require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const authRoutes = require('./routes/auth');

const app = express();

// Inicializa Passport strategies
require('./strategies/googleStrategy');
require('./strategies/localStrategy');

// Middleware JSON
app.use(express.json());

// Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'y:Srt~SU4hpX>-B',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, sameSite: 'lax', maxAge: 86400000 }
}));

// Inicializa Passport
app.use(passport.initialize());
app.use(passport.session());

// Rutas de autenticación (login, register, Google OAuth)
app.use('/auth', authRoutes);

// Middleware para proteger vistas
function ensureAuth(req, res, next) {
  if (req.isAuthenticated() || req.session.user) return next();
  res.redirect('/');
}

// Carpeta de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Vistas abiertas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'home.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'register.html'));
});

// Vistas protegidas
app.get('/home', ensureAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'home.html'));
});
app.get('/account', ensureAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'account.html'));
});
app.get('/settings', ensureAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'settings.html'));
});

// Perfil (API) protegido
app.get('/profile', ensureAuth, (req, res) => {
  const user = req.user || req.session.user;
  res.json({ user });
});

// Logout
app.post('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// Inicia servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
