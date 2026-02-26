import { useEffect, useState, useContext } from "react";
import axios from "../api/axios";
import dayjs from "dayjs";
import { AuthContext } from "../context/AuthContext";
import BookingModal from "./BookingModal";

function WeekCalendar() {
  const { user } = useContext(AuthContext);

  const [startOfWeek, setStartOfWeek] = useState(
    dayjs().startOf("week")
  );
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWeek = async () => {
    const start = startOfWeek.startOf("day");
    const end = startOfWeek.endOf("week").endOf("day");

    const res = await axios.get("/bookings/me");
    const myWeekBookings =
      res.data.bookings?.filter((b) => {
        const d = dayjs(b.date);
        return (
          b.status === "booked" &&
          (d.isSame(start) || d.isAfter(start)) &&
          (d.isSame(end) || d.isBefore(end))
        );
      }) ?? [];

    setBookings(myWeekBookings);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchWeek();
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [startOfWeek]);

  const days = Array.from({ length: 7 }).map((_, i) =>
    startOfWeek.add(i, "day")
  );

  const getBookingsForDay = (date) => {
    return bookings.filter(
      (b) =>
        dayjs(b.date).format("YYYY-MM-DD") ===
        date.format("YYYY-MM-DD")
    );
  };

  const isPastDay = (date) => {
    return date.isBefore(dayjs().startOf("day"));
  };

  const isWeekend = (date) => {
    const day = date.day();
    return day === 0 || day === 6;
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            My weekly bookings
          </h2>
          <p className="text-xs text-slate-500">
            Click an available weekday to book. Past days and weekends are disabled.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              !isLoading &&
              setStartOfWeek(startOfWeek.subtract(7, "day"))
            }
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            Previous
          </button>

          <p className="text-sm font-medium text-slate-800">
            Week of {startOfWeek.format("MMM DD, YYYY")}
          </p>

          <button
            onClick={() =>
              !isLoading && setStartOfWeek(startOfWeek.add(7, "day"))
            }
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            Next
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          Loading week data...
        </div>
      )}

      <div
        className={`grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-7 ${
          isLoading ? "pointer-events-none opacity-70" : ""
        }`}
      >
        {days.map((day) => {
          const formatted = day.format("YYYY-MM-DD");
          const dayBookings = getBookingsForDay(day);
          const past = isPastDay(day);
          const weekend = isWeekend(day);
          const disabled = past || weekend;
          const myBooking = dayBookings[0];
          const hasBooking = Boolean(myBooking);
          const canClick = !disabled && !isLoading && !hasBooking;

          return (
            <div
              key={formatted}
              onClick={() =>
                canClick && setSelectedDate(formatted)
              }
              className={`flex min-h-[175px] flex-col rounded-2xl border p-4 transition-all duration-200
                ${
                  disabled
                    ? "cursor-not-allowed bg-slate-50 text-slate-300"
                    : hasBooking
                      ? "bg-white"
                      : "cursor-pointer bg-slate-50 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                }`}
            >
              <div className="mb-2 flex items-baseline justify-between gap-1">
                <div className="font-medium text-slate-800">
                  {day.format("ddd")}
                </div>
                <div className="text-sm text-slate-500">
                  {day.format("DD")}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {disabled ? (
                  <p className="text-xs text-slate-300">
                    Disabled
                  </p>
                ) : hasBooking ? (
                  <div
                    className={`rounded-lg border p-2 text-xs ${
                      myBooking.type === "designated"
                        ? "border-blue-200 bg-blue-50"
                        : "border-emerald-200 bg-emerald-50"
                    }`}
                  >
                    <p className="font-semibold text-slate-900">
                      Booked
                    </p>
                    <p className="mt-1 text-slate-700">
                      Seat: {myBooking.seatId?.seatNumber ?? "—"}
                    </p>
                    <p className="text-slate-600 capitalize">
                      Type: {myBooking.type}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-white p-2 text-xs">
                    <p className="font-semibold text-slate-900">
                      Available
                    </p>
                    <p className="mt-1 text-slate-500">
                      Click to book
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <BookingModal
          selectedDate={selectedDate}
          onClose={() => setSelectedDate(null)}
          onSuccess={fetchWeek}
        />
      )}
    </div>
  );
}

export default WeekCalendar;