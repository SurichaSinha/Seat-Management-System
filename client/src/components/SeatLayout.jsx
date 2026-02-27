import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import axios from "../api/axios";

function SeatLayout() {
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadLayout = async () => {
      if (isMounted) {
        setLoading(true);
        setError("");
      }
      try {
        const res = await axios.get(
          `/bookings/layout?date=${selectedDate}`
        );
        if (isMounted) {
          setSeats(res.data.seats ?? []);
          setLastUpdatedAt(dayjs().format("HH:mm:ss"));
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || "Failed to load seat layout"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLayout();
    const timer = setInterval(loadLayout, 15000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [selectedDate]);

  const stats = useMemo(() => {
    const result = {
      mine: 0,
      bookedByOthers: 0,
      floaterAvailable: 0,
      designatedAvailable: 0
    };

    seats.forEach((seat) => {
      if (seat.isMine) {
        result.mine += 1;
        return;
      }

      if (seat.isBooked) {
        result.bookedByOthers += 1;
        return;
      }

      if (seat.type === "floater") {
        result.floaterAvailable += 1;
        return;
      }

      result.designatedAvailable += 1;
    });

    return result;
  }, [seats]);

  const liveBookedCount = useMemo(
    () => seats.filter((seat) => seat.isBooked).length,
    [seats]
  );
  const liveAvailableCount = seats.length - liveBookedCount;

  const getPopularityBadge = (count) => {
    if (count >= 8) {
      return {
        label: "Hot",
        className:
          "bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800"
      };
    }
    if (count >= 4) {
      return {
        label: "Popular",
        className:
          "bg-orange-100 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:ring-orange-800"
      };
    }
    return null;
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Seat layout
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Visual map for your seat, booked seats, and available floater seats.
          </p>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-800">
          Live seat counter: {liveBookedCount} booked / {seats.length} total
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600">
          {liveAvailableCount} available
        </span>
        {lastUpdatedAt && (
          <span className="text-slate-500 dark:text-slate-400">
            Updated at {lastUpdatedAt}
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          My seat ({stats.mine})
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Booked ({stats.bookedByOthers})
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Floater available ({stats.floaterAvailable})
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-800">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          Designated available ({stats.designatedAvailable})
        </span>
      </div>

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading seat layout...
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {seats.map((seat) => {
            const cardClass = seat.isMine
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"
              : seat.isBooked
                ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-200"
                : seat.type === "floater"
                  ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
                  : "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-200";

            const status = seat.isMine
              ? "My seat"
              : seat.isBooked
                ? "Booked"
                : seat.type === "floater"
                  ? "Floater"
                  : "Designated";
            const badge = getPopularityBadge(seat.popularityCount ?? 0);

            return (
              <div
                key={seat._id}
                className={`group relative z-0 overflow-visible cursor-pointer rounded-xl border p-3 shadow-sm transition-transform hover:z-30 hover:-translate-y-0.5 ${cardClass}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{seat.seatNumber}</p>
                  {badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] uppercase tracking-wide opacity-85">
                  {status}
                </p>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max -translate-x-1/2 rounded-md bg-slate-950 px-2.5 py-1.5 text-xs text-white opacity-100 shadow-2xl ring-1 ring-slate-700 group-hover:block">
                  {seat.isBooked
                    ? `Booked for: ${seat.bookedByName || "Unknown user"}`
                    : "Currently available"}
                  {` | Used ${seat.popularityCount ?? 0}x (last 28 days)`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default SeatLayout;
