import logo from "../assets/logo.jpg";

function Navbar() {
    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <img
                    src={logo}
                    alt="Ananse"
                    className="h-10 md:h-12"
                />

                <div className="hidden md:flex items-center gap-8 text-sm text-gray-700">
                    <a href="#about" className="hover:text-black">About</a>
                    <a href="#services" className="hover:text-black">Services</a>
                    <a href="#contact" className="hover:text-black">Contact</a>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;