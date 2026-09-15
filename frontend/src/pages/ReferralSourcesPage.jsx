import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/dashboard/PageHeader";
import SectionCard from "../components/dashboard/SectionCard";
import EmptyState from "../components/dashboard/EmptyState";

const emptyForm = { name: "", code: "", source_type: "influencer", managed_by_id: "" };

function ReferralSourcesPage() {
    const [sources, setSources] = useState([]);
    const [staff, setStaff] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState("");
    const [archiveMode, setArchiveMode] = useState(false);

    const load = async () => {
        const [sourceResponse, staffResponse] = await Promise.all([
            api.get("/api/referrals/manage/", { params: { archived: archiveMode } }),
            api.get("/api/accounts/staff/options/"),
        ]);
        setSources(sourceResponse.data.referrals || []);
        setStaff(staffResponse.data.staff || []);
    };

    useEffect(() => { load().catch(console.error); }, [archiveMode]);

    const csrfHeaders = async () => {
        const csrf = await api.get("/api/csrf/");
        return { "X-CSRFToken": csrf.data.csrfToken };
    };

    const create = async (event) => {
        event.preventDefault();
        setMessage("");
        try {
            await api.post(
                "/api/referrals/manage/",
                { ...form, managed_by_id: form.managed_by_id || null },
                { headers: await csrfHeaders() }
            );
            setForm(emptyForm);
            setMessage("External referral link created.");
            await load();
        } catch (err) {
            setMessage(err.response?.data?.error || "Unable to create referral source.");
        }
    };

    const update = async (id, changes) => {
        try {
            await api.patch(`/api/referrals/manage/${id}/`, changes, { headers: await csrfHeaders() });
            await load();
        } catch (err) {
            alert(err.response?.data?.error || "Unable to update referral source.");
        }
    };

    const archiveSource = async (source) => {
        const confirmed = window.confirm(
            `Archive /r/${source.code}? The public link will stop working, but historical clicks and leads will be preserved.`
        );
        if (!confirmed) return;
        try {
            await api.delete(`/api/referrals/manage/${source.id}/`, { headers: await csrfHeaders() });
            await load();
        } catch (err) {
            alert(err.response?.data?.error || "Unable to archive referral source.");
        }
    };

    return (
        <DashboardLayout>
            <div className="app-page">
                <PageHeader
                    eyebrow="Management"
                    title="Influencers & partners"
                    description="Create external links to the Ananse landing page and manage who follows up with the leads they generate."
                />

                {!archiveMode && (
                    <SectionCard title="Create external referral" description="Influencer and partner links track traffic and leads without creating staff accounts.">
                        <form onSubmit={create} className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
                            <Field label="Name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ui-input" /></Field>
                            <Field label="Referral code"><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })} placeholder="e.g. amaka" className="ui-input" /></Field>
                            <Field label="Type">
                                <select value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })} className="ui-input">
                                    <option value="influencer">Influencer</option>
                                    <option value="partner">Partner</option>
                                </select>
                            </Field>
                            <Field label="Managed by">
                                <select value={form.managed_by_id} onChange={(e) => setForm({ ...form, managed_by_id: e.target.value })} className="ui-input">
                                    <option value="">Unassigned</option>
                                    {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                                </select>
                            </Field>
                            <div className="sm:col-span-2 xl:col-span-4">
                                <button className="btn-primary">Create referral link</button>
                                {message && <p className="mt-3 text-sm text-neutral-600">{message}</p>}
                            </div>
                        </form>
                    </SectionCard>
                )}

                <div className={`${archiveMode ? "" : "mt-5"} mb-4 flex w-fit rounded-xl border border-neutral-200 bg-white p-1`}>
                    <TabButton active={!archiveMode} onClick={() => setArchiveMode(false)}>Active</TabButton>
                    <TabButton active={archiveMode} onClick={() => setArchiveMode(true)}>Archive</TabButton>
                </div>

                <SectionCard title={archiveMode ? "Archived referral sources" : "External referral sources"} description={`${sources.length} source${sources.length === 1 ? "" : "s"}`}>
                    {sources.length === 0 ? (
                        <EmptyState title={archiveMode ? "No archived referral sources" : "No external referral sources yet"} />
                    ) : (
                        <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
                            {sources.map((source) => (
                                <div key={source.id} className="rounded-2xl border border-neutral-200/70 bg-[#FCFBF9] p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-neutral-900">{source.name}</p>
                                            <p className="mt-0.5 text-xs capitalize text-neutral-400">{source.source_type}</p>
                                        </div>
                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${source.active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>{source.active ? "Active" : "Archived"}</span>
                                    </div>

                                    <div className="mt-4 break-all rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-600">
                                        {window.location.origin}/r/{source.code}
                                    </div>

                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        <Metric label="Clicks" value={source.metrics.clicks} />
                                        <Metric label="Visitors" value={source.metrics.unique_visitors} />
                                        <Metric label="Leads" value={source.metrics.leads} />
                                    </div>

                                    <label className="mt-4 block">
                                        <span className="ui-label">Managed by</span>
                                        <select disabled={archiveMode} value={source.managed_by?.id || ""} onChange={(e) => update(source.id, { managed_by_id: e.target.value || null })} className="ui-input py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-400">
                                            <option value="">Unassigned</option>
                                            {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                                        </select>
                                    </label>

                                    <div className="mt-4 flex gap-2">
                                        {archiveMode ? (
                                            <button type="button" onClick={() => update(source.id, { active: true })} className="btn-secondary px-3 py-2 text-xs">Restore link</button>
                                        ) : (
                                            <button type="button" onClick={() => archiveSource(source)} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Archive link</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </DashboardLayout>
    );
}

function TabButton({ active, onClick, children }) {
    return <button type="button" onClick={onClick} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${active ? "bg-neutral-950 !text-white" : "text-neutral-500 hover:text-neutral-950"}`}>{children}</button>;
}

function Field({ label, children }) {
    return <label><span className="ui-label">{label}</span>{children}</label>;
}

function Metric({ label, value }) {
    return <div className="rounded-xl border border-neutral-200/70 bg-white px-3 py-3"><p className="text-lg font-semibold text-neutral-950">{value}</p><p className="mt-0.5 text-[11px] text-neutral-400">{label}</p></div>;
}

export default ReferralSourcesPage;
