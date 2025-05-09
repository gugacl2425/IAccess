const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: 'bitnami',
  database: 'IAccess',
});

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = "1033663439401-ba1dh9l4c09v7fsoh2kknoa7fv459bvu.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

app.post('/verify-token', async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    res.json({ user: payload });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
});


app.post('/register', async (req, res) => {
  const { email, password} = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan email o contraseña' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);


    await db.query(
      `INSERT INTO users (email, password_hash /*, preferences */)
       VALUES (?, ? /*, ? */)`,
      [
        email,
        hash,
      ]
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
    if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });
    // Aquí podrías crear un JWT o sesión
    res.json({ message: 'Login correcto', user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});


app.listen(4000, () => {
  console.log('Servidor en http://localhost:4000');
});
