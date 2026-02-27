import WeekCalendar from "../components/WeekCalander";
import AppLayout from "../components/layout/AppLayout";
import SummaryCards from "../components/SummaryCards";
import SeatLayout from "../components/SeatLayout";

export default function Dashboard() {
  return (
    <AppLayout>
      <section className="mb-4 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
          Seat Management Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Monitor availability and book seats for the upcoming week.
        </p>
      </section>

      <SummaryCards />

      <section className="mt-6">
        <WeekCalendar />
      </section>

      <section className="mt-6">
        <SeatLayout />
      </section>
    </AppLayout>
  );
}
