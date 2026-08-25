import axios from "axios";

const API = axios.create({
  baseURL:
    "https://trinity-housing-backend.onrender.com/api",
  withCredentials: true
});

// --------------------------------
// Request Interceptor
// --------------------------------

API.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// --------------------------------
// Response Interceptor
// --------------------------------

API.interceptors.response.use(
  (response) => response,

  async (error) => {

    const originalRequest =
      error.config;

    // No config
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Don't refresh the refresh request itself
    const isRefreshRequest =
      originalRequest.url?.includes(
        "/admin/refresh"
      );

    // Only handle 401
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {

      originalRequest._retry = true;

      try {

        const { data } =
          await axios.post(
            "https://trinity-housing-backend.onrender.com/api/admin/refresh",
            {},
            {
              withCredentials: true
            }
          );

        if (!data?.accessToken) {
          throw new Error(
            "Refresh response does not contain accessToken"
          );
        }

        localStorage.setItem(
          "accessToken",
          data.accessToken
        );

        originalRequest.headers.Authorization =
          `Bearer ${data.accessToken}`;

        return API(originalRequest);

      } catch (refreshError) {

        console.error(
          "Axios refresh failed:",
          refreshError
        );

        localStorage.removeItem(
          "accessToken"
        );

        localStorage.removeItem(
          "admin"
        );

        window.location.href =
          "/";

        return Promise.reject(
          refreshError
        );
      }
    }

    return Promise.reject(error);
  }
);

export default API;