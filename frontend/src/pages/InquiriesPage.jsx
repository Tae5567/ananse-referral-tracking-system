import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/dashboard/PageHeader";
import SectionCard from "../components/dashboard/SectionCard";
import EmptyState from "../components/dashboard/EmptyState";
import Pagination from "../components/dashboard/Pagination";

const STATUS_OPTIONS = [
    ["new", "New"],
    ["contacted", "Contacted"],
    ["follow_up", "Follow-up Required"],
    ["quoted", "Quote Sent"],
    ["converted", "Converted"],
    ["lost", "Lost"],
];

function InquiriesPage() {
    const [inquiries, setInquiries] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [archiveMode, setArchiveMode] = useState(false);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const loadInquiries = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/leads/inquiries/", {
                params: {
                    archived: archiveMode,
                    page,
                    page_size: 25,
                    search: search || undefined,
                    status: statusFilter || undefined,
                },
            });
            setInquiries(response.data.inquiries || []);
            setPagination(response.data.pagination || null);
        } catch (error) {
            console.error("Inquiry loading error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInquiries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [archiveMode, page, search, statusFilter]);

    const changeMode = (archived) => {
        setArchiveMode(archived);
        setPage(1);
        setStatusFilter("");
    };

    const submitSearch = (event) => {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const csrf = await api.get("/api/csrf/");
            const response = await api.patch(
                `/api/leads/inquiries/${id}/status/`,
                { status: newStatus },
                { headers: { "X-CSRFToken": csrf.data.csrfToken } }
            );
            const updated = response.data.inquiry;
            const isTerminal = ["converted", "lost"].includes(updated.status);
            if (isTerminal !== archiveMode) {
                await loadInquiries();
            } else {
                setInquiries((current) => current.map((item) => item.id === id ? updated : item));
            }
        } catch (error) {
            console.error("Inquiry status error:", error);
            alert(error.response?.data?.error || "Unable to update inquiry.");
        }
    };

    return (
        <DashboardLayout>
            <div className="app-page">
                <PageHeader eyebrow="Sales pipeline" title="Inquiries" description="Follow up with customers who have requested custom services." />

                <div className="mb-4 flex w-fit rounded-xl border border-neutral-200 bg-white p-1">
                    <TabButton active={!archiveMode} onClick={() => changeMode(false)}>Active</TabButton>
                    <TabButton active={archiveMode} onClick={() => changeMode(true)}>Archive</TabButton>
                </div>

                <SectionCard className="mb-5">
                    <form onSubmit={submitSearch} className="flex flex-col gap-3 p-4 sm:flex-row sm:p-5">
                        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, email, phone, service or source" className="ui-input py-2 text-sm sm:max-w-lg" />
                        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="ui-input py-2 text-sm sm:max-w-[220px]">
                            <option value="">All statuses</option>
                            {STATUS_OPTIONS.filter(([value]) => archiveMode ? ["converted", "lost"].includes(value) : !["converted", "lost"].includes(value)).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <button className="btn-primary px-4 py-2 text-sm">Search</button>
                        <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setStatusFilter(""); setPage(1); }} className="btn-secondary px-4 py-2 text-sm">Clear</button>
                    </form>
                </SectionCard>

                <SectionCard>
                    {loading ? (
                        <div className="px-5 py-8 text-sm text-neutral-500">Loading inquiries...</div>
                    ) : inquiries.length === 0 ? (
                        <EmptyState title={archiveMode ? "No archived inquiries" : "No active inquiries"} description={archiveMode ? "Converted and lost inquiries will remain here for reference." : "New custom-service requests will appear here."} />
                    ) : (
                        <div className="divide-y divide-neutral-100">
                            {inquiries.map((inquiry) => (
                                <article key={inquiry.id} className="px-4 py-4 sm:px-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-base font-semibold text-neutral-950">{inquiry.first_name} {inquiry.last_name}</h2>
                                                <span className="rounded-full bg-[#F5F1E9] px-2.5 py-1 text-[11px] font-semibold text-[#7B6336]">{inquiry.service_name || "Custom service"}</span>
                                                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] text-neutral-500">Source: {inquiry.referral?.name || inquiry.referral?.code || "Unknown"}</span>
                                            </div>
                                            <div className="mt-3 flex flex-col gap-1 text-sm text-neutral-500 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-1">
                                                <span className="break-all">{inquiry.email || "—"}</span>
                                                <span className="whitespace-nowrap">{inquiry.phone || "—"}</span>
                                                <span>Assigned: {inquiry.assigned_to?.name || "Unassigned"}</span>
                                            </div>
                                        </div>
                                        <div className="w-full lg:w-[220px] lg:flex-none">
                                            <select value={inquiry.status} onChange={(e) => updateStatus(inquiry.id, e.target.value)} className="ui-input w-full py-2 text-sm">
                                                {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-xl bg-[#F9F7F3] p-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">Inquiry</p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{inquiry.inquiry_message || "No message provided."}</p>
                                    </div>
                                    {inquiry.internal_notes && (
                                        <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-4">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">Internal follow-up notes</p>
                                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{inquiry.internal_notes}</p>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                    <Pagination pagination={pagination} onPageChange={setPage} />
                </SectionCard>
            </div>
        </DashboardLayout>
    );
}

function TabButton({ active, onClick, children }) {
    return <button type="button" onClick={onClick} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${active ? "bg-neutral-950 !text-white" : "text-neutral-500 hover:text-neutral-950"}`}>{children}</button>;
}

export default InquiriesPage;
