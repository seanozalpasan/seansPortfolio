import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/index.js';

dotenv.config();

const updateAdminCredentials = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get new credentials from command line arguments
    const newUsername = process.argv[2];
    const newPassword = process.argv[3];

    if (!newUsername || !newPassword) {
      console.error('❌ Usage: node scripts/updateAdmin.js <new-username> <new-password>');
      console.error('   Example: node scripts/updateAdmin.js sean MyNewPassword123!');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Validate password length (model requires min 8 chars)
    if (newPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Find the admin user (assuming there's only one)
    const adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.error('❌ No admin user found');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`\n📝 Updating admin user: ${adminUser.username} → ${newUsername}`);

    // Update the user credentials
    // Note: The User model has a pre-save hook that will automatically hash the password
    adminUser.username = newUsername;
    adminUser.password = newPassword; // Set plain password, model will hash it
    await adminUser.save();

    console.log('\n✅ Admin credentials updated successfully!');
    console.log(`   Username: ${newUsername}`);
    console.log('   Password: ******** (hidden for security)');
    console.log('\n💡 You can now login with these new credentials');

    // Close connection before exiting
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error updating admin credentials:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

updateAdminCredentials();
