import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import { useSearchParams } from "react-router-dom";

function InquiryPage() {
    const navigate = useNavigate();

    const [message, setMessage] = useState("");
    const [serviceName, setServiceName] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [searchParams] = useSearchParams();

    const referralCode = searchParams.get("ref") || "";

    const submitInquiry = async (e) => {
        e.preventDefault();

        if (!message.trim()) {
            alert("Please tell us what service you need.");
            return;
        }

        setLoading(true);
try {
        const csrfResponse = await api.get("/api/csrf/");

        const csrfToken = csrfResponse.data.csrfToken;

        await api.post(
            "/api/leads/inquiry/",
            {
                referral_code: "camille",
                service_name: serviceName,
                inquiry_message: message,
            },
            {
                headers: {
                    "X-CSRFToken": csrfToken,
                },
            }
        );

        setSubmitted(true);

    } catch (error) {

        console.error(
            "Inquiry submission error:",
            error
        );

        if (error.response) {
            console.error(
                "Response:",
                error.response.data
            );
        }

        alert(
            "Something went wrong. Please try again."
        );

    } finally {
        setLoading(false);
    }
};
    if (submitted) {
        return (
            <div className="flex min-h-screen items-center justify-center px-6">
                <div className="max-w-xl text-center">

                    <h1 className="text-3xl font-semibold">
                        Thanks for reaching out!
                    </h1>

                    <p className="mt-4 text-gray-600">
                        We will follow up with you about your request.
                    </p>

                    <button
                        onClick={() => navigate(`/services?ref=${referralCode}`)}
                        className="mt-8 rounded-full bg-black px-6 py-3 text-white"
                    >
                        Back to Services
                    </button>

                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-6 py-12">

            <div className="mx-auto max-w-2xl">

                <button
                    onClick={() => navigate(`/services?ref=${referralCode}`)}
                    className="mb-8 text-sm underline"
                >
                    ← Back to Services
                </button>

                <h1 className="text-4xl font-semibold">
                    Tell us what you need
                </h1>

                <p className="mt-4 text-gray-600">
                    Can't find the service you're looking for?
                    Tell us about it and we will get in touch.
                </p>

                <form
                    onSubmit={submitInquiry}
                    className="mt-8 space-y-6"
                >

                    <div>
                        <label className="block text-sm font-medium">
                            Service you're looking for
                        </label>

                        <input
                            type="text"
                            value={serviceName}
                            onChange={(e) =>
                                setServiceName(e.target.value)
                            }
                            placeholder="e.g. Product photography"
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">
                            Tell us more
                        </label>

                        <textarea
                            value={message}
                            onChange={(e) =>
                                setMessage(e.target.value)
                            }
                            rows="6"
                            placeholder="Tell us what you need..."
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-full bg-black px-6 py-3 text-white disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send Inquiry"}
                    </button>

                </form>

            </div>

        </div>
    );
}

export default InquiryPage;