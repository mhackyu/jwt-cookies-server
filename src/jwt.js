const jwt = require("jsonwebtoken");
const redisClient = require("./redis");
const secretKey = process.env.JWT_SECRET_KEY;
const expiresIn = process.env.JWT_EXPIRES_IN;

const generateRandomId = () => {
  return (
    Math.random()
      .toString(36)
      .substring(2, 15) +
    Math.random()
      .toString(36)
      .substring(2, 15)
  );
};

const generateToken = (res, data) => {
  const sessionId = generateRandomId();
  let accessToken = jwt.sign({ id: sessionId, uid: data.uid }, secretKey, {
    expiresIn
  });

  // redisClient.setAsync(sessionId, accessToken);
  redisClient.setAsync(
    data.uid,
    JSON.stringify({ id: sessionId, uid: data.uid, accessToken })
  );

  console.log("SESSION ID: ", sessionId);
  console.log("GENERATED JWT: ", accessToken);

  // 1d is equivalent to 86400000
  return res.cookie("access_token", accessToken, {
    expires: new Date(Date.now() + 86400000),
    secure: process.env.SECURE == "true", // set to true if your using https
    httpOnly: true
  });
};

const verify = async (req, res, next) => {
  const accessToken = req.cookies.access_token || "";

  if (!accessToken) {
    console.log("NO ACCESS TOKEN ERROR");
    return res.status(401).send({ msg: "Unauthorized error." });
  }

  try {
    const decoded = jwt.verify(accessToken, secretKey);
    const redisResult = await redisClient.getAsync(decoded.uid);
    const redisSession = JSON.parse(redisResult);

    console.log("REDIS ", redisSession);

    if (!redisSession) {
      console.log("NO SESSION FOUND ERROR");
      return res.status(401).send({ msg: "Unauthorized error." });
    }

    if (redisSession.accessToken != accessToken) {
      console.log("INVALID ACCESS TOKEN ERROR", redisSession.accessToken);
      return res.status(401).send({ msg: "Unauthorized error." });
    }
    req.user = { id: decoded.id, uid: decoded.uid };
    next();
  } catch (error) {
    console.log("ERROR", error);
    return res.status(401).send({ msg: "Unauthorized error." });
  }
};

module.exports = {
  generateToken,
  verify
};
