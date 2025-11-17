import React, { useEffect, useState, useContext } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import axios from 'axios';
import { ThemeContext } from '../ThemeContext/ThemeContext';

const JobStatusPieChart = ({ jobs }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (jobs) {
      const processedData = processJobData(jobs);
      setData(processedData);
    } else {
      const fetchJobs = async () => {
        try {
          const token = localStorage.getItem('authToken');
          const response = await axios.get('http://localhost:8000/api/job-homes', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const processedData = processJobData(response.data);
          setData(processedData);
        } catch (error) {
          console.error('Error fetching jobs:', error);
        }
      };
      fetchJobs();
    }
  }, [jobs]);

  const processJobData = (jobs) => {
    const statusCount = jobs.reduce((acc, job) => {
      const status = job.job_status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <h3 className="text-lg font-semibold mb-4">Job Status Summary</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default JobStatusPieChart;
