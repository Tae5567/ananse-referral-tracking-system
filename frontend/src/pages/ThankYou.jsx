import { Link } from "react-router-dom";

function ThankYou() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F7F4EE] px-5">
            <div className="ui-card w-full max-w-lg p-8 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-lg text-emerald-700">✓</div>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950">Thank you</h1>
                <p className="mt-2 text-sm text-neutral-500">Your details have been received.</p>
                <Link to="/" className="btn-primary mt-6">Continue</Link>
            </div>
        </div>
    );
}

export default ThankYou;
