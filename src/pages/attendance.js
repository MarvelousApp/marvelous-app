import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { getLocalStorageItem } from '@/lib/storageHelper';
import Layout from '@/components/Layout';
import { db } from '@/lib/firebaseConfig';
import { motion } from 'framer-motion';

export default function AttendancePage() {
  const [schedules, setSchedules] = useState([]);
  const router = useRouter();

  const userId = getLocalStorageItem('userID');
  const userPosition = getLocalStorageItem('userPosition');
  const currentDay = new Date().toLocaleString('en-us', { weekday: 'long' });

  useEffect(() => {
    const scheduleQuery = userPosition === 'Admin'
      ? collection(db, 'Schedules')
      : query(
          collection(db, 'Schedules'),
          where('Teacher' || 'Dean', '==', userId),
          where('days', 'array-contains', currentDay)
        );

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(scheduleQuery, (querySnapshot) => {
      const fetchedSchedules = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSchedules(fetchedSchedules);
    });


    return () => unsubscribe();
  }, [userId, userPosition, currentDay]);

  const handleScheduleClick = (scheduleId) => {
    router.push(`/attendance/${encodeURIComponent(scheduleId)}`);
  };

  return (
    <Layout>
      <motion.div
        className="p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6 border-b pb-2">Today's Schedules</h1>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {schedules.map(({ id, courseId, subjectId, days, description, room, semester, timeStart, timeEnd, teacher, yearLevel }) => (
            <motion.div
              key={id}
              onClick={() => handleScheduleClick(id)}
              className="p-4 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition-transform transform hover:scale-105"
              whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h2 className="text-xl font-semibold mb-2 border-b pb-2">{id}</h2>
              <p className="text-gray-500">{description}</p>
              <p className="text-sm text-gray-400">Days: {days.join(', ')}</p>
              <p className="text-sm text-gray-500">Time: {timeStart} - {timeEnd}</p>
              <p className="text-sm text-gray-400">Room: {room}</p>
              <p className="text-sm text-gray-400">Semester: {semester}</p>
              <p className="text-sm text-gray-400">Year Level: {yearLevel}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </Layout>
  );
}