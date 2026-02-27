import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

function BookingModal({ selectedDate, onClose, onSuccess }) {
  const [type, setType] = useState("designated");
  const [seatId, setSeatId] = useState("");
  const [availableSeats, setAvailableSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [bookForOtherEmployee, setBookForOtherEmployee] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    const loadSeats = async () => {
      setLoadingSeats(true);
      try {
        const res = await axios.get(`/bookings/layout?date=${selectedDate}`);
        const allSeats = res.data.seats ?? [];
        const filteredSeats = allSeats.filter(
          (seat) => !seat.isBooked && seat.type === type
        );
        setAvailableSeats(filteredSeats);
      } catch {
        setAvailableSeats([]);
      } finally {
        setLoadingSeats(false);
      }
    };

    setSeatId("");
    loadSeats();
  }, [selectedDate, type]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const payload = {
        date: selectedDate,
        type,
      };

      if (bookForOtherEmployee) {
        payload.employeeEmail = employeeEmail.trim();
      }
      if (seatId) {
        payload.seatId = seatId;
      }

      const res = await axios.post("/bookings", payload);

      setMessage(res.data.message);
      onSuccess();
      setTimeout(() => {
        onClose();
        navigate("/bookings");
      }, 600);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const disablePrimary =
    !type ||
    !selectedDate ||
    isSubmitting ||
    (bookForOtherEmployee && !employeeEmail.trim());

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200 transition-all duration-200 dark:bg-slate-800 dark:ring-slate-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
          Book seat for {selectedDate}
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Choose the seat type and confirm your reservation for this date.
        </p>

        <form onSubmit={handleBooking} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Seat type
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="designated">Designated</option>
              <option value="floater">Floater</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Seat selection (optional)
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              value={seatId}
              onChange={(e) => setSeatId(e.target.value)}
              disabled={loadingSeats}
            >
              <option value="">Auto assign seat</option>
              {availableSeats.map((seat) => (
                <option key={seat._id} value={seat._id}>
                  {seat.seatNumber}
                </option>
              ))}
            </select>
            {loadingSeats && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Loading available seats...
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-600">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={bookForOtherEmployee}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setBookForOtherEmployee(checked);
                  if (!checked) {
                    setEmployeeEmail("");
                  }
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Book for another employee
            </label>

            {bookForOtherEmployee && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Employee email
                </label>
                <input
                  type="email"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
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
              <span>{isSubmitting ? "Booking..." : "Confirm booking"}</span>
            </button>
          </div>
        </form>

        {message && <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{message}</p>}
      </div>
    </div>
  );
}

export default BookingModal;
