import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axios';

// Fetch portfolios
export const fetchPortfolios = createAsyncThunk(
  "portfolios/fetchPortfolios",
  async (userId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/portfolio?user=${userId}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Add, update, delete portfolio (same as before)
export const addPortfolio = createAsyncThunk('portfolios/addPortfolio', async (portfolioData, thunkAPI) => {
  try {
    const response = await axiosInstance.post('/portfolio', portfolioData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updatePortfolio = createAsyncThunk('portfolios/updatePortfolio', async ({ id, portfolioData }, thunkAPI) => {
  try {
    const response = await axiosInstance.put(`/portfolio/${id}`, portfolioData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deletePortfolio = createAsyncThunk('portfolios/deletePortfolio', async (id, thunkAPI) => {
  try {
    await axiosInstance.delete(`/portfolio/${id}`);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

const portfolioSlice = createSlice({
  name: 'portfolios',
  initialState: {
    portfolios: [],
    selectedPortfolioId: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedPortfolio: (state, action) => {
      state.selectedPortfolioId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolios.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPortfolios.fulfilled, (state, action) => {
        state.loading = false;
        state.portfolios = action.payload;
        // Select latest portfolio automatically
        if (!state.selectedPortfolioId && action.payload.length > 0) {
          state.selectedPortfolioId = action.payload[action.payload.length - 1]._id;
        }
      })
      .addCase(fetchPortfolios.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // addPortfolio
      .addCase(addPortfolio.fulfilled, (state, action) => {
        state.portfolios.push(action.payload);
        state.selectedPortfolioId = action.payload._id;
      })
      // updatePortfolio
      .addCase(updatePortfolio.fulfilled, (state, action) => {
        const index = state.portfolios.findIndex(p => p._id === action.payload._id);
        if (index !== -1) state.portfolios[index] = action.payload;
      })
      // deletePortfolio
      .addCase(deletePortfolio.fulfilled, (state, action) => {
        state.portfolios = state.portfolios.filter(p => p._id !== action.payload);
        if (state.selectedPortfolioId === action.payload) {
          state.selectedPortfolioId = state.portfolios.length ? state.portfolios[state.portfolios.length - 1]._id : null;
        }
      });
  },
});

export const { setSelectedPortfolio } = portfolioSlice.actions;
export default portfolioSlice.reducer;
