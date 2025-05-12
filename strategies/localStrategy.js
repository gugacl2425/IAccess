const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const db = require('../scripts/db');

passport.use(new LocalStrategy({
  usernameField: 'email'
}, async (email, password, done) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? AND password_hash IS NOT NULL',
      [email]
    );

    if (!rows.length) return done(null, false);
    const user = rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return done(null, false);

    done(null, user);
  } catch (err) {
    done(err);
  }
}));
