import axios from "axios";

let apiURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Robust check: append /api suffix if not already present
if (apiURL && !apiURL.endsWith("/api") && !apiURL.endsWith("/api/")) {
  apiURL = apiURL.replace(/\/$/, "") + "/api";
}

console.log(`[Axios] Initializing API Base URL: ${apiURL}`);

const axiosInstance = axios.create({
  baseURL: apiURL,
});

// Request Interceptor: Attach Token & Log Request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] -> ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, {
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error("[API Request Error] ->", error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Log Success & Handle Auth Errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[API Response] <- ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API Error] <- ${error.response ? error.response.status : "NETWORK_ERROR"} ${error.config ? error.config.url : ""}`, {
      message: error.message,
      responseData: error.response?.data,
    });

    if (error.response && error.response.status === 401) {
      console.warn("[API Error] 401 Unauthorized detected. Clearing token and redirecting to login...");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
