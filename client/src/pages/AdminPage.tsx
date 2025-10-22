import { FormEvent, useEffect, useState } from 'react';
import api from '../utils/api';
import { selectTasks, fetchTasks } from '../store/slices/taskSlice';
import { useAppDispatch, useAppSelector } from '../hooks';
import type { User } from '../types/user';

/**
 * Administrative interface for managing annotators and exporting dataset snapshots.
 */
const AdminPage = () => {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(selectTasks);
  const [annotators, setAnnotators] = useState<User[]>([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedAnnotator, setSelectedAnnotator] = useState('');
  const [exportData, setExportData] = useState('');

  useEffect(() => {
    dispatch(fetchTasks());
    const loadAnnotators = async () => {
      const { data } = await api.get('/admin/users');
      setAnnotators(data.users);
    };
    loadAnnotators();
  }, [dispatch]);

  /**
   * Assigns the selected task to a specific annotator via the admin API.
   */
  const handleAssign = async (event: FormEvent) => {
    event.preventDefault();
    await api.post('/admin/assign', {
      taskId: selectedTask,
      userId: selectedAnnotator
    });
    dispatch(fetchTasks());
  };

  /**
   * Fetches the combined task/annotation export from the backend.
   */
  const handleExport = async () => {
    const { data } = await api.get('/admin/export');
    setExportData(JSON.stringify(data, null, 2));
  };

  return (
    <div className="page">
      <header className="page__header">
        <h2>Admin Panel</h2>
      </header>
      <section className="card">
        <h3>Assign tasks</h3>
        <form onSubmit={handleAssign} className="admin-form">
          <select value={selectedTask} onChange={event => setSelectedTask(event.target.value)}>
            <option value="">Select task</option>
            {tasks.map(task => (
              <option key={task._id} value={task._id}>
                {task.fileName} – {task.status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            value={selectedAnnotator}
            onChange={event => setSelectedAnnotator(event.target.value)}
          >
            <option value="">Select annotator</option>
            {annotators.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
          <button type="submit" disabled={!selectedTask || !selectedAnnotator}>
            Assign
          </button>
        </form>
      </section>
      <section className="card">
        <h3>Export annotations</h3>
        <button onClick={handleExport}>Export JSON</button>
        {exportData && (
          <pre className="export-preview">
            <code>{exportData}</code>
          </pre>
        )}
      </section>
    </div>
  );
};

export default AdminPage;
