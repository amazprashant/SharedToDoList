import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signOut } from 'firebase/auth';
import type { Task, TaskFilter } from '@shared-todo/shared';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { SharePopup } from '../components/SharePopup';
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  validateTaskDescription,
  validateTaskTitle,
} from '../lib/validation';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
};

export function TasksPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [sharingTaskId, setSharingTaskId] = useState<string | null>(null);

  const titleError = titleTouched ? validateTaskTitle(title) : null;
  const descriptionError = descriptionTouched ? validateTaskDescription(description) : null;

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', filter],
    queryFn: async () => (await api.get('/api/tasks', { params: { filter } })).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/tasks', { title: title.trim(), description: description.trim() || undefined });
    },
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setTitleTouched(false);
      setDescriptionTouched(false);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/api/tasks/${id}`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    setTitleTouched(true);
    setDescriptionTouched(true);
    if (!validateTaskTitle(title) && !validateTaskDescription(description)) {
      createMutation.mutate();
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Shared To-Do List</h1>
        <div className="user-chip">
          <span>{user?.displayName || user?.email}</span>
          <button className="btn btn-danger-outline" onClick={() => signOut(auth)}>
            Log out
          </button>
        </div>
      </header>

      <form onSubmit={handleCreate} className="task-form-card" noValidate>
        <div className="task-form-row">
          <div className="form-group title-field">
            <label className="form-label" htmlFor="task-title">
              Title
            </label>
            <input
              id="task-title"
              className={`form-input${titleError ? ' has-error' : ''}`}
              placeholder="New task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTitleTouched(true)}
            />
            {titleError && <p className="field-error">{titleError}</p>}
          </div>
          <div className="form-group desc-field">
            <label className="form-label" htmlFor="task-description">
              Description (optional)
            </label>
            <input
              id="task-description"
              className={`form-input${descriptionError ? ' has-error' : ''}`}
              placeholder="Add more detail…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => setDescriptionTouched(true)}
              maxLength={TASK_DESCRIPTION_MAX_LENGTH}
            />
            {descriptionError && <p className="field-error">{descriptionError}</p>}
          </div>
        </div>
        <div className="task-form-actions">
          <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Adding…' : 'Add task'}
          </button>
        </div>
      </form>

      <div className="toolbar">
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          Filter
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value as TaskFilter)}
          >
            <option value="all">All Tasks</option>
            <option value="mine">My Tasks</option>
            <option value="shared">Shared With Me</option>
          </select>
        </label>
      </div>

      {isLoading && <p>Loading…</p>}

      <ul className="task-list">
        {tasks.map((task) => {
          const isOwner = task.ownerEmail === user?.email;
          return (
            <li key={task.id} className="task-card">
              <div className="task-card-top">
                <h3 className="task-title">{task.title}</h3>
                <select
                  className={`status-badge-select status-${task.status}`}
                  value={task.status}
                  onChange={(e) => statusMutation.mutate({ id: task.id, status: e.target.value })}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {task.description && <p className="task-description">{task.description}</p>}
              <p className="task-meta">Owner: {task.ownerEmail}</p>
              {isOwner && (
                <div className="task-actions">
                  <button className="btn btn-secondary" onClick={() => setSharingTaskId(task.id)}>
                    Share
                  </button>
                  <button className="btn btn-danger-outline" onClick={() => deleteMutation.mutate(task.id)}>
                    Delete
                  </button>
                </div>
              )}
            </li>
          );
        })}
        {!isLoading && tasks.length === 0 && <li className="empty-state">No tasks yet. Add your first one above.</li>}
      </ul>

      {sharingTaskId && <SharePopup taskId={sharingTaskId} onClose={() => setSharingTaskId(null)} />}
    </div>
  );
}
