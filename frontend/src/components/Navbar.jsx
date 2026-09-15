import logo from "../assets/logo.jpg";

function Navbar() {
    return (
        <nav className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
                <img src={logo} alt="Ananse" className="h-8 w-auto object-contain sm:h-9" />
                <a href="#contact" className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50">
                    Get started
                </a>
            </div>
        </nav>
    );
}

export default Navbar;
