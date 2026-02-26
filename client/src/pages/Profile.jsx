import { useContext } from "react";
import AppLayout from "../components/layout/AppLayout";
import { AuthContext } from "../context/AuthContext";

export default function Profile() {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <AppLayout>
      <section className="mb-4 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Profile
        </h1>
        <p className="text-sm text-slate-500">
          Your employee information and seat assignment.
        </p>
      </section>

      <div className="max-w-lg rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium text-slate-900">{user.name}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Team</dt>
            <dd className="font-medium text-slate-900">{user.team}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Batch</dt>
            <dd className="font-medium text-slate-900">
              Batch {user.batch}
            </dd>
          </div>
        </dl>
      </div>
    </AppLayout>
  );
}

