const mongoose = require("mongoose");
require("dotenv").config();
const Seat = require("../models/Seat");

async function seedSeats() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for Seeding");

    const existingSeats = await Seat.countDocuments();

    if (existingSeats > 0) {
      console.log("Seats already exist. Skipping seeding.");
      process.exit();
    }

    const seats = [];

    //created 40 designated seats
    for(let i=1;i<=40;i++){
      seats.push({
        seatNumber: `D${i}`,
        type: "designated",
        assignedBatch: i <= 20 ? 1 : 2
      });
    }

    //create 10 floater seats
    for(let i=1;i<=10;i++){
      seats.push({
        seatNumber: `F${i}`,
        type: "floater",
        assignedBatch: null
      });
    }

    await Seat.insertMany(seats);

    console.log("Seats Seeded Successfully");
    process.exit();
  } catch (error) {
    console.error("Error Seeding Seats:", error);
    process.exit(1);
  }
}
seedSeats();