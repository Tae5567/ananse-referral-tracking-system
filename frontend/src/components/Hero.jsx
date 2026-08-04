import hero from "../assets/hero.jpg";

function Hero({ referral }) {
    return (
        <section className="bg-[#FAF8F5]">
            <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">

                <div>

                    <p className="uppercase tracking-widest text-sm text-[#B68D40] font-semibold">
                        Welcome
                    </p>

                    <h1 className="mt-5 text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                        Discover Africa's Finest Fashion & Creative Services
                    </h1>

                    <p className="mt-8 text-lg leading-8 text-gray-600">
                        You've been invited by
                        <span className="font-semibold text-black">
                            {" "}{referral.name}
                        </span>
                        .
                    </p>

                    <p className="mt-5 text-lg text-gray-600">
                        Browse fashion from Africa's leading designers or
                        enquire about bespoke styling, sourcing,
                        photoshoots and creative services.
                    </p>

                </div>

                <div>

                    <img
                        src={hero}
                        alt="African Fashion"
                        className="rounded-3xl shadow-2xl w-full object-cover"
                    />

                </div>

            </div>
        </section>
    );
}

export default Hero;