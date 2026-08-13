import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Badge, Spinner, Row, Col, Alert } from "react-bootstrap";
import API from "../api/axios";

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPropertyDetail = async () => {
      try {
        const res = await API.get(`/properties/${id}`);
        setProperty(res.data?.data || res.data);
      } catch (err) {
        setError("Failed to fetch property details");
      } finally {
        setLoading(false);
      }
    };
    fetchPropertyDetail();
  }, [id]);

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  if (error) return <div className="container mt-4"><Alert variant="danger">{error}</Alert></div>;
  if (!property) return <div className="container mt-4"><Alert variant="warning">Property not found</Alert></div>;

  return (
    <div className="container py-4">
      <Button variant="outline-secondary" className="mb-3" onClick={() => navigate(-1)}>
        ← Back
      </Button>
      <Card className="border-0 shadow rounded-4 p-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2 className="fw-bold">{property.title}</h2>
              <p className="text-muted">{property.bhk || "N/A"} Configuration</p>
            </div>
            <Badge bg="success" className="fs-6 p-2">{property.availability_status}</Badge>
          </div>
          <hr />
          <Row className="mt-3">
            <Col md={6}>
              <h5>Property Attributes</h5>
              <p><strong>Type:</strong> <span className="text-capitalize">{property.property_type}</span></p>
              <p><strong>Price:</strong> ₹{Number(property.price || 0).toLocaleString("en-IN")}</p>
              <p><strong>Project ID:</strong> {property.project_id || "N/A"}</p>
            </Col>
            <Col md={6}>
              <h5>Description / Details</h5>
              <p>{property.description || "No specific detailed description provided for this listing."}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
}

export default PropertyDetail;