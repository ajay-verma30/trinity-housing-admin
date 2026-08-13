import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Added useNavigate
import {
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Alert
} from "react-bootstrap";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";

import { Bar, Doughnut } from "react-chartjs-2";
import API from "../api/axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Dashboard() {
  const navigate = useNavigate(); // Navigation hook initialized

  // --------------------------------
  // State
  // --------------------------------
  const [stats, setStats] = useState({
    properties: 0,
    projects: 0,
    builders: 0,
    inquiries: 0
  });

  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------
  // Fetch Dashboard Data
  // --------------------------------
  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        propertiesResponse,
        projectsResponse,
        buildersResponse,
        inquiriesResponse
      ] = await Promise.all([
        API.get("/properties"),
        API.get("/projects"),
        API.get("/builders"),
        API.get("/inquiries")
      ]);

      const propertiesData = Array.isArray(propertiesResponse.data)
        ? propertiesResponse.data
        : propertiesResponse.data?.properties || [];

      const projectsData = Array.isArray(projectsResponse.data)
        ? projectsResponse.data
        : projectsResponse.data?.projects || [];

      const buildersData = Array.isArray(buildersResponse.data)
        ? buildersResponse.data
        : buildersResponse.data?.builders || [];

      const inquiriesData = Array.isArray(inquiriesResponse.data)
        ? inquiriesResponse.data
        : inquiriesResponse.data?.inquiries || [];

      setProperties(propertiesData);
      setProjects(projectsData);
      setBuilders(buildersData);
      setInquiries(inquiriesData);

      setStats({
        properties: propertiesData.length,
        projects: projectsData.length,
        builders: buildersData.length,
        inquiries: inquiriesData.length
      });
    } catch (err) {
      console.error("Dashboard API error:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --------------------------------
  // Property & Inquiry Calculations
  // --------------------------------
  const propertyStatus = {
    available: properties.filter(p => p.availability_status === "available").length,
    reserved: properties.filter(p => p.availability_status === "reserved").length,
    sold: properties.filter(p => p.availability_status === "sold").length,
    rented: properties.filter(p => p.availability_status === "rented").length,
    inactive: properties.filter(p => p.availability_status === "inactive").length
  };

  const inquiryStatus = {
    new: inquiries.filter(i => i.status === "new").length,
    contacted: inquiries.filter(i => i.status === "contacted").length,
    follow_up: inquiries.filter(i => i.status === "follow_up").length,
    closed: inquiries.filter(i => i.status === "closed").length
  };

  // --------------------------------
  // Charts Setup
  // --------------------------------
  const propertyChartData = {
    labels: ["Available", "Reserved", "Sold", "Rented", "Inactive"],
    datasets: [
      {
        label: "Properties",
        data: [
          propertyStatus.available,
          propertyStatus.reserved,
          propertyStatus.sold,
          propertyStatus.rented,
          propertyStatus.inactive
        ],
        backgroundColor: ["#198754", "#ffc107", "#dc3545", "#0d6efd", "#6c757d"],
        borderRadius: 6
      }
    ]
  };

  const inquiryChartData = {
    labels: ["New", "Contacted", "Follow Up", "Closed"],
    datasets: [
      {
        data: [
          inquiryStatus.new,
          inquiryStatus.contacted,
          inquiryStatus.follow_up,
          inquiryStatus.closed
        ],
        backgroundColor: ["#0d6efd", "#0dcaf0", "#ffc107", "#198754"]
      }
    ]
  };

  // --------------------------------
  // Recent Data
  // --------------------------------
  const recentProperties = [...properties]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const recentInquiries = [...inquiries]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Dashboard</h2>
          <p className="text-muted mb-0">Trinity Housing overview</p>
        </div>
        <Button variant="outline-primary" size="sm" onClick={fetchDashboardData}>
          🔄 Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* --------------------------------
          Statistics Cards (With Click Nav)
      -------------------------------- */}
      <Row className="g-3 mb-4">
        {/* Properties Card */}
        <Col xs={12} sm={6} lg={3}>
          <Card 
            className="border-0 shadow-sm rounded-4 h-100 cursor-pointer" 
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/properties")}
          >
            <Card.Body>
              <div className="text-muted small">PROPERTIES</div>
              <h2 className="fw-bold mt-2 mb-1">{stats.properties}</h2>
              <small className="text-success">{propertyStatus.available} available</small>
            </Card.Body>
          </Card>
        </Col>

        {/* Projects Card */}
        <Col xs={12} sm={6} lg={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body>
              <div className="text-muted small">PROJECTS</div>
              <h2 className="fw-bold mt-2 mb-1">{stats.projects}</h2>
              <small className="text-muted">Real estate projects</small>
            </Card.Body>
          </Card>
        </Col>

        {/* Builders Card */}
        <Col xs={12} sm={6} lg={3}>
          <Card 
            className="border-0 shadow-sm rounded-4 h-100" 
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/builders")}
          >
            <Card.Body>
              <div className="text-muted small">BUILDERS</div>
              <h2 className="fw-bold mt-2 mb-1">{stats.builders}</h2>
              <small className="text-muted">Registered builders</small>
            </Card.Body>
          </Card>
        </Col>

        {/* Inquiries Card */}
        <Col xs={12} sm={6} lg={3}>
          <Card 
            className="border-0 shadow-sm rounded-4 h-100" 
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/inquiries")}
          >
            <Card.Body>
              <div className="text-muted small">INQUIRIES</div>
              <h2 className="fw-bold mt-2 mb-1">{stats.inquiries}</h2>
              <small className="text-warning">{inquiryStatus.new} new inquiries</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="g-4 mb-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body>
              <h5 className="fw-bold mb-1">Property Inventory</h5>
              <p className="text-muted small">Current property availability</p>
              <div style={{ height: "300px" }}>
                <Bar
                  data={propertyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body>
              <h5 className="fw-bold mb-1">Inquiry Status</h5>
              <p className="text-muted small">Current customer inquiries</p>
              <div style={{ height: "260px" }} className="d-flex justify-content-center">
                <Doughnut
                  data={inquiryChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom" } }
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --------------------------------
          Tables (With Navigation Buttons)
      -------------------------------- */}
      <Row className="g-4">
        {/* Recent Properties Table */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-1">Recent Properties</h5>
                  <small className="text-muted">Latest property listings</small>
                </div>
                <Button variant="link" size="sm" onClick={() => navigate("/properties")}>
                  View All →
                </Button>
              </div>

              <Table hover responsive className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Project</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProperties.length > 0 ? (
                    recentProperties.map(property => (
                      <tr 
                        key={property.id || property._id} 
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/properties/${property.id || property._id}`)}
                      >
                        <td>
                          <div className="fw-semibold text-primary">{property.title}</div>
                          <small className="text-muted">{property.bhk || "N/A"}</small>
                        </td>
                        <td>{property.project_name || "N/A"}</td>
                        <td><span className="text-capitalize">{property.property_type}</span></td>
                        <td className="fw-semibold">₹{Number(property.price).toLocaleString("en-IN")}</td>
                        <td>
                          <Badge bg={property.availability_status === "available" ? "success" : property.availability_status === "sold" ? "danger" : "secondary"}>
                            {property.availability_status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">No properties found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Inquiries Table */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h5 className="fw-bold mb-0">Recent Inquiries</h5>
                <Button variant="link" size="sm" onClick={() => navigate("/inquiries")}>
                  View All →
                </Button>
              </div>
              <small className="text-muted">Latest customer interest</small>

              <Table hover responsive className="align-middle mt-3 mb-0">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Contact</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInquiries.length > 0 ? (
                    recentInquiries.map(inquiry => (
                      <tr 
                        key={inquiry.id || inquiry._id} 
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate("/inquiries")}
                      >
                        <td>
                          <div className="fw-semibold">{inquiry.name}</div>
                          <small className="text-muted">{inquiry.email || "No email"}</small>
                        </td>
                        <td><small>{inquiry.phone || "N/A"}</small></td>
                        <td>
                          <Badge bg={inquiry.status === "new" ? "primary" : inquiry.status === "contacted" ? "info" : inquiry.status === "follow_up" ? "warning" : "success"}>
                            {inquiry.status?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">No inquiries found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;