import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F7F4EE] px-5 text-center">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A27D39]">404</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">Page not found</h1>
                <p className="mt-2 text-sm text-neutral-500">The page you're looking for doesn't exist.</p>
                <Link to="/login" className="btn-primary mt-6">Go to sign in</Link>
            </div>
        </div>
    );
}

export default NotFound;
