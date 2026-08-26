import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import api from "../services/api";

function DashboardLayout({ children }) {
    const navigate = useNavigate();

    const logout = async () => {
        try {
            await api.post("/api/auth/logout/");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            navigate("/login");
        }
    };

    const linkClass = ({ isActive }) =>
        `block rounded-xl px-4 py-3 text-sm font-medium ${
            isActive
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
        }`;

    return (
        <div className="min-h-screen bg-[#FAF8F5]">
            <div className="flex min-h-screen">

                <aside className="hidden w-64 border-r bg-white p-6 md:flex md:flex-col">

                    <div className="mb-10">

                        <p className="mt-4 text-sm text-gray-500">
                            Camille's Referral Dashboard
                        </p>
                    </div>

                    <nav className="space-y-2">
                        <NavLink
                            to="/dashboard"
                            end
                            className={linkClass}
                        >
                            Overview
                        </NavLink>

                        <NavLink
                            to="/dashboard/inquiries"
                            className={linkClass}
                        >
                            Inquiries
                        </NavLink>

                        <NavLink
                            to="/dashboard/custom-sales"
                            className={linkClass}
                        >
                            Custom Sales
                        </NavLink>
                    </nav>

                    <button
                        onClick={logout}
                        className="mt-auto rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-600 hover:bg-gray-100"
                    >
                        Log out
                    </button>
                </aside>
                <div className="flex items-center justify-between border-b bg-white p-4 md:hidden">
    <img
        src={logo}
        alt="Ananse"
        className="h-9 w-auto"
    />

    <div className="flex gap-3 text-sm">
        <NavLink to="/dashboard">Overview</NavLink>
        <NavLink to="/dashboard/inquiries">Inquiries</NavLink>
        <NavLink to="/dashboard/custom-sales">Sales</NavLink>
    </div>
</div>

                <main className="flex-1">
                    {children}
                </main>

            </div>
        </div>
    );
}

export default DashboardLayout;