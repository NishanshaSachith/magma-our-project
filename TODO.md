# Update Frontend to Use 'api' Service Instead of Direct Axios Calls

## Overview
Replace all direct axios calls in frontend components with the centralized 'api' service for consistency and proper backend connection to MongoDB.

## Files to Update
- [x] react-frontend/src/pages/JobHome/Payment.jsx (Already updated)
- [ ] react-frontend/src/context/AuthContext.jsx
- [ ] react-frontend/src/pages/home/home.jsx
- [ ] react-frontend/src/pages/JobHome/JobHome.jsx
- [ ] react-frontend/src/pages/JobHome/ImageUpload.jsx
- [ ] react-frontend/src/pages/JobHome/CancelJobPage.jsx
- [ ] react-frontend/src/pages/itim/ItimPage.jsx
- [ ] react-frontend/src/components/UserList/UserList.jsx
- [ ] react-frontend/src/components/SummaryDashboard/JobTitlePieChart.jsx
- [ ] react-frontend/src/components/SummaryDashboard/YearlyPaymentChart.jsx
- [ ] react-frontend/src/components/SummaryDashboard/PaymentLineChart.jsx
- [ ] react-frontend/src/components/SummaryDashboard/KeyMetrics.jsx
- [ ] react-frontend/src/components/SummaryDashboard/JobStatusPieChart.jsx
- [ ] react-frontend/src/components/SummaryDashboard/IncomePieChart.jsx
- [ ] react-frontend/src/components/SummaryDashboard/IncomeBarChart.jsx
- [ ] react-frontend/src/components/DocumentsLevel/Qutation/Quatation.jsx
- [ ] react-frontend/src/components/DocumentsLevel/Assign/AssignTechnician.jsx

## Steps for Each File
1. Replace `import axios from 'axios'` with `import api from '../../services/api'`
2. Replace all `axios.method(url, config)` calls with `api.method(url, data)` (remove withCredentials, headers since api handles them)
3. Update URLs to be relative (remove base URL like http://localhost:8000/api/)
4. Test the component after changes

## Testing Checklist
- [ ] Authentication still works
- [ ] API calls succeed
- [ ] Error handling displays properly
- [ ] UI updates correctly after API responses
