import React, { useState, useEffect } from "react";
import { Table, Card, Badge, Form, Spinner, Alert } from "react-bootstrap";
import API from "../api/axios";

function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await API.get("/inquiries");
      setInquiries(Array.isArray(res.data) ? res.data : res.data?.inquiries || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await API.put(`/inquiries/${id}`, { status: newStatus });
      fetchInquiries();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Customer Inquiries</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-4">
        <Card.Body>
          <Table hover responsive className="align-middle mb-0">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Message</th>
                <th>Current Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.length > 0 ? (
                inquiries.map((inq) => (
                  <tr key={inq.id || inq._id}>
                    <td><div className="fw-semibold">{inq.name}</div></td>
                    <td>
                      <div>{inq.email || "No Email"}</div>
                      <small className="text-muted">{inq.phone || "No Phone"}</small>
                    </td>
                    <td><small>{inq.message || "No message provided"}</small></td>
                    <td>
                      <Badge bg={inq.status === "new" ? "primary" : inq.status === "contacted" ? "info" : "success"}>
                        {inq.status}
                      </Badge>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        style={{ width: "130px" }}
                        value={inq.status || "new"}
                        onChange={(e) => handleStatusChange(inq.id || inq._id, e.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="follow_up">Follow Up</option>
                        <option value="closed">Closed</option>
                      </Form.Select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center py-4">No inquiries logged</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Inquiries;