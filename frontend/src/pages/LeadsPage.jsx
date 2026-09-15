import { useEffect, useMemo, useState } from "react";
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

const ACTIVE_STATUS_OPTIONS = STATUS_OPTIONS.filter(([value]) => !["converted", "lost"].includes(value));
const ARCHIVED_STATUS_OPTIONS = STATUS_OPTIONS.filter(([value]) => ["converted", "lost"].includes(value));

function LeadsPage() {
    const [leads, setLeads] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const [user, setUser] = useState(null);
    const [staffOptions, setStaffOptions] = useState([]);
    const [archiveMode, setArchiveMode] = useState(false);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [assignedFilter, setAssignedFilter] = useState("");
    const [sourceFilter, setSourceFilter] = useState("");

    const loadLeads = async () => {
        setLoading(true);
        try {
            setError("");
            const response = await api.get("/api/leads/manage/", {
                params: {
                    archived: archiveMode,
                    page,
                    page_size: 25,
                    search: search || undefined,
                    status: statusFilter || undefined,
                    assigned_to: assignedFilter || undefined,
                    source: sourceFilter.trim() || undefined,
                },
            });
            setLeads(response.data.leads || []);
            setPagination(response.data.pagination || null);
        } catch (err) {
            console.error("Lead loading error:", err);
            setError("Unable to load leads.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            try {
                const me = await api.get("/api/auth/me/");
                const currentUser = me.data.user;
                setUser(currentUser);
                if (currentUser?.is_manager) {
                    const staff = await api.get("/api/accounts/staff/options/");
                    setStaffOptions(staff.data.staff || []);
                }
            } catch (err) {
                console.error("Lead page user loading error:", err);
            }
        };
        loadUser();
    }, []);

    useEffect(() => {
        loadLeads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [archiveMode, page, search, statusFilter, assignedFilter, sourceFilter]);

    const changeMode = (archived) => {
        setArchiveMode(archived);
        setPage(1);
        setStatusFilter("");
        setExpanded(null);
    };

    const submitSearch = (event) => {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    const clearFilters = () => {
        setSearchInput("");
        setSearch("");
        setStatusFilter("");
        setAssignedFilter("");
        setSourceFilter("");
        setPage(1);
    };

    const updateLead = async (leadId, changes) => {
        setSaving(leadId);
        try {
            const csrf = await api.get("/api/csrf/");
            const response = await api.patch(
                `/api/leads/manage/${leadId}/update/`,
                changes,
                { headers: { "X-CSRFToken": csrf.data.csrfToken } }
            );

            const updated = response.data.lead;
            const isTerminal = ["converted", "lost"].includes(updated.status);
            if (isTerminal !== archiveMode) {
                await loadLeads();
            } else {
                setLeads((current) => current.map((lead) => lead.id === leadId ? updated : lead));
            }
        } catch (err) {
            console.error("Lead update error:", err);
            alert(err.response?.data?.error || "Unable to update lead.");
        } finally {
            setSaving(null);
        }
    };

    const { myLeads, teamLeads } = useMemo(() => {
        if (!user?.is_manager) return { myLeads: leads, teamLeads: [] };
        const username = user.username;
        const mine = [];
        const team = [];
        leads.forEach((lead) => {
            const ownSource = lead.source_owner?.username === username;
            const assigned = lead.assigned_to?.username === username;
            (ownSource || assigned ? mine : team).push(lead);
        });
        return { myLeads: mine, teamLeads: team };
    }, [leads, user]);

    const statusOptions = archiveMode ? ARCHIVED_STATUS_OPTIONS : ACTIVE_STATUS_OPTIONS;

    return (
        <DashboardLayout>
            <div className="app-page">
                <PageHeader
                    eyebrow="Sales pipeline"
                    title="Leads"
                    description="Manage referral contacts, assignment, follow-up status and customer responses."
                />

                <div className="mb-4 flex w-fit rounded-xl border border-neutral-200 bg-white p-1">
                    <TabButton active={!archiveMode} onClick={() => changeMode(false)}>Active</TabButton>
                    <TabButton active={archiveMode} onClick={() => changeMode(true)}>Archive</TabButton>
                </div>

                <SectionCard className="mb-5">
                    <form onSubmit={submitSearch} className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[minmax(220px,1fr)_180px_180px_180px_auto]">
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search name, email, phone or service"
                            className="ui-input py-2 text-sm"
                        />
                        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="ui-input py-2 text-sm">
                            <option value="">All statuses</option>
                            {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        {user?.is_manager ? (
                            <select value={assignedFilter} onChange={(e) => { setAssignedFilter(e.target.value); setPage(1); }} className="ui-input py-2 text-sm">
                                <option value="">All assignees</option>
                                <option value="unassigned">Unassigned</option>
                                {staffOptions.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                            </select>
                        ) : <div />}
                        <input
                            value={sourceFilter}
                            onChange={(e) => { setSourceFilter(e.target.value.toLowerCase()); setPage(1); }}
                            placeholder="Source code"
                            className="ui-input py-2 text-sm"
                        />
                        <div className="flex gap-2">
                            <button className="btn-primary px-4 py-2 text-sm">Search</button>
                            <button type="button" onClick={clearFilters} className="btn-secondary px-3 py-2 text-sm">Clear</button>
                        </div>
                    </form>
                </SectionCard>

                {loading ? (
                    <p className="text-sm text-neutral-500">Loading leads...</p>
                ) : error ? (
                    <div className="ui-card p-5 text-sm text-rose-700">{error}</div>
                ) : leads.length === 0 ? (
                    <SectionCard><EmptyState title={archiveMode ? "No archived leads" : "No active leads"} description={archiveMode ? "Converted and lost leads will be kept here." : "New referral contacts will appear here."} /></SectionCard>
                ) : user?.is_manager ? (
                    <div className="space-y-5">
                        <LeadSection title="My leads" description={archiveMode ? "Your converted and lost leads." : "Generated through your referral link or currently assigned to you."} leads={myLeads} user={user} staffOptions={staffOptions} saving={saving} expanded={expanded} setExpanded={setExpanded} updateLead={updateLead} />
                        <LeadSection title="Team leads" description={archiveMode ? "Archived leads belonging to other staff, influencers or partners." : "Leads belonging to other staff, influencers or partners."} leads={teamLeads} user={user} staffOptions={staffOptions} saving={saving} expanded={expanded} setExpanded={setExpanded} updateLead={updateLead} />
                        <SectionCard><Pagination pagination={pagination} onPageChange={setPage} /></SectionCard>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <LeadSection title={archiveMode ? "Archived leads" : "My leads"} description={archiveMode ? "Converted and lost leads remain available for reference." : "Leads generated through your referral link or assigned to you."} leads={myLeads} user={user} staffOptions={staffOptions} saving={saving} expanded={expanded} setExpanded={setExpanded} updateLead={updateLead} />
                        <SectionCard><Pagination pagination={pagination} onPageChange={setPage} /></SectionCard>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function TabButton({ active, onClick, children }) {
    return <button type="button" onClick={onClick} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${active ? "bg-neutral-950 !text-white" : "text-neutral-500 hover:text-neutral-950"}`}>{children}</button>;
}

function LeadSection({ title, description, leads, user, staffOptions, saving, expanded, setExpanded, updateLead }) {
    return (
        <SectionCard title={title} description={description} action={<span className="text-xs font-medium text-neutral-400">{leads.length} {leads.length === 1 ? "lead" : "leads"}</span>}>
            {leads.length === 0 ? <EmptyState title="No leads in this section" /> : (
                <div className="divide-y divide-neutral-100">
                    {leads.map((lead) => <LeadRow key={lead.id} lead={lead} user={user} staffOptions={staffOptions} saving={saving} expanded={expanded} setExpanded={setExpanded} updateLead={updateLead} />)}
                </div>
            )}
        </SectionCard>
    );
}

function LeadRow({ lead, user, staffOptions, saving, expanded, setExpanded, updateLead }) {
    const isExpanded = expanded === lead.id;
    const referralName = lead.referral?.name || lead.referral?.code || "Unknown source";
    const sourceType = (lead.referral?.source_type || "referral").replaceAll("_", " ");

    return (
        <article className="px-4 py-4 sm:px-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-neutral-950 sm:text-base">{lead.first_name} {lead.last_name}</h3>
                        <span className="rounded-full bg-[#F5F1E9] px-2.5 py-1 text-[11px] font-semibold text-[#7B6336]">Source: {referralName}</span>
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] capitalize text-neutral-500">{sourceType}</span>
                    </div>
                    <div className="mt-3 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <LeadField label="Email" value={lead.email || "—"} />
                        <LeadField label="Phone" value={lead.phone || "—"} />
                        <LeadField label="Interest" value={lead.service_name || lead.interest_display || "—"} />
                        <LeadField label="Assigned to" value={lead.assigned_to?.name || "Unassigned"} />
                    </div>
                </div>
                <div className={`grid gap-3 ${user?.is_manager ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
                    {user?.is_manager && (
                        <ControlField label="Assign">
                            <select value={lead.assigned_to?.id || ""} disabled={saving === lead.id} onChange={(event) => updateLead(lead.id, { assigned_to_id: event.target.value || null })} className="ui-input py-2 text-sm">
                                <option value="">Unassigned</option>
                                {staffOptions.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                            </select>
                        </ControlField>
                    )}
                    <ControlField label="Status">
                        <select value={lead.status} disabled={saving === lead.id} onChange={(event) => updateLead(lead.id, { status: event.target.value })} className="ui-input py-2 text-sm">
                            {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </ControlField>
                </div>
            </div>
            <button type="button" onClick={() => setExpanded(isExpanded ? null : lead.id)} className="mt-3 text-xs font-semibold text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-950">
                {isExpanded ? "Hide details" : "View lead response"}
            </button>
            {isExpanded && (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl bg-[#F9F7F3] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">Inquiry / lead response</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">{lead.inquiry_message || "No inquiry message. This person completed the lead/contact form only."}</p>
                    </div>
                    <NotesEditor lead={lead} saving={saving === lead.id} onSave={updateLead} />
                </div>
            )}
        </article>
    );
}

function LeadField({ label, value }) {
    return <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400">{label}</p><p className="mt-1 break-words text-sm leading-5 text-neutral-700">{value}</p></div>;
}

function ControlField({ label, children }) {
    return <label><span className="ui-label">{label}</span>{children}</label>;
}

function NotesEditor({ lead, saving, onSave }) {
    const [notes, setNotes] = useState(lead.internal_notes || "");
    useEffect(() => { setNotes(lead.internal_notes || ""); }, [lead.internal_notes]);
    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <label className="text-xs font-semibold text-neutral-600">Internal follow-up notes</label>
            <textarea rows="4" value={notes} onChange={(event) => setNotes(event.target.value)} className="ui-input mt-2 resize-y text-sm" placeholder="Add notes from calls, WhatsApp follow-up, quotes sent, etc." />
            <button type="button" disabled={saving} onClick={() => onSave(lead.id, { internal_notes: notes })} className="btn-primary mt-3 px-4 py-2 text-sm">{saving ? "Saving..." : "Save notes"}</button>
        </div>
    );
}

export default LeadsPage;
