import React, { useEffect, useState, useContext } from 'react';
import api from '../../services/api';
import { ThemeContext } from '../ThemeContext/ThemeContext';
import { motion } from 'framer-motion';

const KeyMetrics = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [metrics, setMetrics] = useState({
    totalJobs: 0,
    totalPayments: 0,
    completedJobs: 0,
    pendingJobs: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await api.get('/job-homes');
        const jobHomes = response.data;
        const totalJobs = jobHomes.length;
        const completedJobs = jobHomes.filter(job => job.job_status === 'complete').length;
        const pendingJobs = jobHomes.filter(job => job.job_status === 'Pending').length;
        const totalPayments = jobHomes.reduce((sum, job) => {
          if (job.payments) {
            return sum + job.payments.reduce((pSum, p) => pSum + parseFloat(p.payment_amount || 0), 0);
          }
          return sum;
        }, 0);

        setMetrics({
          totalJobs,
          totalPayments,
          completedJobs,
          pendingJobs
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { title: 'Total Jobs', value: metrics.totalJobs, color: 'bg-blue-500' },
    { title: 'Total Payments', value: `$${metrics.totalPayments.toFixed(2)}`, color: 'bg-green-500' },
    { title: 'Completed Jobs', value: metrics.completedJobs, color: 'bg-purple-500' },
    { title: 'Pending Jobs', value: metrics.pendingJobs, color: 'bg-orange-500' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`${card.color} text-white p-6 rounded-lg shadow-lg`}
        >
          <h3 className="text-lg font-semibold">{card.title}</h3>
          <p className="text-3xl font-bold">{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default KeyMetrics;
