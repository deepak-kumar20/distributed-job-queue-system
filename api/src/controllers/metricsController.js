const pool = require("../config/database");
const { getAllQueues } = require("../services/queueManager");

const getMetrics = async (req, res) => {
  try {
    // Get job counts from database by status
    const statusQuery = `
            SELECT status, COUNT(*) as count
            FROM jobs
            GROUP BY status
        `;
    const statusResult = await pool.query(statusQuery);

    const statusCounts = {};
    statusResult.rows.forEach((row) => {
      statusCounts[row.status] = parseInt(row.count);
    });

    // Get queue statistics from Bull for all queues
    const queues = getAllQueues();
    const queueMetrics = {};

    for (const [queueName, queue] of Object.entries(queues)) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      queueMetrics[queueName] = {
        waiting,
        active,
        completed,
        failed,
        delayed,
      };
    }

    // Get job type distribution
    const typeQuery = `
            SELECT type, COUNT(*) as count
            FROM jobs
            GROUP BY type
        `;
    const typeResult = await pool.query(typeQuery);

    const jobTypes = {};
    typeResult.rows.forEach((row) => {
      jobTypes[row.type] = parseInt(row.count);
    });

    // Get average processing time (completed jobs)
    const avgTimeQuery = `
            SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration
            FROM jobs
            WHERE status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL
        `;
    const avgTimeResult = await pool.query(avgTimeQuery);
    const avgProcessingTime = avgTimeResult.rows[0].avg_duration
      ? parseFloat(avgTimeResult.rows[0].avg_duration).toFixed(2)
      : null;

    // Get retry statistics
    const retryQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE attempts > 0) as retried_jobs,
                AVG(attempts) as avg_attempts
            FROM jobs
            WHERE status IN ('completed', 'failed', 'dead-letter')
        `;
    const retryResult = await pool.query(retryQuery);

    res.json({
      timestamp: new Date().toISOString(),
      database: {
        totalJobs: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        byStatus: statusCounts,
        byType: jobTypes,
        avgProcessingTimeSeconds: avgProcessingTime,
        retriedJobs: parseInt(retryResult.rows[0].retried_jobs) || 0,
        avgAttempts:
          parseFloat(retryResult.rows[0].avg_attempts).toFixed(2) || 0,
      },
      queues: queueMetrics,
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
};

module.exports = {
  getMetrics,
};
