import React, { useContext } from "react";
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import { motion } from 'framer-motion';
import { FaCode, FaLaptopCode, FaRocket, FaCogs, FaDatabase, FaCloud, FaShieldAlt, FaBug, FaUsers, FaCrown } from 'react-icons/fa';

const SoftwareEngineerTypes = () => {
  const { isDarkMode } = useContext(ThemeContext);

  const engineerTypes = [
    {
      title: "Junior Software Engineer",
      description: "Entry-level developer learning fundamentals and contributing to small features.",
      icon: <FaCode className="text-2xl" />,
      color: "text-green-500"
    },
    {
      title: "Mid-Level Software Engineer",
      description: "Experienced developer handling complex features and mentoring juniors.",
      icon: <FaLaptopCode className="text-2xl" />,
      color: "text-blue-500"
    },
    {
      title: "Senior Software Engineer",
      description: "Expert developer leading projects and making architectural decisions.",
      icon: <FaRocket className="text-2xl" />,
      color: "text-purple-500"
    },
    {
      title: "Lead Software Engineer",
      description: "Technical leader guiding teams and overseeing multiple projects.",
      icon: <FaCrown className="text-2xl" />,
      color: "text-yellow-500"
    },
    {
      title: "Full-Stack Developer",
      description: "Versatile engineer working on both frontend and backend technologies.",
      icon: <FaCogs className="text-2xl" />,
      color: "text-indigo-500"
    },
    {
      title: "Frontend Developer",
      description: "Specialist in user interface and user experience development.",
      icon: <FaLaptopCode className="text-2xl" />,
      color: "text-pink-500"
    },
    {
      title: "Backend Developer",
      description: "Expert in server-side logic, databases, and API development.",
      icon: <FaDatabase className="text-2xl" />,
      color: "text-orange-500"
    },
    {
      title: "DevOps Engineer",
      description: "Specialist in deployment, automation, and infrastructure management.",
      icon: <FaCloud className="text-2xl" />,
      color: "text-cyan-500"
    },
    {
      title: "Security Engineer",
      description: "Focused on implementing security measures and protecting systems.",
      icon: <FaShieldAlt className="text-2xl" />,
      color: "text-red-500"
    },
    {
      title: "QA Engineer",
      description: "Quality assurance specialist ensuring software reliability and performance.",
      icon: <FaBug className="text-2xl" />,
      color: "text-gray-500"
    },
    {
      title: "Mobile App Developer",
      description: "Specialist in developing applications for mobile platforms.",
      icon: <FaLaptopCode className="text-2xl" />,
      color: "text-teal-500"
    },
    {
      title: "Data Engineer",
      description: "Expert in data processing, analytics, and big data technologies.",
      icon: <FaDatabase className="text-2xl" />,
      color: "text-emerald-500"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Software Engineer Types
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {engineerTypes.map((type, index) => (
          <motion.div
            key={type.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-lg ${
              isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center mb-3">
              <div className={`${type.color} mr-3`}>
                {type.icon}
              </div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {type.title}
              </h3>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {type.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Displaying {engineerTypes.length} software engineer types
        </p>
      </div>
    </motion.div>
  );
};

export default SoftwareEngineerTypes;
