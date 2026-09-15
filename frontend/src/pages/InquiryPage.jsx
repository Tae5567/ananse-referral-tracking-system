import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/logo.jpg";

function InquiryPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const referralCode = searchParams.get("ref") || "";
    const [message, setMessage] = useState("");
    const [serviceName, setServiceName] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const submitInquiry = async (event) => {
        event.preventDefault();
        if (!referralCode) {
            alert("Referral information is missing. Please return to the referral page.");
            return;
        }
        if (!message.trim()) {
            alert("Please tell us what service you need.");
            return;
        }

        setLoading(true);
        try {
            const csrfResponse = await api.get("/api/csrf/");
            await api.post(
                "/api/leads/inquiry/",
                {
                    referral_code: referralCode,
                    service_name: serviceName,
                    inquiry_message: message,
                },
                { headers: { "X-CSRFToken": csrfResponse.data.csrfToken } }
            );
            setSubmitted(true);
        } catch (error) {
            console.error("Inquiry submission error:", error);
            alert(error.response?.data?.error || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F4EE]">
            <header className="border-b border-black/5 bg-white">
                <div className="mx-auto flex h-16 max-w-5xl items-center px-5 sm:px-6">
                    <img src={logo} alt="Ananse" className="h-8 w-auto" />
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
                {submitted ? (
                    <div className="ui-card p-8 text-center sm:p-10">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-lg text-emerald-700">✓</div>
                        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950">Thanks for reaching out</h1>
                        <p className="mt-2 text-sm text-neutral-500">Our team will follow up with you about your request.</p>
                        <button onClick={() => navigate(`/services?ref=${referralCode}`)} className="btn-primary mt-6">Back to services</button>
                    </div>
                ) : (
                    <>
                        <button onClick={() => navigate(`/services?ref=${referralCode}`)} className="text-sm font-medium text-neutral-500 hover:text-neutral-950">← Back to services</button>
                        <div className="mt-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A27D39]">Custom request</p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">Tell us what you need</h1>
                            <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-500 sm:text-base">Share the service you're looking for and a few details. An Ananse team member will contact you.</p>
                        </div>

                        <form onSubmit={submitInquiry} className="ui-card mt-7 space-y-5 p-5 sm:p-6">
                            <label><span className="ui-label">Service you're looking for</span><input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="e.g. Product photography" className="ui-input" /></label>
                            <label><span className="ui-label">Tell us more</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows="6" placeholder="Tell us what you need..." className="ui-input resize-y" required /></label>
                            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">{loading ? "Sending..." : "Send inquiry"}</button>
                        </form>
                    </>
                )}
            </main>
        </div>
    );
}

export default InquiryPage;
