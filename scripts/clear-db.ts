import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

// Import models
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// Create readline interface for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function clearDatabase() {
  try {
    // Safety check: Ensure we're in development
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    console.log('\n⚠️  DATABASE CLEARING SCRIPT');
    console.log('================================');
    console.log(`Environment: ${nodeEnv}`);
    console.log(`MongoDB URI: ${process.env.MONGODB_URI?.substring(0, 30)}...`);
    console.log('\n⚠️  WARNING: This will DELETE ALL DATA from the database!');
    console.log('This includes:');
    console.log('  - All users');
    console.log('  - All listings');
    console.log('  - All conversations');
    console.log('  - All messages');
    console.log('\n');

    // Ask for confirmation
    const answer = await askQuestion('Are you sure you want to continue? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Operation cancelled.');
      rl.close();
      process.exit(0);
    }

    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get counts before deletion
    const userCount = await User.countDocuments();
    const listingCount = await Listing.countDocuments();
    const conversationCount = await Conversation.countDocuments();
    const messageCount = await Message.countDocuments();

    console.log('\n📊 Current database state:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Listings: ${listingCount}`);
    console.log(`   - Conversations: ${conversationCount}`);
    console.log(`   - Messages: ${messageCount}`);

    // Clear all collections
    console.log('\n🗑️  Clearing database...');
    
    await User.deleteMany({});
    console.log('   ✓ Cleared Users collection');
    
    await Listing.deleteMany({});
    console.log('   ✓ Cleared Listings collection');
    
    await Conversation.deleteMany({});
    console.log('   ✓ Cleared Conversations collection');
    
    await Message.deleteMany({});
    console.log('   ✓ Cleared Messages collection');

    // Verify deletion
    const remainingUsers = await User.countDocuments();
    const remainingListings = await Listing.countDocuments();
    const remainingConversations = await Conversation.countDocuments();
    const remainingMessages = await Message.countDocuments();

    console.log('\n📊 Database state after clearing:');
    console.log(`   - Users: ${remainingUsers}`);
    console.log(`   - Listings: ${remainingListings}`);
    console.log(`   - Conversations: ${remainingConversations}`);
    console.log(`   - Messages: ${remainingMessages}`);

    if (remainingUsers === 0 && remainingListings === 0 && 
        remainingConversations === 0 && remainingMessages === 0) {
      console.log('\n✅ Database cleared successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Clear your browser cookies/logout from the app');
      console.log('   2. Register a new account to test email verification');
      console.log('   3. Or run: npm run seed (to populate with test data)');
    } else {
      console.log('\n⚠️  Warning: Some documents may still remain in the database');
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB\n');
    
    rl.close();
  } catch (error) {
    console.error('\n❌ Error clearing database:', error);
    rl.close();
    process.exit(1);
  }
}

clearDatabase();
