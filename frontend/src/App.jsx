import {BrowserRouter, Routes, Route} from "react-router-dom";

import CamilleLanding from "./pages/CamilleLanding";
//import ThankYou from "./pages/ThankYou";

function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/r/:code"
          element={<CamilleLanding />}
        />

         <Route
          path="/r/:thank-you"
          element={<ThankYou />}
        />

      </Routes>

    </BrowserRouter>
  );

}

export default App;