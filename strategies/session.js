// strategies/session.js
const passport = require('passport');
const db = require('../scripts/db');

// Serialize: qué parte del user guardamos en la sesión
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize: cómo reconstruimos req.user a partir de ese id
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
