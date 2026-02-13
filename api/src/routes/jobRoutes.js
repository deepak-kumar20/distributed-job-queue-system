const express = require("express");
const router = express.Router();
const {
  createJob,
  getJobById,
  getAllJobs,
} = require("../controllers/jobController");

router.post("/add-job", createJob);
router.get("/:jobId", getJobById);
router.get("/", getAllJobs);

module.exports = router;
