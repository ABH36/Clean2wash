const mongoose = require('mongoose');
const Captain = require('./models/Captain');
require('dotenv').config({ path: './.env.local' });
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const captains = await Captain.find({});
  console.log("Total Captains:", captains.length);
  if(captains.length > 0) {
      console.log(JSON.stringify(captains[captains.length-1], null, 2));
  }
  process.exit(0);
}
check();
