import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { db } from '@/lib/firebaseConfig';
import { motion } from 'framer-motion';

export default function SubjectManagement() {
  const [courses, setCourses] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Get user position and department from localStorage
        const userPosition = localStorage.getItem("userPosition");
        const userDepartment = localStorage.getItem("department");

        let allCourses = [];

        // Fetch courses based on the user's position (if the user is a Dean)
        if (userPosition === "Dean") {
          // Construct the collection path dynamically based on the user's department
          const departmentCoursesRef = collection(db, `Departments/${userDepartment}/Courses`);
          const departmentCourses = await getDocs(departmentCoursesRef);
          allCourses = departmentCourses.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
          // If the user is not a Dean, fetch both board and non-board courses
          const [boardCourses, nonBoardCourses] = await Promise.all([
            getDocs(collection(db, 'Departments/Board Courses/Courses')),
            getDocs(collection(db, 'Departments/Non-Board Courses/Courses')),
          ]);

          allCourses = [
            ...boardCourses.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            ...nonBoardCourses.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          ];
        }

        setCourses(allCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);
  const handleCourseClick = (courseId) => router.push(`/course/${courseId}`);

  return (
    <Layout>
      <motion.div
        className="p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6 border-b pb-2">Subjects</h1>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {courses.map(({ id, name }) => (
            <motion.div
              key={id}
              onClick={() => handleCourseClick(id)}
              className="p-4 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition-transform transform hover:scale-105"
              whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h2 className="text-xl font-semibold mb-2 border-b pb-2">{id}</h2>
              <p className="text-gray-500">{name}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </Layout>
  );
}
