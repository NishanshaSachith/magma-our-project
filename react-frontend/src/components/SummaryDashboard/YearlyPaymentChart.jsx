import React, { useEffect, useState, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { ThemeContext } from '../ThemeContext/ThemeContext';

const YearlyPaymentChart = ({ selectedYear }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchJobHomes = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await api.get('/job-homes');
        const processedData = processJobData(response.data, selectedYear);
        setData(processedData);
      } catch (error) {
        console.error('Error fetching job homes:', error);
      }
    };
    fetchJobHomes();
  }, [selectedYear]);

  const processJobData = (jobHomes, selectedYear) => {
    // Group payments by year
    const yearly = {};

    jobHomes.forEach(jobHome => {
      if (jobHome.payments) {
        jobHome.payments.forEach(payment => {
          const date = new Date(payment.date || payment.created_at);
          const yearKey = date.getFullYear().toString();
          yearly[yearKey] = (yearly[yearKey] || 0) + parseFloat(payment.payment_amount || 0);
        });
      }
    });

    // Years from selectedYear - 4 to selectedYear
    const years = Array.from({ length: 5 }, (_, i) => {
      const y = selectedYear - 4 + i;
      return y.toString();
    });

    return years.map(year => ({
      year,
      amount: yearly[year] || 0
    }));
  };

  return (
    <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <h3 className="text-lg font-semibold mb-4">Yearly Payment Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" fill="#82ca9d" name="Amount" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default YearlyPaymentChart;
