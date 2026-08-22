const express = require("express");
const router = express.Router();
const {
  createJob,
  getJobById,
  getAllJobs,
} = require("../controllers/jobController");

const { validateJob } = require("../middlewares/validationMiddleware");

router.post("/add-job", validateJob, createJob);
router.get("/:jobId", getJobById);
router.get("/", getAllJobs);

module.exports = router;
