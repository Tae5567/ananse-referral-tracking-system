import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../services/api";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import LeadForm from "../components/LeadForm";

function ReferralLanding() {

    const { code } = useParams();

    const [referral, setReferral] = useState(null);

    useEffect(() => {

        api.get(`/referrals/${code}/`)
            .then((res) => {
                setReferral(res.data);
            })
            .catch(console.error);

    }, [code]);

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