import { useEffect, useState } from "react";
import api from "../services/api";
import logo from "../assets/logo.jpg";
import DashboardLayout from "../components/DashboardLayout";


const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
};


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


function DashboardPage() {

    const getCsrfToken = async () => {
    const response = await api.get("/api/csrf/");
    return response.data.csrfToken;
};

    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [uploading, setUploading] = useState(false);

    const [uploadMessage, setUploadMessage] = useState("");

    const [updatingOrder, setUpdatingOrder] = useState(null);

    const [updatingInquiry, setUpdatingInquiry] = useState(null);


    const loadDashboard = async () => {

        try {

            const response = await api.get(
                "/api/dashboard/"
            );

            setData(response.data);

        } catch (err) {

            console.error(
                "Dashboard error:",
                err
            );

            if (err.response?.status === 401) {
                window.location.href = "/login";
                return;
            }

            setError(
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

        const link =
            `${window.location.origin}/r/${data.referral.code}`;

        await navigator.clipboard.writeText(link);

        alert("Referral link copied.");

    };


    const logout = async () => {

        try {

            await api.post("/api/auth/logout/");

        } catch (err) {

            console.error(
                "Logout error:",
                err
            );

        } finally {

            window.location.href = "/login";
        }
    };


    const importCSV = async (event) => {

        const file =
            event.target.files?.[0];

        if (!file) return;

        setUploading(true);

        setUploadMessage("");

        const formData = new FormData();

        formData.append(
            "file",
            file
        );

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

            console.error(
                "CSV import error:",
                err
            );

            setUploadMessage(
                err.response?.data?.error ||
                "CSV import failed."
            );

        } finally {

            setUploading(false);

            event.target.value = "";

        }
    };


    const updateOrderStatus = async (
        orderId,
        newStatus
    ) => {

        setUpdatingOrder(orderId);

        try {

            const csrfToken = await getCsrfToken();

            await api.patch(
                `/api/sales/orders/${orderId}/status/`,
                {
                    status: newStatus,
                },
                {
                    headers: {
                        "X-CSRFToken": csrfToken,
                    },
                }
            );

            await loadDashboard();

        } catch (err) {

            console.error(
                "Order status error:",
                err
            );

            alert(
                err.response?.data?.error ||
                "Unable to update order."
            );

        } finally {

            setUpdatingOrder(null);

        }
    };


    const updateInquiryStatus = async (
        inquiryId,
        newStatus
    ) => {

        setUpdatingInquiry(inquiryId);

        try {
            const csrfToken = await getCsrfToken();

            await api.patch(
                `/api/leads/inquiries/${inquiryId}/status/`,
                {
                    status: newStatus,
                },
                {
                    headers: {
                        "X-CSRFToken": csrfToken,
                    },
                }
            );

            await loadDashboard();

        } catch (err) {

            console.error(
                "Inquiry status error:",
                err
            );

            alert(
                err.response?.data?.error ||
                "Unable to update inquiry."
            );

        } finally {

            setUpdatingInquiry(null);

        }
    };


    if (loading) {

        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading dashboard...
            </div>
        );

    }


    if (error) {

        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="text-center">
                    <p className="text-red-600">
                        {error}
                    </p>

                    <button
                        onClick={loadDashboard}
                        className="mt-4 rounded-full bg-black px-6 py-3 text-white"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );

    }


    if (!data) return null;


    const stats = data.stats || {};

    const orders = data.orders || [];

    const inquiries =
        data.inquiries || [];


    const referralLink =
        `${window.location.origin}/r/${data.referral.code}`;


    return (
        <DashboardLayout>

        <div className="min-h-screen bg-[#FAF8F5]">

            {/* HEADER */}

            <header className="border-b bg-white">

                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">

                    <img
                        src={logo}
                        alt="Ananse Center for Design"
                        className="h-12 w-auto object-contain"
                    />

                    <div className="flex items-center gap-4">

                        <div className="hidden text-right sm:block">
                            <p className="text-sm text-gray-500">
                                Referral account
                            </p>

                            <p className="font-semibold text-gray-900">
                                {data.referral.name}
                            </p>
                        </div>

                        <button
                            onClick={logout}
                            className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                            Logout
                        </button>

                    </div>

                </div>

            </header>


            <main className="mx-auto max-w-7xl px-6 py-10">


                {/* TITLE */}

                <div className="mb-8">

                    <p className="text-sm uppercase tracking-widest text-[#B68D40]">
                        Referral Dashboard
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                        Welcome, {data.referral.name}
                    </h1>

                </div>


                {/* REFERRAL LINK */}

                <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        <div>

                            <h2 className="font-semibold text-gray-900">
                                Your referral link
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Share this link with customers you refer.
                            </p>

                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">

                            <input
                                readOnly
                                value={referralLink}
                                className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm lg:w-96"
                            />

                            <button
                                onClick={copyReferralLink}
                                className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white"
                            >
                                Copy
                            </button>

                        </div>

                    </div>

                </section>


                {/* STATS */}

                <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                    <StatCard
                        label="Clicks"
                        value={stats.clicks}
                    />

                    <StatCard
                        label="Unique Visitors"
                        value={stats.unique_visitors}
                    />

                    <StatCard
                        label="Leads"
                        value={stats.leads}
                    />

                    <StatCard
                        label="Website Orders"
                        value={stats.website_orders}
                    />

                    <StatCard
                        label="Custom Sales"
                        value={stats.custom_sales}
                    />

                    <StatCard
                        label="Total Conversions"
                        value={stats.total_conversions}
                    />

                    <StatCard
                        label="Conversion Rate"
                        value={`${stats.conversion_rate}%`}
                    />

                    <StatCard
                        label="Total Revenue"
                        value={formatCurrency(stats.total_revenue)}
                    />

                </section>


                {/* REVENUE */}

                <section className="mt-10">

                    <h2 className="mb-5 text-2xl font-semibold">
                        Revenue
                    </h2>

                    <div className="grid gap-5 md:grid-cols-2">

                        <RevenueCard
                            label="Website Revenue"
                            value={formatCurrency(
                                stats.website_revenue
                            )}
                        />

                        <RevenueCard
                            label="Custom Sales Revenue"
                            value={formatCurrency(
                                stats.custom_revenue
                            )}
                        />

                    </div>

                </section>


                {/* CSV IMPORT */}

                <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">

                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                        <div>

                            <h2 className="text-xl font-semibold">
                                Daily Transactions
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Upload the latest transaction CSV.
                                Existing transactions will not be duplicated.
                            </p>

                            {uploadMessage && (
                                <p className="mt-3 text-sm font-medium text-green-700">
                                    {uploadMessage}
                                </p>
                            )}

                        </div>

                        <label className="cursor-pointer rounded-xl bg-black px-6 py-3 text-center text-sm font-medium text-white">

                            {uploading
                                ? "Importing..."
                                : "Upload CSV"
                            }

                            <input
                                type="file"
                                accept=".csv"
                                onChange={importCSV}
                                disabled={uploading}
                                className="hidden"
                            />

                        </label>

                    </div>

                </section>


                {/* WEBSITE ORDERS */}

                <section className="mt-10">

                    <div className="mb-5">

                        <h2 className="text-2xl font-semibold">
                            Website Orders
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Verify payments with Accounts before marking an order as paid.
                        </p>

                    </div>

                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[850px]">

                                <thead className="border-b bg-gray-50">

                                    <tr>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Customer
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Service
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Amount
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Date
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y">

                                    {orders.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan="5"
                                                className="px-6 py-10 text-center text-gray-500"
                                            >
                                                No website orders yet.
                                            </td>

                                        </tr>

                                    ) : (

                                        orders.map((order) => (

                                            <tr key={order.id}>

                                                <td className="px-6 py-5">

                                                    <p className="font-medium text-gray-900">
                                                        {order.customer_name}
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {order.email}
                                                    </p>

                                                </td>

                                                <td className="px-6 py-5 text-sm text-gray-600">
                                                    {order.service || "—"}
                                                </td>

                                                <td className="px-6 py-5 font-medium">
                                                    {formatCurrency(
                                                        order.amount
                                                    )}
                                                </td>

                                                <td className="px-6 py-5">

                                                    <select
                                                        value={
                                                            order.status || "pending"
                                                        }
                                                        disabled={
                                                            updatingOrder === order.id
                                                        }
                                                        onChange={(e) =>
                                                            updateOrderStatus(
                                                                order.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="rounded-lg border px-3 py-2 text-sm"
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

                                                    </select>

                                                </td>

                                                <td className="px-6 py-5 text-sm text-gray-500">
                                                    {formatDate(order.date)}
                                                </td>

                                            </tr>

                                        ))

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </section>


                {/* RECENT ACTIVITY */}

                <section className="mt-10 pb-16">

                    <h2 className="text-2xl font-semibold">
                        Recent Activity
                    </h2>

                    <p className="mt-1 mb-5 text-sm text-gray-500">
                        Recent purchases and manually recorded sales.
                    </p>

                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[800px]">

                                <thead className="border-b bg-gray-50">

                                    <tr>

                                        <th className="px-6 py-4 text-left text-xs uppercase tracking-wide text-gray-500">
                                            Customer
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs uppercase tracking-wide text-gray-500">
                                            Service
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs uppercase tracking-wide text-gray-500">
                                            Type
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs uppercase tracking-wide text-gray-500">
                                            Amount
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs uppercase tracking-wide text-gray-500">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs uppercase tracking-wide text-gray-500">
                                            Date
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="divide-y">

                                    {(data.recent_activity || []).map(
                                        (activity, index) => (

                                            <tr key={`${activity.type}-${activity.id}-${index}`}>

                                                <td className="px-6 py-5 font-medium">
                                                    {activity.customer_name}
                                                </td>

                                                <td className="px-6 py-5 text-sm text-gray-600">
                                                    {activity.service}
                                                </td>

                                                <td className="px-6 py-5">

                                                    <span className="rounded-full bg-gray-100 px-3 py-2 text-xs">
                                                        {activity.type}
                                                    </span>

                                                </td>

                                                <td className="px-6 py-5 font-medium">
                                                    {formatCurrency(
                                                        activity.amount
                                                    )}
                                                </td>

                                                <td className="px-6 py-5 text-sm">
                                                    {activity.status}
                                                </td>

                                                <td className="px-6 py-5 text-sm text-gray-500">
                                                    {formatDate(
                                                        activity.date
                                                    )}
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </section>

            </main>

        </div>
        </DashboardLayout>
    );
}


function StatCard({
    label,
    value,
}) {

    return (

        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">

            <p className="text-sm text-gray-500">
                {label}
            </p>

            <p className="mt-2 text-3xl font-semibold text-gray-900">
                {value}
            </p>

        </div>
    );
}


function RevenueCard({
    label,
    value,
}) {

    return (

        <div className="rounded-2xl bg-white p-7 text-center shadow-sm">

            <p className="text-sm text-gray-500">
                {label}
            </p>

            <p className="mt-2 text-3xl font-semibold">
                {value}
            </p>

        </div>
    );
}


export default DashboardPage;