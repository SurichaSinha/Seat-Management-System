const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");
const authMiddleware = require("../middleware/authMiddleware");
const Seat = require("../models/Seat");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Holiday = require("../models/Holiday");
const { isDesignatedDay } = require("../utils/rotation");



// Helper: Weekend Check

function isWeekend(date) {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
}



// BOOK SEAT

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { date, type, employeeEmail, seatId } = req.body;
    let bookingUser = req.user;

    if (employeeEmail) {
      const normalizedEmail = String(employeeEmail).trim().toLowerCase();
      const employee = await User.findOne({ email: normalizedEmail });

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found for the provided email"
        });
      }

      bookingUser = employee;
    }

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

    const holiday = await Holiday.findOne({ date: bookingDate.toDate() });
    if (holiday) {
      return res.status(400).json({
        message: `Cannot book seat on holidays (${holiday.reason})`
      });
    }

    // Prevent double booking
    const existingBooking = await Booking.findOne({
      userId: bookingUser._id,
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

      if (!isDesignatedDay(bookingUser, bookingDate)) {
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

      let seat;

      if (seatId) {
        const selectedSeat = await Seat.findById(seatId).select("_id type");

        if (!selectedSeat || selectedSeat.type !== "designated") {
          return res.status(400).json({
            message: "Selected seat is not a designated seat"
          });
        }

        const seatAlreadyBooked = await Booking.findOne({
          date: bookingDate.toDate(),
          seatId: selectedSeat._id,
          status: "booked"
        });

        if (seatAlreadyBooked) {
          return res.status(400).json({
            message: "Selected seat is no longer available"
          });
        }

        seat = selectedSeat;
      } else {
        const designatedSeats = await Seat.find({
          type: "designated",
        }).select("_id");

        const designatedSeatIds = designatedSeats.map((s) => s._id);

        const usedSeatBookings = await Booking.find({
          date: bookingDate.toDate(),
          seatId: { $in: designatedSeatIds },
          status: "booked",
        }).select("seatId");

        const usedSeatIds = usedSeatBookings.map((b) => b.seatId);

        seat = await Seat.findOne({
          type: "designated",
          _id: { $nin: usedSeatIds },
        });
      }

      if (!seat) {
        return res.status(400).json({
          message: "No designated seat available on this date"
        });
      }

      const booking = await Booking.create({
        userId: bookingUser._id,
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

      if (isDesignatedDay(bookingUser, bookingDate)) {
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

      const releasedSeatBookings = await Booking.find({
        date: bookingDate.toDate(),
        type: "designated",
        status: "released"
      }).select("seatId");

      const releasedDesignatedSeatIds = releasedSeatBookings.map((booking) =>
        booking.seatId.toString()
      );

      const floaterSeats = await Seat.find({ type: "floater" }).select("_id");
      const floaterSeatIds = floaterSeats.map((seat) => seat._id.toString());

      const floaterPoolSeatIdSet = new Set([
        ...floaterSeatIds,
        ...releasedDesignatedSeatIds
      ]);

      const bookedSeatsInPool = await Booking.find({
        date: bookingDate.toDate(),
        status: "booked",
        seatId: { $in: Array.from(floaterPoolSeatIdSet) }
      }).select("seatId");

      const bookedSeatIdSet = new Set(
        bookedSeatsInPool.map((booking) => booking.seatId.toString())
      );

      let seat;

      if (seatId) {
        if (!floaterPoolSeatIdSet.has(String(seatId))) {
          return res.status(400).json({
            message: "Selected seat is not available for floater booking"
          });
        }

        if (bookedSeatIdSet.has(String(seatId))) {
          return res.status(400).json({
            message: "Selected seat is no longer available"
          });
        }

        seat = await Seat.findById(seatId);
      } else {
        const availableSeatId = Array.from(floaterPoolSeatIdSet).find(
          (id) => !bookedSeatIdSet.has(id)
        );
        seat = availableSeatId ? await Seat.findById(availableSeatId) : null;
      }

      if (!seat) {
        return res.status(404).json({
          message: "No floater seat available"
        });
      }

      const booking = await Booking.create({
        userId: bookingUser._id,
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
    })
      .select("seatId userId type")
      .populate("userId", "name");

    const popularityWindowStart = dayjs().subtract(27, "day").startOf("day");
    const popularityRows = await Booking.aggregate([
      {
        $match: {
          status: "booked",
          date: {
            $gte: popularityWindowStart.toDate(),
            $lte: dayjs().endOf("day").toDate()
          }
        }
      },
      {
        $group: {
          _id: "$seatId",
          count: { $sum: 1 }
        }
      }
    ]);

    const popularityBySeatId = new Map(
      popularityRows.map((row) => [row._id.toString(), row.count])
    );

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
            booking.userId?._id?.toString() === req.user._id.toString(),
          bookingType: booking?.type ?? null,
          bookedByName: booking?.userId?.name ?? null,
          popularityCount: popularityBySeatId.get(seat._id.toString()) ?? 0
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

router.get("/holidays", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = dayjs(startDate).startOf("day").toDate();
      }
      if (endDate) {
        query.date.$lte = dayjs(endDate).endOf("day").toDate();
      }
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });
    return res.json({ holidays });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
