import AppLayout from "../components/layout/AppLayout";
import SeatLayout from "../components/SeatLayout";

export default function SeatLayoutPage() {
  return (
    <AppLayout>
      <section className="mb-4 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
          Seat Layout
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          View seat status and click a seat to see who booked it.
        </p>
      </section>

      <SeatLayout />
    </AppLayout>
  );
}
