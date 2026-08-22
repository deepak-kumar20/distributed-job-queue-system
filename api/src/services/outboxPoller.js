const { getQueue } = require("./queueManager");
const pool = require("../config/database");

async function pollOutbox() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(`
      SELECT * FROM jobs 
      WHERE status = 'pending' 
      ORDER BY created_at ASC 
      FOR UPDATE SKIP LOCKED 
      LIMIT 50
    `);

    for (const job of result.rows) {
      const queue = getQueue(job.type);
      await queue.add(
        { ...job.data, jobId: job.job_id, type: job.type },
        {
          priority: job.priority,
          attempts: job.max_attempts,
          backoff: { type: "exponential", delay: 2000 },
        }
      );
      await client.query("UPDATE jobs SET status = 'queued', updated_at = NOW() WHERE job_id = $1", [job.job_id]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Outbox polling error:', error);
  } finally {
    client.release();
  }
}

// Start the poller
setInterval(pollOutbox, 2000);
module.exports = { pollOutbox };
