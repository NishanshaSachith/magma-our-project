# TODO for "New" Badge Implementation

## Backend Changes
- [x] Create migration to add 'state' column to jobhome_technicians table (default 'new')
- [x] Add routes for getting and updating job states
- [x] Implement getStates and updateState methods in JobHomeTechnicianController
- [x] Update assignTechnicians to set state='new' on new assignments
- [ ] Run the migration: `php artisan migrate`

## Frontend Changes
- [x] Add useState for jobStates in home.jsx
- [x] Fetch job states on component load
- [x] Display "New" badge for jobs with state='new'
- [x] Update state to 'opened' when job is clicked/opened

## Testing
- [ ] Test assigning a job to a technician - should show "New" badge
- [ ] Test opening the job - badge should disappear
- [ ] Test backend API endpoints
