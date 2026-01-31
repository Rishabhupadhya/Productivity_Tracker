const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/productivity_tracker')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Team = mongoose.connection.collection('teams');
    
    // Remove all pending invites (except those you want to keep)
    const result = await Team.updateMany(
      {},
      {
        $pull: {
          invites: { status: 'pending' }
        }
      }
    );
    
    console.log(`Cleaned up pending invites from ${result.modifiedCount} teams`);
    
    // Show remaining invites
    const teams = await Team.find({}).toArray();
    teams.forEach(team => {
      if (team.invites && team.invites.length > 0) {
        console.log(`Team "${team.name}" still has ${team.invites.length} invites:`, 
          team.invites.map(i => i.email));
      }
    });
    
    console.log('Cleanup complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
