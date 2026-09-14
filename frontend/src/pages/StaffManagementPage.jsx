import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";

const emptyForm = { username: "", first_name: "", last_name: "", email: "", role: "sales_rep", password: "", referral_code: "" };

function StaffManagementPage() {
    const [staff, setStaff] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const load = async () => {
        try {
            const response = await api.get("/api/accounts/staff/");
            setStaff(response.data.staff || []);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const createStaff = async (e) => {
        e.preventDefault(); setSaving(true); setMessage("");
        try {
            const csrf = await api.get("/api/csrf/");
            await api.post("/api/accounts/staff/", form, { headers: { "X-CSRFToken": csrf.data.csrfToken } });
            setForm(emptyForm); setMessage("Staff account and referral link created."); await load();
        } catch (err) {
            setMessage(err.response?.data?.error || "Unable to create staff account.");
        } finally { setSaving(false); }
    };

    const updateStaff = async (id, changes) => {
        try {
            const csrf = await api.get("/api/csrf/");
            await api.patch(`/api/accounts/staff/${id}/`, changes, { headers: { "X-CSRFToken": csrf.data.csrfToken } });
            await load();
        } catch (err) { alert(err.response?.data?.error || "Unable to update staff member."); }
    };

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8"><p className="text-sm uppercase tracking-widest text-[#B68D40]">Management</p><h1 className="mt-2 text-3xl font-semibold">Staff & sales reps</h1><p className="mt-2 text-gray-500">Create internal accounts and automatically give each person their own referral link.</p></div>

                <form onSubmit={createStaff} className="rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">Add staff member</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Input label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} required />
                        <Input label="First name" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
                        <Input label="Last name" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
                        <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                        <label className="text-sm">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-2 w-full rounded-xl border px-3 py-3"><option value="sales_rep">Sales Rep</option><option value="manager">Manager / Admin</option></select></label>
                        <Input label="Temporary password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
                        <Input label="Referral code" placeholder="e.g. onome" value={form.referral_code} onChange={(v) => setForm({ ...form, referral_code: v })} />
                    </div>
                    <button disabled={saving} className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{saving ? "Creating..." : "Create staff account"}</button>
                    {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
                </form>

                <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold">Current staff</h2>
                    {loading ? <p className="mt-4 text-gray-500">Loading...</p> : <div className="mt-4 overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-left text-gray-500"><tr className="border-b"><th className="py-3 pr-4">Name</th><th className="py-3 pr-4">Role</th><th className="py-3 pr-4">Referral</th><th className="py-3">Status</th></tr></thead><tbody>{staff.map((person) => <tr key={person.id} className="border-b last:border-0"><td className="py-4 pr-4"><p className="font-medium">{person.name}</p><p className="text-xs text-gray-500">@{person.username}</p></td><td className="py-4 pr-4"><select value={person.role} onChange={(e) => updateStaff(person.id, { role: e.target.value })} className="rounded-lg border px-3 py-2"><option value="sales_rep">Sales Rep</option><option value="manager">Manager / Admin</option></select></td><td className="py-4 pr-4">{person.referral ? `/r/${person.referral.code}` : "—"}</td><td className="py-4"><button onClick={() => updateStaff(person.id, { active: !person.active })} className={`rounded-full px-3 py-1 text-xs ${person.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{person.active ? "Active" : "Inactive"}</button></td></tr>)}</tbody></table></div>}
                </section>
            </div>
        </DashboardLayout>
    );
}

function Input({ label, value, onChange, type = "text", placeholder = "", required = false }) {
    return <label className="text-sm">{label}<input type={type} value={value} required={required} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-3" /></label>;
}

export default StaffManagementPage;
