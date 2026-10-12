import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

const emailArg = process.argv[2];

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  if (emailArg) {
    console.log(`\n🔍 Searching for user with email: "${emailArg}"...\n`);
    const user = await User.findOne({ email: emailArg.toLowerCase().trim() }).lean();

    if (!user) {
      console.log(`❌ No user found with email: ${emailArg}`);
    } else {
      console.log('✅ User Found in MongoDB:');
      console.log('--------------------------------------------------');
      console.log(`ID:        ${user._id}`);
      console.log(`Name:      ${user.name}`);
      console.log(`Email:     ${user.email}`);
      console.log(`Role:      ${user.role}`);
      console.log(`CF Handle: ${user.codeforcesHandle || 'None'}`);
      if (user.codeforcesProfile) {
        console.log(`CF Rating: ${user.codeforcesProfile.rating || 'Unrated'} (${user.codeforcesProfile.rank || 'N/A'})`);
        console.log(`Org:       ${user.codeforcesProfile.organization || 'N/A'}`);
      }
      console.log(`Created:   ${new Date(user.createdAt).toLocaleString()}`);
      console.log('--------------------------------------------------');
    }
  } else {
    console.log('\n📋 All Registered Users in MongoDB:\n');
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    console.log(`Total Count: ${users.length}\n`);

    users.forEach((u, idx) => {
      console.log(`${idx + 1}. [${u.role.toUpperCase()}] ${u.name}`);
      console.log(`   Email:     ${u.email}`);
      console.log(`   Handle:    @${u.codeforcesHandle || 'none'}`);
      console.log(`   CF Rating: ${u.codeforcesProfile?.rating || 'Unrated'} (${u.codeforcesProfile?.rank || 'none'})`);
      console.log(`   Joined:    ${new Date(u.createdAt).toLocaleString()}`);
      console.log('');
    });
  }

  await mongoose.disconnect();
}

check().catch((err) => {
  console.error('Error querying MongoDB:', err);
  process.exit(1);
});
