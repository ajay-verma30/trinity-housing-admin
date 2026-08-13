import "./App.css";

import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";

import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import Builders from "./Pages/Builders";
import Properties from "./Pages/Properties";
import PropertyDetail from "./Pages/PropertyDetail";
import Inquiries from "./Pages/Inquiries";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Public Route */}
          <Route
            path="/"
            element={<Login />}
          />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
            <Route
              path="/builders"
              element={<Builders />}
            />
            <Route
              path="/properties"
              element={<Properties />}
            />
            <Route
              path="/properties/:id"
              element={<PropertyDetail />}
            />
            <Route
              path="/inquiries"
              element={<Inquiries />}
            />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;