import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { collection, setDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, limit, writeBatch } from 'firebase/firestore';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import Layout from '@/components/Layout';
import { db } from '@/lib/firebaseConfig';
import { FaEdit, FaTrash, FaSearch, FaSave, FaUndo } from 'react-icons/fa';

const GENDERS = ['Male', 'Female', 'Other'];
const POSITIONS = ['Teacher', 'Dean', 'Registrar'];

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    mobileNumber: '',
    position: '',
    department: '',
    course: '',
  });
  const [currentStaffId, setCurrentStaffId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [allCourses, setAllCourses] = useState({});
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const staffQuery = query(
        collection(db, 'Staff'), where("position", "!=", "Admin"), orderBy('staffId', 'asc')
      );
      const staffDocs = await getDocs(staffQuery);
      setStaff(staffDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const deptSnapshot = await getDocs(collection(db, 'Departments'));
      const departments = deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDepartments(departments);

      const coursesByDept = {};
      const courseQueries = departments.map(department =>
        getDocs(collection(db, `Departments/${department.id}/Courses`))
      );
      const courseSnapshots = await Promise.all(courseQueries);
      courseSnapshots.forEach((courseSnapshot, index) => {
        coursesByDept[departments[index].id] = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      });

      setAllCourses(coursesByDept);
    } catch (error) {
      console.error("Error fetching data: ", error);
      Swal.fire('Error!', 'There was an error fetching the data.', 'error');
    }
  };

  useEffect(() => {
    fetchCurrentStaffId();
    fetchData();
  }, []);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const fetchCurrentStaffId = async () => {
    const { staffId } = await getNextStaffId();
    setCurrentStaffId(staffId);
  };

  const getNextStaffId = async () => {
    const currentYear = '2008';
    const staffRef = collection(db, 'Staff');

    const latestStaffQuery = query(
      staffRef,
      orderBy('staffId', 'desc'),
      limit(1)
    );

    const latestStaffSnapshot = await getDocs(latestStaffQuery);

    let newIdNumber = !latestStaffSnapshot.empty
      ? parseInt(latestStaffSnapshot.docs[0].data().staffId.split('-')[1], 10) + 1
      : 1;

    return {
      staffId: `${currentYear}-${newIdNumber.toString().padStart(5, '0')}`,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, gender, mobileNumber, position, department, course } = formData;

    try {
      if (selectedStaff) {
        const staffRef = doc(db, 'Staff', selectedStaff.id);
        await updateDoc(staffRef, {
          firstName,
          lastName,
          gender,
          mobileNumber,
          position,
          department: position === 'Registrar' ? '' : department,
          course: position === 'Registrar' ? '' : course,
        });
        Swal.fire('Updated!', 'Staff member has been updated.', 'success');
      } else {
        const { staffId } = await getNextStaffId();
        const username = staffId;
        const password = `${firstName.slice(0, 2)}${lastName}`.toLowerCase();

        const staffRef = doc(db, 'Staff', staffId);
        await setDoc(staffRef, {
          firstName,
          lastName,
          gender,
          mobileNumber,
          position,
          department: position === 'Registrar' ? '' : department,
          course: position === 'Registrar' ? '' : course,
          staffId,
          username,
          password,
        });
        Swal.fire('Success!', 'Staff member has been added.', 'success');
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error("Error saving staff data: ", error);
      Swal.fire('Error!', 'There was an error saving the staff data.', 'error');
    }
  };

  const handleEdit = (staffMember) => {
    setFormData(staffMember);
    setCurrentStaffId(staffMember.staffId);
    setSelectedStaff(staffMember);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (staffMember) => {
    const confirmed = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this staff member!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });
    if (confirmed.isConfirmed) {
      try {
        const batch = writeBatch(db);
        const staffRef = doc(db, 'Staff', staffMember.id);
        batch.delete(staffRef);
        await batch.commit();
        Swal.fire('Deleted!', 'Staff member has been deleted.', 'success');
        await fetchData();
      } catch (error) {
        console.error("Error deleting staff member: ", error);
        Swal.fire('Error!', 'There was an error deleting the staff member.', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: '',
      mobileNumber: '',
      position: '',
      department: '',
      course: '',
    });
    setCurrentStaffId('');
    setSelectedStaff(null);
  };

  const filteredStaff = useMemo(() => staff.filter(({ firstName, lastName, position, department, course }) =>
    [firstName, lastName, position, department, course].some(field => field.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [staff, searchQuery]);

  const columns = useMemo(() => [
    { name: 'Name', selector: row => row.firstName + " " + row.lastName, sortable: true },
    { name: 'Position', selector: row => row.position, sortable: true },
    { name: 'Department', selector: row => row.department, sortable: true },
    { name: 'Course', selector: row => row.course, sortable: true },
    {
      cell: (row) => (
        <div className="flex space-x-2">
          <button onClick={() => handleEdit(row)} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
            <FaEdit />
          </button>
          <button onClick={() => handleDelete(row)} className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition">
            <FaTrash />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true
    }
  ], []);

  const customStyles = {
    rows: {
      style: {
        minHeight: '72px',
        '&:nth-child(odd)': { backgroundColor: '#f9f9f9' },
        '&:hover': { backgroundColor: '#f1f1f1' },
      },
    },
    headCells: {
      style: {
        backgroundColor: '#4B5563',
        color: '#ffffff',
        fontWeight: 'bold',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
  };

  const subHeaderComponentMemo = useMemo(() => (
    <div className="flex items-center p-2">
      <FaSearch className="text-gray-400 mr-2" />
      <input
        type="text"
        placeholder="Search Staff..."
        className="w-64 px-4 py-2 border border-gray-300 rounded-lg"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  ), [searchQuery]);

  return (
    <Layout>
      <motion.div className="p-4">
        <h2 className="text-2xl font-semibold">Staff Management</h2>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className="border rounded-md p-2"
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="border rounded-md p-2"
              required
            />
            <select
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="border rounded-md p-2"
              required
            >
              <option value="">Select Gender</option>
              {GENDERS.map(gender => <option key={gender} value={gender}>{gender}</option>)}
            </select>
            <input
              type="text"
              placeholder="Mobile Number"
              value={formData.mobileNumber}
              onChange={(e) => handleChange('mobileNumber', e.target.value)}
              className="border rounded-md p-2"
              required
            />
            <select
              value={formData.position}
              onChange={(e) => handleChange('position', e.target.value)}
              className="border rounded-md p-2"
              required
            >
              <option value="">Select Position</option>
              {POSITIONS.map(position => <option key={position} value={position}>{position}</option>)}
            </select>
            <select
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              className="border rounded-md p-2"
              disabled={formData.position === 'Registrar'}
              required={formData.position !== 'Registrar'}
            >
              <option value="">Select Department</option>
              {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </select>
            <select
              value={formData.course}
              onChange={(e) => handleChange('course', e.target.value)}
              className="border rounded-md p-2"
              disabled={formData.position === 'Registrar'}
              required={formData.position !== 'Registrar'}
            >
              <option value="">Select Course</option>
              {(allCourses[formData.department] || []).map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2 mt-5">
            <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"><FaSave className="inline mr-1" />{selectedStaff ? 'Update Staff' : 'Save'}</button>
            <button type="button" onClick={resetForm} className="bg-gray-300 text-white py-2 px-4 rounded-md hover:bg-gray-400"><FaUndo className="inline mr-1" />Reset</button>
          </div>
        </form>
        <div className="mt-8">
          <DataTable
            title="Staff List"
            columns={columns}
            data={filteredStaff}
            customStyles={customStyles}
            subHeader
            subHeaderComponent={subHeaderComponentMemo}
          />
        </div>
      </motion.div>
    </Layout>
  );
}
