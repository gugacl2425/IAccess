const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const db = require('../scripts/db.js'); // conexión pool a MariaDB
const router = express.Router();

// Login clásico
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    req.login(user, (err) => {
      if (err) return next(err);
      req.session.user = { id: user.id, email: user.email, name: user.name };
      res.json({ message: 'Login exitoso' });
    });
  })(req, res, next);
});

// Registro clásico
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Faltan campos' });

  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, hash, name]
    );
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'El usuario ya existe' });
    } else {
      res.status(500).json({ error: 'Error interno' });
    }
  }
});

// Google login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/home');
  }
);

module.exports = router;
