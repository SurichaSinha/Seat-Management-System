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
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-base font-semibold text-slate-900">
        My Bookings
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Review your upcoming seat reservations and release any you no longer need.
      </p>

      {bookings.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No bookings found.
        </p>
      ) : (
        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Date
              </th>
              <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Seat
              </th>
              <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Type
              </th>
              <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Status
              </th>
              <th className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking._id}
                className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <td className="p-2 text-slate-700">
                  {new Date(booking.date).toLocaleDateString()}
                </td>
                <td className="p-2 text-slate-700">
                  {booking.seatId?.seatNumber}
                </td>
                <td className="p-2 text-slate-700 capitalize">
                  {booking.type}
                </td>
                <td className="p-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      booking.status === "booked"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-slate-50 text-slate-600 ring-1 ring-slate-200"
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