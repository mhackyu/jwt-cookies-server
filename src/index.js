const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("./jwt");
const redisClient = require("./redis");
const auth = require("./login");
const app = express();
const PORT = process.env.PORT || "3000";

// redisClient.setAsync('name', 'mark')
//   .then((result) => {
//     console.log('YOW', result);
//   }).catch((err) => {
//     console.log(err);
//   });

// redisClient.getAsync('name')
//   .then((result) => {
//     console.log('YOW', result);
//   }).catch((err) => {
//     console.log(err);
//   });

// redisClient.delAsync('name')
//   .then((result) => {
//     console.log('YOW', result);
//   }).catch((err) => {
//     console.log(err);
//   });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);

app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({
    msg: "Welcome!"
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = auth.login(email, password);

  if (!user) {
    return res.status(401).json({
      msg: "Unauthorized error"
    });
  }

  jwt.generateToken(res, { id: user.id });
  res.send({ msg: "Successfully logged in." });
});

app.post("/logout", jwt.verify, (req, res) => {
  redisClient
    .delAsync("name")
    .then(() => {
      delete req.user;
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
      res.send({ msg: "Successfully logged out." });
    })
    .catch((err) => {
      return res
        .status(500)
        .send({ msg: "Error while deleting session in redis.", err });
    });
});

app.get("/verify", jwt.verify, (req, res) => {
  res.send({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`Application is listening to PORT ${PORT}`);
});
