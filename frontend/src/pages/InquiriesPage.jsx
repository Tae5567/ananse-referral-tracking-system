import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/dashboard/PageHeader";
import SectionCard from "../components/dashboard/SectionCard";
import EmptyState from "../components/dashboard/EmptyState";

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

            setInquiries((current) =>
                status === "converted" || status === "lost"
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
            <div className="app-page">
                <PageHeader
                    eyebrow="Sales pipeline"
                    title="Inquiries"
                    description="Follow up with customers who have requested custom services."
                />

                <SectionCard>
                    {loading ? (
                        <div className="px-5 py-8 text-sm text-neutral-500">
                            Loading inquiries...
                        </div>
                    ) : inquiries.length === 0 ? (
                        <EmptyState
                            title="No active inquiries"
                            description="New custom-service requests will appear here."
                        />
                    ) : (
                        <div className="divide-y divide-neutral-100">
                            {inquiries.map((inquiry) => (
                                <article
                                    key={inquiry.id}
                                    className="px-4 py-4 sm:px-5"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-base font-semibold text-neutral-950">
                                                    {inquiry.first_name}{" "}
                                                    {inquiry.last_name}
                                                </h2>

                                                <span className="rounded-full bg-[#F5F1E9] px-2.5 py-1 text-[11px] font-semibold text-[#7B6336]">
                                                    {inquiry.service_name ||
                                                        "Custom service"}
                                                </span>
                                            </div>

                                            <div className="mt-3 flex flex-col gap-1 text-sm text-neutral-500 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-1">
                                                <span className="break-all">
                                                    {inquiry.email || "—"}
                                                </span>

                                                <span className="whitespace-nowrap">
                                                    {inquiry.phone || "—"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full lg:w-[220px] lg:flex-none">
                                            <select
                                                value={inquiry.status}
                                                onChange={(e) =>
                                                    updateStatus(
                                                        inquiry.id,
                                                        e.target.value
                                                    )
                                                }
                                                className="ui-input w-full py-2 text-sm"
                                            >
                                                <option value="new">
                                                    New
                                                </option>

                                                <option value="contacted">
                                                    Contacted
                                                </option>

                                                <option value="follow_up">
                                                    Follow-up Required
                                                </option>

                                                <option value="quoted">
                                                    Quote Sent
                                                </option>

                                                <option value="converted">
                                                    Converted
                                                </option>

                                                <option value="lost">
                                                    Lost
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-xl bg-[#F9F7F3] p-4">
                                        <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                                            {inquiry.inquiry_message ||
                                                "No message provided."}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </DashboardLayout>
    );
}

export default InquiriesPage;