import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

function BookingModal({ selectedDate, onClose, onSuccess }) {
  const [type, setType] = useState("designated");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setVisible(true);
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const res = await axios.post("/bookings", {
        date: selectedDate,
        type,
      });

      setMessage(res.data.message);
      onSuccess();
      setTimeout(() => {
        onClose();
        navigate("/bookings");
      }, 600);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const disablePrimary = !type || !selectedDate || isSubmitting;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200 transition-all duration-200 ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
        }`}
      >
        <h2 className="mb-1 text-base font-semibold text-slate-900">
          Book seat for {selectedDate}
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Choose the seat type and confirm your reservation for this date.
        </p>

        <form
          onSubmit={handleBooking}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Seat type
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="designated">Designated</option>
              <option value="floater">Floater</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disablePrimary}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting && (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              <span>
                {isSubmitting ? "Booking..." : "Confirm booking"}
              </span>
            </button>
          </div>
        </form>

        {message && (
          <p className="mt-3 text-xs text-slate-600">{message}</p>
        )}
      </div>
    </div>
  );
}

export default BookingModal;