import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { fetchTasks, selectTasks, upsertTask } from '../store/slices/taskSlice';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout, selectAuth } from '../store/slices/authSlice';

const socket = io({ autoConnect: false, withCredentials: true });

/**
 * Annotator dashboard that handles file uploads, live task updates, and role-aware navigation.
 */
const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(selectTasks);
  const { user } = useAppSelector(selectAuth);
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const isReviewer = user?.role === 'Reviewer';
  const isAnnotator = user?.role === 'Annotator';

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    socket.connect();
    socket.on('task:update', payload => dispatch(upsertTask(payload)));
    return () => {
      socket.disconnect();
    };
  }, [dispatch, user]);

  /**
   * Uploads the selected media file to the API which forwards it to S3.
   */
  const handleUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadStatus('Uploading...');
    try {
      await api.post('/tasks/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus('Upload successful!');
      setFile(null);
      dispatch(fetchTasks());
    } catch (error) {
      setUploadStatus('Upload failed. Check logs.');
      console.error(error);
    }
  };

  /**
   * Terminates the current session and redirects back to the login screen.
   */
  const handleLogout = async () => {
    await dispatch(logout());
  };

  return (
    <div className="page">
      <header className="page__header">
        <h2>Welcome, {user?.name}</h2>
        <div className="page__actions">
          {user?.role === 'Admin' && <Link to="/admin">Admin Panel</Link>}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      {isAnnotator && (
        <section className="card">
          <h3>Upload new media</h3>
          <form onSubmit={handleUpload}>
            <input type="file" onChange={event => setFile(event.target.files?.[0] || null)} />
            <button type="submit" disabled={!file}>
              Upload to S3
            </button>
          </form>
          {uploadStatus && <p>{uploadStatus}</p>}
        </section>
      )}
      {isReviewer && (
        <section className="card">
          <h3>Review queue</h3>
          <p>Approve or request changes on completed annotation jobs.</p>
        </section>
      )}
      <section className="card">
        <h3>{isReviewer ? 'Tasks awaiting your review' : 'Task queue'}</h3>
        <ul className="task-list">
          {tasks.map(task => (
            <li key={task._id}>
              <Link to={`/tasks/${task._id}`}>
                <span className="task-list__title">{task.fileName}</span>
                <span className={`task-list__status task-list__status--${task.status}`}>
                  {task.status.replace(/_/g, ' ')}
                </span>
              </Link>
              {task.lastAiModel && (
                <p className="task-list__meta">
                  AI assist: {task.lastAiModel}
                  {task.lastAiRunAt && ` · ${new Date(task.lastAiRunAt).toLocaleString()}`}
                </p>
              )}
              {task.reviewNotes && !isReviewer && (
                <p className="task-list__notes">Reviewer notes: {task.reviewNotes}</p>
              )}
            </li>
          ))}
          {tasks.length === 0 && <li>No tasks available.</li>}
        </ul>
      </section>
    </div>
  );
};

export default DashboardPage;
