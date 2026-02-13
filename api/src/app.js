const express = require('express');
const jobRoutes = require('./routes/jobRoutes');
const healthRoutes = require('./routes/healthRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('<h1>Hello, World!</h1>')
})
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/metrics', metricsRoutes);

app.listen(PORT, () => {
    console.log(`API server is running on port ${PORT}`);
})