import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

function BookingForm() {
  const [date, setDate] = useState("");
  const [type, setType] = useState("designated");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post("/bookings", {
        date,
        type
      });

      setMessage(res.data.message);
      navigate("/bookings");
    } catch (error) {
      setMessage(error.response?.data?.message || "Error occurred");
    }
  };

  return (
    <div className="mb-8 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-white/60 backdrop-blur-sm">
      <h2 className="text-lg font-semibold text-slate-800">
        Book a Seat
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Choose a date and seat type to reserve your spot in the office.
      </p>

      <form
        onSubmit={handleBooking}
        className="mt-5 flex flex-col gap-4 md:flex-row md:items-end"
      >
        <div className="flex-1 space-y-2">
          <label className="block text-sm font-medium text-slate-600">
            Date
          </label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pastel-mint focus:border-transparent"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="w-full space-y-2 md:w-56">
          <label className="block text-sm font-medium text-slate-600">
            Type
          </label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pastel-mint focus:border-transparent"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="designated">Designated</option>
            <option value="floater">Floater</option>
          </select>
        </div>

        <button className="w-full rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-300 md:w-auto">
          Book
        </button>
      </form>

      {message && (
        <p className="mt-4 text-sm font-medium">{message}</p>
      )}
    </div>
  );
}

export default BookingForm;