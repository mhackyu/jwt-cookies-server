const redis = require("redis");
const { promisify } = require("util");
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

module.exports = {
  client,
  getAsync: promisify(client.get).bind(client),
  setAsync: promisify(client.set).bind(client),
  delAsync: promisify(client.del).bind(client)
};
