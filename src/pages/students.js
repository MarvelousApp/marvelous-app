import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaSave, FaUndo } from 'react-icons/fa';
import Layout from '@/components/Layout';
import DataTable from 'react-data-table-component';
import { db } from '@/lib/firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, limit, setDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

const SEMESTERS = {
  '1st Sem': '1st Sem',
  '2nd Sem': '2nd Sem',
  'Summer': 'Summer'
};

const YEAR_LEVELS = {
  '1st Year': '1st Year',
  '2nd Year': '2nd Year',
  '3rd Year': '3rd Year',
  '4th Year': '4th Year'
};

const GENDERS = {
  male: 'Male',
  female: 'Female',
  other: 'Other'
};

const INITIAL_FORM_STATE = {
  firstName: '', middleName: '', lastName: '', gender: '',
  province: '', municipality: '', barangay: '', street: '',
  mobileNumber: '', dob: '', course: '', department: '', semester: '', yearLevel: ''
};

const getCurrentSchoolYear = () => {
  const currentYear = new Date().getFullYear();
  return new Date().getMonth() >= 6 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
};

const Select = ({ value, onChange, options = [], placeholder, disabled }) => (
  <select value={value} onChange={onChange} required disabled={disabled} className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
    <option value="">{placeholder}</option>
    {options.length > 0 ? (
      options.map(({ code, name }, index) => (
        <option key={code || index} value={code}>
          {name}
        </option>
      ))
    ) : (
      <option value="" disabled>No options available</option>
    )}
  </select>
);


export default function Students() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allCourses, setCourses] = useState({});
  const [currentStudent, setCurrentStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [currentSchoolId, setCurrentSchoolId] = useState('');

  const fetchData = (url, setter) => {
    fetch(url)
      .then(response => response.json())
      .then(data => setter(data));
  };

  useEffect(() => {
    fetchData('https://psgc.gitlab.io/api/provinces', setProvinces);
    fetchStudents();
    fetchDepartments();
    fetchCurrentSchoolId();
  }, [fetchData]);

  const fetchCurrentSchoolId = async () => {
    const { studentId } = await getNextStudentId();
    setCurrentSchoolId(studentId);
  };

  const fetchStudents = async () => {
    try {
      const studentsCollection = collection(db, 'Students');
      const studentSnapshot = await getDocs(studentsCollection);
      const studentsData = studentSnapshot.docs.map(doc => ({
        id: doc.id,
        studentId: doc.data().studentId,
        ...doc.data()
      }));

      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students: ', error);
      Swal.fire('Error!', 'There was an error fetching the student data.', 'error');
    }
  };

  const fetchDepartments = async () => {
    try {
      const deptSnapshot = await getDocs(collection(db, 'Departments'));
      const departments = deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDepartments(departments);

      const coursesByDept = {};
      for (const department of departments) {
        const courseSnapshot = await getDocs(collection(db, `Departments/${department.id}/Courses`));
        coursesByDept[department.id] = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      setCourses(coursesByDept);
    } catch (error) {
      console.error('Error fetching departments: ', error);
      Swal.fire('Error!', 'There was an error fetching the department data.', 'error');
    }
  };

  const getNextStudentId = async () => {
    const schoolYear = getCurrentSchoolYear();
    const currentYear = schoolYear.split('-')[0];
    const studentRef = collection(db, 'Students');

    const latestStudentQuery = query(
      studentRef,
      where('schoolYear', '==', schoolYear),
      orderBy('studentId', 'desc'),
      limit(1)
    );

    const latestStudentSnapshot = await getDocs(latestStudentQuery);

    let newIdNumber = !latestStudentSnapshot.empty
      ? parseInt(latestStudentSnapshot.docs[0].data().studentId.split('-')[1], 10) + 1
      : 1;

    return {
      studentId: `${currentYear}-${newIdNumber.toString().padStart(5, '0')}`,
      schoolYear
    };
  };

  const handleStudentSubmit = async (studentData) => {
    const schoolYear = getCurrentSchoolYear();
    const studentId = currentStudent ? currentStudent.id : await getNextStudentId().studentId;

    const username = studentId;
    const password = `${studentData.firstName.slice(0, 2)}${studentData.lastName.charAt(0).toUpperCase()}${studentData.lastName.slice(1).toLowerCase()}`;

    try {
      if (currentStudent) {
        await updateDoc(doc(db, 'Students', currentStudent.id), {
          ...studentData,
          schoolYear,
          studentId,
          username,
          password
        });
        Swal.fire('Success!', 'Student data has been updated.', 'success');
      } else {
        await setDoc(doc(db, 'Students', studentId), {
          ...studentData,
          schoolYear,
          studentId,
          username,
          password
        });
        Swal.fire('Success!', 'New student has been added.', 'success');
      }

      fetchStudents(); // Refresh the student list after saving
      resetForm(); // Reset form after submission
    } catch (error) {
      console.error('Error saving student data: ', error);
      Swal.fire('Error!', 'There was an error saving the student data.', 'error');
    }
  };

  const handleStudentDelete = async (studentId) => {
    const confirmDelete = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the student.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    });

    if (confirmDelete.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'Students', studentId));
        Swal.fire('Deleted!', 'Student has been deleted.', 'success');
        fetchStudents();
      } catch (error) {
        Swal.fire('Error!', 'There was an error deleting the student.', 'error');
      }
    }
  };

  const resetForm = () => {
    setCurrentStudent(null);
    setFormData(INITIAL_FORM_STATE);
    setMunicipalities([]);
    setBarangays([]);
  };

  const filteredStudents = useMemo(() =>
    students.filter(student => `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())),
    [students, searchQuery]
  );

  const handleEdit = (student) => {
    setFormData({
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      gender: student.gender,
      province: student.province,
      municipality: student.municipality,
      barangay: student.barangay,
      street: student.street,
      mobileNumber: student.mobileNumber,
      dob: student.dob,
      course: student.course,
      department: student.department,
      semester: student.semester,
      yearLevel: student.yearLevel
    });

    setCurrentStudent(student);
  };


  const columns = [
    { name: 'ID', selector: row => row.studentId, sortable: true },
    { name: 'Name', selector: row => `${row.firstName} ${row.lastName}`, sortable: true },
    {
      name: 'Actions',
      cell: row => (
        <>
          <button
            className="text-blue-600 hover:text-blue-800 mr-2 bg-transparent hover:bg-slate-300"
            onClick={() => handleEdit(row)}
          >
            <FaEdit />
          </button>
          <button
            className="text-red-600 hover:text-red-800 bg-transparent hover:bg-slate-300"
            onClick={() => handleStudentDelete(row.id)}
          >
            <FaTrashAlt />
          </button>
        </>
      ),
    },
  ];

  const subHeaderComponentMemo = useMemo(() => (
    <div className="flex items-center p-2">
      <FaSearch className="text-gray-400 mr-2" />
      <input
        type="text"
        placeholder="Search Student..."
        className="border rounded-md p-2 w-full"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
    </div>
  ), [searchQuery]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'department') {
      const selectedCourses = allCourses[value] || [];
      setFormData(prev => ({ ...prev, course: '', department: value }));
    }

    if (field === 'province') {
      // Reset municipality and barangay when province is changed
      setMunicipalities([]);
      setBarangays([]);
      fetchData(`https://psgc.gitlab.io/api/provinces/${value}/cities-municipalities`, setMunicipalities);
    }

    if (field === 'municipality') {
      // Fetch barangays based on municipality
      setBarangays([]);  // Reset barangays before fetching new ones
      fetchData(`https://psgc.gitlab.io/api/cities-municipalities/${value}/barangays`, setBarangays);
    }
  };

  // Effect to trigger fetching of municipalities when province is set
  useEffect(() => {
    if (formData.province) {
      fetchData(`https://psgc.gitlab.io/api/provinces/${formData.province}/cities-municipalities`, setMunicipalities);
    }
  }, [formData.province]);

  // Effect to trigger fetching of barangays when municipality is set
  useEffect(() => {
    if (formData.municipality) {
      fetchData(`https://psgc.gitlab.io/api/cities-municipalities/${formData.municipality}/barangays`, setBarangays);
    }
  }, [formData.municipality]);


  return (
    <Layout>
      <motion.div className="p-4">
        <h1 className="text-3xl font-bold mb-6 border-b pb-2">Student Management</h1>
        <form onSubmit={(e) => { e.preventDefault(); handleStudentSubmit(formData); resetForm(); }} className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input type="text" placeholder="First Name" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required className="border p-2 rounded-md" />
            <input type="text" placeholder="Last Name" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required className="border p-2 rounded-md" />
            <input type="text" placeholder="Middle Name" value={formData.middleName} onChange={(e) => handleChange('middleName', e.target.value)} required className="border p-2 rounded-md" />
            <Select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} options={Object.entries(GENDERS).map(([key, value]) => ({ code: key, name: value }))} placeholder="Select Gender" />
            <Select value={formData.department} onChange={(e) => handleChange('department', e.target.value)} options={departments} placeholder="Select Department" />
            <Select value={formData.course} onChange={(e) => handleChange('course', e.target.value)} options={allCourses[formData.department] || []} placeholder="Select Course" />
            <Select value={formData.province} onChange={(e) => handleChange('province', e.target.value)} options={provinces} placeholder="Select Province" />
            <Select value={formData.municipality} onChange={(e) => handleChange('municipality', e.target.value)} options={municipalities} placeholder="Select Municipality" />
            <Select value={formData.barangay} onChange={(e) => handleChange('barangay', e.target.value)} options={barangays} placeholder="Select Barangay" />
            <input type="text" placeholder="Street/Housing No." value={formData.street} onChange={(e) => handleChange('street', e.target.value)} className="border p-2 rounded-md" />
            <input type="text" placeholder="Mobile Number" value={formData.mobileNumber} onChange={(e) => handleChange('mobileNumber', e.target.value)} required className="border p-2 rounded-md" />
            <input type="date" value={formData.dob} onChange={(e) => handleChange('dob', e.target.value)} required className="border p-2 rounded-md" />
            <Select value={formData.semester} onChange={(e) => handleChange('semester', e.target.value)} options={Object.entries(SEMESTERS).map(([code, name]) => ({ code, name }))} placeholder="Select Semester" />
            <Select value={formData.yearLevel} onChange={(e) => handleChange('yearLevel', e.target.value)} options={Object.entries(YEAR_LEVELS).map(([code, name]) => ({ code, name }))} placeholder="Select Year Level" />
            <input type="text" value={getCurrentSchoolYear()} readOnly aria-label="Current School Year" className="border border-gray-300 p-3 rounded-md bg-gray-100 cursor-not-allowed" />
            <input type="text" value={currentSchoolId} readOnly className="border border-gray-300 p-3 rounded-md bg-gray-100 cursor-not-allowed" />
          </div>
          <div className='flex justify-end space-x-2 mt-5'>
            <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md mr-2">
              <FaSave className="inline mr-1" /> Save
            </button>
            <button type="button" onClick={resetForm} className="bg-gray-300 text-white py-2 px-4 rounded-md hover:bg-gray-400">
              <FaUndo className="inline mr-1" /> Reset
            </button>
          </div>
        </form>
        <DataTable
          columns={columns}
          data={filteredStudents}
          pagination
          subHeader
          subHeaderComponent={subHeaderComponentMemo}
        />
      </motion.div>
    </Layout>
  );
}