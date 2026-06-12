require('dotenv').config();
const app = require('./src/app');
const { startTATScanJob } = require('./src/jobs/tatScanJob');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  startTATScanJob();
});
