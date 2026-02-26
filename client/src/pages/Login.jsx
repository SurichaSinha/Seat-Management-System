import { useState, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("/auth/login", {
        email,
        password
      });

      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-sky via-pastel-rose to-pastel-indigo px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-white/60 shadow-xl rounded-2xl px-8 py-10 space-y-6"
      >
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold text-slate-800">
            Employee Login
          </h2>
          <p className="text-sm text-slate-500">
            Sign in to manage your office seat bookings.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-600">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pastel-indigo focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-600">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-pastel-indigo focus:border-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="w-full mt-4 rounded-xl bg-indigo-400 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300">
          Login
        </button>

        {error && (
          <p className="text-red-500 text-sm mt-4">{error}</p>
        )}
      </form>
    </div>
  );
}

export default Login;