function Pagination({ pagination, onPageChange }) {
    if (!pagination || pagination.total_pages <= 1) return null;

    return (
        <div className="flex flex-col gap-3 border-t border-neutral-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-neutral-400">
                Page {pagination.page} of {pagination.total_pages} · {pagination.total} records
            </p>
            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={!pagination.has_previous}
                    onClick={() => onPageChange(pagination.page - 1)}
                    className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
                >
                    Previous
                </button>
                <button
                    type="button"
                    disabled={!pagination.has_next}
                    onClick={() => onPageChange(pagination.page + 1)}
                    className="btn-secondary px-3 py-2 text-xs disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default Pagination;