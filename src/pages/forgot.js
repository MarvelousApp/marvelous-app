import { motion } from 'framer-motion';
import { useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Swal from 'sweetalert2';

export default function Forgot() {
  const [username, setUsername] = useState('');

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      const staffQuery = query(collection(db, 'Staff'), where('staffId', '==', username));
      const querySnapshot = await getDocs(staffQuery);
      
      if (!querySnapshot.empty) {
        const staffDoc = querySnapshot.docs[0].data();
        
        // Implement your admin notification logic here
        Swal.fire({
          icon: 'info',
          title: 'Request Sent',
          text: `Password retrieval request for ${staffDoc.firstName} ${staffDoc.lastName} sent to the admin for confirmation.`,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Username Not Found',
          text: 'Please check your username and try again.',
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred. Please try again later.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral">
      <motion.div
        className="p-8 bg-white shadow-lg rounded-lg max-w-md w-full"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold text-primary text-center mb-6">Forgot Password</h2>
        <form onSubmit={handleForgot}>
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
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition duration-300 ease-in-out transform hover:scale-105"
          >
            Request Password Retrieval
          </button>
        </form>
        <div className="mt-4 text-center">
          <a href="/" className="text-secondary hover:underline">Back to Login</a>
        </div>
      </motion.div>
    </div>
  );
}