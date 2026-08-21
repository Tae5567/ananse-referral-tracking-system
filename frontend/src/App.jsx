import { BrowserRouter, Routes, Route } from "react-router-dom";

import ReferralLanding from "./pages/ReferralLanding";
import ServicesPage from "./pages/ServicesPage";
import InquiryPage from "./pages/InquiryPage";
import CustomSalePage from "./pages/CustomSalePage";
import DashboardPage from "./pages/DashboardPage";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/r/:code" element={<ReferralLanding />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/inquiry" element={<InquiryPage />} />
                <Route path="/custom-sale" element={<CustomSalePage />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /> </ProtectedRoute>} />
                <Route path="/thank-you" element={<ThankYou />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<NotFound />} />
                
            </Routes>
        </BrowserRouter>
    );
}

export default App;