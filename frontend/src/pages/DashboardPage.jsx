import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import logo from "../assets/logo.jpg";


function DashboardPage() {

    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {

        async function loadDashboard() {

            try {

                const response = await api.get("dashboard/");

                setDashboard(response.data);

            } catch (error) {

                console.error("Dashboard error:", error);

                if (error.response?.status === 401) {
                    navigate("/login");
                    return;
                }

                setError(
                    "Unable to load the dashboard. Please try again."
                );

            } finally {

                setLoading(false);

            }
        }

        loadDashboard();

    }, [navigate]);


    const logout = async () => {

        try {

            await api.post("auth/logout/");

        } catch (error) {

            console.error("Logout error:", error);

        } finally {

            navigate("/login");

        }
    };


    const copyReferralLink = async () => {

        const link = `${window.location.origin}/r/${dashboard.referral.code}`;

        try {

            await navigator.clipboard.writeText(link);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);

        } catch (error) {

            console.error("Copy failed:", error);

        }
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
                <p className="text-gray-500">
                    Loading dashboard...
                </p>
            </div>
        );
    }


    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-6">
                <div className="text-center">

                    <p className="text-red-600">
                        {error}
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 rounded-full bg-black px-6 py-3 text-white"
                    >
                        Try Again
                    </button>

                </div>
            </div>
        );
    }


    const stats = dashboard.stats;


    const referralLink =
        `${window.location.origin}/r/${dashboard.referral.code}`;


    return (
        <div className="min-h-screen bg-[#FAF8F5]">

            {/* Header */}

            <header className="border-b border-gray-200 bg-white">

                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

                    <img
                        src={logo}
                        alt="Ananse"
                        className="h-10 w-auto object-contain"
                    />

                    <button
                        onClick={logout}
                        className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium transition hover:bg-gray-100"
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* Main */}

            <main className="mx-auto max-w-7xl px-6 py-10">

                {/* Welcome */}

                <div>

                    <p className="text-sm uppercase tracking-widest text-[#B68D40] font-semibold">
                        Referral Dashboard
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold text-gray-900 sm:text-4xl">
                        Welcome, {dashboard.referral.name}
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Here's how your referrals are performing.
                    </p>

                </div>


                {/* Referral Link */}

                <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <p className="text-sm font-medium text-gray-500">
                        Your referral link
                    </p>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">

                        <div className="flex-1 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 break-all">
                            {referralLink}
                        </div>

                        <button
                            onClick={copyReferralLink}
                            className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                        >
                            {copied ? "Copied!" : "Copy Link"}
                        </button>

                    </div>

                </div>


                {/* Stats */}

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

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
                        label="Conversion Rate"
                        value={`${stats.conversion_rate}%`}
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
                        label="Total Revenue"
                        value={`₦${Number(stats.total_revenue).toLocaleString()}`}
                        large
                    />

                </div>


                {/* Revenue Breakdown */}

                <section className="mt-8">

                    <h2 className="text-xl font-semibold text-gray-900">
                        Revenue
                    </h2>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">

                        <RevenueCard
                            title="Website Revenue"
                            amount={stats.website_revenue}
                        />

                        <RevenueCard
                            title="Custom Sales Revenue"
                            amount={stats.custom_revenue}
                        />

                    </div>

                </section>


                {/* Recent Activity */}

                <section className="mt-10">

                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Recent Activity
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Recent purchases and manually recorded sales.
                            </p>
                        </div>

                    </div>


                    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">

                        {dashboard.recent_activity.length === 0 ? (

                            <div className="px-6 py-10 text-center text-gray-500">
                                No activity yet.
                            </div>

                        ) : (

                            <div className="overflow-x-auto">

                                <table className="w-full text-left text-sm">

                                    <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">

                                        <tr>

                                            <th className="px-6 py-4">
                                                Customer
                                            </th>

                                            <th className="px-6 py-4">
                                                Service
                                            </th>

                                            <th className="px-6 py-4">
                                                Type
                                            </th>

                                            <th className="px-6 py-4">
                                                Amount
                                            </th>

                                            <th className="px-6 py-4">
                                                Status
                                            </th>

                                            <th className="px-6 py-4">
                                                Date
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody className="divide-y">

                                        {dashboard.recent_activity.map(
                                            (activity, index) => (

                                                <tr
                                                    key={`${activity.type}-${activity.id}-${index}`}
                                                    className="hover:bg-gray-50"
                                                >

                                                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                                                        {activity.customer_name || "Unknown"}
                                                    </td>

                                                    <td className="max-w-xs px-6 py-4 text-gray-600">
                                                        {activity.service || "—"}
                                                    </td>

                                                    <td className="px-6 py-4">

                                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                                                            {activity.type}
                                                        </span>

                                                    </td>

                                                    <td className="whitespace-nowrap px-6 py-4 font-medium">
                                                        ₦{Number(activity.amount).toLocaleString()}
                                                    </td>

                                                    <td className="px-6 py-4 text-gray-600">
                                                        {activity.status || "—"}
                                                    </td>

                                                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                                                        {formatDate(activity.date)}
                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </div>

                </section>

            </main>

        </div>
    );
}


function StatCard({ label, value, large = false }) {

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
                {label}
            </p>

            <p
                className={`mt-2 font-semibold text-gray-900 ${
                    large
                        ? "text-2xl"
                        : "text-3xl"
                }`}
            >
                {value}
            </p>

        </div>
    );
}


function RevenueCard({ title, amount }) {

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
                {title}
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
                ₦{Number(amount).toLocaleString()}
            </p>

        </div>
    );
}


function formatDate(date) {

    if (!date) {
        return "—";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "—";
    }

    return parsed.toLocaleDateString(
        "en-NG",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        }
    );
}


export default DashboardPage;