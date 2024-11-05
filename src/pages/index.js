import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import Swal from 'sweetalert2';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    const staffQuery = query(collection(db, 'Staff'), where('username', '==', username));
    const querySnapshot = await getDocs(staffQuery);

    if (querySnapshot.empty) {
      Swal.fire({
        icon: 'error',
        title: 'Username Not Found',
        text: 'Please check your username and try again.',
      });
      return;
    }

    const staffData = querySnapshot.docs[0].data();

    if (staffData.password === password) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem("userID", staffData.staffID);
      localStorage.setItem("userPosition", staffData.position);

      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: 'Redirecting to the dashboard...',
        timer: 1500,
        showConfirmButton: false,
      });
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Incorrect Password',
        text: 'Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral">
      <motion.div
        className="p-8 bg-white border-t-blue-950 border shadow-lg rounded-lg max-w-md w-full"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold text-primary text-center mb-6">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-secondary mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-secondary mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition duration-300 ease-in-out transform hover:scale-105"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <a href="/forgot" className="text-secondary hover:underline">Forgot Password?</a>
        </div>
      </motion.div>
    </div>
  );
}
