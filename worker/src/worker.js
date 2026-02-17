require("dotenv").config({ debug: false });
const { getAllQueues } = require("./services/queueManager");
const processJob = require("./processors/jobProcessor");
const Job = require("./models/Job");
const pool = require("./config/database");

// Get all queues
const queues = getAllQueues();

// Process jobs from each queue
Object.entries(queues).forEach(([queueName, queue]) => {
  queue.process(async (job) => {
    const jobId = job.data.jobId;
    console.log(`▶ Started [${queueName}] Job ${jobId}`);

    try {
      // Mark job as active in database
      await Job.updateStatus(jobId, "active");

      // Process the job
      const result = await processJob(job);

      // Mark job as completed in database
      await Job.updateStatus(jobId, "completed", {
        results: result,
      });
      console.log(`✓ Completed [${queueName}] Job ${jobId}`);

      return result;
    } catch (error) {
      console.error(`✗ Failed [${queueName}] Job ${jobId}:`, error.message);

      // Increment attempts
      const updatedJob = await Job.incrementAttempts(jobId);

      // Check if max attempts reached
      if (updatedJob.attempts >= updatedJob.max_attempts) {
        console.error(
          `☠ Dead-letter [${queueName}] Job ${jobId} (max attempts exceeded)`,
        );
        await Job.updateStatus(jobId, "dead-letter", {
          error: error.message,
        });
      } else {
        console.log(
          `↻ Retry [${queueName}] Job ${jobId} (${updatedJob.attempts}/${updatedJob.max_attempts})`,
        );
        await Job.updateStatus(jobId, "failed", {
          error: error.message,
        });
      }

      throw error; // Re-throw to let Bull handle retry
    }
  });

  // Event listeners for each queue
  queue.on("error", (error) => {
    console.error(`✗ Queue error [${queueName}]:`, error.message);
  });
});

console.log("✓ Worker ready");
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[Worker] Received ${signal}, starting graceful shutdown...`);

  // Pause all queues
  const queues = getAllQueues();
  for (const [queueName, queue] of Object.entries(queues)) {
    await queue.pause(true, true);
    console.log(`[Worker] Queue ${queueName} paused`);
  }
  console.log("[Worker] All queues paused, no new jobs will be accepted");

  // Wait for active jobs to complete
  const timeout = 30000;
  const startTime = Date.now();

  while (true) {
    let totalActive = 0;
    for (const queue of Object.values(queues)) {
      totalActive += (await queue.getActive()).length;
    }

    if (totalActive === 0) break;

    if (Date.now() - startTime > timeout) {
      console.log("[Worker] Timeout reached, forcing shutdown");
      break;
    }

    console.log(
      `[Worker] Waiting for ${totalActive} active job(s) to complete...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("[Worker] All jobs completed");

  // Close all queue connections
  for (const [queueName, queue] of Object.entries(queues)) {
    await queue.close();

    await pool.end();
    console.log(`[Worker] Queue ${queueName} connection closed`);
  }
  console.log("[Worker] Database connection closed");

  console.log("[Worker] Graceful shutdown complete");
  process.exit(0);
};

// Listen for shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Graceful shutdown handlers registered
