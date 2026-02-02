import { connectDB } from "../src/config/db";
import { Goal } from "../src/modules/auth/goal/goal.model";
import mongoose from "mongoose";

const migrate = async () => {
  await connectDB();
  console.log("Connected to DB");

  const cursor = Goal.find().cursor();
  let updated = 0;
  let processed = 0;

  for (let goal = await cursor.next(); goal != null; goal = await cursor.next()) {
    processed++;
    let changed = false;
    for (let i = 0; i < (goal.reviews || []).length; i++) {
      const rev: any = (goal.reviews as any)[i];
      if (!rev._id) {
        (rev as any)._id = new mongoose.Types.ObjectId();
        changed = true;
      }
    }
    if (changed) {
      await goal.save();
      updated++;
      console.log(`Updated goal ${goal._id} with new review _id(s)`);
    }
  }

  console.log(`Processed ${processed} goals, updated ${updated} goals`);
  process.exit(0);
};

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
