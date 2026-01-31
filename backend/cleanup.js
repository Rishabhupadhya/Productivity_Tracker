const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/productivity_tracker')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const User = mongoose.connection.collection('users');
    const Team = mongoose.connection.collection('teams');
    const Task = mongoose.connection.collection('tasks');
    
    // Find test user (assuming it's the first registered user or has 'test' in email)
    const testUser = await User.findOne({ email: /test|rishabh/i });
    
    if (!testUser) {
      console.log('No test user found. Please specify which user to keep.');
      process.exit(1);
    }
    
    console.log(`Keeping user: ${testUser.email} (${testUser.name})`);
    
    // Get all other user IDs
    const usersToDelete = await User.find({
      _id: { $ne: testUser._id }
    }).toArray();
    
    const userIdsToDelete = usersToDelete.map(u => u._id);
    
    console.log(`Found ${userIdsToDelete.length} users to delete`);
    
    if (userIdsToDelete.length > 0) {
      // Delete users
      const deletedUsers = await User.deleteMany({
        _id: { $in: userIdsToDelete }
      });
      console.log(`Deleted ${deletedUsers.deletedCount} users`);
      
      // Remove from teams
      const teamsUpdate = await Team.updateMany(
        {},
        { 
          $pull: { 
            members: { userId: { $in: userIdsToDelete } }
          }
        }
      );
      console.log(`Removed users from ${teamsUpdate.modifiedCount} teams`);
      
      // Delete invites except those still pending
      const invitesUpdate = await Team.updateMany(
        {},
        {
          $pull: {
            invites: { 
              email: { 
                $nin: [testUser.email]
              },
              status: 'accepted'
            }
          }
        }
      );
      console.log(`Cleaned up ${invitesUpdate.modifiedCount} team invites`);
      
      // Delete tasks created by deleted users
      const deletedTasks = await Task.deleteMany({
        userId: { $in: userIdsToDelete }
      });
      console.log(`Deleted ${deletedTasks.deletedCount} tasks`);
    }
    
    console.log('Cleanup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
