const express = require("express");
const bcrypt = require("bcryptjs");
const dayjs = require("dayjs");
const User = require("../models/User");
const Seat = require("../models/Seat");
const Booking = require("../models/Booking");
const Holiday = require("../models/Holiday");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { name, email, password, team, batch, role } = req.body;

    if (!name || !email || !password || !team || !batch) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      team,
      batch,
      role: role === "admin" ? "admin" : "employee",
    });

    const sanitizedUser = await User.findById(user._id).select("-password");
    res.status(201).json({ message: "User created successfully", user: sanitizedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await Booking.deleteMany({ userId: id });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/seats", async (req, res) => {
  try {
    const seats = await Seat.find({}).sort({ seatNumber: 1 });
    res.json({ seats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/bookings", async (req, res) => {
  try {
    const { date } = req.query;
    const query = {};

    if (date) {
      const bookingDate = dayjs(date).startOf("day");
      if (!bookingDate.isValid()) {
        return res.status(400).json({ message: "Invalid date" });
      }
      query.date = bookingDate.toDate();
    }

    const bookings = await Booking.find(query)
      .populate("userId", "name email team batch role")
      .populate("seatId", "seatNumber type")
      .sort({ date: -1, createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/holidays", async (req, res) => {
  try {
    const holidays = await Holiday.find({}).sort({ date: 1 });
    res.json({ holidays });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/holidays", async (req, res) => {
  try {
    const { date, reason } = req.body;

    if (!date || !reason) {
      return res.status(400).json({ message: "Date and reason are required" });
    }

    const holidayDate = dayjs(date).startOf("day");
    if (!holidayDate.isValid()) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const holiday = await Holiday.create({
      date: holidayDate.toDate(),
      reason,
    });

    res.status(201).json({ message: "Holiday added successfully", holiday });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Holiday already exists for this date" });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/holidays/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Holiday.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    res.json({ message: "Holiday removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/bookings", async (req, res) => {
  try {
    const { userId, seatId, date, status } = req.body;

    if (!userId || !seatId || !date) {
      return res.status(400).json({ message: "userId, seatId and date are required" });
    }

    const bookingDate = dayjs(date).startOf("day");
    if (!bookingDate.isValid()) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(400).json({ message: "Invalid user selected" });
    }

    const seatDoc = await Seat.findById(seatId);
    if (!seatDoc) {
      return res.status(400).json({ message: "Invalid seat selected" });
    }

    const conflictingSeatBooking = await Booking.findOne({
      seatId,
      date: bookingDate.toDate(),
      status: "booked",
    });
    if (conflictingSeatBooking) {
      return res.status(400).json({ message: "Seat already booked for this date" });
    }

    const conflictingUserBooking = await Booking.findOne({
      userId,
      date: bookingDate.toDate(),
      status: "booked",
    });
    if (conflictingUserBooking) {
      return res.status(400).json({ message: "User already has a booking for this date" });
    }

    const booking = await Booking.create({
      userId,
      seatId,
      date: bookingDate.toDate(),
      type: seatDoc.type === "floater" ? "floater" : "designated",
      status: status === "released" ? "released" : "booked",
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("userId", "name email team batch role")
      .populate("seatId", "seatNumber type");

    res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, seatId, date, status } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const nextUserId = userId || booking.userId;
    let nextSeatId = seatId || booking.seatId;
    let nextDate = booking.date;
    const nextStatus = status || booking.status;

    if (date) {
      const parsedDate = dayjs(date).startOf("day");
      if (!parsedDate.isValid()) {
        return res.status(400).json({ message: "Invalid date" });
      }
      nextDate = parsedDate.toDate();
    }

    const seatDoc = await Seat.findById(nextSeatId);
    if (!seatDoc) {
      return res.status(400).json({ message: "Invalid seat selected" });
    }
    nextSeatId = seatDoc._id;

    const targetUser = await User.findById(nextUserId);
    if (!targetUser) {
      return res.status(400).json({ message: "Invalid user selected" });
    }

    const conflictingSeatBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      seatId: nextSeatId,
      date: nextDate,
    });
    if (conflictingSeatBooking) {
      return res.status(400).json({ message: "Seat already booked for this date" });
    }

    const conflictingUserBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      userId: nextUserId,
      date: nextDate,
    });
    if (conflictingUserBooking) {
      return res.status(400).json({ message: "User already has a booking for this date" });
    }

    booking.userId = nextUserId;
    booking.seatId = nextSeatId;
    booking.date = nextDate;
    booking.status = nextStatus;
    booking.type = seatDoc.type === "floater" ? "floater" : "designated";

    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate("userId", "name email team batch role")
      .populate("seatId", "seatNumber type");

    res.json({ message: "Booking updated successfully", booking: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
