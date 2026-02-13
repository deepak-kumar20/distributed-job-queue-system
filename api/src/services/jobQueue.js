const Queue = require('bull');
const jobQueue= new Queue('jobQueue', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS
    }
});

module.exports = jobQueue;