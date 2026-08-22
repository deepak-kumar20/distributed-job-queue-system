const { z } = require('zod');

const jobSchema = z.object({
  jobData: z.object({
    type: z.string().min(1, "Job type is required"),
    priority: z.number().int().optional(),
    maxAttempts: z.number().int().optional(),
  }).passthrough()
});

const validateJob = (req, res, next) => {
  try {
    req.body = jobSchema.parse(req.body);
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid input', details: err.errors });
  }
};

module.exports = { validateJob };
