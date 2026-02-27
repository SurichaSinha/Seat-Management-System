import { useContext } from "react";
import AppLayout from "../components/layout/AppLayout";
import { AuthContext } from "../context/AuthContext";

export default function Profile() {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppLayout>
      <section className="mb-6 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
          Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your employee information and hybrid seating configuration.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Team
              </dt>
              <dd className="rounded-lg bg-slate-50 px-3 py-2 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                {user.team}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Batch
              </dt>
              <dd className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                Batch {user.batch}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Role
              </dt>
              <dd className="rounded-lg bg-slate-50 px-3 py-2 text-slate-800 capitalize dark:bg-slate-700 dark:text-slate-200">
                {user.role || "employee"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Seat booking rules
          </h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li>
              - Batch {user.batch} follows a rotating pattern of designated days
              (Mon-Wed vs Thu-Fri) based on the week.
            </li>
            <li>
              - On your designated days you must book a{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                designated
              </span>{" "}
              seat.
            </li>
            <li>
              - On non-batch days you may request a{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                floater
              </span>{" "}
              seat for Monday on Friday, and for Tuesday-Friday one day before.
            </li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
