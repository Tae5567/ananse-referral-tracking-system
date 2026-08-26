import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

function InquiriesPage() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadInquiries = async () => {
        try {
            const response = await api.get("/api/dashboard/");
            setInquiries(response.data.inquiries || []);
        } catch (error) {
            console.error("Inquiry loading error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInquiries();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            const csrf = await api.get("/api/csrf/");

            await api.patch(
                `/api/leads/inquiries/${id}/status/`,
                { status },
                {
                    headers: {
                        "X-CSRFToken": csrf.data.csrfToken,
                    },
                }
            );

            // Converted inquiries disappear from the active list.
            setInquiries((current) =>
                status === "converted"
                    ? current.filter((item) => item.id !== id)
                    : current.map((item) =>
                        item.id === id
                            ? { ...item, status }
                            : item
                    )
            );
        } catch (error) {
            console.error("Inquiry status error:", error);
            alert("Unable to update inquiry.");
        }
    };

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-5xl px-6 py-10">

                <div className="mb-8">
                    <h1 className="text-3xl font-semibold">
                        Inquiries
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Follow up with customers who have requested custom services.
                    </p>
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading inquiries...</p>
                ) : inquiries.length === 0 ? (
                    <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                        <p className="text-gray-500">
                            No active inquiries.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {inquiries.map((inquiry) => (
                            <div
                                key={inquiry.id}
                                className="rounded-2xl bg-white p-6 shadow-sm"
                            >
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                                    <div>
                                        <h2 className="font-semibold text-lg">
                                            {inquiry.first_name} {inquiry.last_name}
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-500">
                                            {inquiry.service_name || "Custom service"}
                                        </p>

                                        <div className="mt-3 text-sm text-gray-600">
                                            <p>{inquiry.email}</p>
                                            <p>{inquiry.phone}</p>
                                        </div>
                                    </div>

                                    <select
                                        value={inquiry.status}
                                        onChange={(e) =>
                                            updateStatus(
                                                inquiry.id,
                                                e.target.value
                                            )
                                        }
                                        className="rounded-xl border px-4 py-2 text-sm"
                                    >
                                        <option value="new">New</option>
                                        <option value="contacted">
                                            Contacted
                                        </option>
                                        <option value="converted">
                                            Converted
                                        </option>
                                    </select>
                                </div>

                                <div className="mt-5 rounded-xl bg-gray-50 p-4">
                                    <p className="text-sm leading-6 text-gray-700">
                                        {inquiry.inquiry_message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default InquiriesPage;