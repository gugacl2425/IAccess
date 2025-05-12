// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// Pool de MariaDB
const db = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: 'bitnami',
  database: 'IAccess',
});

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || '8J0|+O"[}k`RX/#',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport serialize/deserialize
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.query('SELECT id, email, name FROM users WHERE id = ?', [id]);
    done(null, rows[0] || false);
  } catch (err) {
    done(err);
  }
});

// Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  'http://localhost:4000/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const name  = profile.displayName;
      // Busca o inserta
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      let user = rows[0];
      if (!user) {
        const [result] = await db.query(
          'INSERT INTO users (email, name, google_id) VALUES (?, ?, ?)',
          [email, name, profile.id]
        );
        user = { id: result.insertId, email, name };
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }
));

const LocalStrategy = require('passport-local').Strategy;

// Agrega esto después de la estrategia de Google
passport.use(new LocalStrategy(
  { usernameField: 'email' }, // Campo esperado
  async (email, password, done) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM users WHERE email = ? AND password_hash IS NOT NULL',
        [email]
      );
      if (!rows.length) return done(null, false);
      
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return done(null, false);
      
      done(null, user); // Usuario válido
    } catch (err) {
      done(err);
    }
  }
));
// Rutas de autenticación Google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html', session: true }),
  (req, res) => {
    // Éxito → vuelve a home.html
    res.redirect('http://localhost:3000/home.html');
  }
);

// Registro clásico
app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, hash, name]
    );
    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'El usuario ya existe' });
    } else {
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  }
});

// Login clásico
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan email o contraseña' });
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? AND password_hash IS NOT NULL',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    // Establece sesión
    req.session.user = { id: user.id, email: user.email, name: user.name };
    res.json({ message: 'Login correcto' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Middleware de protección
function ensureAuth(req, res, next) {
  if (req.isAuthenticated() || req.session.user) return next();
  res.status(401).json({ error: 'No autorizado' });
}

// Perfil (para dynamic-ui.js)
app.get('/profile', ensureAuth, (req, res) => {
  // Si usó Google, está en req.user; si fue login clásico, en req.session.user
  const u = req.user || req.session.user;
  res.json({ user: u });
});

// Logout
app.post('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.sendStatus(204);
  });
});

// Sirve estáticos (si quieres servir tus HTML desde aquí)
app.use(express.static(path.join(__dirname, 'public')));

app.listen(4000, () => {
  console.log('Servidor en http://localhost:4000');
});
