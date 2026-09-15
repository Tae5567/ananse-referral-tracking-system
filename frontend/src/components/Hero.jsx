import hero from "../assets/hero.png";

function Hero({ referral }) {
    return (
        <section className="bg-[#FAF8F5] text-black">
            <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                {/* Text */}
                <div>

                    <p className="uppercase tracking-widest text-sm text-[#B68D40] font-semibold">
                        Ananse Center for Design
                    </p>

                    <h1 className="mt-5 text-5xl lg:text-6xl font-bold leading-tight !text-black">
                        Welcome to the Ananse Center for Design.
                    </h1>

                    <div className="mt-7 space-y-5 text-lg leading-8 !text-black">

                        <p>
                            From photography and content creation to fashion
                            production, creative workspaces, training programmes
                            and event spaces, we've created a hub designed to
                            help creatives, brands and businesses bring their
                            ideas to life.
                        </p>

                        <p>
                            Complete your details below to continue to your
                            booking.
                        </p>

                    </div>

                    <div className="mt-8 border-l-2 border-[#B68D40] pl-5">
                        <p className="font-semibold text-gray-900">
                            Questions before booking?
                        </p>

                        <p className="mt-2 text-gray-600">
                            Feel free to reach out. We are happy to help you
                            choose the service that's right for you.
                        </p>
                    </div>

                </div>

                {/* Hero image */}
                <div>
                    <img
                        src={hero}
                        alt="Ananse Center for Design"
                        className="rounded-3xl shadow-2xl w-full object-cover"
                    />
                </div>

            </div>
        </section>
    );
}

export default Hero;