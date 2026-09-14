import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

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
                setUser(me.data.user);
                if (me.data.user?.is_manager) {
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
                {
                    headers: {
                        "X-CSRFToken": csrf.data.csrfToken,
                    },
                }
            );

            setLeads((current) =>
                current.map((lead) =>
                    lead.id === leadId ? response.data.lead : lead
                )
            );
        } catch (err) {
            console.error("Lead update error:", err);
            alert(err.response?.data?.error || "Unable to update lead.");
        } finally {
            setSaving(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-8">
                    <p className="text-sm uppercase tracking-widest text-[#B68D40]">
                        Sales Pipeline
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                        Leads
                    </h1>
                    <p className="mt-2 text-gray-500">
                        View contact-form responses, referral source, inquiry details and follow-up status.
                    </p>
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading leads...</p>
                ) : error ? (
                    <p className="text-red-600">{error}</p>
                ) : leads.length === 0 ? (
                    <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                        <p className="text-gray-500">No leads yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {leads.map((lead) => (
                            <div key={lead.id} className="rounded-2xl bg-white p-6 shadow-sm">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                {lead.first_name} {lead.last_name}
                                            </h2>
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                                                {lead.referral?.name || lead.referral?.code}
                                            </span>
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize text-gray-600">
                                                {lead.referral?.source_type}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid gap-1 text-sm text-gray-600 sm:grid-cols-2">
                                            <p>{lead.email}</p>
                                            <p>{lead.phone}</p>
                                            <p>
                                                Interest: {lead.service_name || lead.interest_display || "—"}
                                            </p>
                                            <p>
                                                Assigned to: {lead.assigned_to?.name || "Unassigned"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        {user?.is_manager && (
                                            <select
                                                value={lead.assigned_to?.id || ""}
                                                disabled={saving === lead.id}
                                                onChange={(event) =>
                                                    updateLead(lead.id, { assigned_to_id: event.target.value || null })
                                                }
                                                className="rounded-xl border px-4 py-2 text-sm"
                                            >
                                                <option value="">Unassigned</option>
                                                {staffOptions.map((person) => (
                                                    <option key={person.id} value={person.id}>{person.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        <select
                                            value={lead.status}
                                            disabled={saving === lead.id}
                                            onChange={(event) =>
                                                updateLead(lead.id, { status: event.target.value })
                                            }
                                            className="rounded-xl border px-4 py-2 text-sm"
                                        >
                                            {STATUS_OPTIONS.map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                                    className="mt-5 text-sm font-medium underline"
                                >
                                    {expanded === lead.id ? "Hide details" : "View lead response"}
                                </button>

                                {expanded === lead.id && (
                                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                        <div className="rounded-xl bg-gray-50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Inquiry / Lead response
                                            </p>
                                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                                {lead.inquiry_message || "No inquiry message. This person completed the lead/contact form only."}
                                            </p>
                                        </div>

                                        <NotesEditor lead={lead} saving={saving === lead.id} onSave={updateLead} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function NotesEditor({ lead, saving, onSave }) {
    const [notes, setNotes] = useState(lead.internal_notes || "");

    useEffect(() => {
        setNotes(lead.internal_notes || "");
    }, [lead.internal_notes]);

    return (
        <div className="rounded-xl border p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Internal follow-up notes
            </label>
            <textarea
                rows="5"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-3 w-full rounded-xl border px-4 py-3 text-sm"
                placeholder="Add notes from calls, WhatsApp follow-up, quotes sent, etc."
            />
            <button
                type="button"
                disabled={saving}
                onClick={() => onSave(lead.id, { internal_notes: notes })}
                className="mt-3 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
                {saving ? "Saving..." : "Save notes"}
            </button>
        </div>
    );
}

export default LeadsPage;
