const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const M = require('./models/Milestone');
  
  // Get all milestones that have been submitted (have any submission data)
  const ms = await M.find({
    $or: [
      { submissionFileHash: { $exists: true, $ne: '' } },
      { submissionVideoHash: { $exists: true, $ne: '' } }
    ]
  }).select('title status submissionVideoUrl submissionVideoHash submissionFileUrl submissionFileHash rdStatus rdRequestId rdAnalyzedAt').lean();
  
  console.log('=== Milestones with submissions ===');
  console.log(JSON.stringify(ms, null, 2));
  
  mongoose.disconnect();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
