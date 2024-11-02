import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Forgot() {
  const [email, setEmail] = useState('');

  const handleForgot = (e) => {
    e.preventDefault();
    // Handle forgot password logic here
    console.log('Password reset request for', email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral">
      <motion.div
        className="p-8 bg-white shadow-lg rounded-lg max-w-md w-full"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold text-primary text-center mb-6">
          Forgot Password
        </h2>
        <form onSubmit={handleForgot}>
          <div className="mb-6">
            <label className="block text-secondary mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark"
          >
            Send Reset Link
          </button>
        </form>
        <div className="mt-4 text-center">
          <a href="/" className="text-secondary">
            Back to Login
          </a>
        </div>
      </motion.div>
    </div>
  );
}
