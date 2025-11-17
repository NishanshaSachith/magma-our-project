import React, { useEffect, useState, useContext, useMemo } from "react";
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import { motion } from 'framer-motion';
import api from "../../services/api";
import { JobLoading } from "../../components/Loading/LoadingItems";

const ITEMS_PER_PAGE = 10;

// Helper function to format date and calculate relative time
const formatDateAndRelative = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let relativeTime;
  if (diffDays === 1) {
    relativeTime = '1 day ago';
  } else if (diffDays < 7) {
    relativeTime = `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    relativeTime = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    relativeTime = `${months} month${months > 1 ? 's' : ''} ago`;
  }

  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${formattedDate} (${relativeTime})`;
};

const TechnicianSummary = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [technicianData, setTechnicianData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchTechnicianSummary = async () => {
      try {
        setLoading(true);
        const response = await api.get('/jobhome-technicians');
        const assignments = response.data;

        const technicianMap = {};
        assignments.forEach(assignment => {
          const techName = assignment.technician_name;
          if (!technicianMap[techName]) {
            technicianMap[techName] = {
              name: techName,
              assignments: [],
              count: 0
            };
          }
          technicianMap[techName].assignments.push(assignment);
          technicianMap[techName].count += 1;
        });

        const summaryData = Object.values(technicianMap);
        setTechnicianData(summaryData);
      } catch (err) {
        setError('Failed to fetch technician data');
        console.error('Error fetching technician summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianSummary();
  }, []);

  const filteredData = useMemo(() => {
    return technicianData.filter(tech =>
      tech.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [technicianData, searchTerm]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let compare = 0;
      if (sortKey === 'name') {
        compare = a.name.localeCompare(b.name);
      } else if (sortKey === 'count') {
        compare = a.count - b.count;
      } else if (sortKey === 'lastAssignment') {
        const aDate = a.assignments.length ? new Date(a.assignments[0].assign_date) : new Date(0);
        const bDate = b.assignments.length ? new Date(b.assignments[0].assign_date) : new Date(0);
        compare = aDate - bDate;
      }
      return sortOrder === 'asc' ? compare : -compare;
    });
    return sorted;
  }, [filteredData, sortKey, sortOrder]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return <JobLoading isDarkMode={isDarkMode} jobType="Technician Data" />;
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Technician Summary
        </h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
    >
      <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Technician Summary
      </h2>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <input
          type="text"
          placeholder="Search technician..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex space-x-2">
          <button
            onClick={() => handleSort('name')}
            className={`px-3 py-1 rounded ${
              sortKey === 'name' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Sort by Name
          </button>
          <button
            onClick={() => handleSort('count')}
            className={`px-3 py-1 rounded ${
              sortKey === 'count' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Sort by Assignments
          </button>
          <button
            onClick={() => handleSort('lastAssignment')}
            className={`px-3 py-1 rounded ${
              sortKey === 'lastAssignment' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Sort by Last Assignment
          </button>
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          No technician assignments found
        </p>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {paginatedData.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {tech.name}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {tech.count} assignment{tech.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {tech.count}
                </div>
              </div>

              <div className="mt-2">
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Recent Assignments:
                </h4>
                <div className="space-y-1">
                  {tech.assignments.slice(0, 10).map((assignment, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-3 rounded ${
                        isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="font-medium">Job Home ID: {assignment.jobhome_id}</div>
                      <div className="mt-1 text-xs opacity-80">
                        Assigned: {formatDateAndRelative(assignment.assign_date)}
                      </div>
                      {assignment.status && (
                        <div className="mt-1">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            assignment.status === 'completed' ? 'bg-green-500 text-white' :
                            assignment.status === 'in_progress' ? 'bg-blue-500 text-white' :
                            'bg-yellow-500 text-white'
                          }`}>
                            {assignment.status}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {tech.assignments.length > 10 && (
                    <div className={`text-xs p-2 rounded ${isDarkMode ? 'text-gray-400 bg-gray-600' : 'text-gray-500 bg-gray-200'}`}>
                      ... and {tech.assignments.length - 10} more assignments
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-center space-x-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        <span className={`px-3 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200'}`}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </motion.div>
  );
};

export default TechnicianSummary;
