import AppLayout from "../components/layout/AppLayout";
import MyBookings from "../components/MyBookings";

export default function Bookings() {
  return (
    <AppLayout>
      <section className="mb-4 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          My bookings
        </h1>
        <p className="text-sm text-slate-500">
          View and manage all your upcoming and past seat reservations.
        </p>
      </section>

      <MyBookings />
    </AppLayout>
  );
}

