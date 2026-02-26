const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");
const authMiddleware = require("../middleware/authMiddleware");
const Seat = require("../models/Seat");
const Booking = require("../models/Booking");
const { isDesignatedDay } = require("../utils/rotation");



// Helper: Weekend Check

function isWeekend(date) {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
}



// BOOK SEAT

router.post("/", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { date, type } = req.body;

    const bookingDate = dayjs(date).startOf("day");
    const today = dayjs().startOf("day");
    const now = dayjs();

    if (!bookingDate.isValid()) {
      return res.status(400).json({ message: "Invalid date" });
    }

    if (isWeekend(bookingDate)) {
      return res.status(400).json({
        message: "Cannot book seat on weekends"
      });
    }

    if (bookingDate.isBefore(today)) {
      return res.status(400).json({
        message: "Cannot book past dates"
      });
    }

    // Prevent double booking
    const existingBooking = await Booking.findOne({
      userId: user._id,
      date: bookingDate.toDate(),
      status: "booked"
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "You already have a booking for this date"
      });
    }

    
    // DESIGNATED BOOKING LOGIC
    
    if (type === "designated") {

      if (!isDesignatedDay(user, bookingDate)) {
        return res.status(400).json({
          message: "This is not your designated batch day"
        });
      }

      const endOfNextWeek = today.add(1, "week").endOf("week");

      if (bookingDate.isAfter(endOfNextWeek)) {
        return res.status(400).json({
          message: "Designated seat can only be booked for current or next week"
        });
      }

      const seat = await Seat.findOne({
        type: "designated",
        assignedBatch: user.batch,
      });

      if (!seat) {
        return res.status(404).json({
          message: "No designated seat found"
        });
      }

      const booking = await Booking.create({
        userId: user._id,
        seatId: seat._id,
        date: bookingDate.toDate(),
        type: "designated",
        status: "booked"
      });

      return res.json({
        message: "Designated seat booked successfully",
        booking
      });
    }


    
    // FLOATER BOOKING LOGIC
    
    if (type === "floater") {

      if (isDesignatedDay(user, bookingDate)) {
        return res.status(400).json({
          message: "You must book designated seat on your batch day"
        });
      }

      const tomorrow = today.add(1, "day");

      const isToday = bookingDate.isSame(today);
      const isTomorrow = bookingDate.isSame(tomorrow);

      if (!isToday && !isTomorrow) {
        return res.status(400).json({
          message: "Floater seat can only be booked for today or tomorrow"
        });
      }

      if (isTomorrow && now.hour() < 15) {
        return res.status(400).json({
          message: "Floater booking for tomorrow allowed only after 3PM"
        });
      }

      // Find released designated seat first
      let releasedSeatBooking = await Booking.findOne({
        date: bookingDate.toDate(),
        type: "designated",
        status: "released"
      }).populate("seatId");

      let seat;

      if (releasedSeatBooking) {
        seat = releasedSeatBooking.seatId;
      } else {
        seat = await Seat.findOne({ type: "floater" });
      }

      if (!seat) {
        return res.status(404).json({
          message: "No floater seat available"
        });
      }

      const booking = await Booking.create({
        userId: user._id,
        seatId: seat._id,
        date: bookingDate.toDate(),
        type: "floater",
        status: "booked"
      });

      return res.json({
        message: "Floater seat booked successfully",
        booking
      });
    }

    return res.status(400).json({
      message: "Invalid booking type"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error"
    });
  }
});



// RELEASE BOOKING

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized"
      });
    }

    booking.status = "released";
    await booking.save();

    return res.json({
      message: "Seat released successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error"
    });
  }
});


// LIST CURRENT USER BOOKINGS (GET /api/bookings)

router.get("/", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user._id,
    })
      .populate("seatId")
      .sort({ date: 1 });

    return res.json({ bookings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});



// WEEK VIEW

router.get("/week", authMiddleware, async (req, res) => {
  try {
    const { startDate } = req.query;

    const start = dayjs(startDate).startOf("week");
    const end = start.endOf("week");

    const bookings = await Booking.find({
      date: {
        $gte: start.toDate(),
        $lte: end.toDate()
      },
      status: "booked"
    })
      .populate("userId")
      .populate("seatId")
      .sort({ date: 1 });

    return res.json({ bookings });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error"
    });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user._id
    })
      .populate("seatId")
      .sort({ date: 1 });

    res.json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/availability", authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;

    const bookingDate = dayjs(date).startOf("day");

    const floaterSeats = await Seat.find({ type: "floater" }).select(
      "_id"
    );
    const floaterSeatIds = floaterSeats.map((s) => s._id);

    const bookedFloaterSeats = await Booking.countDocuments({
      date: bookingDate.toDate(),
      seatId: { $in: floaterSeatIds },
      status: "booked"
    });

    const releasedDesignatedSeats = await Booking.countDocuments({
      date: bookingDate.toDate(),
      type: "designated",
      status: "released"
    });

    const availableFloaterSeats =
      Math.max(floaterSeatIds.length - bookedFloaterSeats, 0) +
      releasedDesignatedSeats;

    res.json({ availableFloaterSeats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;