import React, { useEffect, useState, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { ThemeContext } from '../ThemeContext/ThemeContext';

const PaymentLineChart = ({ selectedDate }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchJobHomes = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await api.get('/job-homes');
        const processedData = processJobData(response.data, selectedDate);
        setData(processedData);
      } catch (error) {
        console.error('Error fetching job homes:', error);
      }
    };
    fetchJobHomes();
  }, [selectedDate]);

  const processJobData = (jobHomes, selectedDate) => {
    const daily = {};

    jobHomes.forEach(jobHome => {
      if (jobHome.payments) {
        jobHome.payments.forEach(payment => {
          const date = new Date(payment.date || payment.created_at);
          const dayKey = date.toISOString().split('T')[0];
          daily[dayKey] = (daily[dayKey] || 0) + parseFloat(payment.payment_amount || 0);
        });
      }
    });

    // Days in the selected month
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return d.toISOString().split('T')[0];
    });

    return days.map(day => ({
      date: day,
      amount: daily[day] || 0
    }));
  };

  return (
    <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <h3 className="text-lg font-semibold mb-4">Daily Payment Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaymentLineChart;
