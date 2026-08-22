const crypto = require("crypto");
const { getQueue } = require("../services/queueManager");
const Job = require("../models/Job");

// Create a new job using Transactional Outbox pattern
const createJob = async (req, res) => {
  const { jobData } = req.body;
  const pool = require("../config/database");

  const client = await pool.connect();
  try {
    const { type, priority = 0, maxAttempts = 3, ...data } = jobData;
    const jobId = crypto.randomUUID();

    await client.query('BEGIN');

    // Insert into DB as 'pending' outbox pattern
    const query = `
      INSERT INTO jobs (job_id, type, data, priority, max_attempts, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `;
    const values = [jobId, type, JSON.stringify(data), priority, maxAttempts];
    const result = await client.query(query, values);

    await client.query('COMMIT');

    res.status(200).json({
      message: "Job added to queue successfully (Outbox pattern)",
      jobId: jobId,
      type: type,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error adding job:", error);
    res.status(500).json({ error: "Failed to add job to queue" });
  } finally {
    client.release();
  }
};

// Get job by ID
const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.status(200).json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: "Failed to fetch job" });
  }
};

// Get all jobs with Keyset Pagination
const getAllJobs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const lastCursor = req.query.lastCursor; // Keyset pagination cursor (timestamp)
    const status = req.query.status;
    const pool = require("../config/database");

    let query = "SELECT * FROM jobs";
    let params = [];
    let paramCounter = 1;

    let conditions = [];

    if (status) {
      conditions.push(`status = $${paramCounter++}`);
      params.push(status);
    }
    
    if (lastCursor) {
      // Assuming lastCursor is created_at
      conditions.push(`created_at < $${paramCounter++}`);
      params.push(lastCursor);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramCounter}`;
    params.push(limit);

    const result = await pool.query(query, params);
    const jobs = result.rows;

    res.status(200).json({
      total: jobs.length,
      limit: limit,
      nextCursor: jobs.length > 0 ? jobs[jobs.length - 1].created_at : null,
      jobs: jobs.map((job) => ({
        jobId: job.job_id,
        type: job.type,
        status: job.status,
        priority: job.priority,
        attempts: job.attempts,
        createdAt: job.created_at,
        completedAt: job.completed_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

module.exports = {
  createJob,
  getJobById,
  getAllJobs,
};
