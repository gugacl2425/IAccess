const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');

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

app.listen(4000, () => {
  console.log('Servidor en http://localhost:4000');
});
