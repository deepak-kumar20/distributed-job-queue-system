const pool = require("../config/database");

class Job {
  // Update job status
  static async updateStatus(jobId, status, additionalFields = {}) {
    const fields = ["status = $2"];
    const values = [jobId, status];
    let paramCounter = 3;

    if (status === "active" && !additionalFields.started_at) {
      fields.push(`started_at = NOW()`);
    }
    if (status === "completed" && !additionalFields.completed_at) {
      fields.push(`completed_at = NOW()`);
    }
    if (status === "failed" && !additionalFields.failed_at) {
      fields.push(`failed_at = NOW()`);
    }

    for (const [key, value] of Object.entries(additionalFields)) {
      fields.push(`${key} = $${paramCounter}`);
      values.push(typeof value === "object" ? JSON.stringify(value) : value);
      paramCounter++;
    }

    const query = `
            UPDATE jobs 
            SET ${fields.join(", ")}
            WHERE job_id = $1
            RETURNING *
        `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Increment attempt counter
  static async incrementAttempts(jobId) {
    const query = `
            UPDATE jobs 
            SET attempts = attempts + 1
            WHERE job_id = $1
            RETURNING *
        `;
    const result = await pool.query(query, [jobId]);
    return result.rows[0];
  }
}

module.exports = Job;
