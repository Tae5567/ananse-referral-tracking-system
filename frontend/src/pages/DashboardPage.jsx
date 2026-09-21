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

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

function TabButton({ active, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                    ? "bg-neutral-950 !text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
            ].join(" ")}
        >
            {children}
        </button>
    );
}

function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [updatingOrder, setUpdatingOrder] = useState(null);
    const [archivingKey, setArchivingKey] = useState("");
    const [ordersTab, setOrdersTab] = useState("active");
    const [activityTab, setActivityTab] = useState("active");

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

            setError(
                err.response?.data?.error ||
                "Unable to load the dashboard."
            );
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

        if (!file) {
            return;
        }

        setUploading(true);
        setUploadMessage("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const csrfToken = await getCsrfToken();

            const response = await api.post(
                "/api/sales/orders/import/",
                formData,
                {
                    headers: {
                        "X-CSRFToken": csrfToken,
                    },
                }
            );

            setUploadMessage(
                response.data.message ||
                "Transactions imported."
            );

            await loadDashboard();
        } catch (err) {
            console.error("CSV import error:", err);

            setUploadMessage(
                err.response?.data?.error ||
                "CSV import failed."
            );
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
                {
                    payment_status: paymentStatus,
                },
                {
                    headers: {
                        "X-CSRFToken": csrfToken,
                    },
                }
            );

            await loadDashboard();
        } catch (err) {
            console.error("Order status error:", err);

            alert(
                err.response?.data?.error ||
                "Unable to update order."
            );
        } finally {
            setUpdatingOrder(null);
        }
    };

    const setOrderArchived = async (orderId, archived) => {
        const key = `Website-${orderId}`;
        setArchivingKey(key);

        try {
            const csrfToken = await getCsrfToken();

            await api.patch(
                `/api/sales/orders/${orderId}/archive/`,
                { archived },
                {
                    headers: {
                        "X-CSRFToken": csrfToken,
                    },
                }
            );

            await loadDashboard();
        } catch (err) {
            console.error("Order archive error:", err);

            alert(
                err.response?.data?.error ||
                "Unable to update order archive."
            );
        } finally {
            setArchivingKey("");
        }
    };

    const setCustomSaleArchived = async (saleId, archived) => {
        const key = `Custom-${saleId}`;
        setArchivingKey(key);

        try {
            const csrfToken = await getCsrfToken();

            await api.patch(
                `/api/sales/custom-sales/${saleId}/archive/`,
                { archived },
                {
                    headers: {
                        "X-CSRFToken": csrfToken,
                    },
                }
            );

            await loadDashboard();
        } catch (err) {
            console.error("Custom sale archive error:", err);

            alert(
                err.response?.data?.error ||
                "Unable to update custom-sale archive."
            );
        } finally {
            setArchivingKey("");
        }
    };

    const setActivityArchived = async (item, archived) => {
        if (item.type === "Website") {
            await setOrderArchived(item.id, archived);
            return;
        }

        await setCustomSaleArchived(item.id, archived);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="app-page">
                    <p className="text-sm text-neutral-500">
                        Loading dashboard...
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="app-page">
                    <div className="ui-card max-w-xl p-5">
                        <p className="text-sm text-rose-700">
                            {error}
                        </p>

                        <button
                            onClick={loadDashboard}
                            className="btn-primary mt-4"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return null;
    }

    const stats = data.stats || {};
    const activeOrders = data.orders || [];
    const archivedOrders = data.archived_orders || [];
    const activeActivity = data.recent_activity || [];
    const archivedActivity = data.archived_activity || [];

    const visibleOrders =
        ordersTab === "active"
            ? activeOrders
            : archivedOrders;

    const visibleActivity =
        activityTab === "active"
            ? activeActivity
            : archivedActivity;

    const referralLink =
        `${window.location.origin}/r/${data.referral.code}`;

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
                            <p className="text-sm font-semibold text-neutral-900">
                                Your referral link
                            </p>

                            <p className="mt-1 text-sm text-neutral-500">
                                Share this link with customers you refer.
                            </p>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row lg:max-w-2xl">
                            <input
                                readOnly
                                value={referralLink}
                                className="ui-input min-w-0 flex-1 bg-[#FBFAF8] text-sm"
                            />

                            <button
                                onClick={copyReferralLink}
                                className="btn-primary shrink-0"
                            >
                                Copy link
                            </button>
                        </div>
                    </div>
                </SectionCard>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                    <MetricCard
                        label="Clicks"
                        value={stats.clicks || 0}
                    />
                    <MetricCard
                        label="Unique visitors"
                        value={stats.unique_visitors || 0}
                    />
                    <MetricCard
                        label="Leads"
                        value={stats.leads || 0}
                    />
                    <MetricCard
                        label="Conversions"
                        value={stats.total_conversions || 0}
                        helper={`${stats.conversion_rate || 0}% conversion`}
                    />
                    <MetricCard
                        label="Website orders"
                        value={stats.website_orders || 0}
                    />
                    <MetricCard
                        label="Custom sales"
                        value={stats.custom_sales || 0}
                    />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <MetricCard
                        label="Website service revenue"
                        value={formatCurrency(stats.website_revenue)}
                    />
                    <MetricCard
                        label="Custom service revenue"
                        value={formatCurrency(stats.custom_revenue)}
                    />
                    <MetricCard
                        label="Total service revenue"
                        value={formatCurrency(stats.total_revenue)}
                    />
                </div>

                <SectionCard
                    className="mt-5"
                    title="Website orders"
                    description="Five most recent website orders. Archived orders remain part of historical revenue and attribution."
                    action={
                        <label
                            className={`btn-secondary ${
                                uploading
                                    ? "pointer-events-none opacity-50"
                                    : ""
                            }`}
                        >
                            {uploading
                                ? "Importing..."
                                : "Import CSV"}

                            <input
                                type="file"
                                accept=".csv,text/csv"
                                onChange={importCSV}
                                className="hidden"
                                disabled={uploading}
                            />
                        </label>
                    }
                >
                    <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3">
                        <TabButton
                            active={ordersTab === "active"}
                            onClick={() => setOrdersTab("active")}
                        >
                            Recent
                        </TabButton>

                        <TabButton
                            active={ordersTab === "archive"}
                            onClick={() => setOrdersTab("archive")}
                        >
                            Archive
                        </TabButton>
                    </div>

                    {uploadMessage && (
                        <div className="border-b border-neutral-100 px-5 py-3 text-sm text-neutral-600">
                            {uploadMessage}
                        </div>
                    )}

                    {visibleOrders.length === 0 ? (
                        <EmptyState
                            title={
                                ordersTab === "active"
                                    ? "No website orders yet"
                                    : "No archived website orders"
                            }
                            description={
                                ordersTab === "active"
                                    ? "Your five most recent matched website transactions will appear here."
                                    : "Orders you archive from the dashboard will appear here."
                            }
                        />
                    ) : (
                        <div className="scrollbar-thin overflow-x-auto">
                            <table className="min-w-[930px] w-full border-collapse text-sm">
                                <thead className="bg-[#FBFAF8] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-400">
                                    <tr>
                                        <th className="px-5 py-3">Customer</th>
                                        <th className="px-5 py-3">Service</th>
                                        <th className="px-5 py-3">Amount</th>
                                        <th className="px-5 py-3">Payment</th>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3 text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {visibleOrders.map((order) => {
                                        const archiveKey =
                                            `Website-${order.id}`;

                                        return (
                                            <tr
                                                key={order.id}
                                                className="border-t border-neutral-100 hover:bg-[#FCFBF9]"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-neutral-900">
                                                        {order.customer_name || "—"}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-neutral-400">
                                                        {order.email || ""}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 text-neutral-600">
                                                    {order.service || "—"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-neutral-900">
                                                        {formatCurrency(order.total_paid)}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-neutral-400">
                                                        Service {formatCurrency(order.service_value)}
                                                        {" · "}Tax {formatCurrency(order.tax_amount)}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <select
                                                        value={
                                                            order.payment_status ||
                                                            "pending"
                                                        }
                                                        disabled={
                                                            updatingOrder ===
                                                            order.id
                                                        }
                                                        onChange={(event) =>
                                                            updateOrderStatus(
                                                                order.id,
                                                                event.target.value
                                                            )
                                                        }
                                                        className="ui-input max-w-[150px] py-2 text-sm"
                                                    >
                                                        <option value="pending">
                                                            Pending
                                                        </option>
                                                        <option value="paid">
                                                            Paid
                                                        </option>
                                                        <option value="not_paid">
                                                            Not Paid
                                                        </option>
                                                        <option value="failed">
                                                            Failed
                                                        </option>
                                                        <option value="cancelled">
                                                            Cancelled
                                                        </option>
                                                        <option value="refunded">
                                                            Refunded
                                                        </option>
                                                    </select>
                                                </td>

                                                <td className="px-5 py-4 text-neutral-500">
                                                    {formatDate(order.date)}
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            archivingKey ===
                                                            archiveKey
                                                        }
                                                        onClick={() =>
                                                            setOrderArchived(
                                                                order.id,
                                                                ordersTab !==
                                                                    "archive"
                                                            )
                                                        }
                                                        className="text-sm font-semibold text-neutral-700 underline underline-offset-4 disabled:opacity-50"
                                                    >
                                                        {ordersTab === "archive"
                                                            ? "Restore"
                                                            : "Archive"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    className="mt-5"
                    title="Recent activity"
                    description="Ten most recent website orders and custom sales."
                >
                    <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3">
                        <TabButton
                            active={activityTab === "active"}
                            onClick={() => setActivityTab("active")}
                        >
                            Recent
                        </TabButton>

                        <TabButton
                            active={activityTab === "archive"}
                            onClick={() => setActivityTab("archive")}
                        >
                            Archive
                        </TabButton>
                    </div>

                    {visibleActivity.length === 0 ? (
                        <EmptyState
                            title={
                                activityTab === "active"
                                    ? "No recent activity"
                                    : "No archived activity"
                            }
                        />
                    ) : (
                        <div className="scrollbar-thin overflow-x-auto">
                            <table className="min-w-[900px] w-full border-collapse text-sm">
                                <thead className="bg-[#FBFAF8] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-400">
                                    <tr>
                                        <th className="px-5 py-3">Customer</th>
                                        <th className="px-5 py-3">Service</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">Amount</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3 text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {visibleActivity.map((item, index) => {
                                        const archiveKey =
                                            `${item.type}-${item.id}`;

                                        return (
                                            <tr
                                                key={`${item.type}-${item.id}-${index}`}
                                                className="border-t border-neutral-100 hover:bg-[#FCFBF9]"
                                            >
                                                <td className="px-5 py-4 font-medium text-neutral-900">
                                                    {item.customer_name || "—"}
                                                </td>

                                                <td className="px-5 py-4 text-neutral-600">
                                                    {item.service || "—"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                                                        {item.type}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-neutral-900">
                                                        {formatCurrency(item.total_paid)}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-neutral-400">
                                                        Revenue {formatCurrency(item.revenue_amount)}
                                                        {" · "}Tax {formatCurrency(item.tax_amount)}
                                                        {Number(item.security_deposit || 0) > 0
                                                            ? ` · Deposit ${formatCurrency(item.security_deposit)}`
                                                            : ""}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <StatusBadge
                                                        value={item.status}
                                                    />
                                                </td>

                                                <td className="px-5 py-4 text-neutral-500">
                                                    {formatDate(item.date)}
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            archivingKey ===
                                                            archiveKey
                                                        }
                                                        onClick={() =>
                                                            setActivityArchived(
                                                                item,
                                                                activityTab !==
                                                                    "archive"
                                                            )
                                                        }
                                                        className="text-sm font-semibold text-neutral-700 underline underline-offset-4 disabled:opacity-50"
                                                    >
                                                        {activityTab === "archive"
                                                            ? "Restore"
                                                            : "Archive"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
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