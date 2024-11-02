import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import { db } from '@/lib/firebaseConfig';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import DataTable from 'react-data-table-component';

export default function CourseDetails() {
  const { query: { courseId }, back } = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ subjectCode: '', description: '', units: '', semester: '1st Sem' });
  const [selectedYearLevel, setSelectedYearLevel] = useState('1st Year');
  const [subjects, setSubjects] = useState({});

  useEffect(() => {
    if (!courseId) return;

    const fetchCourseDetails = async () => {
      try {
        const boardCoursesSnapshot = await getDocs(collection(db, 'Departments/Board Courses/Courses'));
        const nonBoardCoursesSnapshot = await getDocs(collection(db, 'Departments/Non-Board Courses/Courses'));

        const boardCourses = boardCoursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const nonBoardCourses = nonBoardCoursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const foundCourse = [...boardCourses, ...nonBoardCourses].find(course => course.id === courseId);
        if (foundCourse) {
          setCourse(foundCourse);
          // Fetch subjects
          const subjectsData = await getSubjects(foundCourse.id);
          setSubjects(subjectsData);
        } else {
          setCourse(null);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const handleInputChange = ({ target: { name, value } }) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubject = () => setShowModal(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { subjectCode, description, units } = formData;

    // Basic validation
    if (!subjectCode || !description || !units) {
      alert('Please fill in all fields');
      return;
    }

    const subjectData = {
      subjectCode,
      description,
      units,
      semester: formData.semester,
      yearLevel: selectedYearLevel,
    };

    try {
      // Create a new document in the Subjects collection under the corresponding course ID
      const path = `Subjects/${courseId}`;
      await setDoc(doc(db, path, subjectCode), subjectData);

      setFormData({ subjectCode: '', description: '', units: '', semester: '1st Sem' });
      setShowModal(false);
    } catch (error) {
      console.error("Error saving subject:", error);
    }
  };

  if (loading) return <LoadingState />;
  if (!course) return <NoCourseFound />;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.5 }} className="p-6">
        <button onClick={back} className="flex items-center mb-4 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition">
          <FaArrowLeft className="mr-2" /> Back
        </button>
        <h1 className="text-3xl font-bold mb-6 border-b pb-2">{course.name} ({course.id})</h1>
        <div className="flex justify-end items-center space-x-4 mt-6">
          <button onClick={handleAddSubject} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105">
            <FaPlus /> Add Subject
          </button>
          <select className="rounded-lg bg-gray-100 border border-gray-300 text-gray-700 py-2 pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500 transition" value={selectedYearLevel} onChange={({ target }) => setSelectedYearLevel(target.value)}>
            {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(year => <option key={year}>{year}</option>)}
          </select>
        </div>

        <AnimatePresence>
          {showModal && <Modal {...{ onClose: () => setShowModal(false), onSubmit: handleSubmit, formData, onInputChange: handleInputChange, selectedYearLevel }} />}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}

const LoadingState = () => (
  <Layout>
    <CenteredMessage message="Loading..." />
  </Layout>
);

const NoCourseFound = () => (
  <Layout>
    <CenteredMessage message="No course found!" className="text-red-600" />
  </Layout>
);

const CenteredMessage = ({ message, className = '' }) => (
  <div className="flex items-center justify-center h-screen">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className={`text-xl font-semibold ${className}`}>{message}</motion.div>
  </div>
);

const Modal = ({ onClose, onSubmit, formData, onInputChange, selectedYearLevel }) => (
  <motion.div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.3 }} className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-96">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Add New Subject</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        {['subjectCode', 'description', 'units', 'semester'].map((field, index) => (
          <Label key={field} field={field} value={formData[field]} onChange={onInputChange} isSelect={field === 'semester'} >
            {index === 3 ? ['1st Sem', '2nd Sem', 'Summer'] : undefined}
          </Label>
        ))}
        <Label field="yearLevel" value={selectedYearLevel} readOnly />
        <div className="flex justify-end space-x-3 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Add Subject</button>
        </div>
      </form>
    </motion.div>
  </motion.div>
);

const Label = ({ field, value, onChange, isSelect, readOnly, children }) => (
  <label className="block">
    <span className="text-gray-700">{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
    {isSelect ? (
      <select name={field} value={value} onChange={onChange} className="mt-1 block p-3 w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-green-500">
        {children.map(option => <option key={option}>{option}</option>)}
      </select>
    ) : (
      <input
        type={field === 'units' ? 'number' : 'text'}
        name={field}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-green-500"
        required
      />
    )}
  </label>
);
