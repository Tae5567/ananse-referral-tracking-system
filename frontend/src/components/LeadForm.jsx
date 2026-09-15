import { useState } from "react";
import api from "../services/api";
import { getCookie } from "../utils/csrf";
import { useNavigate } from "react-router-dom";

function LeadForm({ referralCode }) {

    const [submitted, setSubmitted] = useState(false);

    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
    });

    function update(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    async function submit(e) {

        e.preventDefault();

        setLoading(true);

        try {
    // Get CSRF token from Django
    const csrfResponse = await api.get("/api/csrf/");

    const csrfToken = csrfResponse.data.csrfToken;

    // Submit lead with CSRF token
    await api.post(
        "/api/leads/",
        {
            ...form,
            referral_code: referralCode,
        },
        {
            headers: {
                "X-CSRFToken": csrfToken,
            },
        }
    );

    navigate(`/services?ref=${referralCode}`);

} catch (err) {
    console.error(err);
    alert("Something went wrong.");
}

        setLoading(false);

    }

    if (submitted) {

        return (

            <section className="max-w-xl mx-auto py-20 px-6 text-center">

                <div className="bg-white rounded-3xl shadow-xl p-10">

                    <h2 className="text-3xl font-bold">
                        Thank you!
                    </h2>

                    <p className="mt-5 text-gray-600">
                        We've received your details.
                        Choose how you'd like to continue.
                    </p>

                    <div className="mt-10 space-y-4">

                        <a
                            href="https://alpha.ananse.com"
                            className="block w-full bg-black text-white rounded-xl py-4 font-semibold hover:bg-gray-800"
                        >
                            Shop FashionHub
                        </a>

                        <button
                            className="w-full border border-gray-300 rounded-xl py-4 font-semibold hover:bg-gray-100"
                        >
                            Request Another Service
                        </button>

                    </div>

                </div>

            </section>

        );

    }

    return (

        <section id="contact" className="py-20 bg-white">

            <div className="max-w-xl mx-auto px-6">

                <div className="bg-white rounded-3xl shadow-xl p-10">

                    <h2 className="text-3xl font-bold text-center">
                        Get Started
                    </h2>

                    <p className="text-center mt-3 text-gray-500">
                        Enter your details before continuing.
                    </p>

                    <form
                        onSubmit={submit}
                        className="mt-8 space-y-5"
                    >

                        <input
                            name="first_name"
                            placeholder="First Name"
                            className="w-full border rounded-xl p-4"
                            onChange={update}
                            required
                        />

                        <input
                            name="last_name"
                            placeholder="Last Name"
                            className="w-full border rounded-xl p-4"
                            onChange={update}
                        />

                        <input
                            name="email"
                            type="email"
                            placeholder="Email"
                            className="w-full border rounded-xl p-4"
                            onChange={update}
                            required
                        />

                        <input
                            name="phone"
                            placeholder="Phone Number"
                            className="w-full border rounded-xl p-4"
                            onChange={update}
                            required
                        />

                        <button
                            disabled={loading}
                            className="w-full bg-[#B68D40] hover:bg-[#9f7b37] text-white rounded-xl py-4 font-semibold transition"
                        >
                            {loading ? "Please wait..." : "Continue"}
                        </button>

                    </form>

                </div>

            </div>

        </section>

    );
}

export default LeadForm;