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
                console.log("Getting CSRF cookie...");

                await api.get("csrf/");

                console.log("Getting referral:", code);

                const res = await api.get(`referrals/${code}/`);

                console.log("Referral response:", res.data);

                setReferral(res.data);

            } catch (error) {
                console.error("Referral landing page error:", error);
                setError(error);
            }
        }

        load();
    }, [code]);

    if (error) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center px-6 text-center">
                <h1 className="text-2xl font-semibold">
                    Something went wrong
                </h1>

                <p className="mt-3 text-gray-600">
                    We couldn't load this referral page.
                </p>

                <p className="mt-4 text-sm text-gray-400">
                    Please try again in a moment.
                </p>
            </div>
        );
    }

    if (!referral) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="bg-[#FAF8F5] min-h-screen">
            <Navbar />

            <Hero referral={referral} />

            <LeadForm referralCode={referral.code} />
        </div>
    );
}

export default ReferralLanding;