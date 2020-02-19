const redis = require("redis");
const config = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
};

const client = redis.createClient(config);

client.on("error", function(error) {
  console.error(error);
});

client.on("connect", function() {
  console.log("Connected to redis server");
});

module.exports = client;