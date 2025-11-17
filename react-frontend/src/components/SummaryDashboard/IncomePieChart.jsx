import React, { useEffect, useState, useContext } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import axios from 'axios';
import { ThemeContext } from '../ThemeContext/ThemeContext';

const IncomePieChart = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:8000/api/job-homes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Process data for pie chart, e.g., sum by job_status or payment status
        const processedData = processJobData(response.data);
        setData(processedData);
      } catch (error) {
        console.error('Error fetching job homes:', error);
      }
    };
    fetchPayments();
  }, []);

  const processJobData = (jobHomes) => {
    // Group by job_status and sum payments
    const grouped = jobHomes.reduce((acc, jobHome) => {
      const status = jobHome.job_status || 'Unknown';
      const totalPayment = jobHome.payments ? jobHome.payments.reduce((sum, p) => sum + parseFloat(p.payment_amount || 0), 0) : 0;
      acc[status] = (acc[status] || 0) + totalPayment;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <h3 className="text-lg font-semibold mb-4">Payment Summary by Job Status</h3>
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

export default IncomePieChart;
