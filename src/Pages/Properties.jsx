import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Card, Badge, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Properties() {
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const initialFormState = {
    project_id: "",
    title: "",
    bhk: "",
    property_type: "apartment",
    price: "",
    carpet_area: "",
    builtup_area: "",
    bathrooms: "",
    balconies: "",
    floor_number: "",
    total_floors: "",
    furnishing: "unfurnished",
    facing: "",
    availability_status: "available",
    description: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch all properties & projects for foreign key dropdown mapping
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [propRes, projRes] = await Promise.all([
        API.get("/properties"),
        API.get("/projects")
      ]);

      const propsList = Array.isArray(propRes.data) ? propRes.data : propRes.data?.properties || [];
      const projsList = Array.isArray(projRes.data) ? projRes.data : projRes.data?.projects || [];

      setProperties(propsList);
      setProjects(projsList);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load property listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (prop = null) => {
    if (prop) {
      setEditMode(true);
      setSelectedId(prop.id);
      setFormData({
        project_id: prop.project_id || "",
        title: prop.title || "",
        bhk: prop.bhk || "",
        property_type: prop.property_type || "apartment",
        price: prop.price || "",
        carpet_area: prop.carpet_area || "",
        builtup_area: prop.builtup_area || "",
        bathrooms: prop.bathrooms || "",
        balconies: prop.balconies || "",
        floor_number: prop.floor_number || "",
        total_floors: prop.total_floors || "",
        furnishing: prop.furnishing || "unfurnished",
        facing: prop.facing || "",
        availability_status: prop.availability_status || "available",
        description: prop.description || ""
      });
    } else {
      setEditMode(false);
      setSelectedId(null);
      setFormData(initialFormState);
    }
    setShowModal(true);
  };

  // CREATE / UPDATE Mechanism
  // Fixed CREATE / UPDATE Mechanism in Properties.jsx
const handleSave = async (e) => {
  e.preventDefault();
  setActionLoading(true);

  // Helper to safely parse numbers or send null
  const parseNum = (val) => (val !== "" && val !== null && !isNaN(val) ? Number(val) : null);

  const payload = {
    ...formData,
    // Keep project_id as String because DB uses UUIDs
    project_id: formData.project_id || null, 
    price: parseNum(formData.price),
    carpet_area: parseNum(formData.carpet_area),
    builtup_area: parseNum(formData.builtup_area),
    bathrooms: parseNum(formData.bathrooms),
    balconies: parseNum(formData.balconies),
    floor_number: parseNum(formData.floor_number),
    total_floors: parseNum(formData.total_floors)
  };

  try {
    if (editMode) {
      await API.put(`/properties/${selectedId}`, payload, { withCredentials: true });
    } else {
      await API.post("/properties", payload, { withCredentials: true });
    }
    setShowModal(false);
    fetchData();
  } catch (err) {
    console.error("Save error details:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Error saving property information");
  } finally {
    setActionLoading(false);
  }
};

  // DELETE Mechanism
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this property listing?")) {
      try {
        // DELETE /api/properties/:id -> tokenValidation protected route
        await API.delete(`/properties/${id}`, { withCredentials: true });
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete property listing");
      }
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Property Listings</h2>
          <p className="text-muted mb-0">Manage and update active real estate properties</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>+ Add New Property</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body>
          <Table hover responsive className="align-middle mb-0">
            <thead>
              <tr>
                <th>Title</th>
                <th>Project</th>
                <th>BHK / Config</th>
                <th>Type</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.length > 0 ? (
                properties.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-semibold text-primary">{p.title}</td>
                    <td>{p.project_name || p.project_id || "N/A"}</td>
                    <td>{p.bhk || "N/A"}</td>
                    <td className="text-capitalize">{p.property_type}</td>
                    <td className="fw-bold text-success">₹{Number(p.price || 0).toLocaleString("en-IN")}</td>
                    <td>
                      <Badge bg={
                        p.availability_status === "available" ? "success" :
                        p.availability_status === "sold" ? "danger" :
                        p.availability_status === "reserved" ? "warning" : "secondary"
                      }>
                        {p.availability_status}
                      </Badge>
                    </td>
                    <td>
                      <Button variant="outline-info" size="sm" className="me-1" onClick={() => navigate(`/properties/${p.id}`)}>View</Button>
                      <Button variant="outline-warning" size="sm" className="me-1" onClick={() => handleOpenModal(p)}>Edit</Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(p.id)}>Delete</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">No properties found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Property Create / Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Edit Property Listing" : "Add New Property Listing"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Project *</Form.Label>
                  <Form.Select 
                    required 
                    value={formData.project_id} 
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  >
                    <option value="">Select Project</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name} ({proj.builder_name || "Builder ID: " + proj.builder_id})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Title *</Form.Label>
                  <Form.Control 
                    type="text" 
                    required 
                    placeholder="e.g. Luxury 3BHK Apartment in Bandra"
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  />
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>BHK Specification</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. 2 BHK, 3.5 BHK" 
                    value={formData.bhk} 
                    onChange={(e) => setFormData({ ...formData, bhk: e.target.value })} 
                  />
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Property Type *</Form.Label>
                  <Form.Select 
                    value={formData.property_type} 
                    onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  >
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="plot">Plot</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="commercial">Commercial</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Price (₹) *</Form.Label>
                  <Form.Control 
                    type="number" 
                    required 
                    placeholder="Total price"
                    value={formData.price} 
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                  />
                </Form.Group>
              </div>

              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Carpet Area (sqft)</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={formData.carpet_area} 
                    onChange={(e) => setFormData({ ...formData, carpet_area: e.target.value })} 
                  />
                </Form.Group>
              </div>

              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Builtup Area (sqft)</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={formData.builtup_area} 
                    onChange={(e) => setFormData({ ...formData, builtup_area: e.target.value })} 
                  />
                </Form.Group>
              </div>

              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Bathrooms</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={formData.bathrooms} 
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} 
                  />
                </Form.Group>
              </div>

              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Balconies</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={formData.balconies} 
                    onChange={(e) => setFormData({ ...formData, balconies: e.target.value })} 
                  />
                </Form.Group>
              </div>

              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Floor Number</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={formData.floor_number} 
                    onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })} 
                  />
                </Form.Group>
              </div>

              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Total Floors</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={formData.total_floors} 
                    onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })} 
                  />
                </Form.Group>
              </div>

              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Furnishing</Form.Label>
                  <Form.Select 
                    value={formData.furnishing} 
                    onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                  >
                    <option value="unfurnished">Unfurnished</option>
                    <option value="semi-furnished">Semi-Furnished</option>
                    <option value="fully-furnished">Fully Furnished</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Availability Status</Form.Label>
                  <Form.Select 
                    value={formData.availability_status} 
                    onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-12">
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    placeholder="Enter detailed property features..."
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  />
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? <Spinner size="sm" animation="border" /> : editMode ? "Update Property" : "Create Property"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Properties;