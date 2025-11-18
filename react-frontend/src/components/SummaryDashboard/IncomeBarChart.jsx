import React, { useEffect, useState, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { ThemeContext } from '../ThemeContext/ThemeContext';

const IncomeBarChart = ({ year, month }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchJobHomes = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await api.get('/job-homes');
        const processedData = processJobData(response.data, year, month);
        setData(processedData);
      } catch (error) {
        console.error('Error fetching job homes:', error);
      }
    };
    fetchJobHomes();
  }, [year, month]);

  const processJobData = (jobHomes, selectedYear, selectedMonth) => {
    // Group payments by month
    const monthly = {};

    jobHomes.forEach(jobHome => {
      if (jobHome.payments) {
        jobHome.payments.forEach(payment => {
          const date = new Date(payment.date || payment.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthly[monthKey] = (monthly[monthKey] || 0) + parseFloat(payment.payment_amount || 0);
        });
      }
    });

    // Show monthly data for the selected year
    if (selectedYear) {
      const months = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const key = `${selectedYear}-${String(month).padStart(2, '0')}`;
        return {
          month: key,
          amount: monthly[key] || 0
        };
      });
      return months;
    }

    // Last 12 months fallback
    const now = new Date();
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }).reverse();

    return last12Months.map(month => ({
      month,
      amount: monthly[month] || 0
    }));
  };

  return (
    <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <h3 className="text-lg font-semibold mb-4">Monthly Payment Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" fill="#8884d8" name="Amount" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeBarChart;
