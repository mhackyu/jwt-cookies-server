const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('./jwt');
const redisClient = require('./redis');
const auth = require('./login');
const app = express();
const PORT = process.env.PORT || '3000';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(cookieParser());

app.get('/', (req, res) => {
  res.send({
    msg: 'Welcome!'
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = auth.login(email, password);

  if (!user) {
    return res.status(401).json({
      msg: 'Unauthorized error'
    });
  }

  jwt.generateToken(res, { id: user.id, email: user.email });
  res.send({ msg: 'Successfully logged in.' });
});

app.post('/logout', jwt.verify, (req, res) => {
  redisClient.del(req.user.id, (err) => {
    if (err) {
      return res.status(500).send({ msg: 'Error while deleting session in redis.' });
    }
    console.log('DEL redis ', req.user.id);
    delete req.user;
    res.send({ msg: 'Successfully logged out.' });
  });
});

app.get('/verify', jwt.verify, (req, res) => {
  res.send({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`Application is listening to PORT ${PORT}`);
});