const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: ["designated", "floater"],
      required: true
    },
    assignedBatch: {
      type: Number,
      enum: [1, 2],
      default: null // floater seats won’t have batch
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seat", seatSchema);