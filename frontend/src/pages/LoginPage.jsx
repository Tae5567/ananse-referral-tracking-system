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

    const submitLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
        const csrfResponse = await api.get("csrf/");

        const csrfToken = csrfResponse.data.csrfToken;

        await api.post(
            "auth/login/",
            {
                username,
                password,
            },
            {
                headers: {
                    "X-CSRFToken": csrfToken,
                },
            }
        );

        navigate("/dashboard");

    } catch (error) {
        console.error("Login error:", error);

        if (error.response) {
            console.error("Response:", error.response.data);

            setError(
                error.response.data?.error ||
                "Unable to sign in. Please try again."
            );
        } else {
            setError("Unable to connect to the server.");
        }
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-6">

            <div className="w-full max-w-md">

                <div className="text-center mb-8">

                    <img
                        src={logo}
                        alt="Ananse"
                        className="mx-auto h-12 w-auto"
                    />

                    <p className="mt-5 text-sm text-gray-500">
                        Ananse Center for Design
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                        Referral Dashboard
                    </h1>

                    <p className="mt-3 text-gray-600">
                        Sign in to view your referral activity.
                    </p>

                </div>

                <form
                    onSubmit={submitLogin}
                    className="rounded-3xl bg-white border border-gray-200 shadow-sm p-7"
                >

                    {error && (
                        <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div>

                        <label className="block text-sm font-medium text-gray-700">
                            Username
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            required
                            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        />

                    </div>

                    <div className="mt-5">

                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        />

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 w-full rounded-full bg-black px-6 py-3 font-medium text-white disabled:opacity-50"
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign in"
                        }
                    </button>

                </form>

            </div>

        </div>
    );
}

export default LoginPage;