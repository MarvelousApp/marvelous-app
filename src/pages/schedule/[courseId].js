import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import Select from 'react-select';
import Swal from 'sweetalert2';

export default function ScheduleDetails() {
  const { query: { courseId }, back } = useRouter();
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [subjectsByYear, setSubjectsByYear] = useState({});
  const [editingSubject, setEditingSubject] = useState(null);
  const [editData, setEditData] = useState({});
  const [teacherOptions, setTeacherOptions] = useState([]);

  const semesterOptions = [
    { value: '1st Sem', label: '1st Semester' },
    { value: '2nd Sem', label: '2nd Semester' },
    { value: 'Summer', label: 'Summer' }
  ];

  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ].map(day => ({ value: day, label: day }));

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const querySnapshot = await getDocs(query(collection(db, 'Staff'), where('position', 'in', ['Teacher', 'Dean'])));
    const teachers = querySnapshot.docs.map((doc) => {
      const { firstName, lastName, course } = doc.data();
      return { value: doc.id, label: `${firstName} ${lastName} (${course})` };
    });
    setTeacherOptions(teachers);
  };

  const fetchSubjects = async (semester) => {
    const subjectSnapshots = await getDocs(query(
      collection(db, 'Subjects'), where('courseId', '==', courseId), where('semester', '==', semester)
    ));
    const subjects = subjectSnapshots.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    fetchSchedules(subjects);
  };

  const fetchSchedules = async (subjects) => {
    const scheduleSnapshots = await getDocs(query(collection(db, 'Schedules'), where('courseId', '==', courseId)));
    const schedules = Object.fromEntries(scheduleSnapshots.docs.map((doc) => [doc.data().subjectId, doc.data()]));

    const teacherMap = {};
    if (Object.values(schedules).some(({ teacher }) => teacher)) {
      const teacherIds = Array.from(new Set(Object.values(schedules).map(s => s.teacher).filter(Boolean)));
      const teacherSnapshots = await getDocs(query(collection(db, 'Staff'), where('__name__', 'in', teacherIds)));
      teacherSnapshots.forEach(doc => {
        const { firstName, lastName } = doc.data();
        teacherMap[doc.id] = `${firstName} ${lastName}`;
      });
    }

    const groupedSubjects = subjects.reduce((acc, subject) => {
      const schedule = schedules[subject.id] || {};
      acc[subject.yearLevel] = acc[subject.yearLevel] || [];
      acc[subject.yearLevel].push({ ...subject, ...schedule, teacher: teacherMap[schedule.teacher] || '' });
      return acc;
    }, {});

    setSubjectsByYear(groupedSubjects);
  };

  const checkAvailability = async (subjectId, room, teacher, timeStart, timeEnd, selectedDays) => {
    const scheduleSnapshots = await getDocs(query(collection(db, 'Schedules'), where('courseId', '==', courseId)));
    const schedules = scheduleSnapshots.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    for (const schedule of schedules) {
      if (schedule.subjectId !== subjectId) {
        const isSameRoom = schedule.room === room;
        const isSameTeacher = schedule.teacher === teacher;

        const isSameDay = schedule.days.some(day => selectedDays.includes(day));

        const overlap =
          (timeStart < schedule.timeEnd && timeEnd > schedule.timeStart);

        if ((isSameRoom || isSameTeacher) && isSameDay && overlap) {
          return true;
        }
      }
    }
    return false;
  };


  const handleSemesterChange = (selectedOption) => {
    setSelectedSemester(selectedOption);
    if (selectedOption) fetchSubjects(selectedOption.value);
  };

  const handleSaveClick = async (subjectId) => {
    const { room, teacher, timeStart, timeEnd, days } = editData;

    const conflict = await checkAvailability(subjectId, room, teacher, timeStart, timeEnd, days);
    if (conflict) {
      Swal.fire({
        icon: 'error',
        title: 'Scheduling Conflict',
        text: 'The selected room or teacher is already booked during this time.',
      });
      return;
    }

    await setDoc(doc(collection(db, 'Schedules'), `${courseId}-${subjectId}`), {
      courseId, subjectId, ...editData
    });
    if (selectedSemester) fetchSubjects(selectedSemester.value);
    setEditingSubject(null);
  };

  const handleInputChange = (field, value) => setEditData((prev) => ({ ...prev, [field]: value }));

  return (
    <Layout>
      <motion.div className="p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
        <motion.button onClick={back} className="flex items-center mb-4 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition"
          whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 300 }}>
          <FaArrowLeft className="mr-2" /> Back
        </motion.button>
        <h1 className="text-2xl font-bold mb-6 border-b pb-2">Schedule for {courseId}</h1>

        <Select options={semesterOptions} value={selectedSemester} onChange={handleSemesterChange} placeholder="Select Semester" className="mb-4" />

        {Object.keys(subjectsByYear).map((yearLevel) => (
          <div key={yearLevel} className="mb-6">
            <h2 className="text-xl font-bold mb-2">{yearLevel}</h2>
            <table className="min-w-full bg-white border border-gray-300 overflow-x-auto">
              <thead>
                <tr className="bg-gray-200 hidden md:table-row">
                  <th className="border px-4 py-2">Subject Code</th>
                  <th className="border px-4 py-2">Room</th>
                  <th className="border px-4 py-2">Teacher</th>
                  <th className="border px-4 py-2">Days</th>
                  <th className="border px-4 py-2">Time Start - End</th>
                  <th className="border px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {subjectsByYear[yearLevel].map((subject) => (
                  <tr key={subject.id} className="md:table-row flex flex-col md:flex-row border-b md:border-none mb-2 md:mb-0 p-4 md:p-0">
                    <td className="border px-4 py-2">
                      <span className="md:hidden font-bold">Subject Code:</span>
                      {subject.subjectCode}
                    </td>
                    <td className="border px-4 py-2">
                      <span className="md:hidden font-bold">Room:</span>
                      {editingSubject === subject.id ? (
                        <input type="text" value={editData.room || ''} onChange={(e) => handleInputChange('room', e.target.value)} className="border rounded px-2 py-1" />
                      ) : subject.room || ''}
                    </td>
                    <td className="border px-4 py-2">
                      <span className="md:hidden font-bold">Teacher:</span>
                      {editingSubject === subject.id ? (
                        <Select options={teacherOptions} value={teacherOptions.find((opt) => opt.value === editData.teacher)}
                          onChange={(selected) => handleInputChange('teacher', selected?.value || '')} placeholder="Select Teacher" isClearable />
                      ) : subject.teacher || ''}
                    </td>
                    <td className="border px-4 py-2">
                      <span className="md:hidden font-bold">Days:</span>
                      {editingSubject === subject.id ? (
                        <Select options={dayOptions} value={dayOptions.filter((opt) => editData.days?.includes(opt.value))}
                          onChange={(selectedOptions) => handleInputChange('days', selectedOptions.map((opt) => opt.value))} placeholder="Select Days" isMulti isClearable />
                      ) : subject.days?.join(', ') || ''}
                    </td>
                    <td className="border px-4 py-2">
                      <span className="md:hidden font-bold">Time:</span>
                      {editingSubject === subject.id ? (
                        <>
                          <input type="time" value={editData.timeStart || ''} onChange={(e) => handleInputChange('timeStart', e.target.value)} className="border rounded px-2 py-1 mr-1" />
                          <input type="time" value={editData.timeEnd || ''} onChange={(e) => handleInputChange('timeEnd', e.target.value)} className="border rounded px-2 py-1" />
                        </>
                      ) : `${subject.timeStart || ''} - ${subject.timeEnd || ''}`}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      {editingSubject === subject.id ? (
                        <>
                          <button onClick={() => handleSaveClick(subject.id)} className="text-green-600 mr-2 bg-transparent hover:bg-slate-300"><FaCheck /></button>
                          <button onClick={() => setEditingSubject(null)} className="text-red-600 bg-transparent hover:bg-slate-300"><FaTimes /></button>
                        </>
                      ) : (
                        <button onClick={() => { setEditingSubject(subject.id); setEditData(subject); }} className="text-primary bg-transparent hover:bg-slate-300"><FaEdit /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        ))}
      </motion.div>
    </Layout>
  );
}
