import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import portfolioReducer from "./slices/portfolioSlice";
import assetReducer from "./slices/assetsSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    portfolios: portfolioReducer,
    assets: assetReducer
  },
});

export default store;
