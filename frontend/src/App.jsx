import "./App.css";
import Navbar from "./components/Navbar";
import ClubsPage from "./pages/ClubsPages";
import Holidays from "./pages/Holidays";
import Placements from "./pages/Placements";
import Papers from "./pages/Papers";

import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/holidays" element={<Holidays />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/placements" element={<Placements />} />
        <Route path="/papers" element={<Papers />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
