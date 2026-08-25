import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from "react";

import API from '../api/axios';


const AuthContext = createContext(null);


const ACCESS_TOKEN_KEY = "accessToken";
const ADMIN_KEY = "admin";

// Note: the refresh token is no longer stored here.
// The backend sets it as an httpOnly cookie, so the
// browser sends it automatically with every request
// that includes credentials: "include" — client-side
// JS never sees or manages it directly.


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


    const decodedPayload = JSON.parse(
      atob(
        payload
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );


    return decodedPayload;

  } catch (error) {

    console.error(
      "Failed to decode token:",
      error
    );

    return null;
  }
};


export const AuthProvider = ({ children }) => {

  // --------------------------------
  // State
  // --------------------------------

  const [accessToken, setAccessToken] = useState(
    localStorage.getItem(ACCESS_TOKEN_KEY)
  );


  const [admin, setAdmin] = useState(() => {

    const storedAdmin =
      localStorage.getItem(ADMIN_KEY);


    try {

      return storedAdmin
        ? JSON.parse(storedAdmin)
        : null;

    } catch (error) {

      console.error(
        "Failed to parse stored admin:",
        error
      );

      return null;
    }
  });


  const [loading, setLoading] = useState(true);


  // --------------------------------
  // Guard against overlapping refresh calls
  // (refresh token rotates server-side, so two
  // simultaneous calls would race: whichever
  // request loses would try to use an already-
  // revoked refresh token and force a logout)
  // --------------------------------

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

    if (!data.accessToken) {
      throw new Error("Invalid authentication response");
    }

    localStorage.setItem(
      ACCESS_TOKEN_KEY,
      data.accessToken
    );

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

 const logout = useCallback(async () => {
  try {
    await API.post("/admin/logout");
  } catch (error) {
    console.error("Logout request error:", error);
  } finally {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);

    setAccessToken(null);
    setAdmin(null);
  }
}, []);


  // --------------------------------
  // Refresh Access Token
  // --------------------------------

  const refreshAccessToken = useCallback(
    async () => {

      // If a refresh is already in flight, reuse its
      // promise instead of firing a second request —
      // the backend revokes the old refresh token on
      // every rotation, so a second concurrent call
      // would always fail and wrongly trigger logout().
      if (refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }


      const doRefresh = async () => {

        try {

          const response = await fetch(
            `${API}/login`,
            {
              method: "POST",

              credentials: "include", // sends the refresh-token cookie

              headers: {
                "Content-Type": "application/json"
              }
            }
          );


          if (!response.ok) {

            throw new Error(
              "Failed to refresh access token"
            );
          }


          const data =
            await response.json();


          if (!data.accessToken) {

            throw new Error(
              "Access token missing from refresh response"
            );
          }


          localStorage.setItem(
            ACCESS_TOKEN_KEY,
            data.accessToken
          );


          setAccessToken(
            data.accessToken
          );


          // The rotated refresh token is set directly as
          // a cookie by the server — nothing to store here.

          return true;

        } catch (error) {

          console.error(
            "Refresh token error:",
            error
          );


          logout();


          return false;

        } finally {

          refreshPromiseRef.current = null;
        }
      };


      refreshPromiseRef.current = doRefresh();


      return refreshPromiseRef.current;
    },
    [logout]
  );


  // --------------------------------
  // Check Existing Session
  // --------------------------------

  useEffect(() => {

    const initializeAuth = async () => {

      try {

        const storedToken =
          localStorage.getItem(
            ACCESS_TOKEN_KEY
          );


        // No access token — try the refresh cookie in case
        // a valid session still exists server-side (e.g.
        // access token was never persisted, or was cleared).
        if (!storedToken) {

          await refreshAccessToken();

          setLoading(false);

          return;
        }


        const decodedToken =
          decodeToken(storedToken);


        // Invalid access token
        if (!decodedToken) {

          logout();

          setLoading(false);

          return;
        }


        const currentTime =
          Date.now() / 1000;


        // Access token expired
        if (
          decodedToken.exp &&
          decodedToken.exp <= currentTime
        ) {

          await refreshAccessToken();

        } else {

          // Access token still valid
          setAccessToken(
            storedToken
          );
        }

      } catch (error) {

        console.error(
          "Initialize auth error:",
          error
        );

        logout();

      } finally {

        setLoading(false);
      }
    };


    initializeAuth();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // --------------------------------
  // Automatically Refresh Access Token
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