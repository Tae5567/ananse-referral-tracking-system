import { BrowserRouter, Routes, Route } from "react-router-dom";

import ReferralLanding from "./pages/ReferralLanding";
import ServicesPage from "./pages/ServicesPage";
import InquiryPage from "./pages/InquiryPage";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/r/:code" element={<ReferralLanding />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/inquiry" element={<InquiryPage />} />
                <Route path="/thank-you" element={<ThankYou />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;