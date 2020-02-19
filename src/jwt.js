const jwt = require('jsonwebtoken');
const redisClient = require('./redis');
const secretKey = process.env.JWT_SECRET_KEY;

module.exports.generateToken = (res, data) => {
  // 1d is equivalent to 86400000
  const token = jwt.sign(data, secretKey, { expiresIn: '1d' });
  redisClient.set(data.id, token, (err) => {
    if (err) {
      return res.status(500).send({
        msg: 'Failed to create session.'
      });
    }

    console.log('SET redis ', token);
  });

  return res.cookie('access_token', token, {
    expires: new Date(Date.now() + 86400000),
    // secure: process.env.SECURE, // set to true if your using https
    secure: true, // set to true if your using https
    httpOnly: true,
  });
};

module.exports.verify = (req, res , next) => {
  const token = req.cookies.access_token || '';
  if (!token) {
    return res.status(401).send({ msg: 'Unauthorized error.'});
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).send({ msg: 'Unauthorized error.'});
    }

    redisClient.get(decoded.id, (err, val) => {
      if (err) {
        console.log('Something went wrong while getting session from redis.');
      }
      
      console.log('GET redis ', val);
      if (val) {
        req.user = decoded;
      } else {
        return res.status(401).send({ msg: 'Unauthorized error.'});
      }
      next();
    });
  });

};
