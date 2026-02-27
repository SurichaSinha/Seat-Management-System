import { useEffect, useState } from "react";
import dayjs from "dayjs";
import AppLayout from "../components/layout/AppLayout";
import MyBookings from "../components/MyBookings";
import axios from "../api/axios";

export default function Bookings() {
  const [stats, setStats] = useState({
    upcoming: 0,
    total: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/bookings/me");
        const list = res.data.bookings ?? [];
        const todayStart = dayjs().startOf("day");

        const upcoming = list.filter((b) => {
          const d = dayjs(b.date);
          return (
            b.status === "booked" &&
            (d.isSame(todayStart, "day") || d.isAfter(todayStart))
          );
        }).length;

        setStats({
          upcoming,
          total: list.length,
        });
      } catch {
        // ignore, keep defaults
      }
    };

    load();
  }, []);

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800";

  return (
    <AppLayout>
      <section className="mb-4 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
          My bookings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          View and manage all your upcoming and past seat reservations.
        </p>
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className={cardClass}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Upcoming
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {stats.upcoming}
          </p>
        </div>
        <div className={cardClass}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Total bookings
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {stats.total}
          </p>
        </div>
      </section>

      <MyBookings />
    </AppLayout>
  );
}

