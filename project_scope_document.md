# Project Scope Document: TVS PED Material Handling System

## 1. Project Overview
The **TVS PED Material Handling System** is a comprehensive web-based platform designed to digitize, track, and manage the end-to-end lifecycle of Material Handling (MH) equipment requests. The system streamlines the workflow from the initial request generation by employees to the final delivery and implementation by assigned vendors, ensuring full transparency, accountability, and standardized approval matrices.

## 2. Objectives
- **Digitize Workflows**: Eliminate manual and paper-based tracking of material handling asset requests.
- **Enforce Hierarchical Approvals**: Implement a strict, multi-tier validation and approval workflow (L1 Approver -> PED Engineer -> Designer -> Checker -> Final Approver).
- **Vendor & Asset Tracking**: Track vendor assignments, development milestones, lead times, and final asset delivery.
- **Real-Time Visibility**: Provide stakeholders with a centralized dashboard for KPIs, live statuses, and calendar-based tracking of delivery milestones.
- **Dynamic Role Management**: Allow administrative flexibility to create and manage custom roles without altering core system code.

## 3. In-Scope Features

### 3.1. User & Role Management
- Authentication and authorization framework.
- Dynamic custom role management (ability to add/edit custom roles via the UI).
- Core system roles mapping for workflow routing: `Requester`, `L1 Approver`, `PED Engineer`, `Designer`, `Checker`, `Final Approver`, `Admin`, and `Vendor`.

### 3.2. MH Request Workflow (State Machine)
- **Request Generation**: Requesters submit requirements for new or modified MH equipment.
- **L1 Validation**: L1 Approvers validate the feasibility of the request and assign it to a PED Engineer.
- **Design Phase**: PED Engineers assign a Designer. Designers upload CAD/design files.
- **Feedback Loop**: Checkers review designs. If requirements are not met, the request is reverted to the Designer or rejected back to the Requester with an automated email.
- **Final Approval**: Final Approvers sign off on the validated design.

### 3.3. Development & Vendor Tracking
- **MH Development Tracker**: Once approved, requests move to the development tracker to manage PR/PO release, vendor selection, sample production, and bulk lot readiness.
- **Vendor Management**: Maintain a registry of vendors, track their performance scores, and manage project milestones.

### 3.4. Dashboard & Analytics
- **KPI Metrics**: High-level overview of total requests, active requests, rejected requests, and implemented assets.
- **Live Status & Calendar**: A dynamic calendar view aggregating request creation dates, vendor delivery targets, and project milestones on a visual timeline.
- **Export Capabilities**: Export dashboard metrics to PDF, Excel, and PowerPoint.

### 3.5. Notifications
- Automated email notifications triggered by workflow state changes (e.g., notifying the L1 Approver upon new request submission, notifying the Requester upon rejection).

## 4. Out of Scope
- Direct integration with ERP systems (e.g., SAP) for automated PR/PO generation (unless explicitly defined in future phases).
- Financial accounting and payment processing for vendors.
- Mobile application development (the system is responsive web-based).

## 5. Technology Stack
- **Frontend**: React.js, Ant Design (UI Framework), Tailwind CSS, Vite.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose ODM).
- **Integrations**: Nodemailer (Email).

## 6. Success Criteria
- 100% digitization of the MH Request process.
- Reduction in approval turnaround times.
- Accurate reporting of vendor delivery timelines via the integrated calendar dashboard.
- Zero downtime during the deployment of dynamic role modifications.
