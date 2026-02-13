const pool = require("../config/database");

class Job {
  // Create a new job record
  static async create(jobId, type, data, priority = 0, maxAttempts = 3) {
    const query = `
            INSERT INTO jobs (job_id, type, data, priority, max_attempts, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING *
        `;
    const values = [jobId, type, JSON.stringify(data), priority, maxAttempts];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

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

  // Get job by ID
  static async findById(jobId) {
    const query = "SELECT * FROM jobs WHERE job_id = $1";
    const result = await pool.query(query, [jobId]);
    return result.rows[0];
  }

  // Get all jobs with pagination
  static async findAll(limit = 50, offset = 0, status = null) {
    let query = "SELECT * FROM jobs";
    const values = [];

    if (status) {
      query += " WHERE status = $1";
      values.push(status);
      query += " ORDER BY created_at DESC LIMIT $2 OFFSET $3";
      values.push(limit, offset);
    } else {
      query += " ORDER BY created_at DESC LIMIT $1 OFFSET $2";
      values.push(limit, offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
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
