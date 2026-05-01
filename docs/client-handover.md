# Project Handover Document - Office Workstation Inventory Management System

## 1. Project Overview
The **Office Workstation Inventory Management System** was developed for **Eagle Eyes CCTV Solutions (Private) Limited** to help manage office devices, workstation allocations, repairs, replacements, alerts, and access requests in one centralized system.

This system allows the company to:
- Keep track of office assets such as machines, monitors, keyboards, mice, UPS units, and other equipment
- Assign assets to specific workstations
- Monitor repair activity and replacement usage
- View alerts and follow-up actions
- Manage user access requests in a controlled way

In simple terms, the system helps the company maintain better visibility over office equipment and reduce manual tracking.

## 2. System Access Details
- **Frontend URL:** `[ADD_FRONTEND_URL]`
- **Backend API URL:** `[ADD_BACKEND_API_URL]`
- **Admin Username:** `[ADD_USERNAME]`
- **Temporary Password:** `[ADD_PASSWORD]`

**Important Note:**  
The client should change the temporary password immediately after the first login.

## 3. Technology Stack
- **Frontend:** Next.js
  Used to build the main user interface and dashboard.
- **Backend:** Express.js / Node.js / TypeScript
  Used to handle business logic, API routes, and system rules.
- **Database:** PostgreSQL hosted on Neon
  Used to store assets, workstations, repair records, replacements, alerts, and users.
- **ORM:** Prisma
  Used to safely manage database access and queries.
- **Hosting / Deployment:** Vercel
  Used to host both the frontend and backend services.
- **Authentication:** Username/password with JWT and cookie-based authentication
  Used to secure user login and protect restricted areas of the system.

## 4. Main Features
### Dashboard
- Displays key counts and quick summaries
- Helps users see important system activity at a glance

### Workstations
- Shows all workstation records
- Displays workstation-related asset counts and details

### Assets
- Stores office asset information such as asset code, type, model, brand, and serial number
- Supports tracking of current location and workstation assignment

### Repairs
- Tracks faulty assets and repair activity
- Maintains repair history without deleting records

### Replacements
- Tracks temporary or permanent replacement assets
- Helps maintain service continuity when an original asset is unavailable

### Alerts
- Displays follow-up reminders and important notices related to workstation or asset activity

### Access Requests
- Allows new users to request system access
- Supports approval or rejection by administrators

### Admin Controls
- Admin-only controls are available for restricted actions such as asset deletion
- Sensitive actions are protected and validated by the backend

## 5. User Guide
### How to Login
1. Open the system URL in a browser.
2. Enter the assigned username.
3. Enter the password.
4. Click **Sign In**.
5. If logging in for the first time, change the temporary password when prompted.

### How to Add an Asset
1. Go to the **Assets** section.
2. Click **Add Asset**.
3. Fill in the asset details such as code, type, brand, model, serial number, and current location.
4. Save the form.

### How to Assign an Asset to a Workstation
1. Add the asset using the correct workstation code or assignment flow.
2. If the asset is linked to a workstation, the system creates an assignment record.
3. The workstation asset count should update automatically.

### How to View Workstation Details
1. Open the **Workstations** section.
2. Select the required workstation.
3. Review assigned assets, counts, and other related information.

### How to Log a Repair
1. Go to the **Repairs** section.
2. Click **Log Repair** or the relevant repair action.
3. Select the asset and complete the repair details.
4. Submit the repair record.

### How to Manage Replacements
1. Open the **Replacements** section.
2. Create a new replacement when a faulty asset needs a temporary or permanent substitute.
3. Save the replacement information.
4. Review replacement history as needed.

### How to Check Alerts
1. Open the **Alerts** section.
2. Review new, pending, or resolved alerts.
3. Follow the alert details to take action if needed.

### How to Logout
1. Click the **Logout** button from the dashboard layout or header.
2. The system will end the session and return to the login screen.

## 6. Admin Guide
### Admin Account Responsibility
- Admin accounts should only be used by authorized personnel.
- Admin users are responsible for access approvals, data review, and sensitive system actions.

### Password Security
- Change temporary passwords immediately.
- Use strong passwords and do not share credentials with unauthorized users.
- Rotate passwords periodically when required.

### Delete vs Archive Recommendation
- **Archive** is recommended for assets that have already been used in operations.
- **Delete** should only be used for clearly invalid or test records with no related history.
- Assets with repair, replacement, alert, or assignment history should generally not be hard deleted.

### Database Backup Importance
- Regular database backups are strongly recommended.
- The database contains operational history that should be preserved.

### User Access Request Handling
- Review each access request carefully before approving.
- Ensure the correct user role is assigned during approval.

## 7. Deployment Information
- **Frontend:** Deployed on Vercel
- **Backend:** Deployed on Vercel
- **Database:** Hosted on Neon PostgreSQL
- **Important:** Environment variables are required for system operation and should not be shared publicly.

## 8. Environment Variables
Below is a safe example format only. Do not place real secrets into shared documents.

```env
DATABASE_URL=
JWT_SECRET=
AUTH_SECRET=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=
USE_MOCK_DATA=false
NODE_ENV=production
```

## 9. Database Notes
- Assets and workstations are connected through the **WorkstationAsset** assignment table.
- This means the system separates:
  - the physical asset
  - the workstation
  - the assignment history between them
- Asset history should be preserved whenever possible.
- Avoid hard deleting records that already have repair, replacement, alert, or assignment history.

## 10. Backup and Maintenance
- Schedule regular database backups.
- Maintain secure password rotation for admin users.
- Monitor Vercel deployment logs for build or runtime issues.
- Plan dependency updates carefully instead of making frequent untested changes.
- Review production issues promptly to avoid service interruptions.

## 11. Known Limitations / Future Improvements
Possible future enhancements include:
- Change password UI
- Forgot password feature
- Account lock after repeated failed attempts
- Export reports
- Better activity logs
- Advanced role-based access

## 12. Support and Maintenance Plan
- **Free support period:** `[ADD_SUPPORT_PERIOD]`
- **Maintenance fee:** `[ADD_MONTHLY_FEE]`
- **Developer contact:** `[ADD_CONTACT_DETAILS]`

## 13. Final Handover Confirmation
- **Client Name:**  
- **Developer Name:**  
- **Date:**  
- **Signature:**  

