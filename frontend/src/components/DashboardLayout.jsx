import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import api from "../services/api";

function DashboardLayout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        api.get("/api/auth/me/")
            .then((response) => setUser(response.data.user))
            .catch(() => {});
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

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
    [
        "block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
            ? "bg-black !text-white"
            : "text-gray-700 hover:bg-black/5 hover:text-black",
    ].join(" ");

    const navigation = (
        <>
            <nav className="space-y-1">
                <NavLink to="/dashboard" end className={linkClass}>Overview</NavLink>
                <NavLink to="/dashboard/leads" className={linkClass}>Leads</NavLink>
                <NavLink to="/dashboard/inquiries" className={linkClass}>Inquiries</NavLink>
                <NavLink to="/dashboard/custom-sales" className={linkClass}>Custom Sales</NavLink>
            </nav>

            {user?.is_manager && (
                <div className="mt-7 border-t border-neutral-200 pt-5">
                    <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        Management
                    </p>
                    <nav className="space-y-1">
                        <NavLink to="/management" end className={linkClass}>Company Overview</NavLink>
                        <NavLink to="/management/staff" className={linkClass}>Staff & Sales Reps</NavLink>
                        <NavLink to="/management/referrals" className={linkClass}>Influencers & Partners</NavLink>
                    </nav>
                </div>
            )}
        </>
    );

    return (
        <div className="min-h-screen bg-[#F7F5F1] text-neutral-950">
            <div className="flex min-h-screen">
                <aside className="hidden w-[248px] shrink-0 border-r border-[#E7E2DA] bg-white lg:flex lg:flex-col">
                    <div className="px-5 pb-5 pt-6">
                        <img src={logo} alt="Ananse" className="h-9 w-auto object-contain" />
                        <p className="mt-5 truncate text-sm font-semibold text-neutral-900">
                            {user?.name || "Ananse Services"}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-400">
                            {user?.role_display || "Referral & Sales"}
                        </p>
                    </div>

                    <div className="px-4">{navigation}</div>

                    <div className="mt-auto border-t border-neutral-100 p-4">
                        <button
                            onClick={logout}
                            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-neutral-500 transition hover:bg-[#F4F1EB] hover:text-neutral-950"
                        >
                            Log out
                        </button>
                    </div>
                </aside>

                <div className="min-w-0 flex-1">
                    <header className="sticky top-0 z-40 border-b border-[#E7E2DA] bg-white/95 backdrop-blur lg:hidden">
                        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                            <img src={logo} alt="Ananse" className="h-8 w-auto object-contain" />
                            <button
                                type="button"
                                onClick={() => setMobileOpen((open) => !open)}
                                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700"
                                aria-expanded={mobileOpen}
                            >
                                {mobileOpen ? "Close" : "Menu"}
                            </button>
                        </div>

                        {mobileOpen && (
                            <div className="border-t border-neutral-100 bg-white px-4 py-4 shadow-sm sm:px-6">
                                <div className="mb-4 rounded-xl bg-[#F8F6F1] px-3 py-3">
                                    <p className="text-sm font-semibold text-neutral-900">{user?.name || "Ananse Services"}</p>
                                    <p className="mt-0.5 text-xs text-neutral-400">{user?.role_display || "Referral & Sales"}</p>
                                </div>
                                {navigation}
                                <button
                                    onClick={logout}
                                    className="mt-5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-left text-sm font-medium text-neutral-600"
                                >
                                    Log out
                                </button>
                            </div>
                        )}
                    </header>

                    <main>{children}</main>
                </div>
            </div>
        </div>
    );
}

export default DashboardLayout;
