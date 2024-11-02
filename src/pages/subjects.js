import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { db } from '@/lib/firebaseConfig';

export default function SubjectManagement() {
  const [courses, setCourses] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const boardCourses = await getDocs(collection(db, 'Departments/Board Courses/Courses'));
        const nonBoardCourses = await getDocs(collection(db, 'Departments/Non-Board Courses/Courses'));
        
        setCourses([
          ...boardCourses.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          ...nonBoardCourses.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ]);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseClick = (courseId) => router.push(`/course/${courseId}`);

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 border-b pb-2">Courses</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id} 
              onClick={() => handleCourseClick(course.id)} 
              className="p-4 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition"
            >
              <h2 className="text-xl font-semibold mb-2 border-b pb-2">{course.id}</h2>
              <p className="text-gray-500">{course.name}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}