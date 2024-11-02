import Layout from '@/components/Layout';
import { motion } from 'framer-motion';

export default function Dashboard() {
  return (
    <Layout className="bg-white">
      <motion.h1
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Dashboard
      </motion.h1>
      <div className="border-b border-gray-300 mb-6" />
    </Layout>
  );
}
