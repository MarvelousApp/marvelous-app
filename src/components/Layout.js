import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaChalkboardTeacher, FaUniversity, FaHome, FaUsers, FaBook, FaBars, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

const navItems = [
  { href: "/dashboard", icon: <FaHome />, label: "Dashboard" },
  { href: "/staffs", icon: <FaChalkboardTeacher />, label: "Staffs" },
  { href: "/students", icon: <FaUsers />, label: "Students" },
  { href: "/subjects", icon: <FaBook />, label: "Subjects" },
];

const NavigationItem = ({ href, icon, label, isActive, onClick }) => (
  <Link href={href} onClick={onClick} aria-label={label}>
    <li
      className={`py-2 px-4 flex items-center gap-2 cursor-pointer hover:bg-gray-700 transition-colors duration-300 ease-in-out ${isActive ? "bg-gray-700" : ""}`}
    >
      {icon}
      {label}
    </li>
  </Link>
);

const LoadingScreen = () => {
  const dots = [0, 1, 2, 3]; // Array for dots animation
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative flex items-center">
        {dots.map((_, index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-blue-600 rounded-full mx-1"
            animate={{
              scale: [1, 1.5, 1], // Scale animation for dots
              opacity: [1, 0.5, 1], // Opacity animation for dots
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 0.1,
              ease: "easeInOut",
              times: [0, 0.5, 1],
              delay: index * 0.15, // Delay each dot's animation
            }}
          />
        ))}
      </div>
      <motion.div
        className="mt-4 text-lg font-semibold text-gray-800"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        exit={{ y: -20 }}
      >
        Loading...
      </motion.div>
    </motion.div>
  );
};


export default function Layout ({ children }) {
  const router = useRouter();
  const activeTab = router.pathname;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // Simulate loading time for demonstration
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Set loading to false after 2 seconds
    }, 2000); // Change this to your actual loading logic

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100 relative">
      {/* Top Navigation Bar (Mobile View) */}
      <header className="bg-gray-900 text-white flex justify-between items-center p-4 md:hidden">
        <div className="flex items-center">
          <FaUniversity className="mr-3 text-2xl" />
          <span className="text-2xl font-semibold">Marvelous Panel</span>
        </div>
        {/* Hamburger Menu Icon */}
        <div onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }} // Smooth easing
          className="absolute top-16 left-0 right-0 bg-gray-800 text-white md:hidden z-10"
        >
          <ul className="space-y-2 p-4">
            {navItems.map(({ href, icon, label }) => (
              <NavigationItem
                key={href}
                href={href}
                icon={icon}
                label={label}
                isActive={activeTab === href}
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push(href); // Ensure it navigates correctly
                }}
              />
            ))}
          </ul>
        </motion.nav>
      )}

      {/* Sidebar (Desktop View) */}
      <div className="hidden md:flex flex-1">
        <aside className="w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out">
          <div className="p-6 text-2xl font-semibold tracking-wider border-b border-gray-700 flex items-center">
            <FaUniversity className="mr-3 text-xl" />
            Marvelous Panel
          </div>

          {/* Navigation Links */}
          <nav className="mt-6">
            <ul className="space-y-2">
              {navItems.map(({ href, icon, label }) => (
                <NavigationItem
                  key={href}
                  href={href}
                  icon={icon}
                  label={label}
                  isActive={activeTab === href}
                  onClick={() => {}} // No need for onClick in sidebar
                />
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto text-primary">
          {loading ? (
            <LoadingScreen /> // Use the LoadingScreen component
          ) : (
            children // Render children when not loading
          )}
        </main>
      </div>

      {/* Main Content Area for Mobile */}
      <main className="flex-1 p-8 overflow-auto text-primary md:hidden">
        {loading ? (
          <LoadingScreen /> // Use the LoadingScreen component
        ) : (
          children // Render children when not loading
        )}
      </main>
    </div>
  );
};