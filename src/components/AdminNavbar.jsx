import React from "react";
import { Navbar, Nav, Container, NavDropdown, Badge } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../api/axios";

function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await API.post("/admin/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      // Clear session data & redirect to login page
      localStorage.removeItem("adminToken");
      navigate("/");
    }
  };

  // Helper function to mark active route
  const isActive = (path) => location.pathname === path;

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-sm py-2">
      <Container fluid className="px-4">
        {/* Brand Logo / Title */}
        <Navbar.Brand as={Link} to="/dashboard" className="fw-bold fs-4 text-primary">
          Trinity<span className="text-white">Housing</span>
          <Badge bg="primary" className="ms-2 fs-6 fw-normal">Admin</Badge>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="admin-navbar-nav" />

        <Navbar.Collapse id="admin-navbar-nav">
          {/* Main Navigation Links */}
          <Nav className="me-auto ms-3 gap-2">
            <Nav.Link 
              as={Link} 
              to="/dashboard" 
              className={isActive("/dashboard") ? "fw-bold text-primary" : ""}
            >
              📊 Dashboard
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/properties" 
              className={isActive("/properties") || location.pathname.startsWith("/properties/") ? "fw-bold text-primary" : ""}
            >
              🏢 Properties
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/builders" 
              className={isActive("/builders") ? "fw-bold text-primary" : ""}
            >
              🏗️ Builders
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/inquiries" 
              className={isActive("/inquiries") ? "fw-bold text-primary" : ""}
            >
              📩 Inquiries
            </Nav.Link>
          </Nav>

          {/* Right Profile / Action Menu */}
          <Nav className="align-items-center">
            <NavDropdown
              title={
                <span className="text-white">
                  👤 <span className="fw-semibold">Admin Panel</span>
                </span>
              }
              id="admin-profile-dropdown"
              align="end"
            >
              <NavDropdown.Header>Signed in as Administrator</NavDropdown.Header>
              <NavDropdown.Item as={Link} to="/dashboard">
                Dashboard Overview
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout} className="text-danger fw-semibold">
                🚪 Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AdminNavbar;