import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import Cookies from 'js-cookie';
import type { RootState } from '..';
import type { User } from '../../types/user';

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'failed';
  error?: string;
}

const initialState: AuthState = {
  user: null,
  status: 'idle'
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await axios.post('/api/auth/login', credentials, {
      withCredentials: true
    });
    return response.data;
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: { name: string; email: string; password: string; role: string }) => {
    const response = await axios.post('/api/auth/register', payload, {
      withCredentials: true
    });
    return response.data;
  }
);

export const fetchMe = createAsyncThunk('auth/me', async () => {
  const response = await axios.get('/api/auth/me', {
    withCredentials: true
  });
  return response.data;
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await axios.post('/api/auth/logout', null, { withCredentials: true });
  Cookies.remove('token');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'idle';
        state.user = action.payload.user;
        state.error = undefined;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.status = 'idle';
        state.error = undefined;
      })
      .addCase(register.pending, state => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.status = 'idle';
        state.error = undefined;
      })
      .addCase(fetchMe.rejected, state => {
        state.status = 'idle';
        state.user = null;
        state.error = undefined;
      })
      .addCase(logout.fulfilled, state => {
        state.user = null;
        state.status = 'idle';
        state.error = undefined;
      });
  }
});

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
