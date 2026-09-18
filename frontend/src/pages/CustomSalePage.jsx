import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/dashboard/PageHeader";
import SectionCard from "../components/dashboard/SectionCard";

function CustomSalePage() {
    const navigate = useNavigate();

    const [sources, setSources] = useState([]);
    const [pricing, setPricing] = useState({
        tax_rate: "0.075",
        facilities: [],
    });
    const [sourceLoading, setSourceLoading] = useState(true);

    const [form, setForm] = useState({
        customer_first_name: "",
        customer_last_name: "",
        customer_email: "",
        customer_phone: "",
        service_name: "",
        amount: "",
        facility_type: "",
        payment_method: "bank_transfer",
        status: "paid",
        notes: "",
        sale_date: new Date().toISOString().slice(0, 16),
        referral_source_id: "",
    });

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const loadSources = async () => {
            try {
                const response = await api.get(
                    "/api/sales/custom-sales/source-options/"
                );

                const options = response.data.sources || [];

                setSources(options);
                setPricing(
                    response.data.pricing || {
                        tax_rate: "0.075",
                        facilities: [],
                    }
                );

                if (options.length > 0) {
                    setForm((current) => ({
                        ...current,
                        referral_source_id:
                            current.referral_source_id ||
                            String(options[0].id),
                    }));
                }
            } catch (error) {
                console.error("Sales source loading error:", error);
            } finally {
                setSourceLoading(false);
            }
        };

        loadSources();
    }, []);

    const handleChange = (event) => {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const submitSale = async (event) => {
        event.preventDefault();

        if (!form.referral_source_id) {
            alert("Please choose the sales source for this transaction.");
            return;
        }

        setLoading(true);

        try {
            const csrfResponse = await api.get("/api/csrf/");
            const csrfToken = csrfResponse.data.csrfToken;

            const response = await api.post(
                "/api/sales/custom-sales/",
                {
                    ...form,
                    referral_source_id: Number(
                        form.referral_source_id
                    ),
                },
                {
                    headers: {
                        "X-CSRFToken": csrfToken,
                    },
                }
            );

            setResult(response.data);
            setSubmitted(true);
        } catch (error) {
            console.error("Custom sale error:", error);

            alert(
                error.response?.data?.error ||
                "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const serviceValue = Number(form.amount || 0);
    const taxRate = Number(pricing.tax_rate || 0.075);
    const taxAmount = serviceValue * taxRate;

    const selectedFacility = (pricing.facilities || []).find(
        (facility) => facility.value === form.facility_type
    );

    const securityDeposit = Number(
        selectedFacility?.security_deposit || 0
    );

    const totalPaid =
        serviceValue +
        taxAmount +
        securityDeposit;

    const money = (value) =>
        new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0,
        }).format(Number(value || 0));

    if (submitted) {
        return (
            <DashboardLayout>
                <div className="app-page">
                    <div className="mx-auto max-w-xl">
                        <SectionCard>
                            <div className="p-6 text-center sm:p-8">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A4772B]">
                                    Sale recorded
                                </p>

                                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                                    Custom sale added
                                </h1>

                                <p className="mt-3 text-sm leading-6 text-neutral-500">
                                    The sale has been attributed to{" "}
                                    <span className="font-medium text-neutral-800">
                                        {result?.lead?.referral_name ||
                                            "the selected source"}
                                    </span>
                                    .
                                </p>

                                <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate("/dashboard")
                                        }
                                        className="btn-primary"
                                    >
                                        Back to dashboard
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSubmitted(false);
                                            setResult(null);
                                            setForm((current) => ({
                                                ...current,
                                                customer_first_name: "",
                                                customer_last_name: "",
                                                customer_email: "",
                                                customer_phone: "",
                                                service_name: "",
                                                amount: "",
                                                facility_type: "",
                                                notes: "",
                                                sale_date:
                                                    new Date()
                                                        .toISOString()
                                                        .slice(0, 16),
                                            }));
                                        }}
                                        className="btn-secondary"
                                    >
                                        Record another
                                    </button>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="app-page">
                <PageHeader
                    eyebrow="Sales"
                    title="Record custom sale"
                    description="Record sales completed outside the website, including bank transfers, walk-ins, WhatsApp customers and existing clients."
                />

                <div className="mx-auto max-w-3xl">
                    <SectionCard>
                        <form
                            onSubmit={submitSale}
                            className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6"
                        >
                            <div className="sm:col-span-2">
                                <label className="ui-label">
                                    Sales source / attributed to
                                </label>

                                <select
                                    name="referral_source_id"
                                    value={form.referral_source_id}
                                    onChange={handleChange}
                                    disabled={sourceLoading}
                                    className="ui-input mt-2 w-full"
                                    required
                                >
                                    <option value="">
                                        {sourceLoading
                                            ? "Loading sources..."
                                            : "Choose source"}
                                    </option>

                                    {sources.map((source) => (
                                        <option
                                            key={source.id}
                                            value={source.id}
                                        >
                                            {source.name} —{" "}
                                            {source.source_type_display}
                                        </option>
                                    ))}
                                </select>

                                <p className="mt-2 text-xs leading-5 text-neutral-400">
                                    Choose who should receive attribution for
                                    this sale. If the customer already exists
                                    as a lead under this source, the sale will
                                    use that lead. Otherwise the system creates
                                    a converted lead automatically.
                                </p>
                            </div>

                            <div>
                                <label className="ui-label">
                                    First name
                                </label>
                                <input
                                    name="customer_first_name"
                                    value={form.customer_first_name}
                                    onChange={handleChange}
                                    className="ui-input mt-2 w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="ui-label">
                                    Last name
                                </label>
                                <input
                                    name="customer_last_name"
                                    value={form.customer_last_name}
                                    onChange={handleChange}
                                    className="ui-input mt-2 w-full"
                                />
                            </div>

                            <div>
                                <label className="ui-label">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="customer_email"
                                    value={form.customer_email}
                                    onChange={handleChange}
                                    className="ui-input mt-2 w-full"
                                />
                            </div>

                            <div>
                                <label className="ui-label">
                                    Phone
                                </label>
                                <input
                                    name="customer_phone"
                                    value={form.customer_phone}
                                    onChange={handleChange}
                                    className="ui-input mt-2 w-full"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="ui-label">
                                    Service
                                </label>
                                <input
                                    name="service_name"
                                    value={form.service_name}
                                    onChange={handleChange}
                                    className="ui-input mt-2 w-full"
                                    placeholder="e.g. Studio photography"
                                    required
                                />
                            </div>

                            <div>
                                <label className="ui-label">
                                    Service value (before 7.5% tax)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="amount"
                                    value={form.amount}
                                    onChange={handleChange}
                                    className="ui-input mt-2 w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="ui-label">
                                    Facility / refundable security deposit
                                </label>

                                <select
                                    name="facility_type"
                                    value={form.facility_type}
                                    onChange={handleChange}
                                    className="ui-input mt-2 w-full"
                                >
                                    {(pricing.facilities || []).map((facility) => (
                                        <option
                                            key={facility.value || "none"}
                                            value={facility.value}
                                        >
                                            {facility.label}
                                            {Number(facility.security_deposit || 0) > 0
                                                ? ` — ${money(facility.security_deposit)} deposit`
                                                : ""}
                                        </option>
                                    ))}
                                </select>

                                <p className="mt-2 text-xs leading-5 text-neutral-400">
                                    The security deposit is refundable and is not counted as revenue.
                                </p>
                            </div>

                            <div>
                                <label className="ui-label">
                                    Sale date
                                </label>
                                <input
                                    type="datetime-local"
                                    name="sale_date"
                                    value={form.sale_date}
                                    onChange={handleChange}
                                    className="ui-input mt-2 w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="ui-label">
                                    Payment method
                                </label>

                                <select
                                    name="payment_method"
                                    value={form.payment_method}
                                    onChange={handleChange}
                                    className="ui-input mt-2 w-full"
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

                            <div>
                                <label className="ui-label">
                                    Payment status
                                </label>

                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    className="ui-input mt-2 w-full"
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

                            <div className="sm:col-span-2 rounded-2xl border border-neutral-200 bg-[#FBFAF8] p-4">
                                <p className="text-sm font-semibold text-neutral-900">
                                    Customer payment breakdown
                                </p>

                                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-neutral-500">Service value</span>
                                        <span className="font-medium text-neutral-900">
                                            {money(serviceValue)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-neutral-500">Tax (7.5%)</span>
                                        <span className="font-medium text-neutral-900">
                                            {money(taxAmount)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="text-neutral-500">Refundable deposit</span>
                                        <span className="font-medium text-neutral-900">
                                            {money(securityDeposit)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span className="font-semibold text-neutral-900">Total customer pays</span>
                                        <span className="font-semibold text-neutral-950">
                                            {money(totalPaid)}
                                        </span>
                                    </div>
                                </div>

                                <p className="mt-3 text-xs leading-5 text-neutral-500">
                                    Revenue / commission base: {money(serviceValue)}.
                                    Tax and refundable deposits are excluded.
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="ui-label">
                                    Notes
                                </label>

                                <textarea
                                    rows="4"
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    className="ui-input mt-2 w-full resize-y"
                                    placeholder="Optional sales notes"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <button
                                    type="submit"
                                    disabled={loading || sourceLoading}
                                    className="btn-primary w-full sm:w-auto"
                                >
                                    {loading
                                        ? "Recording..."
                                        : "Record sale"}
                                </button>
                            </div>
                        </form>
                    </SectionCard>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default CustomSalePage;