import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/logo.jpg";

function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submitLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            const csrfResponse = await api.get("/api/csrf/");
            await api.post(
                "/api/auth/login/",
                { username, password },
                { headers: { "X-CSRFToken": csrfResponse.data.csrfToken } }
            );
            navigate("/dashboard");
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.error || "Unable to sign in. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid min-h-screen bg-[#F7F4EE] lg:grid-cols-[.9fr_1.1fr]">
            <div className="flex items-center justify-center px-5 py-10 sm:px-8">
                <div className="w-full max-w-md">
                    <img src={logo} alt="Ananse" className="h-10 w-auto" />
                    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#A27D39]">Internal platform</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">Referral & sales</h1>
                    <p className="mt-3 text-sm leading-6 text-neutral-500">Sign in to manage your leads, sales activity and referral performance.</p>

                    <form onSubmit={submitLogin} className="ui-card mt-7 space-y-5 p-5 sm:p-6">
                        {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
                        <label><span className="ui-label">Username</span><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="ui-input" autoComplete="username" /></label>
                        <label><span className="ui-label">Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="ui-input" autoComplete="current-password" /></label>
                        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Signing in..." : "Sign in"}</button>
                    </form>
                </div>
            </div>

            <div className="hidden bg-neutral-950 p-10 text-white lg:flex lg:flex-col lg:justify-end">
                <div className="max-w-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D6B875]">Ananse Center for Design</p>
                    <p className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em]">One view of referrals, relationships and revenue.</p>
                    <p className="mt-4 max-w-lg text-sm leading-7 text-neutral-400">Built for Ananse staff to follow leads from first click through to paid website orders and custom sales.</p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
