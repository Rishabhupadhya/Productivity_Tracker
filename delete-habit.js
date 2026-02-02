const { MongoClient } = require('mongodb');

async function deleteHabit() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('momentum');
    
    // First, list all habits
    const habits = await db.collection('habits').find({}).toArray();
    console.log('\n📋 All habits in database:');
    habits.forEach((habit, idx) => {
      console.log(`${idx + 1}. "${habit.name}" (ID: ${habit._id})`);
    });
    
    // Delete habits matching the pattern
    const result = await db.collection('habits').deleteMany({ 
      name: { $regex: 'hab', $options: 'i' } 
    });
    
    console.log(`\n✅ Deleted ${result.deletedCount} habit(s) from database`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

deleteHabit();
