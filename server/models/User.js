const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    team: {
      type: String,
      required: true
    },
    batch: {
      type: Number,
      enum: [1, 2],
      required: true
    },
    designatedSeatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat"
    },
    role: {
      type: String,
      enum: ["employee", "admin"],
      default: "employee"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);