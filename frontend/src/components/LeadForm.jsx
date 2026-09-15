import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function LeadForm({ referralCode }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });

    const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const csrfResponse = await api.get("/api/csrf/");
            await api.post(
                "/api/leads/",
                { ...form, referral_code: referralCode },
                { headers: { "X-CSRFToken": csrfResponse.data.csrfToken } }
            );
            navigate(`/services?ref=${referralCode}`);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="contact" className="bg-white py-14 sm:py-20">
            <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:items-start lg:px-8">
                <div className="lg:sticky lg:top-24">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A27D39]">Start here</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-neutral-950 sm:text-4xl">Tell us how to reach you.</h2>
                    <p className="mt-4 max-w-md text-sm leading-7 text-neutral-500 sm:text-base">Complete your details once, then choose the service you want to book or send a custom request.</p>
                </div>

                <form onSubmit={submit} className="ui-card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                    <Field label="First name"><input name="first_name" value={form.first_name} onChange={update} required className="ui-input" /></Field>
                    <Field label="Last name"><input name="last_name" value={form.last_name} onChange={update} className="ui-input" /></Field>
                    <Field label="Email"><input name="email" type="email" value={form.email} onChange={update} required className="ui-input" /></Field>
                    <Field label="Phone number"><input name="phone" value={form.phone} onChange={update} required className="ui-input" /></Field>
                    <div className="pt-1 sm:col-span-2">
                        <button disabled={loading} className="btn-primary w-full sm:w-auto">{loading ? "Please wait..." : "Continue to services"}</button>
                    </div>
                </form>
            </div>
        </section>
    );
}

function Field({ label, children }) {
    return <label><span className="ui-label">{label}</span>{children}</label>;
}

export default LeadForm;
