import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { validateShareEmail } from '../lib/validation';

interface SharedUser {
  id: string;
  email: string;
  displayName: string | null;
}

export function SharePopup({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fieldError = touched ? validateShareEmail(email) : null;

  const { data: sharedUsers = [] } = useQuery<SharedUser[]>({
    queryKey: ['task-shares', taskId],
    queryFn: async () => (await api.get(`/api/tasks/${taskId}/shares`)).data,
  });

  const shareMutation = useMutation({
    mutationFn: async (targetEmail: string) => {
      await api.post(`/api/tasks/${taskId}/share`, { email: targetEmail });
    },
    onSuccess: () => {
      setEmail('');
      setTouched(false);
      setServerError(null);
      queryClient.invalidateQueries({ queryKey: ['task-shares', taskId] });
    },
    onError: (err: any) => setServerError(err.response?.data?.error ?? 'Failed to share'),
  });

  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/api/tasks/${taskId}/share/${userId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task-shares', taskId] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setServerError(null);
    const error = validateShareEmail(email);
    if (!error) shareMutation.mutate(email.trim());
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Share task</h3>
        <form onSubmit={handleSubmit} className="share-form" noValidate>
          <div className="form-group">
            <input
              type="email"
              placeholder="user@example.com"
              className={`form-input${fieldError ? ' has-error' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched) setServerError(null);
              }}
              onBlur={() => setTouched(true)}
            />
            {fieldError && <p className="field-error">{fieldError}</p>}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={shareMutation.isPending}>
            Share
          </button>
        </form>
        {serverError && <div className="form-error-banner" style={{ marginTop: 12 }}>{serverError}</div>}

        <ul className="shared-list">
          {sharedUsers.map((u) => (
            <li key={u.id} className="shared-list-item">
              <span>{u.displayName ?? u.email}</span>
              <button className="icon-btn" onClick={() => revokeMutation.mutate(u.id)} aria-label="Remove">
                ×
              </button>
            </li>
          ))}
          {sharedUsers.length === 0 && <li className="shared-list-item" style={{ color: '#9ca3af' }}>Not shared with anyone yet.</li>}
        </ul>

        <div className="modal-close-row">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
