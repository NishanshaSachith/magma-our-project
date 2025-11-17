import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "../../components/ThemeContext/ThemeContext";
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from "../../services/api";
import { JobLoading } from "../../components/Loading/LoadingItems";

const TechnicianBarChart = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTechnicianData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/jobhome-technicians');
        const assignments = response.data;

        // Group assignments by technician and count them
        const technicianMap = {};
        assignments.forEach(assignment => {
          const techName = assignment.technician_name;
          technicianMap[techName] = (technicianMap[techName] || 0) + 1;
        });

        // Convert to array format for the chart
        const data = Object.entries(technicianMap)
          .map(([name, count]) => ({
            name: name.length > 15 ? name.substring(0, 15) + '...' : name,
            fullName: name,
            count: count
          }))
          .sort((a, b) => b.count - a.count) // Sort by count descending
          .slice(0, 15); // Show top 15 technicians

        setChartData(data);
      } catch (err) {
        setError('Failed to fetch technician data');
        console.error('Error fetching technician data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianData();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
        }`}>
          <p className="font-semibold">{data.fullName}</p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Total Jobs: <span className="font-bold text-blue-500">{data.count}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <JobLoading isDarkMode={isDarkMode} jobType="Technician Job Distribution" />;
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Technician Job Distribution
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
        Technician Job Distribution
      </h2>

      {chartData.length === 0 ? (
        <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          No technician data available
        </p>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkMode ? '#374151' : '#e5e7eb'}
              />
              <XAxis
                dataKey="name"
                stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis
                stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill={isDarkMode ? '#3b82f6' : '#2563eb'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 text-center">
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing top {chartData.length} technicians by job count
        </p>
      </div>
    </motion.div>
  );
};

export default TechnicianBarChart;
