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
