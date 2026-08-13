import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Card, Spinner, Alert } from "react-bootstrap";
import API from "../api/axios";

function Builders() {
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });

  const fetchBuilders = async () => {
    setLoading(true);
    try {
      const res = await API.get("/builders");
      setBuilders(Array.isArray(res.data) ? res.data : res.data?.builders || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch builders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilders();
  }, []);

  const handleOpenModal = (builder = null) => {
    if (builder) {
      setEditMode(true);
      setSelectedId(builder.id || builder._id);
      setFormData({
        name: builder.name || "",
        email: builder.email || "",
        phone: builder.phone || "",
        address: builder.address || ""
      });
    } else {
      setEditMode(false);
      setSelectedId(null);
      setFormData({ name: "", email: "", phone: "", address: "" });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await API.put(`/builders/${selectedId}`, formData);
      } else {
        await API.post("/builders", formData);
      }
      setShowModal(false);
      fetchBuilders();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving builder");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this builder?")) {
      try {
        await API.delete(`/builders/${id}`);
        fetchBuilders();
      } catch (err) {
        alert("Failed to delete builder");
      }
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Builders Directory</h2>
        <Button variant="primary" onClick={() => handleOpenModal()}>+ Add New Builder</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body>
          <Table hover responsive className="align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {builders.length > 0 ? (
                builders.map((b) => (
                  <tr key={b.id || b._id}>
                    <td className="fw-semibold">{b.name}</td>
                    <td>{b.email || "N/A"}</td>
                    <td>{b.phone || "N/A"}</td>
                    <td>{b.address || "N/A"}</td>
                    <td>
                      <Button variant="outline-warning" size="sm" className="me-2" onClick={() => handleOpenModal(b)}>Edit</Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(b.id || b._id)}>Delete</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center py-4">No builders found</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add / Edit Builder Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Edit Builder" : "Add New Builder"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Builder Name</Form.Label>
              <Form.Control type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control as="textarea" rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </Form.Group>
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

export default Builders;