import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, NavLink } from "react-router-dom";
import ThemeToggleButton from "../ThemeToggleButton";

function AppLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-sm">
                SMS
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Seat Management System
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Corporate seat booking dashboard
                </p>
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {user.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {user.email}
                  </span>
                </div>

                <ThemeToggleButton />

                <button
                  onClick={handleLogout}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          <nav className="flex justify-center gap-3 border-t border-slate-100 pb-1 pt-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
            <NavLink
              to="/book-seats"
              className={({ isActive }) =>
                `rounded-full px-3 py-1 transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700"
                }`
              }
            >
              Book seats
            </NavLink>
            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `rounded-full px-3 py-1 transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700"
                }`
              }
            >
              Bookings
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `rounded-full px-3 py-1 transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700"
                }`
              }
            >
              Profile
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
      </main>
    </div>
  );
}

export default AppLayout;
  