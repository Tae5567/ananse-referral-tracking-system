import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/dashboard/PageHeader";
import MetricCard from "../components/dashboard/MetricCard";
import SectionCard from "../components/dashboard/SectionCard";
import EmptyState from "../components/dashboard/EmptyState";
import StatusBadge from "../components/dashboard/StatusBadge";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [updatingOrder, setUpdatingOrder] = useState(null);

    const getCsrfToken = async () => {
        const response = await api.get("/api/csrf/");
        return response.data.csrfToken;
    };

    const loadDashboard = async () => {
        try {
            setError("");
            const response = await api.get("/api/dashboard/");
            setData(response.data);
        } catch (err) {
            console.error("Dashboard error:", err);
            if (err.response?.status === 401) {
                window.location.href = "/login";
                return;
            }
            setError(err.response?.data?.error || "Unable to load the dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const copyReferralLink = async () => {
        const link = `${window.location.origin}/r/${data.referral.code}`;
        await navigator.clipboard.writeText(link);
        alert("Referral link copied.");
    };

    const importCSV = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadMessage("");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const csrfToken = await getCsrfToken();
            const response = await api.post("/api/sales/orders/import/", formData, {
                headers: { "X-CSRFToken": csrfToken },
            });
            setUploadMessage(response.data.message || "Transactions imported.");
            await loadDashboard();
        } catch (err) {
            console.error("CSV import error:", err);
            setUploadMessage(err.response?.data?.error || "CSV import failed.");
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };

    const updateOrderStatus = async (orderId, paymentStatus) => {
        setUpdatingOrder(orderId);
        try {
            const csrfToken = await getCsrfToken();
            await api.patch(
                `/api/sales/orders/${orderId}/payment-status/`,
                { payment_status: paymentStatus },
                { headers: { "X-CSRFToken": csrfToken } }
            );
            await loadDashboard();
        } catch (err) {
            console.error("Order status error:", err);
            alert(err.response?.data?.error || "Unable to update order.");
        } finally {
            setUpdatingOrder(null);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="app-page"><p className="text-sm text-neutral-500">Loading dashboard...</p></div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="app-page">
                    <div className="ui-card max-w-xl p-5">
                        <p className="text-sm text-rose-700">{error}</p>
                        <button onClick={loadDashboard} className="btn-primary mt-4">Try again</button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!data) return null;

    const stats = data.stats || {};
    const orders = data.orders || [];
    const activity = data.recent_activity || [];
    const referralLink = `${window.location.origin}/r/${data.referral.code}`;

    return (
        <DashboardLayout>
            <div className="app-page">
                <PageHeader
                    eyebrow="Referral dashboard"
                    title={`Welcome, ${data.referral.name}`}
                    description="Track your referral traffic, leads, website orders and custom sales in one place."
                />

                <SectionCard className="mb-5">
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-neutral-900">Your referral link</p>
                            <p className="mt-1 text-sm text-neutral-500">Share this link with customers you refer.</p>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row lg:max-w-2xl">
                            <input readOnly value={referralLink} className="ui-input min-w-0 flex-1 bg-[#FBFAF8] text-sm" />
                            <button onClick={copyReferralLink} className="btn-primary shrink-0">Copy link</button>
                        </div>
                    </div>
                </SectionCard>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                    <MetricCard label="Clicks" value={stats.clicks || 0} />
                    <MetricCard label="Unique visitors" value={stats.unique_visitors || 0} />
                    <MetricCard label="Leads" value={stats.leads || 0} />
                    <MetricCard label="Conversions" value={stats.total_conversions || 0} helper={`${stats.conversion_rate || 0}% conversion`} />
                    <MetricCard label="Website orders" value={stats.website_orders || 0} />
                    <MetricCard label="Custom sales" value={stats.custom_sales || 0} />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <MetricCard label="Website revenue" value={formatCurrency(stats.website_revenue)} />
                    <MetricCard label="Custom revenue" value={formatCurrency(stats.custom_revenue)} />
                    <MetricCard label="Total revenue" value={formatCurrency(stats.total_revenue)} />
                </div>

                <SectionCard
                    className="mt-5"
                    title="Website orders"
                    description="Upload daily transactions and confirm payment status. Only paid orders count toward revenue."
                    action={
                        <label className={`btn-secondary ${uploading ? "pointer-events-none opacity-50" : ""}`}>
                            {uploading ? "Importing..." : "Import CSV"}
                            <input type="file" accept=".csv,text/csv" onChange={importCSV} className="hidden" disabled={uploading} />
                        </label>
                    }
                >
                    {uploadMessage && (
                        <div className="border-b border-neutral-100 px-5 py-3 text-sm text-neutral-600">{uploadMessage}</div>
                    )}
                    {orders.length === 0 ? (
                        <EmptyState title="No website orders yet" description="Imported transactions that match your leads will appear here." />
                    ) : (
                        <div className="scrollbar-thin overflow-x-auto">
                            <table className="min-w-[820px] w-full border-collapse text-sm">
                                <thead className="bg-[#FBFAF8] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-400">
                                    <tr>
                                        <th className="px-5 py-3">Customer</th>
                                        <th className="px-5 py-3">Service</th>
                                        <th className="px-5 py-3">Amount</th>
                                        <th className="px-5 py-3">Payment</th>
                                        <th className="px-5 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-t border-neutral-100 hover:bg-[#FCFBF9]">
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-neutral-900">{order.customer_name || "—"}</p>
                                                <p className="mt-0.5 text-xs text-neutral-400">{order.email || ""}</p>
                                            </td>
                                            <td className="px-5 py-4 text-neutral-600">{order.service || "—"}</td>
                                            <td className="px-5 py-4 font-medium text-neutral-900">{formatCurrency(order.amount)}</td>
                                            <td className="px-5 py-4">
                                                <select
                                                    value={order.payment_status || "pending"}
                                                    disabled={updatingOrder === order.id}
                                                    onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                                                    className="ui-input max-w-[150px] py-2 text-sm"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="paid">Paid</option>
                                                    <option value="not_paid">Not Paid</option>
                                                    <option value="failed">Failed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                    <option value="refunded">Refunded</option>
                                                </select>
                                            </td>
                                            <td className="px-5 py-4 text-neutral-500">{formatDate(order.date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>

                <SectionCard className="mt-5" title="Recent activity" description="Recent website purchases and manually recorded sales.">
                    {activity.length === 0 ? (
                        <EmptyState title="No recent activity" />
                    ) : (
                        <div className="scrollbar-thin overflow-x-auto">
                            <table className="min-w-[760px] w-full border-collapse text-sm">
                                <thead className="bg-[#FBFAF8] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-400">
                                    <tr>
                                        <th className="px-5 py-3">Customer</th>
                                        <th className="px-5 py-3">Service</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">Amount</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activity.map((item, index) => (
                                        <tr key={`${item.type}-${item.id}-${index}`} className="border-t border-neutral-100 hover:bg-[#FCFBF9]">
                                            <td className="px-5 py-4 font-medium text-neutral-900">{item.customer_name || "—"}</td>
                                            <td className="px-5 py-4 text-neutral-600">{item.service || "—"}</td>
                                            <td className="px-5 py-4"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">{item.type}</span></td>
                                            <td className="px-5 py-4 font-medium text-neutral-900">{formatCurrency(item.amount)}</td>
                                            <td className="px-5 py-4"><StatusBadge value={item.status} /></td>
                                            <td className="px-5 py-4 text-neutral-500">{formatDate(item.date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>
            </div>
        </DashboardLayout>
    );
}

export default DashboardPage;
