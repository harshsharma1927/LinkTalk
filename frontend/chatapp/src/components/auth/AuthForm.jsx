import { useState } from 'react';
import { apiFetch } from '../../api';

export const AuthForm = ({ mode = 'login', onAuthenticated }) => {
  const [formMode, setFormMode] = useState(mode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (formMode === 'signup' && !name)) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const path = formMode === 'login' ? '/auth/login' : '/auth/signup';
      const body =
        formMode === 'login'
          ? { email, password }
          : { name, email, password };

      const res = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const user = res?.data?.user;
      const token = res?.data?.token;

      if (onAuthenticated && user && token) {
        onAuthenticated(user, token);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setFormMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    setError('');
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-[2rem] shadow-2xl shadow-indigo-100 border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800">
          {formMode === 'login' ? 'Welcome Back' : 'Join Us'}
        </h2>
        <p className="text-slate-500 mt-2">
          Enter your details to access your chats.
        </p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {formMode === 'signup' && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        )}
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isSubmitting
            ? formMode === 'login'
              ? 'Signing In...'
              : 'Creating Account...'
            : formMode === 'login'
            ? 'Sign In'
            : 'Create Account'}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-slate-600">
        {formMode === 'login'
          ? "Don't have an account?"
          : 'Already have an account?'}
        <button
          type="button"
          onClick={toggleMode}
          className="text-indigo-600 font-bold ml-1 hover:underline text-sm"
        >
          {formMode === 'login' ? 'Sign Up' : 'Log In'}
        </button>
      </p>
    </div>
  );
};