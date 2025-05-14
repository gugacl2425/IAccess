const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const db = require('../scripts/db.js');

const router = express.Router();

// 1) LOGIN LOCAL: dejamos que Passport maneje todo
router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login?error=1'
  })
);

// 2) REGISTER mantiene tu lógica igual
router.post('/register', async (req, res, next) => {
  const { email, password, confirmPassword, name } = req.body;
  if (!email || !password || !confirmPassword || !name) {
    return res.redirect(302, '/register?error=missing');
  }
  if (password !== confirmPassword) {
    return res.redirect(302, '/register?error=nomatch');
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, hash, name]
    );
    return res.redirect(302, '/login?registered=1');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.redirect(302, '/register?error=exists');
    }
    return next(err);
  }
});

// 3) HANDSIGN: validamos y luego usamos req.login para que Passport cree la sesión
router.post('/HandSignLogin', async (req, res, next) => {
  const { email, gestureSequence } = req.body;
  if (!email || !gestureSequence) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }
  let sequence;
  try {
    sequence = JSON.parse(gestureSequence);
    if (!Array.isArray(sequence) || sequence.length !== 3) {
      throw new Error('Formato inválido');
    }
  } catch (err) {
    return res.status(400).json({ error: 'Secuencia inválida' });
  }
  try {
    const [rows] = await db.query(
      'SELECT id, email, name, preferences FROM users WHERE email = ?',
      [email]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = rows[0];
    const expected = JSON.parse(user.preferences);  // ej. [2,5,7]
    const matches =
      expected.length === sequence.length &&
      expected.every((v, i) => v === sequence[i]);
    if (!matches) {
      return res.status(401).json({ error: 'Secuencia de gestos incorrecta' });
    }
    // Aquí Passport serializa para ti
    req.login(user, (err) => {
      if (err) return next(err);
      return res.json({ success: true, redirect: '/settings' });
    });
  } catch (err) {
    console.error('Error en HandSignLogin:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 4) GOOGLE OAUTH
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.send(`
      <html><body>
        <script>
          window.opener.location.reload();
          window.close();
        </script>
      </body></html>
    `);
  }
);

module.exports = router;
