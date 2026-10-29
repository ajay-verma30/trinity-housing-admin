import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Card, Spinner, Alert, Row, Col, Badge } from "react-bootstrap";
import API from "../api/axios";

const EMPTY_FORM = {
  builder_id: "",
  name: "",
  description: "",
  property_type: "",
  listing_type: "",
  address: "",
  locality: "",
  city: "",
  state: "",
  pincode: "",
  latitude: "",
  longitude: "",
  total_units: "",
  total_towers: "",
  possession_date: "",
  rera_number: "",
  status: ""
};

function Projects() {
  const [projects, setProjects] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await API.get("/projects");
      setProjects(Array.isArray(res.data) ? res.data : res.data?.projects || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchBuilders = async () => {
    try {
      const res = await API.get("/builders");
      setBuilders(Array.isArray(res.data) ? res.data : res.data?.builders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch builders");
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchBuilders();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (project = null) => {
    if (project) {
      setEditMode(true);
      setSelectedId(project.id || project._id);
      setFormData({
        builder_id: project.builder_id ?? "",
        name: project.name ?? "",
        description: project.description ?? "",
        property_type: project.property_type ?? "",
        listing_type: project.listing_type ?? "",
        address: project.address ?? "",
        locality: project.locality ?? "",
        city: project.city ?? "",
        state: project.state ?? "",
        pincode: project.pincode ?? "",
        latitude: project.latitude ?? "",
        longitude: project.longitude ?? "",
        total_units: project.total_units ?? "",
        total_towers: project.total_towers ?? "",
        possession_date: project.possession_date
          ? String(project.possession_date).slice(0, 10)
          : "",
        rera_number: project.rera_number ?? "",
        status: project.status ?? ""
      });
    } else {
      setEditMode(false);
      setSelectedId(null);
      setFormData(EMPTY_FORM);
    }
    setShowModal(true);
  };

  const buildPayload = () => {
    const payload = {};
    Object.keys(formData).forEach((key) => {
      payload[key] = formData[key] === "" ? null : formData[key];
    });
    return payload;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = buildPayload();
    try {
      if (editMode) {
        await API.put(`/projects/${selectedId}`, payload);
      } else {
        await API.post("/projects", payload);
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving project");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await API.delete(`/projects/${id}`);
        fetchProjects();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete project");
      }
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "N/A");

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Projects Directory</h2>
        <Button variant="primary" onClick={() => handleOpenModal()}>+ Add New Project</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body>
          <Table hover responsive className="align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Builder</th>
                <th>Type</th>
                <th>Listing</th>
                <th>Location</th>
                <th>Units / Towers</th>
                <th>Possession</th>
                <th>RERA</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length > 0 ? (
                projects.map((p) => (
                  <tr key={p.id || p._id}>
                    <td className="fw-semibold">{p.name}</td>
                    <td>{p.builder_name || "N/A"}</td>
                    <td>{p.property_type || "N/A"}</td>
                    <td>{p.listing_type || "N/A"}</td>
                    <td>
                      {[p.locality, p.city, p.state].filter(Boolean).join(", ") || "N/A"}
                      {p.pincode ? ` - ${p.pincode}` : ""}
                    </td>
                    <td>{p.total_units ?? "-"} / {p.total_towers ?? "-"}</td>
                    <td>{formatDate(p.possession_date)}</td>
                    <td>{p.rera_number || "N/A"}</td>
                    <td>{p.status ? <Badge bg="info">{p.status}</Badge> : "N/A"}</td>
                    <td className="text-nowrap">
                      <Button variant="outline-warning" size="sm" className="me-2" onClick={() => handleOpenModal(p)}>Edit</Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(p.id || p._id)}>Delete</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="10" className="text-center py-4">No projects found</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add / Edit Project Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? "Edit Project" : "Add New Project"}</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Builder *</Form.Label>
                  <Form.Select name="builder_id" required value={formData.builder_id} onChange={handleChange}>
                    <option value="">Select builder</option>
                    {builders.map((b) => (
                      <option key={b.id || b._id} value={b.id || b._id}>{b.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Project Name *</Form.Label>
                  <Form.Control type="text" name="name" required value={formData.name} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleChange} />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Property Type *</Form.Label>
                  <Form.Select name="property_type" required value={formData.property_type} onChange={handleChange}>
                    <option value="">Select property type</option>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="plot">Plot</option>
                    <option value="mixed_use">Mixed Use</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Listing Type *</Form.Label>
                  <Form.Select name="listing_type" required value={formData.listing_type} onChange={handleChange}>
                    <option value="">Select listing type</option>
                    <option value="sale">Sale</option>
                    <option value="rent">Rent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Address *</Form.Label>
              <Form.Control as="textarea" rows={2} name="address" required value={formData.address} onChange={handleChange} />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Locality</Form.Label>
                  <Form.Control type="text" name="locality" value={formData.locality} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City *</Form.Label>
                  <Form.Control type="text" name="city" required value={formData.city} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>State *</Form.Label>
                  <Form.Control type="text" name="state" required value={formData.state} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pincode *</Form.Label>
                  <Form.Control type="text" name="pincode" required value={formData.pincode} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Latitude</Form.Label>
                  <Form.Control type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Longitude</Form.Label>
                  <Form.Control type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Units</Form.Label>
                  <Form.Control type="number" min="0" name="total_units" value={formData.total_units} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Towers</Form.Label>
                  <Form.Control type="number" min="0" name="total_towers" value={formData.total_towers} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Possession Date</Form.Label>
                  <Form.Control type="date" name="possession_date" value={formData.possession_date} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>RERA Number</Form.Label>
                  <Form.Control type="text" name="rera_number" value={formData.rera_number} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            {editMode && (
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Control
                  type="text"
                  name="status"
                  placeholder="e.g. active, upcoming, completed"
                  value={formData.status}
                  onChange={handleChange}
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editMode ? "Update" : "Save"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Projects;