const Queue = require("bull");

const jobQueue = new Queue("jobQueue", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
});

module.exports = jobQueue;
