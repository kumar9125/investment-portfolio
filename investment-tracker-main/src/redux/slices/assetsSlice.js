import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";

// Fetch assets by portfolio
export const fetchAssets = createAsyncThunk(
  "assets/fetchAssets",
  async (portfolioId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/assets/${portfolioId}`);
      return response.data.assets;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Add asset
export const addAsset = createAsyncThunk(
  "assets/addAsset",
  async (asset, thunkAPI) => {
    try {
      const response = await axiosInstance.post("/assets", asset);
      return response.data.asset;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Update asset
export const updateAsset = createAsyncThunk(
  "assets/updateAsset",
  async ({ id, updatedData }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`/assets/${id}`, updatedData);
      return response.data.asset;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Delete asset
export const deleteAsset = createAsyncThunk(
  "assets/deleteAsset",
  async (id, thunkAPI) => {
    try {
      await axiosInstance.delete(`/assets/${id}`);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Fetch Asset History
export const fetchAssetHistory = createAsyncThunk(
  "assets/fetchAssetHistory",
  async (assetId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/assets/${assetId}/history`);
      return response.data.history;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

const assetsSlice = createSlice({
  name: "assets",
  initialState: {
    assets: [],
    assetHistory: [],
    historyLoading: false,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.assets = action.payload;
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add
      .addCase(addAsset.fulfilled, (state, action) => {
        state.assets.push(action.payload);
      })

      // Update
      .addCase(updateAsset.fulfilled, (state, action) => {
        const index = state.assets.findIndex(
          (a) => a._id === action.payload._id
        );
        if (index !== -1) {
          state.assets[index] = action.payload;
        }
      })

      // Delete
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.assets = state.assets.filter((a) => a._id !== action.payload);
      })
      
      // Fetch History
      .addCase(fetchAssetHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchAssetHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.assetHistory = action.payload;
      })
      .addCase(fetchAssetHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.assetHistory = [];
        state.error = action.payload;
      });
  },
});

export default assetsSlice.reducer;
