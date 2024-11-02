import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { db } from '@/lib/firebaseConfig'; // Adjust the import according to your project structure

export default function SubjectManagement() {
  const [courses, setCourses] = useState([]);
  const router = useRouter();

  // Function to fetch courses from Firestore
  const fetchCourses = async () => {
    try {
      const boardCoursesSnapshot = await getDocs(collection(db, 'Departments/Board Courses/Courses'));
      const nonBoardCoursesSnapshot = await getDocs(collection(db, 'Departments/Non-Board Courses/Courses'));

      const boardCourses = boardCoursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const nonBoardCourses = nonBoardCoursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Log the fetched courses for debugging
      console.log('Board Courses:', boardCourses);
      console.log('Non-Board Courses:', nonBoardCourses);

      setCourses([...boardCourses, ...nonBoardCourses]);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Navigate to course details
  const handleCourseClick = (courseId) => {
    router.push(`/course/${courseId}`);
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold mb-6 border-b pb-2">Subject Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length > 0 ? (
            courses.map(course => (
              <div key={course.id} className="border rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition" onClick={() => handleCourseClick(course.id)}>
                <h2 className="text-xl font-semibold">{course.id}</h2>
                <p>{course.name}</p>
              </div>
            ))
          ) : (
            <p>No courses found.</p>
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
