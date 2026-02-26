const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    seatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ["designated", "floater"],
      required: true
    },
    status: {
      type: String,
      enum: ["booked", "released"],
      default: "booked"
    }
  },
  { timestamps: true }
);

//compound index to prevent double booking of seat on same day
bookingSchema.index({ seatId: 1, date: 1 }, { unique: true });

//compound index to prevent same user booking multiple seats same day
bookingSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Booking", bookingSchema);