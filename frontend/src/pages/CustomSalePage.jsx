
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

function CustomSalePage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        customer_first_name: "",
        customer_last_name: "",
        customer_email: "",
        customer_phone: "",
        service_name: "",
        amount: "",
        payment_method: "bank_transfer",
        status: "paid",
        notes: "",
        sale_date: new Date().toISOString().slice(0, 16),
    });

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

   const submitSale = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
        // Get CSRF cookie first
        const csrfResponse = await api.get("/api/csrf/");

        const csrfToken =
            csrfResponse.data.csrfToken ||
            csrfResponse.data.csrftoken;

        await api.post(
            "/api/sales/custom-sales/",
            form,
            {
                headers: {
                    "X-CSRFToken": csrfToken,
                },
            }
        );

        setSubmitted(true);

    } catch (error) {
        console.error("Custom sale error:", error);

        if (error.response) {
            console.error(
                "Response:",
                error.response.data
            );
        }

        alert("Something went wrong. Please try again.");

    } finally {
        setLoading(false);
    }
};

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-6">
                <div className="max-w-xl text-center">

                    <h1 className="text-3xl font-semibold text-gray-900">
                        Sale recorded
                    </h1>

                    <p className="mt-4 text-gray-600">
                        The sale has been successfully recorded.
                    </p>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="mt-8 rounded-full bg-black px-6 py-3 text-white"
                    >
                        Back to Dashboard
                    </button>

                </div>
            </div>
        );
    }


    return (
        <DashboardLayout>
        <div className="min-h-screen bg-[#FAF8F5] px-6 py-8">

            <div className="mx-auto max-w-3xl px-6 py-10">

                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 text-sm underline"
                >
                    ← Back
                </button>

                <h1 className="text-3xl font-semibold">
                    Record a Custom Sale
                </h1>

                <p className="mt-3 text-gray-500">
                    Record services or bookings paid outside the
                    Ananse Center for Design website.
                </p>

                <form
                    onSubmit={submitSale}
                    className="mt-6 space-y-4"
                >

                    {/* Customer */}

                    <div className="grid gap-6 md:grid-cols-2">

                        <div>
                            <label className="block text-sm font-medium">
                                First name
                            </label>

                            <input
                                name="customer_first_name"
                                value={form.customer_first_name}
                                onChange={handleChange}
                                required
                                className="mt-2 w-full rounded-xl border px-4 py-3"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium">
                                Last name
                            </label>

                            <input
                                name="customer_last_name"
                                value={form.customer_last_name}
                                onChange={handleChange}
                                className="mt-2 w-full rounded-xl border px-4 py-3"
                            />
                        </div>

                    </div>

                    {/* Contact */}

                    <div>
                        <label className="block text-sm font-medium">
                            Email
                        </label>

                        <input
                            type="email"
                            name="customer_email"
                            value={form.customer_email}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">
                            Phone
                        </label>

                        <input
                            type="tel"
                            name="customer_phone"
                            value={form.customer_phone}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                        />
                    </div>

                    {/* Service */}

                    <div>
                        <label className="block text-sm font-medium">
                            Service
                        </label>

                        <input
                            name="service_name"
                            value={form.service_name}
                            onChange={handleChange}
                            placeholder="e.g. Photography Package"
                            required
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                        />
                    </div>

                    {/* Amount */}

                    <div>
                        <label className="block text-sm font-medium">
                            Amount (₦)
                        </label>

                        <input
                            type="number"
                            name="amount"
                            value={form.amount}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            required
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                        />
                    </div>

                    {/* Payment method */}

                    <div>
                        <label className="block text-sm font-medium">
                            Payment method
                        </label>

                        <select
                            name="payment_method"
                            value={form.payment_method}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                        >
                            <option value="bank_transfer">
                                Bank Transfer
                            </option>

                            <option value="onsite">
                                Onsite
                            </option>

                            <option value="other">
                                Other
                            </option>
                        </select>
                    </div>

                    {/* Status */}

                    <div>
                        <label className="block text-sm font-medium">
                            Payment status
                        </label>

                        <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                        >
                            <option value="paid">
                                Paid
                            </option>

                            <option value="pending">
                                Pending
                            </option>

                            <option value="cancelled">
                                Cancelled
                            </option>
                        </select>
                    </div>

                    {/* Notes */}

                    <div>
                        <label className="block text-sm font-medium">
                            Notes
                        </label>

                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Optional notes about this sale..."
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                        />
                    </div>

                    {/* Date */}

                    <div>
                        <label className="block text-sm font-medium">
                            Sale date
                        </label>

                        <input
                            type="datetime-local"
                            name="sale_date"
                            value={form.sale_date}
                            onChange={handleChange}
                            required
                            className="mt-2 w-full rounded-xl border px-4 py-3"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-full bg-black px-6 py-3 text-white disabled:opacity-50"
                    >
                        {loading ? "Recording..." : "Record Sale"}
                    </button>

                </form>

            </div>

        </div>
        </DashboardLayout>

    );
}

export default CustomSalePage;