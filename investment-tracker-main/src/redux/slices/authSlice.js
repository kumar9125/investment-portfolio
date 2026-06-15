import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";

// --- Signup Thunk (registers user)
export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (userData, { rejectWithValue }) => {
    try {
      console.log("[Redux] signupUser action triggered. Payload:", { ...userData, password: "[REDACTED]" });
      const res = await axiosInstance.post("/auth/signup", userData);
      console.log("[Redux] signupUser action SUCCESS. Response data:", res.data);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Signup failed";
      console.error("[Redux] signupUser action REJECTED. Error message:", errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// --- Login Thunk (logs in + saves token)
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      console.log("[Redux] loginUser action triggered. Payload:", { ...userData, password: "[REDACTED]" });
      const res = await axiosInstance.post("/auth/login", userData);
      console.log("[Redux] loginUser action SUCCESS. Response data:", res.data);
      if (res.data?.token) {
        console.log("[Redux] Storing session token to localStorage.");
        localStorage.setItem("token", res.data.token);
      } else {
        console.warn("[Redux] Login succeeded but no token was returned in response.");
      }
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Login failed";
      console.error("[Redux] loginUser action REJECTED. Error message:", errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

// --- Fetch User Profile
export const fetchUser = createAsyncThunk(
  "auth/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      console.log("[Redux] fetchUser action triggered.");
      const res = await axiosInstance.get("/auth/me");
      console.log("[Redux] fetchUser action SUCCESS. User details:", res.data);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch user";
      console.error("[Redux] fetchUser action REJECTED. Error message:", errorMsg);
      return rejectWithValue(errorMsg);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token") || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      console.log("[Redux Reducer] logout action triggered. Clearing local session details.");
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Signup
      .addCase(signupUser.pending, (state) => {
        console.log("[Redux Slice] signupUser.pending. Setting loading state.");
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        console.log("[Redux Slice] signupUser.fulfilled. Registration complete.");
        state.loading = false;
      })
      .addCase(signupUser.rejected, (state, action) => {
        console.log("[Redux Slice] signupUser.rejected. Error:", action.payload);
        state.loading = false;
        state.error = action.payload;
      })

      // --- Login
      .addCase(loginUser.pending, (state) => {
        console.log("[Redux Slice] loginUser.pending. Setting loading state.");
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log("[Redux Slice] loginUser.fulfilled. Setting token and user state.");
        state.loading = false;
        state.user = {
          _id: action.payload.user?._id || action.payload._id,
          name: action.payload.user?.name || action.payload.name,
          email: action.payload.user?.email || action.payload.email,
        };
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log("[Redux Slice] loginUser.rejected. Error:", action.payload);
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch User
      .addCase(fetchUser.pending, (state) => {
        console.log("[Redux Slice] fetchUser.pending. Fetching user info.");
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        console.log("[Redux Slice] fetchUser.fulfilled. User state updated:", action.payload);
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        console.log("[Redux Slice] fetchUser.rejected. Clearing user state. Error:", action.payload);
        state.loading = false;
        state.error = action.payload;
        state.user = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
