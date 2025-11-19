import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User, Gallery } from '../models/index.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...\n');

    // Connect to MongoDB
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('📦 Clearing existing data...');
    await User.deleteMany({});
    await Gallery.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create admin user (using environment variables for security)
    console.log('👤 Creating admin user...');

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL;

    const adminUser = await User.create({
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });
    
    // Create empty galleries
    console.log('🖼️  Creating galleries...');

    const aboutGallery = await Gallery.create({
      name: 'about',
      displayName: 'About Me',
      description: 'Personal photos and moments',
      images: [],
      settings: {
        carouselSpeed: 1600,
        displayType: 'carousel',
        showCaptions: false
      },
      active: true
    });
    console.log(`✅ Created gallery: ${aboutGallery.displayName}`);

    const sailingGallery = await Gallery.create({
      name: 'sailing',
      displayName: 'Sailing Adventures',
      description: 'My sailing journey',
      images: [],
      settings: {
        carouselSpeed: 2000,
        displayType: 'grid',
        showCaptions: true
      },
      active: true
    });
    console.log(`✅ Created gallery: ${sailingGallery.displayName}`);

    const kazakhstanGallery = await Gallery.create({
      name: 'kazakhstan',
      displayName: 'Kazakhstan 2024',
      description: 'Turkish Youth Forum in Kazakhstan',
      images: [],
      settings: {
        carouselSpeed: 2300,
        displayType: 'carousel',
        showCaptions: false
      },
      active: true
    });
    console.log(`✅ Created gallery: ${kazakhstanGallery.displayName}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedDatabase();
