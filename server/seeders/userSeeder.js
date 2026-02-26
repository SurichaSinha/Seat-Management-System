const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Seat = require("../models/Seat");

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for User Seeding");

    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log("Users already exist. Skipping seeding.");
      process.exit();
    }

    const seats = await Seat.find({ type: "designated" });

    const users = [];
    const hashedPassword = await bcrypt.hash("password123", 10);

    for (let i = 1; i <= 80; i++) {
      users.push({
        name: `Employee${i}`,
        email: `employee${i}@company.com`,
        password: hashedPassword,
        team: `Team${(i % 15) + 1}`,
        batch: i <= 40 ? 1 : 2,
        designatedSeatId: seats[i - 1]?._id || null
      });
    }

    await User.insertMany(users);

    console.log("80 Users Seeded Successfully");
    process.exit();
  } catch (error) {
    console.error("Error Seeding Users:", error);
    process.exit(1);
  }
}

seedUsers();