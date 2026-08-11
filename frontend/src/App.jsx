import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard/Dashboard";
import Members from "./pages/Members/Members";
import Attendance from "./pages/Attendance/Attendance";
import Learning from "./pages/Learning/Learning";
import Projects from "./pages/Projects/Projects";
import Research from "./pages/Research/Research";
import Rankings from "./pages/Rankings/Rankings";
import Analytics from "./pages/Analytics/Analytics";
import Reports from "./pages/Reports/Reports";

import DashboardLayout from "./components/layout/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>

          <Route path="/" element={<Dashboard />} />

          <Route path="/members" element={<Members />} />

          <Route path="/attendance" element={<Attendance />} />

          <Route path="/learning" element={<Learning />} />

          <Route path="/projects" element={<Projects />} />

          <Route path="/research" element={<Research />} />

          <Route path="/rankings" element={<Rankings />} />

          <Route path="/analytics" element={<Analytics />} />

          <Route path="/reports" element={<Reports />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;