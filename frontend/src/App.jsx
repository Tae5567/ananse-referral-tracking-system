import { BrowserRouter, Routes, Route } from "react-router-dom";

import ReferralLanding from "./pages/ReferralLanding";
import ServicesPage from "./pages/ServicesPage";
import InquiryPage from "./pages/InquiryPage";
import CustomSalePage from "./pages/CustomSalePage";
import DashboardPage from "./pages/DashboardPage";
import InquiriesPage from "./pages/InquiriesPage";
import LeadsPage from "./pages/LeadsPage";
import ManagementDashboardPage from "./pages/ManagementDashboardPage";
import StaffManagementPage from "./pages/StaffManagementPage";
import ReferralSourcesPage from "./pages/ReferralSourcesPage";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ManagerRoute from "./components/ManagerRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/r/:code" element={<ReferralLanding />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/inquiry" element={<InquiryPage />} />

                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/dashboard/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
                <Route path="/dashboard/inquiries" element={<ProtectedRoute><InquiriesPage /></ProtectedRoute>} />
                <Route path="/dashboard/custom-sales" element={<ProtectedRoute><CustomSalePage /></ProtectedRoute>} />

                <Route path="/management" element={<ProtectedRoute><ManagerRoute><ManagementDashboardPage /></ManagerRoute></ProtectedRoute>} />
                <Route path="/management/staff" element={<ProtectedRoute><ManagerRoute><StaffManagementPage /></ManagerRoute></ProtectedRoute>} />
                <Route path="/management/referrals" element={<ProtectedRoute><ManagerRoute><ReferralSourcesPage /></ManagerRoute></ProtectedRoute>} />

                <Route path="/thank-you" element={<ThankYou />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
