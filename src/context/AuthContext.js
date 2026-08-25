import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from "react";

import API from "../api/axios";

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = "accessToken";
const ADMIN_KEY = "admin";

// --------------------------------
// Decode JWT
// --------------------------------

const decodeToken = (token) => {
  try {
    if (!token) {
      return null;
    }

    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    return JSON.parse(
      atob(
        payload
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

// --------------------------------
// Auth Provider
// --------------------------------

export const AuthProvider = ({ children }) => {

  // --------------------------------
  // State
  // --------------------------------

  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem(ACCESS_TOKEN_KEY)
  );

  const [admin, setAdmin] = useState(() => {
    const storedAdmin = localStorage.getItem(ADMIN_KEY);

    if (!storedAdmin) {
      return null;
    }

    try {
      return JSON.parse(storedAdmin);
    } catch (error) {
      console.error("Failed to parse stored admin:", error);
      localStorage.removeItem(ADMIN_KEY);
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Prevent multiple refresh requests at the same time
  const refreshPromiseRef = useRef(null);

  // --------------------------------
  // Login
  // --------------------------------

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await API.post("/admin/login", {
        email,
        password
      });

      if (!data?.accessToken) {
        throw new Error("Invalid authentication response");
      }

      // Store access token
      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        data.accessToken
      );

      // Store admin information
      if (data.admin) {
        localStorage.setItem(
          ADMIN_KEY,
          JSON.stringify(data.admin)
        );

        setAdmin(data.admin);
      }

      setAccessToken(data.accessToken);

      return {
        success: true,
        admin: data.admin
      };

    } catch (error) {
      console.error("Login error:", error);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to login"
      };
    }
  }, []);

  // --------------------------------
  // Logout
  // --------------------------------

  const logout = useCallback(() => {

    // Clear client-side authentication state
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);

    setAccessToken(null);
    setAdmin(null);

  }, []);

  // --------------------------------
  // Refresh Access Token
  // --------------------------------

  const refreshAccessToken = useCallback(async () => {

    // If refresh already running, reuse it
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const doRefresh = async () => {
      try {

        const { data } = await API.post(
          "/admin/refresh",
          {}
        );

        if (!data?.accessToken) {
          throw new Error(
            "Access token missing from refresh response"
          );
        }

        // Save new access token
        localStorage.setItem(
          ACCESS_TOKEN_KEY,
          data.accessToken
        );

        setAccessToken(data.accessToken);

        return true;

      } catch (error) {

        console.error(
          "Refresh token error:",
          error
        );

        // Refresh failed → clear authentication
        localStorage.removeItem(
          ACCESS_TOKEN_KEY
        );

        localStorage.removeItem(
          ADMIN_KEY
        );

        setAccessToken(null);
        setAdmin(null);

        return false;

      } finally {
        refreshPromiseRef.current = null;
      }
    };

    refreshPromiseRef.current = doRefresh();

    return refreshPromiseRef.current;

  }, []);

  // --------------------------------
  // Initialize Authentication
  // --------------------------------

  useEffect(() => {

    let mounted = true;

    const initializeAuth = async () => {

      try {

        const storedToken =
          localStorage.getItem(
            ACCESS_TOKEN_KEY
          );

        // --------------------------------
        // No access token
        // --------------------------------
        //
        // Do NOT automatically call refresh here.
        // This prevents the login page from continuously
        // trying to refresh when there is no session.
        //

        if (!storedToken) {

          if (mounted) {
            setLoading(false);
          }

          return;
        }

        // --------------------------------
        // Decode access token
        // --------------------------------

        const decodedToken =
          decodeToken(storedToken);

        // Invalid token
        if (!decodedToken) {

          logout();

          if (mounted) {
            setLoading(false);
          }

          return;
        }

        // --------------------------------
        // Check expiry
        // --------------------------------

        const currentTime =
          Date.now() / 1000;

        const isExpired =
          decodedToken.exp &&
          decodedToken.exp <= currentTime;

        // --------------------------------
        // Token expired
        // --------------------------------

        if (isExpired) {

          await refreshAccessToken();

        } else {

          // Token still valid
          if (mounted) {
            setAccessToken(storedToken);
          }
        }

      } catch (error) {

        console.error(
          "Initialize auth error:",
          error
        );

        logout();

      } finally {

        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };

  }, [logout, refreshAccessToken]);

  // --------------------------------
  // Automatic Access Token Refresh
  // --------------------------------

  useEffect(() => {

    if (!accessToken) {
      return;
    }

    const decodedToken =
      decodeToken(accessToken);

    if (!decodedToken?.exp) {
      return;
    }

    const currentTime =
      Date.now() / 1000;

    const expiresIn =
      decodedToken.exp - currentTime;

    // Refresh 1 minute before expiry
    const refreshTime =
      Math.max(
        (expiresIn - 60) * 1000,
        0
      );

    const timer = setTimeout(() => {
      refreshAccessToken();
    }, refreshTime);

    return () => {
      clearTimeout(timer);
    };

  }, [
    accessToken,
    refreshAccessToken
  ]);

  // --------------------------------
  // Authenticated State
  // --------------------------------

  const isAuthenticated =
    Boolean(accessToken);

  // --------------------------------
  // Context
  // --------------------------------

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        admin,
        loading,
        isAuthenticated,
        login,
        logout,
        refreshAccessToken,
        decodeToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// --------------------------------
// useAuth Hook
// --------------------------------

export const useAuth = () => {

  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};