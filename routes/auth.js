const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const db = require('../scripts/db.js');
const router = express.Router();




router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    req.login(user, (err) => {
      if (err) return next(err);
      req.session.user = { id: user.id, email: user.email, name: user.name };
        return res.redirect('/settings');
    });


  })(req, res, next);
});

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

// POST /auth/HandSignLogin
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
    // Busca al usuario y sus preferencias
    const [rows] = await db.query(
      'SELECT id, email, name, preferences FROM users WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = rows[0];
    const expected = JSON.parse(user.preferences);  // ej. [2,5,7]
    // Compara secuencias
    const matches = expected.length === sequence.length
      && expected.every((val, idx) => val === sequence[idx]);

    if (!matches) {
      return res.status(401).json({ error: 'Secuencia de gestos incorrecta' });
    }

    // Autentica manualmente el usuario
    req.session.user = { id: user.id, email: user.email, name: user.name };
    // Si quieres usar req.login() de Passport, podrías serializar el objeto usuario:
    // req.login(user, err => { if (err) return next(err); ... });

    return res.json({ success: true, redirect: '/settings' });
  } catch (err) {
    console.error('Error en HandSignLogin:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});
module.exports = router;




router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.send(`
      <html>
      <body>
        <script>
          // Refresca la ventana padre para que detecte la sesión
          window.opener.location.reload();
          // Cierra esta ventana popup
          window.close();
        </script>
      </body>
      </html>
    `);
  }
);

module.exports = router;
