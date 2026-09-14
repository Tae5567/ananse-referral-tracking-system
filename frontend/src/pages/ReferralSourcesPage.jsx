import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

const emptyForm = { name: "", code: "", source_type: "influencer", managed_by_id: "" };

function ReferralSourcesPage() {
    const [sources, setSources] = useState([]);
    const [staff, setStaff] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState("");

    const load = async () => {
        const [sourceResponse, staffResponse] = await Promise.all([
            api.get("/api/referrals/manage/"),
            api.get("/api/accounts/staff/options/"),
        ]);
        setSources(sourceResponse.data.referrals || []);
        setStaff(staffResponse.data.staff || []);
    };

    useEffect(() => { load().catch(console.error); }, []);

    const create = async (e) => {
        e.preventDefault(); setMessage("");
        try {
            const csrf = await api.get("/api/csrf/");
            await api.post("/api/referrals/manage/", { ...form, managed_by_id: form.managed_by_id || null }, { headers: { "X-CSRFToken": csrf.data.csrfToken } });
            setForm(emptyForm); setMessage("External referral link created."); await load();
        } catch (err) { setMessage(err.response?.data?.error || "Unable to create referral source."); }
    };

    const update = async (id, changes) => {
        try {
            const csrf = await api.get("/api/csrf/");
            await api.patch(`/api/referrals/manage/${id}/`, changes, { headers: { "X-CSRFToken": csrf.data.csrfToken } });
            await load();
        } catch (err) { alert(err.response?.data?.error || "Unable to update referral source."); }
    };

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8"><p className="text-sm uppercase tracking-widest text-[#B68D40]">Management</p><h1 className="mt-2 text-3xl font-semibold">Influencers & partners</h1><p className="mt-2 text-gray-500">Create external links to the same Ananse landing page. Only clicks, visitors and leads are used for their performance view.</p></div>

                <form onSubmit={create} className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">Create external referral</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <label className="text-sm">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border px-3 py-3" /></label>
                        <label className="text-sm">Referral code<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })} placeholder="e.g. amaka" className="mt-2 w-full rounded-xl border px-3 py-3" /></label>
                        <label className="text-sm">Type<select value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })} className="mt-2 w-full rounded-xl border px-3 py-3"><option value="influencer">Influencer</option><option value="partner">Partner</option></select></label>
                        <label className="text-sm">Managed by<select value={form.managed_by_id} onChange={(e) => setForm({ ...form, managed_by_id: e.target.value })} className="mt-2 w-full rounded-xl border px-3 py-3"><option value="">Unassigned</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
                    </div>
                    <button className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white">Create referral link</button>
                    {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
                </form>

                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                    {sources.map((source) => (
                        <div key={source.id} className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{source.name}</h2><p className="mt-1 text-sm capitalize text-gray-500">{source.source_type}</p></div><button onClick={() => update(source.id, { active: !source.active })} className={`rounded-full px-3 py-1 text-xs ${source.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{source.active ? "Active" : "Inactive"}</button></div>
                            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm">{window.location.origin}/r/{source.code}</div>
                            <div className="mt-4 grid grid-cols-3 gap-3 text-center"><Metric label="Clicks" value={source.metrics.clicks} /><Metric label="Visitors" value={source.metrics.unique_visitors} /><Metric label="Leads" value={source.metrics.leads} /></div>
                            <label className="mt-4 block text-sm">Managed by<select value={source.managed_by?.id || ""} onChange={(e) => update(source.id, { managed_by_id: e.target.value || null })} className="mt-2 w-full rounded-xl border px-3 py-2"><option value="">Unassigned</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

function Metric({ label, value }) { return <div className="rounded-lg border p-3"><p className="text-xl font-semibold">{value}</p><p className="text-xs text-gray-500">{label}</p></div>; }

export default ReferralSourcesPage;
