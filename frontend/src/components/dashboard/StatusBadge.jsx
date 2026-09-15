const styles = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    converted: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/10",
    new: "bg-sky-50 text-sky-700 ring-sky-600/10",
    contacted: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
    follow_up: "bg-amber-50 text-amber-700 ring-amber-600/10",
    quoted: "bg-violet-50 text-violet-700 ring-violet-600/10",
    not_paid: "bg-neutral-100 text-neutral-600 ring-neutral-600/10",
    failed: "bg-rose-50 text-rose-700 ring-rose-600/10",
    cancelled: "bg-neutral-100 text-neutral-600 ring-neutral-600/10",
    lost: "bg-rose-50 text-rose-700 ring-rose-600/10",
    refunded: "bg-orange-50 text-orange-700 ring-orange-600/10",
};

function StatusBadge({ value }) {
    const key = String(value || "").toLowerCase();
    const label = key ? key.replaceAll("_", " ") : "—";
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${styles[key] || "bg-neutral-100 text-neutral-600 ring-neutral-600/10"}`}>
            {label}
        </span>
    );
}

export default StatusBadge;
