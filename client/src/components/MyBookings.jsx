import { useEffect, useState } from "react";
import axios from "../api/axios";

function MyBookings() {
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    const res = await axios.get("/bookings/me");
    setBookings(res.data.bookings);
  };

  const handleRelease = async (id) => {
    await axios.delete(`/bookings/${id}`);
    fetchBookings();
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        My Bookings
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Review your upcoming seat reservations and release any you no longer need.
      </p>

      {bookings.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          No bookings found.
        </p>
      ) : (
        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
              <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Date
              </th>
              <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Seat
              </th>
              <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Type
              </th>
              <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Status
              </th>
              <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking._id}
                className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:odd:bg-slate-800 dark:even:bg-slate-900 dark:hover:bg-slate-700/40"
              >
                <td className="p-2 text-slate-700 dark:text-slate-200">
                  {new Date(booking.date).toLocaleDateString()}
                </td>
                <td className="p-2 text-slate-700 dark:text-slate-200">
                  {booking.seatId?.seatNumber}
                </td>
                <td className="p-2 capitalize text-slate-700 dark:text-slate-200">
                  {booking.type}
                </td>
                <td className="p-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      booking.status === "booked"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800"
                        : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600"
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="p-2">
                  {booking.status === "booked" && (
                    <button
                      onClick={() => handleRelease(booking._id)}
                      className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
                    >
                      Release
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MyBookings;
