const pool = require("../config/database");
const { getAllQueues } = require("../services/queueManager");

const getHealth = async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
  };

  try {
    // Check database connection
    await pool.query("SELECT 1");
    health.services.database = "connected";
  } catch (error) {
    health.services.database = "disconnected";
    health.status = "unhealthy";
  }

  try {
    // Check Redis connection
    const queues = getAllQueues();
    const firstQueue = Object.values(queues)[0];
    const client = await firstQueue.client;
    await client.ping();
    health.services.redis = "connected";
  } catch (error) {
    health.services.redis = "disconnected";
    health.status = "unhealthy";
  }

  // Get queue stats for all queues
  try {
    const queues = getAllQueues();
    const queueStats = {};

    for (const [queueName, queue] of Object.entries(queues)) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);

      queueStats[queueName] = {
        waiting,
        active,
        completed,
        failed,
      };
    }

    health.services.queues = queueStats;
  } catch (error) {
    health.services.queues = { status: "error" };
    health.status = "unhealthy";
  }

  const statusCode = health.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(health);
};

module.exports = {
  getHealth,
};
