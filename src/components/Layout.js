import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FaChalkboardTeacher, FaUniversity, FaHome, FaUsers, FaBook, FaBars, FaTimes, FaSignOutAlt, FaClipboard, FaClipboardList, FaChartBar, FaCalendarWeek } from 'react-icons/fa';
import { getLocalStorageItem, removeLocalStorageItem } from '@/lib/storageHelper';

const navItems = [
  { href: "/dashboard", icon: <FaHome />, label: "Dashboard" },
  { href: "/staffs", icon: <FaChalkboardTeacher />, label: "Staffs" },
  { href: "/students", icon: <FaUsers />, label: "Students" },
  { href: "/subjects", icon: <FaBook />, label: "Subjects" },
  { href: "/schedule", icon: <FaCalendarWeek />, label: "Schedule" },
  { href: "/grade", icon: <FaClipboard />, label: "Grading" },
  { href: "/attendance", icon: <FaClipboardList />, label: "Attendance" },
  { href: "/report", icon: <FaChartBar />, label: "Report" },
];

const NavigationItem = ({ href, icon, label, isActive }) => (
  <Link href={href} aria-label={label}>
    <li className={`py-2 px-4 flex items-center gap-2 cursor-pointer hover:bg-gray-700 ${isActive ? "bg-gray-700" : ""}`}>
      {icon} {label}
    </li>
  </Link>
);

const LoadingScreen = () => {
  const dots = [0, 1, 2, 3];
  return (
    <motion.div className="flex flex-col items-center justify-center h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="relative flex items-center">
        {dots.map((_, index) => (
          <motion.div key={index} className="w-2 h-2 bg-blue-600 rounded-full mx-1" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1, ease: "easeInOut", times: [0, 0.5, 1], delay: index * 0.15 }} />
        ))}
      </div>
    </motion.div>
  );
};

console.log(getLocalStorageItem("userPosition"));

export default function Layout({ children }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = getLocalStorageItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    } else {
      router.push('/');
    }
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [router]);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleLogout = () => {
    removeLocalStorageItem("isAuthenticated");
    removeLocalStorageItem("userPosition");
    removeLocalStorageItem("userID");
    router.push('/');
  };



  const getFilteredNavItems = () => {
    const userPosition = getLocalStorageItem("userPosition");
    if (userPosition === "Dean") {
      return navItems.filter(item => !["Staffs", "Students"].includes(item.label));
    }
    if (userPosition === "Teacher") {
      return navItems.filter(item => !["Staffs", "Students", "Subjects", "Schedule"].includes(item.label));
    }
    if (userPosition === "Registrar") {
      return navItems.filter(item => !["Grading", "Attendance"].includes(item.label));
    }
    return navItems;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-gray-900 text-white flex justify-between items-center p-4 md:hidden">
        <div className="flex items-center">
          <FaUniversity className="mr-3 text-2xl" />
          <span className="text-2xl font-semibold">Marvelous Panel</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="text-xl">
            <FaSignOutAlt aria-label="Logout" />
          </button>
          <button onClick={toggleMenu} aria-label="Menu">
            {isMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2 }} className="absolute top-24 left-0 right-0 bg-gray-800 text-white md:hidden z-10">
          <ul className="space-y-2 p-4">
            {getFilteredNavItems().map(({ href, icon, label }) => (
              <NavigationItem key={href} href={href} icon={icon} label={label} isActive={router.pathname === href} />
            ))}
          </ul>
        </motion.nav>
      )}

      <div className="hidden md:flex h-screen">
        <aside className="w-64 bg-gray-900 text-white">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center">
              <FaUniversity className="mr-3 text-xl" />
              Marvelous Panel
            </div>
            <button onClick={handleLogout} className="text-xl">
              <FaSignOutAlt aria-label="Logout" />
            </button>
          </div>
          <nav className="mt-6">
            <ul className="space-y-2">
              {getFilteredNavItems().map(({ href, icon, label }) => (
                <NavigationItem key={href} href={href} icon={icon} label={label} isActive={router.pathname === href} />
              ))}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto">{loading ? <LoadingScreen /> : children}</main>
      </div>
      <main className="flex-1 p-8 overflow-auto md:hidden">{loading ? <LoadingScreen /> : children}</main>
    </div>
  );
}
