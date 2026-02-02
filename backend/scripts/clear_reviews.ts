import { connectDB } from "../src/config/db";
import { Goal } from "../src/modules/auth/goal/goal.model";

const clearReviews = async () => {
  await connectDB();
  console.log("Connected to DB");

  // Clear all reviews from all goals
  const result = await Goal.updateMany(
    {},
    { $set: { reviews: [] } }
  );

  console.log(`Cleared reviews from ${result.modifiedCount} goals`);
  process.exit(0);
};

clearReviews().catch(err => {
  console.error(err);
  process.exit(1);
});
