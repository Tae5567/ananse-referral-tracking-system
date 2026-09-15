import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/dashboard/PageHeader";
import SectionCard from "../components/dashboard/SectionCard";
import EmptyState from "../components/dashboard/EmptyState";

const STATUS_OPTIONS = [
    ["new", "New"],
    ["contacted", "Contacted"],
    ["follow_up", "Follow-up Required"],
    ["quoted", "Quote Sent"],
    ["converted", "Converted"],
    ["lost", "Lost"],
];

function LeadsPage() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const [user, setUser] = useState(null);
    const [staffOptions, setStaffOptions] = useState([]);

    const loadLeads = async () => {
        try {
            setError("");
            const response = await api.get("/api/leads/manage/");
            setLeads(response.data.leads || []);
        } catch (err) {
            console.error("Lead loading error:", err);
            setError("Unable to load leads.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            await loadLeads();
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
        load();
    }, []);

    const updateLead = async (leadId, changes) => {
        setSaving(leadId);
        try {
            const csrf = await api.get("/api/csrf/");
            const response = await api.patch(
                `/api/leads/manage/${leadId}/update/`,
                changes,
                { headers: { "X-CSRFToken": csrf.data.csrfToken } }
            );
            setLeads((current) => current.map((lead) => lead.id === leadId ? response.data.lead : lead));
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

    return (
        <DashboardLayout>
            <div className="app-page">
                <PageHeader
                    eyebrow="Sales pipeline"
                    title="Leads"
                    description="Manage referral contacts, assignment, follow-up status and customer responses."
                />

                {loading ? (
                    <p className="text-sm text-neutral-500">Loading leads...</p>
                ) : error ? (
                    <div className="ui-card p-5 text-sm text-rose-700">{error}</div>
                ) : leads.length === 0 ? (
                    <SectionCard><EmptyState title="No leads yet" /></SectionCard>
                ) : user?.is_manager ? (
                    <div className="space-y-5">
                        <LeadSection title="My leads" description="Generated through your referral link or currently assigned to you." leads={myLeads} user={user} staffOptions={staffOptions} saving={saving} expanded={expanded} setExpanded={setExpanded} updateLead={updateLead} />
                        <LeadSection title="Team leads" description="Leads belonging to other staff, influencers or partners." leads={teamLeads} user={user} staffOptions={staffOptions} saving={saving} expanded={expanded} setExpanded={setExpanded} updateLead={updateLead} />
                    </div>
                ) : (
                    <LeadSection title="My leads" description="Leads generated through your referral link or assigned to you." leads={myLeads} user={user} staffOptions={staffOptions} saving={saving} expanded={expanded} setExpanded={setExpanded} updateLead={updateLead} />
                )}
            </div>
        </DashboardLayout>
    );
}

function LeadSection({ title, description, leads, user, staffOptions, saving, expanded, setExpanded, updateLead }) {
    return (
        <SectionCard
            title={title}
            description={description}
            action={<span className="text-xs font-medium text-neutral-400">{leads.length} {leads.length === 1 ? "lead" : "leads"}</span>}
        >
            {leads.length === 0 ? (
                <EmptyState title="No leads in this section" />
            ) : (
                <div className="divide-y divide-neutral-100">
                    {leads.map((lead) => (
                        <LeadRow key={lead.id} lead={lead} user={user} staffOptions={staffOptions} saving={saving} expanded={expanded} setExpanded={setExpanded} updateLead={updateLead} />
                    ))}
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
                            <select
                                value={lead.assigned_to?.id || ""}
                                disabled={saving === lead.id}
                                onChange={(event) => updateLead(lead.id, { assigned_to_id: event.target.value || null })}
                                className="ui-input py-2 text-sm"
                            >
                                <option value="">Unassigned</option>
                                {staffOptions.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                            </select>
                        </ControlField>
                    )}
                    <ControlField label="Status">
                        <select
                            value={lead.status}
                            disabled={saving === lead.id}
                            onChange={(event) => updateLead(lead.id, { status: event.target.value })}
                            className="ui-input py-2 text-sm"
                        >
                            {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </ControlField>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : lead.id)}
                className="mt-3 text-xs font-semibold text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-950"
            >
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
    return <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-neutral-400">{label}</p><p className="mt-1 break-words text-sm leading-5 text-neutral-700">{value}</p></div>;
}

function ControlField({ label, children }) {
    return <div><label className="ui-label">{label}</label>{children}</div>;
}

function NotesEditor({ lead, saving, onSave }) {
    const [notes, setNotes] = useState(lead.internal_notes || "");
    useEffect(() => setNotes(lead.internal_notes || ""), [lead.internal_notes]);
    return (
        <div className="rounded-xl border border-neutral-200 p-4">
            <label className="ui-label">Internal follow-up notes</label>
            <textarea rows="4" value={notes} onChange={(event) => setNotes(event.target.value)} className="ui-input resize-y text-sm" placeholder="Add notes from calls, WhatsApp follow-up, quotes sent, etc." />
            <button type="button" disabled={saving} onClick={() => onSave(lead.id, { internal_notes: notes })} className="btn-primary mt-3">{saving ? "Saving..." : "Save notes"}</button>
        </div>
    );
}

export default LeadsPage;
