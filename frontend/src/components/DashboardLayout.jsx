import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import api from "../services/api";

function DashboardLayout({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        api.get("/api/auth/me/")
            .then((response) => setUser(response.data.user))
            .catch(() => {});
    }, []);

    const logout = async () => {
        try {
            const csrf = await api.get("/api/csrf/");
            await api.post(
                "/api/auth/logout/",
                {},
                { headers: { "X-CSRFToken": csrf.data.csrfToken } }
            );
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            navigate("/login");
        }
    };

    const linkClass = ({ isActive }) =>
        `block rounded-xl px-4 py-3 text-sm font-medium ${
            isActive ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
        }`;

    return (
        <div className="min-h-screen bg-[#FAF8F5]">
            <div className="flex min-h-screen">
                <aside className="hidden w-64 border-r bg-white p-6 md:flex md:flex-col">
                    <div className="mb-8">
                        <img src={logo} alt="Ananse" className="h-10 w-auto" />
                        <p className="mt-4 font-medium text-gray-900">{user?.name || "Ananse Services"}</p>
                        <p className="mt-1 text-xs text-gray-500">{user?.role_display || "Referral & Sales Dashboard"}</p>
                    </div>

                    <nav className="space-y-2">
                        <NavLink to="/dashboard" end className={linkClass}>Overview</NavLink>
                        <NavLink to="/dashboard/leads" className={linkClass}>Leads</NavLink>
                        <NavLink to="/dashboard/inquiries" className={linkClass}>Inquiries</NavLink>
                        <NavLink to="/dashboard/custom-sales" className={linkClass}>Custom Sales</NavLink>
                    </nav>

                    {user?.is_manager && (
                        <div className="mt-7 border-t pt-6">
                            <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Management</p>
                            <nav className="space-y-2">
                                <NavLink to="/management" end className={linkClass}>Company Overview</NavLink>
                                <NavLink to="/management/staff" className={linkClass}>Staff & Sales Reps</NavLink>
                                <NavLink to="/management/referrals" className={linkClass}>Influencers & Partners</NavLink>
                            </nav>
                        </div>
                    )}

                    <button onClick={logout} className="mt-auto rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-600 hover:bg-gray-100">Log out</button>
                </aside>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between border-b bg-white p-4 md:hidden">
                        <img src={logo} alt="Ananse" className="h-9 w-auto" />
                        <div className="flex gap-3 text-xs">
                            <NavLink to="/dashboard">Overview</NavLink>
                            <NavLink to="/dashboard/leads">Leads</NavLink>
                            {user?.is_manager && <NavLink to="/management">Manage</NavLink>}
                        </div>
                    </div>
                    <main>{children}</main>
                </div>
            </div>
        </div>
    );
}

export default DashboardLayout;
