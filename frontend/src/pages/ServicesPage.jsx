import { useNavigate } from "react-router-dom";
import services from "../data/services";

import { useSearchParams } from "react-router-dom";

function ServicesPage() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();

    const referralCode = searchParams.get("ref") || "";

    const handleServiceClick = (service) => {
        if (!service.paymentUrl) {
            navigate(`/inquiry?ref=${referralCode}`);
            return;
        }


        window.location.href = service.paymentUrl;
    };

    return (
        <div className="min-h-screen bg-[#FAF8F5] px-6 py-12">
            <div className="mx-auto max-w-5xl">

                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#B68D40]">
                        Ananse Center for Design
                    </p>

                    <h1 className="mt-4 text-4xl font-bold text-gray-900">
                        What would you like to book?
                    </h1>

                    <p className="mt-4 text-lg leading-8 text-gray-600">
                        Choose a service below to continue to booking and
                        payment.
                    </p>

                    <a
                        href={import.meta.env.VITE_RATE_CARD_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-block font-semibold underline underline-offset-4"
                    >
                        View our rate card
                    </a>
                </div>

                <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                    {services.map((service) => (
                        <div
                            key={service.id}
                            className="flex flex-col rounded-3xl bg-white p-7 shadow-sm ring-1 ring-gray-100"
                        >
                            <p className="text-xs font-semibold uppercase tracking-widest text-[#B68D40]">
                                {service.category}
                            </p>

                            <h2 className="mt-3 text-2xl font-semibold text-gray-900">
                                {service.name}
                            </h2>

                            <p className="mt-4 flex-1 leading-7 text-gray-600">
                                {service.description}
                            </p>

                            <button
                                type="button"
                                onClick={() => handleServiceClick(service)}
                                className="mt-7 w-full rounded-full bg-black px-5 py-3 font-medium text-white transition hover:opacity-80"
                            >
                                {service.paymentUrl
                                    ? "Continue to Booking"
                                    : "Make an Inquiry"}
                            </button>
                        </div>
                    ))}

                </div>

                <div className="mx-auto mt-12 max-w-2xl text-center">
                    <p className="text-gray-600">
                        Looking for something different?
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate(`/inquiry?ref=${referralCode}`)}
                        className="mt-3 font-semibold underline underline-offset-4"
                    >
                        Tell us what you need
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ServicesPage;