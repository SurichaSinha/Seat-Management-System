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

      const batchSeats = await Seat.find({
        type: "designated",
        assignedBatch: user.batch,
      }).select("_id");

      const batchSeatIds = batchSeats.map((s) => s._id);

      const usedSeatBookings = await Booking.find({
        date: bookingDate.toDate(),
        seatId: { $in: batchSeatIds },
      }).select("seatId");

      const usedSeatIds = usedSeatBookings.map((b) => b.seatId);

      const seat = await Seat.findOne({
        type: "designated",
        assignedBatch: user.batch,
        _id: { $nin: usedSeatIds },
      });

      if (!seat) {
        return res.status(400).json({
          message: "No designated seat available for your batch on this date"
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

      const bookingDay = bookingDate.day(); // 1 Mon - 5 Fri
      const isMondayBookingFromFriday =
        bookingDay === 1 &&
        today.day() === 5 &&
        bookingDate.isSame(today.add(3, "day"), "day");

      const isTueToFriBookingOneDayBefore =
        bookingDay >= 2 &&
        bookingDay <= 5 &&
        bookingDate.isSame(today.add(1, "day"), "day");
      const isSameDayBooking = bookingDate.isSame(today, "day");

      if (isTueToFriBookingOneDayBefore && now.hour() < 10) {
        return res.status(400).json({
          message:
            "Floater booking for Tuesday-Friday is allowed one day before only after 10:00 AM"
        });
      }

      if (
        !isMondayBookingFromFriday &&
        !isTueToFriBookingOneDayBefore &&
        !isSameDayBooking
      ) {
        return res.status(400).json({
          message:
            "Floater booking rules: same-day booking is allowed, Monday can be booked on Friday, and Tuesday-Friday can be booked one day before after 10:00 AM"
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
    if (error?.code === 11000) {
      return res.status(400).json({
        message: "Selected seat is no longer available, please try again"
      });
    }
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

router.get("/layout", authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const bookingDate = dayjs(date).startOf("day");

    if (!bookingDate.isValid()) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const seats = await Seat.find({}).select(
      "_id seatNumber type assignedBatch"
    );
    const bookings = await Booking.find({
      date: bookingDate.toDate(),
      status: "booked"
    }).select("seatId userId type");

    const bookingBySeatId = new Map(
      bookings.map((booking) => [booking.seatId.toString(), booking])
    );

    const seatLayout = seats
      .map((seat) => {
        const booking = bookingBySeatId.get(seat._id.toString());
        return {
          _id: seat._id,
          seatNumber: seat.seatNumber,
          type: seat.type,
          assignedBatch: seat.assignedBatch,
          isBooked: Boolean(booking),
          isMine:
            Boolean(booking) &&
            booking.userId.toString() === req.user._id.toString(),
          bookingType: booking?.type ?? null
        };
      })
      .sort((a, b) => {
        const aMatch = a.seatNumber.match(/^([A-Za-z]+)(\d+)$/);
        const bMatch = b.seatNumber.match(/^([A-Za-z]+)(\d+)$/);

        if (!aMatch || !bMatch) {
          return a.seatNumber.localeCompare(b.seatNumber);
        }

        const prefixCompare = aMatch[1].localeCompare(bMatch[1]);
        if (prefixCompare !== 0) {
          return prefixCompare;
        }

        return Number(aMatch[2]) - Number(bMatch[2]);
      });

    return res.json({
      date: bookingDate.format("YYYY-MM-DD"),
      seats: seatLayout
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
