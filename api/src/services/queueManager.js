const Queue = require("bull");

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
};

// Create separate queues for different job types
const queues = {
  email: new Queue("emailQueue", { redis: redisConfig }),
  notification: new Queue("notificationQueue", { redis: redisConfig }),
  report: new Queue("reportQueue", { redis: redisConfig }),
  default: new Queue("defaultQueue", { redis: redisConfig }),
};

// Configure each queue with retry settings
Object.values(queues).forEach((queue) => {
  queue.on("error", (error) => {
    console.error(`[Queue ${queue.name}] Error:`, error);
  });
});

// Get appropriate queue based on job type
const getQueue = (jobType) => {
  return queues[jobType] || queues.default;
};

// Get all queues
const getAllQueues = () => {
  return queues;
};

module.exports = {
  getQueue,
  getAllQueues,
  queues,
};
