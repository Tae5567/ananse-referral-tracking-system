import { useNavigate, useSearchParams } from "react-router-dom";
import services from "../data/services";
import logo from "../assets/logo.jpg";

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
        <div className="min-h-screen bg-[#F7F4EE] text-neutral-950">
            <header className="border-b border-black/5 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-6 lg:px-8">
                    <img src={logo} alt="Ananse" className="h-8 w-auto" />
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14 lg:px-8">
                <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A27D39]">Ananse Center for Design</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Choose a service</h1>
                    <p className="mt-3 text-sm leading-7 text-neutral-500 sm:text-base">Book directly where available, or send us a request for services that need a custom quote.</p>
                    <a href={import.meta.env.VITE_RATE_CARD_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-semibold text-neutral-800 underline decoration-neutral-300 underline-offset-4">View rate card</a>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {services.map((service) => (
                        <article key={service.id} className="ui-card flex min-h-[245px] flex-col p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A27D39]">{service.category}</p>
                            <h2 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-neutral-950">{service.name}</h2>
                            <p className="mt-3 flex-1 text-sm leading-6 text-neutral-500">{service.description}</p>
                            <button type="button" onClick={() => handleServiceClick(service)} className="btn-primary mt-5 w-full">
                                {service.paymentUrl ? "Continue to booking" : "Make an inquiry"}
                            </button>
                        </article>
                    ))}
                </div>

                <div className="mt-8 rounded-2xl border border-black/5 bg-white px-5 py-5 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="font-semibold text-neutral-900">Looking for something different?</p>
                        <p className="mt-1 text-sm text-neutral-500">Tell us what you need and our team will follow up.</p>
                    </div>
                    <button type="button" onClick={() => navigate(`/inquiry?ref=${referralCode}`)} className="btn-secondary mt-4 sm:mt-0">Send a request</button>
                </div>
            </main>
        </div>
    );
}

export default ServicesPage;
