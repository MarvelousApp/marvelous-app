import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import { db } from '@/lib/firebaseConfig';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaUpload } from 'react-icons/fa';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

export default function CourseDetails() {
  const { query: { courseId }, back } = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ subjectCode: '', description: '', units: '', semester: '1st Sem' });
  const [selectedYearLevel, setSelectedYearLevel] = useState('1st Year');
  const [subjects, setSubjects] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    const fetchCourseDetails = async () => {
      try {
        const boardCourses = await getDocs(collection(db, 'Departments/Board Courses/Courses'));
        const nonBoardCourses = await getDocs(collection(db, 'Departments/Non-Board Courses/Courses'));

        const allCourses = [...boardCourses.docs, ...nonBoardCourses.docs];
        const foundCourse = allCourses.find((doc) => doc.id === courseId)?.data();

        if (foundCourse) {
          setCourse({ id: courseId, ...foundCourse });
          setSubjects(await getSubjects(courseId));
        }
      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  const getSubjects = async (courseId) => {
    const subjectsSnapshot = await getDocs(collection(db, 'Subjects'));
    return subjectsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(subject => subject.courseId === courseId);
  };

  const handleAddSubject = () => {
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ subjectCode: '', description: '', units: '', semester: '1st Sem' });
    setIsEditMode(false);
    setEditSubjectId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFormData(formData)) return;

    const subjectData = {
      ...formData,
      units: parseInt(formData.units, 10),
      yearLevel: selectedYearLevel,
      courseId: courseId,
    };

    try {
      if (isEditMode) {
        await setDoc(doc(db, 'Subjects', editSubjectId), subjectData);
        setSubjects(prev => prev.map(subject => (subject.id === editSubjectId ? subjectData : subject)));
      } else {
        await setDoc(doc(db, 'Subjects', formData.subjectCode), subjectData);
        setSubjects(prev => [...prev, { id: formData.subjectCode, ...subjectData }]);
      }
      setShowModal(false);
      Swal.fire({ icon: 'success', title: 'Success!', text: isEditMode ? 'Subject updated!' : 'Subject added!' });
    } catch (error) {
      console.error("Error saving subject:", error);
      Swal.fire({ icon: 'error', title: 'Error!', text: 'There was an error saving the subject.' });
    }
  };

  const validateFormData = ({ subjectCode, description, units }) => {
    if (!subjectCode || !description || isNaN(units) || units <= 0) {
      Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please fill in all fields correctly.' });
      return false;
    }
    return true;
  };

  const handleDeleteSubject = async (subjectId) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'Subjects', subjectId));
        setSubjects(prev => prev.filter(subject => subject.id !== subjectId));
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Subject has been deleted.' });
      } catch (error) {
        console.error("Error deleting subject:", error);
        Swal.fire({ icon: 'error', title: 'Error!', text: 'There was an error deleting the subject.' });
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);

      validateAndImportSubjects(json);
    };
    reader.readAsArrayBuffer(file);
  };

  const validateAndImportSubjects = async (data) => {
    const invalidEntries = data.filter(entry => !validateFormData(entry));
    if (invalidEntries.length > 0) {
      return Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Some entries are invalid. Please check the data.' });
    }

    try {
      await Promise.all(data.map(entry => {
        const subjectData = { ...entry, units: parseInt(entry.units, 10), courseId };
        return setDoc(doc(db, 'Subjects', entry.subjectCode), subjectData);
      }));
      setSubjects(await getSubjects(courseId));
      Swal.fire({ icon: 'success', title: 'Success!', text: 'Subjects imported successfully!' });
    } catch (error) {
      console.error("Error importing subjects:", error);
      Swal.fire({ icon: 'error', title: 'Error!', text: 'There was an error importing subjects.' });
    }
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} className="p-6">
        <button onClick={back} className="flex items-center mb-4 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition">
          <FaArrowLeft className="mr-2" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-6">{course?.name} ({course?.id})</h1>
        <div className="flex justify-end space-x-4">
        <input type="file" accept=".xlsx" onChange={handleFileUpload} className="hidden" id="file-upload" />
          <label htmlFor="file-upload" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:bg-primary-dark hover:shadow-lg hover:transform hover:scale-10">
            <FaUpload /> Upload Excel
          </label>
          <button onClick={handleAddSubject} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:scale-105 hover:bg-green-900">
            <FaPlus /> Add Subject
          </button>
          <select value={selectedYearLevel} onChange={(e) => setSelectedYearLevel(e.target.value)} className="rounded-lg bg-gray-100 border py-2 pl-4 pr-8">
            {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(year => <option key={year}>{year}</option>)}
          </select>
        </div>

        {['1st Sem', '2nd Sem'].map((semester) => {
          const semesterSubjects = subjects.filter(subject => subject.semester === semester && subject.yearLevel === selectedYearLevel);
          return semesterSubjects.length > 0 && (
            <div key={semester}>
              <h2 className="text-2xl font-semibold mt-8">{semester}</h2>
              <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-200 text-gray-600">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Units</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {semesterSubjects.map(subject => (
                    <tr key={subject.id} className="border-b border-gray-300 text-center">
                      <td className="py-2 px-4">{subject.subjectCode}</td>
                      <td className="py-2 px-4">{subject.description}</td>
                      <td className="py-2 px-4">{subject.units}</td>
                      <td className="py-2 px-4">
                        <button onClick={() => { setFormData(subject); setIsEditMode(true); setEditSubjectId(subject.id); setShowModal(true); }} className="text-primary bg-transparent hover:bg-slate-300 hover:text-primary-dark">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDeleteSubject(subject.id)} className="text-red-600 bg-transparent hover:bg-slate-300 hover:text-red-800">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 w-1/3">
                <h2 className="text-xl font-semibold">{isEditMode ? 'Edit Subject' : 'Add Subject'}</h2>
                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="mb-4">
                    <label className="block mb-2" htmlFor="subjectCode">Subject Code</label>
                    <input type="text" id="subjectCode" value={formData.subjectCode} onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })} required className="border border-gray-300 rounded px-4 py-2 w-full" />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2" htmlFor="description">Description</label>
                    <input type="text" id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required className="border border-gray-300 rounded px-4 py-2 w-full" />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2" htmlFor="units">Units</label>
                    <input type="number" id="units" value={formData.units} onChange={(e) => setFormData({ ...formData, units: e.target.value })} required className="border border-gray-300 rounded px-4 py-2 w-full" />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2" htmlFor="semester">Semester</label>
                    <select id="semester" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} className="border border-gray-300 rounded px-4 py-2 w-full">
                      {['1st Sem', '2nd Sem', 'Summer'].map(sem => <option key={sem} value={sem}>{sem}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 transition">{isEditMode ? 'Update Subject' : 'Add Subject'}</button>
                  <button type="button" onClick={() => setShowModal(false)} className="w-full mt-2 text-gray-500">Cancel</button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}