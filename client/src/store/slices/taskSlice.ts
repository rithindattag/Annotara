import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import type { RootState } from '..';
import type { AnnotationTask } from '../../types/task';

interface TaskState {
  items: AnnotationTask[];
  status: 'idle' | 'loading' | 'failed';
  error?: string;
}

const initialState: TaskState = {
  items: [],
  status: 'idle'
};

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async () => {
  const response = await axios.get('/api/tasks', { withCredentials: true });
  return response.data.tasks as AnnotationTask[];
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    upsertTask(state, action) {
      const updated = action.payload as AnnotationTask;
      const index = state.items.findIndex(item => item._id === updated._id);
      if (index >= 0) {
        state.items[index] = updated;
      } else {
        state.items.push(updated);
      }
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTasks.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export const { upsertTask } = taskSlice.actions;
export const selectTasks = (state: RootState) => state.tasks.items;

export default taskSlice.reducer;
