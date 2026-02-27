import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import AppLayout from "../components/layout/AppLayout";
import axios from "../api/axios";

function toDateInputValue(dateValue) {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

const TAB_ITEMS = [
  { key: "add_user", label: "Add user" },
  { key: "search_user", label: "Search user" },
  { key: "make_booking", label: "Make booking" },
  { key: "modify_booking", label: "Modify booked seats" },
  { key: "holidays", label: "Holidays" },
];

export default function AdminPanel() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("add_user");
  const [users, setUsers] = useState([]);
  const [seats, setSeats] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [bookingEdits, setBookingEdits] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    team: "",
    batch: "1",
    role: "employee",
  });
  const [userSearch, setUserSearch] = useState("");
  const [newBooking, setNewBooking] = useState({
    userId: "",
    seatId: "",
    date: new Date().toISOString().slice(0, 10),
    status: "booked",
  });
  const [newHoliday, setNewHoliday] = useState({
    date: new Date().toISOString().slice(0, 10),
    reason: "",
  });

  const loadAdminData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [usersRes, seatsRes, bookingsRes, holidaysRes] = await Promise.all([
        axios.get("/admin/users"),
        axios.get("/admin/seats"),
        axios.get("/admin/bookings"),
        axios.get("/admin/holidays"),
      ]);

      const fetchedUsers = usersRes.data.users ?? [];
      const fetchedSeats = seatsRes.data.seats ?? [];
      const fetchedBookings = bookingsRes.data.bookings ?? [];
      const fetchedHolidays = holidaysRes.data.holidays ?? [];

      setUsers(fetchedUsers);
      setSeats(fetchedSeats);
      setBookings(fetchedBookings);
      setHolidays(fetchedHolidays);
      setNewBooking((prev) => ({
        ...prev,
        userId: prev.userId || fetchedUsers[0]?._id || "",
        seatId: prev.seatId || fetchedSeats[0]?._id || "",
      }));

      const initialEdits = {};
      fetchedBookings.forEach((booking) => {
        initialEdits[booking._id] = {
          userId: booking.userId?._id ?? "",
          seatId: booking.seatId?._id ?? "",
          date: toDateInputValue(booking.date),
          status: booking.status,
        };
      });
      setBookingEdits(initialEdits);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      loadAdminData();
    }
  }, [user?.role]);

  const handleNewUserChange = (field, value) => {
    setNewUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await axios.post("/admin/users", {
        ...newUser,
        batch: Number(newUser.batch),
      });
      setMessage("User created successfully");
      setNewUser({
        name: "",
        email: "",
        password: "",
        team: "",
        batch: "1",
        role: "employee",
      });
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (userId) => {
    setMessage("");
    setError("");
    try {
      await axios.delete(`/admin/users/${userId}`);
      setMessage("User deleted successfully");
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleBookingEditChange = (bookingId, field, value) => {
    setBookingEdits((prev) => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        [field]: value,
      },
    }));
  };

  const handleUpdateBooking = async (bookingId) => {
    setMessage("");
    setError("");
    try {
      const payload = bookingEdits[bookingId];
      await axios.patch(`/admin/bookings/${bookingId}`, payload);
      setMessage("Booking updated successfully");
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update booking");
    }
  };

  const handleNewBookingChange = (field, value) => {
    setNewBooking((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await axios.post("/admin/bookings", newBooking);
      setMessage("Booking created successfully");
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create booking");
    }
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await axios.post("/admin/holidays", newHoliday);
      setMessage("Holiday added successfully");
      setNewHoliday((prev) => ({ ...prev, reason: "" }));
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add holiday");
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    setMessage("");
    setError("");
    try {
      await axios.delete(`/admin/holidays/${holidayId}`);
      setMessage("Holiday removed successfully");
      loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove holiday");
    }
  };

  const filteredUsers = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword) ||
        String(u.batch).includes(keyword) ||
        u.team.toLowerCase().includes(keyword)
    );
  }, [users, userSearch]);

  if (user?.role !== "admin") {
    return (
      <AppLayout>
        <p className="text-sm text-red-500">Only admins can access this panel.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
          Admin Panel
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage users and bookings with dedicated tabs.
        </p>
      </section>

      {message && <p className="mb-3 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      <section className="mb-4 flex flex-wrap gap-2">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {activeTab === "add_user" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            Add User
          </h2>
          <form
            onSubmit={handleCreateUser}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input
              value={newUser.name}
              onChange={(e) => handleNewUserChange("name", e.target.value)}
              placeholder="Name"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              required
            />
            <input
              value={newUser.email}
              onChange={(e) => handleNewUserChange("email", e.target.value)}
              placeholder="Email"
              type="email"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              required
            />
            <input
              value={newUser.password}
              onChange={(e) => handleNewUserChange("password", e.target.value)}
              placeholder="Password"
              type="password"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              required
            />
            <input
              value={newUser.team}
              onChange={(e) => handleNewUserChange("team", e.target.value)}
              placeholder="Team"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              required
            />
            <select
              value={newUser.batch}
              onChange={(e) => handleNewUserChange("batch", e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="1">Batch 1</option>
              <option value="2">Batch 2</option>
            </select>
            <select
              value={newUser.role}
              onChange={(e) => handleNewUserChange("role", e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Create user
            </button>
          </form>
        </section>
      )}

      {activeTab === "search_user" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            Search User
          </h2>
          <input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search users by name, email, team, batch"
            className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading users...</p>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div
                  key={u._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {u.name} ({u.role})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {u.email} | {u.team} | Batch {u.batch}
                    </p>
                  </div>
                  {u._id !== user.id && (
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="rounded-lg bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "make_booking" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            Make Booking
          </h2>
          <form
            onSubmit={handleCreateBooking}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            <select
              value={newBooking.userId}
              onChange={(e) => handleNewBookingChange("userId", e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              required
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>

            <select
              value={newBooking.seatId}
              onChange={(e) => handleNewBookingChange("seatId", e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              required
            >
              <option value="">Select seat</option>
              {seats.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.seatNumber} ({s.type})
                </option>
              ))}
            </select>

            <input
              type="date"
              value={newBooking.date}
              onChange={(e) => handleNewBookingChange("date", e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              required
            />

            <select
              value={newBooking.status}
              onChange={(e) => handleNewBookingChange("status", e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="booked">booked</option>
              <option value="released">released</option>
            </select>

            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Create booking
            </button>
          </form>
        </section>
      )}

      {activeTab === "modify_booking" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            Modify Booked Seats
          </h2>
          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading bookings...</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const edit = bookingEdits[booking._id];
                if (!edit) return null;

                return (
                  <div
                    key={booking._id}
                    className="grid gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-600 lg:grid-cols-6"
                  >
                    <select
                      value={edit.userId}
                      onChange={(e) =>
                        handleBookingEditChange(booking._id, "userId", e.target.value)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={edit.seatId}
                      onChange={(e) =>
                        handleBookingEditChange(booking._id, "seatId", e.target.value)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {seats.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.seatNumber} ({s.type})
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={edit.date}
                      onChange={(e) =>
                        handleBookingEditChange(booking._id, "date", e.target.value)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    />

                    <select
                      value={edit.status}
                      onChange={(e) =>
                        handleBookingEditChange(booking._id, "status", e.target.value)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="booked">booked</option>
                      <option value="released">released</option>
                    </select>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Current: {booking.userId?.name} | {booking.seatId?.seatNumber}
                    </div>

                    <button
                      onClick={() => handleUpdateBooking(booking._id)}
                      className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "holidays" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            Holidays
          </h2>
          <form onSubmit={handleCreateHoliday} className="mb-4 grid gap-3 sm:grid-cols-3">
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) =>
                setNewHoliday((prev) => ({ ...prev, date: e.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              required
            />
            <input
              type="text"
              value={newHoliday.reason}
              onChange={(e) =>
                setNewHoliday((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="Reason (e.g. Public holiday)"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 sm:col-span-2"
              required
            />
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:col-span-3 sm:w-fit">
              Add holiday
            </button>
          </form>

          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading holidays...
            </p>
          ) : (
            <div className="space-y-2">
              {holidays.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No holidays configured.
                </p>
              )}
              {holidays.map((holiday) => (
                <div
                  key={holiday._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {toDateInputValue(holiday.date)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {holiday.reason}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(holiday._id)}
                    className="rounded-lg bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-600"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </AppLayout>
  );
}
