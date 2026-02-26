const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const {
  isWeekend,
  isHoliday,
  isWithinAllowedDesignatedWindow,
  canBookFloater,
  isUserBatchDay
} = require("../services/bookingService");
const dayjs = require("dayjs");

const router = express.Router();

//Create Booking

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { date, type } = req.body;
    const user = req.user;

    if (!date || !type) {
      return res.status(400).json({ message: "Date and type are required" });
    }

    const bookingDate = dayjs(date).startOf("day").toDate();

    if (isWeekend(bookingDate)) {
      return res.status(400).json({ message: "Cannot book on weekend" });
    }

    if (await isHoliday(bookingDate)) {
      return res.status(400).json({ message: "Cannot book on holiday" });
    }

    const existingBooking = await Booking.findOne({
      userId: user._id,
      date: bookingDate,
      status: "booked"
    });

    if (existingBooking) {
      return res
        .status(400)
        .json({ message: "You already have a booking for this date" });
    }

    //DESIGNATED BOOKING
    
    if (type === "designated") {
      if (!isWithinAllowedDesignatedWindow(bookingDate)) {
        return res.status(400).json({
          message:
            "Designated seat can only be booked for current or next week"
        });
      }

      if (!user.designatedSeatId) {
        return res
          .status(400)
          .json({ message: "No designated seat assigned" });
      }

      const seat = await Seat.findById(user.designatedSeatId);

      if (!seat) {
        return res.status(400).json({ message: "Designated seat not found" });
      }

      const booking = await Booking.create({
        userId: user._id,
        seatId: seat._id,
        date: bookingDate,
        type: "designated"
      });

      return res.json({
        message: "Designated seat booked successfully",
        booking
      });
    }

    //FLOATER BOOKING
    
    if (type === "floater") {
      if (!canBookFloater(bookingDate)) {
        return res.status(400).json({
          message:
            "Floater seat can only be booked for tomorrow after 3PM"
        });
      }

      if (isUserBatchDay(user, bookingDate)) {
        return res.status(400).json({
          message:
            "Cannot book floater on your designated batch day"
        });
      }

      const bookedSeats = await Booking.find({
        date: bookingDate,
        status: "booked"
      }).select("seatId");

      const bookedSeatIds = bookedSeats.map(b => b.seatId);

      const permanentFloaters = await Seat.find({
        type: "floater",
        _id: { $nin: bookedSeatIds }
      });

      const releasedDesignatedBookings = await Booking.find({
        date: bookingDate,
        status: "released",
        type: "designated"
      }).select("seatId");

      const releasedSeatIds = releasedDesignatedBookings.map(b => b.seatId);

      const releasedSeats = await Seat.find({
        _id: { $in: releasedSeatIds }
      });

      const availableSeats = [...permanentFloaters, ...releasedSeats];

      if (availableSeats.length === 0) {
        return res
          .status(400)
          .json({ message: "No floater seats available" });
      }

      const selectedSeat = availableSeats[0];

      const booking = await Booking.create({
        userId: user._id,
        seatId: selectedSeat._id,
        date: bookingDate,
        type: "floater"
      });

      return res.json({
        message: "Floater seat booked successfully",
        booking
      });
    }

    return res.status(400).json({ message: "Invalid booking type" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

//Release Booking
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to release this booking" });
    }

    booking.status = "released";
    await booking.save();

    res.json({ message: "Seat released successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

//Week-wise Allocation View
router.get("/week", authMiddleware, async (req, res) => {
  try {
    const { startDate } = req.query;

    if (!startDate) {
      return res.status(400).json({ message: "startDate is required" });
    }

    const start = dayjs(startDate).startOf("day");
    const end = start.add(6, "day").endOf("day");

    const bookings = await Booking.find({
      date: {
        $gte: start.toDate(),
        $lte: end.toDate()
      }
    })
      .populate("userId", "name email team")
      .populate("seatId", "seatNumber type");

    res.json({
      weekStart: start.format("YYYY-MM-DD"),
      weekEnd: end.format("YYYY-MM-DD"),
      totalBookings: bookings.length,
      bookings
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

//Get My Bookings
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user._id
    })
      .populate("seatId", "seatNumber type")
      .sort({ date: 1 });

    res.json({
      total: bookings.length,
      bookings
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

//Get Availability For Date

router.get("/availability", authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const bookingDate = dayjs(date).startOf("day").toDate();

    const bookedSeats = await Booking.find({
      date: bookingDate,
      status: "booked"
    }).select("seatId");

    const bookedSeatIds = bookedSeats.map(b => b.seatId);

    const availablePermanentFloaters = await Seat.countDocuments({
      type: "floater",
      _id: { $nin: bookedSeatIds }
    });

    const releasedDesignated = await Booking.find({
      date: bookingDate,
      status: "released",
      type: "designated"
    }).select("seatId");

    const releasedCount = releasedDesignated.length;

    res.json({
      date,
      availableFloaterSeats:
        availablePermanentFloaters + releasedCount
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;