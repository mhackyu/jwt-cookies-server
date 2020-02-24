const jwt = require("jsonwebtoken");
const redisClient = require("./redis");
const secretKey = process.env.JWT_SECRET_KEY;

const generateRefreshToken = () => {
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
  console.log('GENERATING NEW TOKEN ', { data });
  // 1d is equivalent to 86400000
  // 60 * 10
  let accessToken = jwt.sign(data, secretKey, { expiresIn: "10000" });
  let refreshToken = generateRefreshToken();
  // const refreshTokenMaxAge = new Date();
  // refreshTokenMaxAge.setDate(refreshTokenMaxAge.getDate() + 30); // Set now + 30 days as the new date
  const refreshTokenMaxAge = new Date();
  refreshTokenMaxAge.setSeconds(refreshTokenMaxAge.getSeconds() + 10);

  redisClient.setAsync(
    data.id,
    JSON.stringify({
      accessToken,
      refreshToken,
      refreshTokenMaxAge
    })
  );

  res.cookie("access_token", accessToken, {
    secure: process.env.SECURE == "true", // set to true if your using https
    httpOnly: true
    // expires: new Date(Date.now() + 86400000),
    // sameSite: none
  });

  res.cookie("refresh_token", refreshToken, {
    secure: process.env.SECURE == "true", // set to true if your using https
    httpOnly: true
    // expires: new Date(Date.now() + 86400000),
    // sameSite: none
  });

  console.log('NEW TOKEN IS CREATED');
};

const verify = (req, res, next) => {
  let accessToken = req.cookies.access_token || "";
  let refreshToken = req.cookies.refresh_token || "";

  if (!accessToken && !refreshToken) {
    return res.status(401).send({ msg: "Unauthorized error." });
  }
  
  try {
    jwt.verify(accessToken, secretKey, async (err, decodedToken) => {

      if (err) {
        // If token is already expired
        if (err.hasOwnProperty('name') && err.name == "TokenExpiredError") {
          console.log('ACCESS_TOKEN IS ALREADY EXPIRED');
          const decoded = jwt.decode(accessToken, secretKey);
          let redisVal = await redisClient.getAsync(decoded.id);

          if (!redisVal) return res.status(401).send({ msg: "Unauthorized error." });
          
          let redisToken = JSON.parse(redisVal);

          console.log('REDIS CURRENT REFRESH TOKEN: ', redisToken.refreshToken);
          console.log('REQ CURRENT REFRESH TOKEN: ', refreshToken);
          
          if (redisToken.refreshToken != refreshToken) {
            console.log('REFRESH TOKEN IS INVALID');
            return res.status(401).send({ msg: "Unauthorized error." });
          }

          // Generate new access and refresh tokens if refresh token is still valid
          // TODO:
          if (new Date(redisToken.refreshTokenMaxAge) < new Date()) {
            console.log('REFRESH TOKEN IS ALREADY EXPIRED');
            // console.log(new Date(redisToken.refreshTokenMaxAge));
            return res.status(401).send({ msg: "Unauthorized error." });
          }

          const { id } = decoded;
          generateToken(res, { id });
        } else {
          req.user = decodedToken;
          next();
        }
        
        // return res.status(401).send({ msg: "Unauthorized error." });
      }
      
      // if (err.name == "TokenExpiredError") {
        // console.log('DECODED: ', decoded);
      // }

      // redisToken = await redisClient.getAsync(decoded.id);
      // if (redisToken) {
      //   req.user = decoded;
      // } else {
      //   return res.status(401).send({ msg: "Unauthorized error." });
      // }
      
    });
    
  } catch (error) {
    return res.status(401).send({ msg: "Unauthorized error." });
  }
};

module.exports = {
  generateToken,
  verify
};
