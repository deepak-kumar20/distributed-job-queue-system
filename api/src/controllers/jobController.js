const crypto = require("crypto");
const { getQueue } = require("../services/queueManager");
const Job = require("../models/Job");

// Create a new job
const createJob = async (req, res) => {
  const { jobData } = req.body;

  try {
    // Validate input
    if (!jobData || !jobData.type) {
      return res.status(400).json({ error: "jobData.type is required" });
    }

    const { type, priority = 0, maxAttempts = 3, ...data } = jobData;

    // Generate unique job ID
    const jobId = crypto.randomUUID();

    // Get appropriate queue based on job type
    const queue = getQueue(type);

    // Add job to Bull queue with UUID attached to job data
    const bullJob = await queue.add(
      { ...jobData, jobId },
      {
        priority: priority,
        attempts: maxAttempts,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    );

    // Save job metadata to database
    await Job.create(jobId, type, data, priority, maxAttempts);

    res.status(200).json({
      message: "Job added to queue successfully",
      jobId: jobId,
      type: type,
    });
  } catch (error) {
    console.error("Error adding job:", error);
    res.status(500).json({ error: "Failed to add job to queue" });
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

    res.status(200).json({
      jobId: job.job_id,
      type: job.type,
      status: job.status,
      priority: job.priority,
      data: job.data,
      result: job.results,
      error: job.error,
      attempts: job.attempts,
      maxAttempts: job.max_attempts,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      failedAt: job.failed_at,
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: "Failed to fetch job" });
  }
};

// Get all jobs
const getAllJobs = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const jobs = await Job.findAll(parseInt(limit), parseInt(offset), status);

    res.status(200).json({
      total: jobs.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
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
