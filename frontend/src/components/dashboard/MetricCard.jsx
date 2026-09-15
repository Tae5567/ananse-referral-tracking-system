function MetricCard({ label, value, helper }) {
    return (
        <div className="ui-card min-h-[108px] px-4 py-4 sm:px-5">
            <p className="text-xs font-medium text-neutral-500">{label}</p>
            <p className="mt-2 text-[25px] font-semibold leading-none tracking-[-0.035em] text-neutral-950 sm:text-[28px]">
                {value}
            </p>
            {helper && <p className="mt-2 text-xs text-neutral-400">{helper}</p>}
        </div>
    );
}

export default MetricCard;
