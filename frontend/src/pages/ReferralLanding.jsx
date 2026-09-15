import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import LeadForm from "../components/LeadForm";

function ReferralLanding() {
    const { code } = useParams();
    const [referral, setReferral] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                await api.get("/api/csrf/");
                const response = await api.get(`/api/referrals/${code}/`);
                setReferral(response.data);
            } catch (err) {
                console.error("Referral landing page error:", err);
                setError(err);
            }
        }
        load();
    }, [code]);

    if (error) return <CenteredMessage title="Something went wrong" description="We couldn't load this referral page. Please try again in a moment." />;
    if (!referral) return <CenteredMessage title="Loading" description="Preparing Ananse services..." />;

    return (
        <div className="min-h-screen bg-[#F7F4EE]">
            <Navbar />
            <Hero referral={referral} />
            <LeadForm referralCode={referral.code} />
        </div>
    );
}

function CenteredMessage({ title, description }) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F7F4EE] px-6 text-center"><div><h1 className="text-2xl font-semibold text-neutral-950">{title}</h1><p className="mt-2 text-sm text-neutral-500">{description}</p></div></div>;
}

export default ReferralLanding;
