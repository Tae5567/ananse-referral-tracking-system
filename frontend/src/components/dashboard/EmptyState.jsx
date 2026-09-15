function EmptyState({ title = "Nothing here yet", description }) {
    return (
        <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-neutral-700">{title}</p>
            {description && <p className="mx-auto mt-1 max-w-lg text-sm text-neutral-400">{description}</p>}
        </div>
    );
}

export default EmptyState;
