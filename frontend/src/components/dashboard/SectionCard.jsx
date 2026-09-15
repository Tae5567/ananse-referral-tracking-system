function SectionCard({ title, description, action, children, className = "" }) {
    return (
        <section className={`ui-card ${className}`}>
            {(title || description || action) && (
                <div className="flex flex-col gap-3 border-b border-neutral-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        {title && <h2 className="text-base font-semibold tracking-[-0.01em] text-neutral-950 sm:text-lg">{title}</h2>}
                        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
                    </div>
                    {action && <div className="shrink-0">{action}</div>}
                </div>
            )}
            {children}
        </section>
    );
}

export default SectionCard;
