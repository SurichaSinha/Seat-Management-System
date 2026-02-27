import { useEffect, useState } from "react";
import axios from "../api/axios";
import dayjs from "dayjs";

function SummaryCards() {
  const [stats, setStats] = useState({
    weekTotal: 0,
    floaterToday: 0,
    myUpcoming: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const startOfWeek = dayjs().startOf("week");
        const today = dayjs().format("YYYY-MM-DD");
        const todayStart = dayjs().startOf("day");

        const [weekRes, availabilityRes, myRes] = await Promise.all([
          axios.get(
            `/bookings/week?startDate=${startOfWeek.format("YYYY-MM-DD")}`
          ),
          axios.get(`/bookings/availability?date=${today}`),
          axios.get("/bookings/me"),
        ]);

        const weekTotal = weekRes.data.bookings?.length ?? 0;
        const floaterToday = availabilityRes.data?.availableFloaterSeats ?? 0;
        const myUpcoming =
          myRes.data.bookings?.filter(
            (b) =>
              b.status === "booked" &&
              (dayjs(b.date).isSame(todayStart, "day") ||
                dayjs(b.date).isAfter(todayStart))
          ).length ?? 0;

        setStats({ weekTotal, floaterToday, myUpcoming });
      } catch (e) {
        // keep defaults on error
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const baseCard =
    "rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800";

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <div className={baseCard}>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          This week&apos;s bookings
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {loading ? "-" : stats.weekTotal}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            seats booked
          </span>
        </div>
      </div>

      <div className={baseCard}>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Floater seats today
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-semibold text-blue-600">
            {loading ? "-" : stats.floaterToday}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            available
          </span>
        </div>
      </div>

      <div className={baseCard}>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          My upcoming bookings
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-semibold text-emerald-600">
            {loading ? "-" : stats.myUpcoming}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            reservations
          </span>
        </div>
      </div>
    </section>
  );
}

export default SummaryCards;
