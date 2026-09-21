import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/dashboard/PageHeader";
import MetricCard from "../components/dashboard/MetricCard";
import SectionCard from "../components/dashboard/SectionCard";
import EmptyState from "../components/dashboard/EmptyState";
import StatusBadge from "../components/dashboard/StatusBadge";

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

    if (loading) return <DashboardLayout><div className="app-page"><p className="text-sm text-neutral-500">Loading company overview...</p></div></DashboardLayout>;
    if (error) return <DashboardLayout><div className="app-page"><div className="ui-card p-5 text-sm text-rose-700">{error}</div></div></DashboardLayout>;

    const stats = data?.stats || {};
    const staff = data?.staff_performance || [];
    const external = data?.external_sources || [];

    return (
        <DashboardLayout>
            <div className="app-page">
                <PageHeader
                    eyebrow="Management"
                    title="Company overview"
                    description="Referral, lead and sales performance across Ananse."
                />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                    <MetricCard label="Clicks" value={stats.clicks || 0} />
                    <MetricCard label="Unique visitors" value={stats.unique_visitors || 0} />
                    <MetricCard label="Total leads" value={stats.leads || 0} helper={`${stats.active_leads || 0} active`} />
                    <MetricCard label="Website orders" value={stats.website_orders || 0} />
                    <MetricCard label="Custom sales" value={stats.custom_sales || 0} />
                    <MetricCard
                        label="Total service revenue"
                        value={money(stats.total_revenue)}
                    />
                </div>

                <SectionCard className="mt-5" title="Staff performance" description="Performance is attributed to each staff member's referral source.">
                    {staff.length === 0 ? (
                        <EmptyState title="No staff performance yet" />
                    ) : (
                        <div className="scrollbar-thin overflow-x-auto">
                            <table className="min-w-[840px] w-full border-collapse text-sm">
                                <thead className="bg-[#FBFAF8] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-400">
                                    <tr>
                                        <th className="px-5 py-3">Staff</th>
                                        <th className="px-5 py-3">Referral</th>
                                        <th className="px-5 py-3">Clicks</th>
                                        <th className="px-5 py-3">Leads</th>
                                        <th className="px-5 py-3">Website</th>
                                        <th className="px-5 py-3">Custom</th>
                                        <th className="px-5 py-3">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.map((person) => (
                                        <tr key={person.id} className="border-t border-neutral-100 hover:bg-[#FCFBF9]">
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-neutral-900">{person.name}</p>
                                                <p className="mt-0.5 text-xs text-neutral-400">{person.role === "manager" ? "Manager" : "Sales Rep"}</p>
                                            </td>
                                            <td className="px-5 py-4 text-neutral-600">{person.referral ? `/r/${person.referral.code}` : "—"}</td>
                                            <td className="px-5 py-4 text-neutral-700">{person.metrics.clicks}</td>
                                            <td className="px-5 py-4 text-neutral-700">{person.metrics.leads}</td>
                                            <td className="px-5 py-4 text-neutral-700">{person.metrics.website_orders}</td>
                                            <td className="px-5 py-4 text-neutral-700">{person.metrics.custom_sales}</td>
                                            <td className="px-5 py-4 font-semibold text-neutral-950">{money(person.metrics.total_revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>

                <SectionCard className="mt-5" title="Influencers & partners" description="External sources are measured by traffic and leads. Follow-up is handled internally by Ananse staff.">
                    {external.length === 0 ? (
                        <EmptyState title="No external referral sources yet" />
                    ) : (
                        <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
                            {external.map((source) => (
                                <div key={source.id} className="rounded-2xl border border-neutral-200/70 bg-[#FCFBF9] p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-neutral-900">{source.name}</p>
                                            <p className="mt-0.5 text-xs capitalize text-neutral-400">{source.source_type}</p>
                                        </div>
                                        <StatusBadge value={source.active ? "active" : "inactive"} />
                                    </div>
                                    <p className="mt-3 break-all text-xs text-neutral-500">/r/{source.code}</p>
                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        <MiniMetric label="Clicks" value={source.metrics.clicks} />
                                        <MiniMetric label="Visitors" value={source.metrics.unique_visitors} />
                                        <MiniMetric label="Leads" value={source.metrics.leads} />
                                    </div>
                                    <p className="mt-3 text-xs text-neutral-400">Managed by {source.managed_by || "Unassigned"}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </DashboardLayout>
    );
}

function MiniMetric({ label, value }) {
    return (
        <div className="rounded-xl border border-neutral-200/70 bg-white px-3 py-3">
            <p className="text-lg font-semibold tracking-tight text-neutral-950">{value}</p>
            <p className="mt-0.5 text-[11px] text-neutral-400">{label}</p>
        </div>
    );
}

export default ManagementDashboardPage;
