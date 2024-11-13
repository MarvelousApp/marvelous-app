import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { FaArrowLeft } from 'react-icons/fa';

export default function ScheduleDetailsPage() {
    const { query: { scheduleId }, back } = useRouter();
    const router = useRouter();
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!scheduleId) return;

            setLoading(true);

            try {
                // Fetch the schedule document using the scheduleId (courseId-subjectId)
                const scheduleRef = doc(db, 'Schedules', scheduleId);
                const scheduleDoc = await getDoc(scheduleRef);

                if (scheduleDoc.exists()) {
                    setSchedule(scheduleDoc.data());
                } else {
                    console.error('No such schedule!');
                }
            } catch (error) {
                console.error('Error fetching schedule:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [scheduleId]);

    // Helper function to get the current school year
    const getCurrentSchoolYear = () => {
        const currentYear = new Date().getFullYear();
        return new Date().getMonth() >= 6 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
    };

    if (!schedule) {
        return (
            <Layout>
                <div className="text-center p-6">
                    <h1 className="text-xl font-semibold text-red-500">Schedule not found.</h1>
                </div>
            </Layout>
        );
    }

    const {id, courseId, subjectId, days, description, room, semester, timeStart, timeEnd, teacher, yearLevel } = schedule;

    const qrCodeValue = `${window.location.origin}/attendance/mark/${scheduleId}?schoolYear=${getCurrentSchoolYear()}`;

    return (
        <Layout>
            <motion.div
                className="p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
            >
                <button onClick={back} className="flex items-center mb-4 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition">
                    <FaArrowLeft className="mr-2" /> Back
                </button>
                <h1 className="text-3xl font-bold mb-6 border-b pb-2">{description}</h1>

                <motion.div
                    className="p-4 bg-white rounded-lg shadow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* QR Code for Attendance */}
                    <div className="mt-6 flex justify-center items-center">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold mb-2">Scan QR Code for Attendance:</h3>
                            <QRCode value={qrCodeValue} size={256} />
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </Layout>
    );
}
