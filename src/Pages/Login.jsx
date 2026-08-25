import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  const [loading, setLoading] = useState(false);

  // --------------------------------
  // UI Validation Only
  // --------------------------------

  const validateForm = () => {
    const errors = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // --------------------------------
  // Handle Login
  // --------------------------------

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    // Only UI validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Authentication handled by AuthContext
      const result = await login(email, password);

      if (!result.success) {
        setErrorMessage(result.message);

        return;
      }

      // Login successful
      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container mt-4"
      style={{
        maxWidth: "400px",
      }}
    >
      <h3 className="text-center mb-4">Trinity Housing</h3>

      <Form
        onSubmit={handleLogin}
        style={{
          padding: "10%",
          border: "1px solid black",
          borderRadius: "10px",
        }}
      >
        {errorMessage && (
          <Alert
            variant="danger"
            onClose={() => setErrorMessage("")}
            dismissible
          >
            {errorMessage}
          </Alert>
        )}

        {/* Email */}

        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Email</Form.Label>

          <Form.Control
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            isInvalid={!!fieldErrors.email}
          />

          <Form.Control.Feedback type="invalid">
            {fieldErrors.email}
          </Form.Control.Feedback>
        </Form.Group>

        {/* Password */}

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>

          <Form.Control
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            isInvalid={!!fieldErrors.password}
          />

          <Form.Control.Feedback type="invalid">
            {fieldErrors.password}
          </Form.Control.Feedback>
        </Form.Group>

        <hr />

        <Button
          variant="success"
          className="w-100"
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </Form>
    </div>
  );
}

export default Login;
