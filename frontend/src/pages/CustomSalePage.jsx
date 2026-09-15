import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/dashboard/PageHeader";
import SectionCard from "../components/dashboard/SectionCard";

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

    const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

    const submitSale = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const csrf = await api.get("/api/csrf/");
            await api.post("/api/sales/custom-sales/", form, {
                headers: { "X-CSRFToken": csrf.data.csrfToken || csrf.data.csrftoken },
            });
            setSubmitted(true);
        } catch (error) {
            console.error("Custom sale error:", error);
            alert(error.response?.data?.error || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <DashboardLayout>
                <div className="app-page flex min-h-[70vh] items-center justify-center">
                    <div className="ui-card w-full max-w-lg p-8 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-lg text-emerald-700">✓</div>
                        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950">Sale recorded</h1>
                        <p className="mt-2 text-sm text-neutral-500">The sale has been successfully added to the referral activity.</p>
                        <button onClick={() => navigate("/dashboard")} className="btn-primary mt-6">Back to dashboard</button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="app-page">
                <PageHeader eyebrow="Sales" title="Record custom sale" description="Record services or bookings paid outside the Ananse website." />

                <SectionCard className="max-w-4xl">
                    <form onSubmit={submitSale} className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
                        <Field label="First name"><input name="customer_first_name" value={form.customer_first_name} onChange={handleChange} required className="ui-input" /></Field>
                        <Field label="Last name"><input name="customer_last_name" value={form.customer_last_name} onChange={handleChange} className="ui-input" /></Field>
                        <Field label="Email"><input type="email" name="customer_email" value={form.customer_email} onChange={handleChange} className="ui-input" /></Field>
                        <Field label="Phone"><input name="customer_phone" value={form.customer_phone} onChange={handleChange} className="ui-input" /></Field>
                        <Field label="Service"><input name="service_name" value={form.service_name} onChange={handleChange} required placeholder="e.g. Photography studio" className="ui-input" /></Field>
                        <Field label="Amount (₦)"><input type="number" name="amount" value={form.amount} onChange={handleChange} min="0" step="0.01" required className="ui-input" /></Field>
                        <Field label="Payment method">
                            <select name="payment_method" value={form.payment_method} onChange={handleChange} className="ui-input">
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="onsite">Onsite</option>
                                <option value="other">Other</option>
                            </select>
                        </Field>
                        <Field label="Payment status">
                            <select name="status" value={form.status} onChange={handleChange} className="ui-input">
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </Field>
                        <Field label="Sale date"><input type="datetime-local" name="sale_date" value={form.sale_date} onChange={handleChange} required className="ui-input" /></Field>
                        <div className="sm:col-span-2">
                            <Field label="Notes"><textarea name="notes" value={form.notes} onChange={handleChange} rows="4" placeholder="Optional notes about this sale..." className="ui-input resize-y" /></Field>
                        </div>
                        <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
                            <button type="submit" disabled={loading} className="btn-primary">{loading ? "Recording..." : "Record sale"}</button>
                        </div>
                    </form>
                </SectionCard>
            </div>
        </DashboardLayout>
    );
}

function Field({ label, children }) {
    return <label><span className="ui-label">{label}</span>{children}</label>;
}

export default CustomSalePage;
