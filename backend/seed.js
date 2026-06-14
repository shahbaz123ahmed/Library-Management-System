const dotenv = require("dotenv");
const connectDb = require("./config/db");
const seedData = require("./utils/seedData");

const run = async () => {
  dotenv.config();
  await connectDb();
  await seedData();
  console.log("Seed data loaded");
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
