import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

const money = (value) => new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
}).format(Number(value || 0));

function ManagementDashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/api/dashboard/management/")
            .then((response) => setData(response.data))
            .catch((err) => {
                console.error("Management dashboard error:", err);
                setError(err.response?.data?.detail || "Unable to load management dashboard.");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <DashboardLayout><div className="p-10">Loading management dashboard...</div></DashboardLayout>;
    if (error) return <DashboardLayout><div className="p-10 text-red-600">{error}</div></DashboardLayout>;

    const stats = data?.stats || {};

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8">
                    <p className="text-sm uppercase tracking-widest text-[#B68D40]">Management</p>
                    <h1 className="mt-2 text-3xl font-semibold text-gray-900">Company referral & sales overview</h1>
                    <p className="mt-2 text-gray-500">All staff referral performance, external sources and company-wide sales activity.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Stat label="Clicks" value={stats.clicks || 0} />
                    <Stat label="Unique visitors" value={stats.unique_visitors || 0} />
                    <Stat label="Total leads" value={stats.leads || 0} sub={`${stats.active_leads || 0} active`} />
                    <Stat label="Total revenue" value={money(stats.total_revenue)} />
                    <Stat label="Website orders" value={stats.website_orders || 0} />
                    <Stat label="Custom sales" value={stats.custom_sales || 0} />
                </div>

                <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-xl font-semibold">Staff performance</h2>
                        <p className="mt-1 text-sm text-gray-500">Performance is attributed to each staff member's referral source.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="text-left text-gray-500">
                                <tr className="border-b">
                                    <th className="py-3 pr-4">Staff</th><th className="py-3 pr-4">Link</th><th className="py-3 pr-4">Clicks</th><th className="py-3 pr-4">Leads</th><th className="py-3 pr-4">Website</th><th className="py-3 pr-4">Custom</th><th className="py-3">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.staff_performance || []).map((staff) => (
                                    <tr key={staff.id} className="border-b last:border-0">
                                        <td className="py-4 pr-4"><p className="font-medium">{staff.name}</p><p className="text-xs text-gray-500">{staff.role === "manager" ? "Manager" : "Sales Rep"}</p></td>
                                        <td className="py-4 pr-4">{staff.referral ? `/r/${staff.referral.code}` : "—"}</td>
                                        <td className="py-4 pr-4">{staff.metrics.clicks}</td>
                                        <td className="py-4 pr-4">{staff.metrics.leads}</td>
                                        <td className="py-4 pr-4">{staff.metrics.website_orders}</td>
                                        <td className="py-4 pr-4">{staff.metrics.custom_sales}</td>
                                        <td className="py-4 font-medium">{money(staff.metrics.total_revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold">Influencers & partners</h2>
                    <p className="mt-1 text-sm text-gray-500">External sources are measured by traffic and leads. Ananse staff manage the follow-up internally.</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {(data.external_sources || []).length === 0 ? (
                            <p className="text-sm text-gray-500">No external referral sources yet.</p>
                        ) : (data.external_sources || []).map((source) => (
                            <div key={source.id} className="rounded-xl border p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div><p className="font-semibold">{source.name}</p><p className="text-xs capitalize text-gray-500">{source.source_type}</p></div>
                                    <span className={`rounded-full px-2 py-1 text-xs ${source.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{source.active ? "Active" : "Inactive"}</span>
                                </div>
                                <p className="mt-3 text-sm text-gray-600">/r/{source.code}</p>
                                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                    <Metric label="Clicks" value={source.metrics.clicks} />
                                    <Metric label="Visitors" value={source.metrics.unique_visitors} />
                                    <Metric label="Leads" value={source.metrics.leads} />
                                </div>
                                <p className="mt-3 text-xs text-gray-500">Managed by: {source.managed_by || "Unassigned"}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

function Stat({ label, value, sub }) {
    return <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>{sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}</div>;
}

function Metric({ label, value }) {
    return <div className="rounded-lg bg-gray-50 p-2"><p className="text-lg font-semibold">{value}</p><p className="text-[11px] text-gray-500">{label}</p></div>;
}

export default ManagementDashboardPage;
