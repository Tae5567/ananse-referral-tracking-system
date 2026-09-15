import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import PageHeader from "../components/dashboard/PageHeader";
import SectionCard from "../components/dashboard/SectionCard";
import EmptyState from "../components/dashboard/EmptyState";

const emptyForm = {
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "sales_rep",
    password: "",
    referral_code: "",
};

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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const createStaff = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        try {
            const csrf = await api.get("/api/csrf/");
            await api.post("/api/accounts/staff/", form, {
                headers: { "X-CSRFToken": csrf.data.csrfToken },
            });
            setForm(emptyForm);
            setMessage("Staff account and referral link created.");
            await load();
        } catch (err) {
            setMessage(err.response?.data?.error || "Unable to create staff account.");
        } finally {
            setSaving(false);
        }
    };

    const updateStaff = async (id, changes) => {
        try {
            const csrf = await api.get("/api/csrf/");
            await api.patch(`/api/accounts/staff/${id}/`, changes, {
                headers: { "X-CSRFToken": csrf.data.csrfToken },
            });
            await load();
        } catch (err) {
            alert(err.response?.data?.error || "Unable to update staff member.");
        }
    };

    return (
        <DashboardLayout>
            <div className="app-page">
                <PageHeader
                    eyebrow="Management"
                    title="Staff & sales reps"
                    description="Create internal accounts, manage roles and give each staff member their own referral link."
                />

                <SectionCard title="Add staff member" description="Managers can create both sales rep and manager accounts.">
                    <form onSubmit={createStaff} className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
                        <Input label="Username" value={form.username} onChange={(value) => setForm({ ...form, username: value })} required />
                        <Input label="First name" value={form.first_name} onChange={(value) => setForm({ ...form, first_name: value })} />
                        <Input label="Last name" value={form.last_name} onChange={(value) => setForm({ ...form, last_name: value })} />
                        <Input label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
                        <Field label="Role">
                            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="ui-input">
                                <option value="sales_rep">Sales Rep</option>
                                <option value="manager">Manager / Admin</option>
                            </select>
                        </Field>
                        <Input label="Temporary password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
                        <Input label="Referral code" placeholder="e.g. onome" value={form.referral_code} onChange={(value) => setForm({ ...form, referral_code: value.toLowerCase() })} />
                        <div className="flex items-end">
                            <button disabled={saving} className="btn-primary w-full">{saving ? "Creating..." : "Create account"}</button>
                        </div>
                        {message && <p className="text-sm text-neutral-600 sm:col-span-2 xl:col-span-4">{message}</p>}
                    </form>
                </SectionCard>

                <SectionCard className="mt-5" title="Current staff" description={`${staff.length} internal account${staff.length === 1 ? "" : "s"}`}>
                    {loading ? (
                        <div className="px-5 py-8 text-sm text-neutral-500">Loading staff...</div>
                    ) : staff.length === 0 ? (
                        <EmptyState title="No staff accounts yet" />
                    ) : (
                        <div className="scrollbar-thin overflow-x-auto">
                            <table className="min-w-[720px] w-full border-collapse text-sm">
                                <thead className="bg-[#FBFAF8] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-neutral-400">
                                    <tr>
                                        <th className="px-5 py-3">Staff</th>
                                        <th className="px-5 py-3">Role</th>
                                        <th className="px-5 py-3">Referral</th>
                                        <th className="px-5 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.map((person) => (
                                        <tr key={person.id} className="border-t border-neutral-100 hover:bg-[#FCFBF9]">
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-neutral-900">{person.name}</p>
                                                <p className="mt-0.5 text-xs text-neutral-400">@{person.username}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <select value={person.role} onChange={(event) => updateStaff(person.id, { role: event.target.value })} className="ui-input max-w-[180px] py-2 text-sm">
                                                    <option value="sales_rep">Sales Rep</option>
                                                    <option value="manager">Manager / Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-5 py-4 text-neutral-600">{person.referral ? `/r/${person.referral.code}` : "—"}</td>
                                            <td className="px-5 py-4">
                                                <button onClick={() => updateStaff(person.id, { active: !person.active })} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${person.active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                                                    {person.active ? "Active" : "Inactive"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>
            </div>
        </DashboardLayout>
    );
}

function Field({ label, children }) {
    return <label><span className="ui-label">{label}</span>{children}</label>;
}

function Input({ label, value, onChange, type = "text", placeholder = "", required = false }) {
    return (
        <Field label={label}>
            <input type={type} value={value} required={required} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="ui-input" />
        </Field>
    );
}

export default StaffManagementPage;
