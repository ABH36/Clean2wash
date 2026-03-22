const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: './.env.local' });
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const admin = await User.findOne({ role: 'admin' });
  if(admin) {
      console.log(admin._id.toString());
  } else {
      console.log("NO_ADMIN_FOUND");
  }
  process.exit(0);
}
check();
