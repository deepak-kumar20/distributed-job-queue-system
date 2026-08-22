const pool = require("../config/database");

// HEARTBEAT / TIMEOUT MONITORING
async function monitorStaleJobs() {
  const client = await pool.connect();
  try {
    const timeoutThreshold = '5 minutes';
    
    const result = await client.query(`
      UPDATE jobs 
      SET status = 'pending', updated_at = NOW() 
      WHERE status = 'active' 
        AND updated_at < NOW() - INTERVAL '${timeoutThreshold}'
      RETURNING job_id
    `);
    
    if (result.rows.length > 0) {
      console.log(`Recovered ${result.rows.length} stale jobs and moved back to pending.`);
    }
  } catch (error) {
    console.error('Error monitoring stale jobs:', error);
  } finally {
    client.release();
  }
}

// Run the monitor every 1 minute
setInterval(monitorStaleJobs, 60000);
module.exports = { monitorStaleJobs };
