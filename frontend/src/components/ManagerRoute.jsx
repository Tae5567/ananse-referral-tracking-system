import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../services/api";

function ManagerRoute({ children }) {
    const [state, setState] = useState({ loading: true, allowed: false });

    useEffect(() => {
        let active = true;
        const check = async () => {
            try {
                const response = await api.get("/api/auth/me/");
                if (active) {
                    setState({
                        loading: false,
                        allowed: Boolean(response.data?.user?.is_manager),
                    });
                }
            } catch {
                if (active) setState({ loading: false, allowed: false });
            }
        };
        check();
        return () => { active = false; };
    }, []);

    if (state.loading) {
        return <div className="min-h-screen flex items-center justify-center">Checking access...</div>;
    }

    if (!state.allowed) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default ManagerRoute;
