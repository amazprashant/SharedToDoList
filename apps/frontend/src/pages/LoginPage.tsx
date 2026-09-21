import { FormEvent, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { validateDisplayName, validateEmail, validatePassword } from '../lib/validation';

type Mode = 'login' | 'signup';
type FieldErrors = { email?: string | null; password?: string | null; displayName?: string | null };

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validateField(field: keyof FieldErrors, value: string): string | null {
    if (field === 'email') return validateEmail(value);
    if (field === 'password') return validatePassword(value);
    if (field === 'displayName') return mode === 'signup' ? validateDisplayName(value) : null;
    return null;
  }

  function handleBlur(field: keyof FieldErrors, value: string) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validateField(field, value) }));
  }

  function handleChange(field: keyof FieldErrors, value: string) {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'displayName') setDisplayName(value);
    if (touched[field]) {
      setErrors((e) => ({ ...e, [field]: validateField(field, value) }));
    }
  }

  function validateAll(): boolean {
    const nextErrors: FieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
      displayName: mode === 'signup' ? validateDisplayName(displayName) : null,
    };
    setErrors(nextErrors);
    setTouched({ email: true, password: true, displayName: true });
    return !nextErrors.email && !nextErrors.password && !nextErrors.displayName;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: displayName.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: any) {
      setFormError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login');
    setFormError(null);
    setErrors({});
    setTouched({});
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-mark">✓</div>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        </div>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Log in to see your shared tasks.' : 'Sign up to start sharing tasks.'}
        </p>

        {formError && <div className="form-error-banner">{formError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="displayName">
                Name
              </label>
              <input
                id="displayName"
                type="text"
                className={`form-input${touched.displayName && errors.displayName ? ' has-error' : ''}`}
                value={displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                onBlur={(e) => handleBlur('displayName', e.target.value)}
                placeholder="Jane Doe"
              />
              {touched.displayName && errors.displayName && (
                <p className="field-error">{errors.displayName}</p>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`form-input${touched.email && errors.email ? ' has-error' : ''}`}
              value={email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={(e) => handleBlur('email', e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {touched.email && errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`form-input${touched.password && errors.password ? ' has-error' : ''}`}
              value={password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={(e) => handleBlur('password', e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {touched.password && errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <div className="switch-mode">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" className="btn btn-secondary" onClick={switchMode}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}

function mapAuthError(err: any): string {
  const code = err?.code as string | undefined;
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return err?.message ?? 'Something went wrong. Please try again.';
  }
}
