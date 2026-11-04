# HomeServe Technologies – User Stories Specification

This document details user stories and acceptance criteria across all four system roles: **Customer**, **Service Provider**, **Field Technician**, and **System/Super Administrator**.

---

## 1. Homeowner Customer User Stories

### US-CUST-01: Service Catalog & Visual Discovery
- **User Story**: As a homeowner, I want to browse services organized by category with pricing, duration, and imagery, so that I can quickly select the right repair or maintenance solution for my home.
- **Acceptance Criteria**:
  - *Given* I am on the home or browse page (`/services`).
  - *When* I filter by one of the 8 categories (e.g. Electrical, Plumbing, AC Repair) or type a search query.
  - *Then* matching services display fixed base price, duration, category icon, and realistic photography.

### US-CUST-02: Promotional Discount & Booking Checkout
- **User Story**: As a customer, I want to apply promotional coupon codes (e.g., `WELCOME20`, `SAVE10`) and pick an available date and time, so that I can reserve a verified provider with transparent discounts.
- **Acceptance Criteria**:
  - *Given* I select a service and certified provider.
  - *When* I enter valid coupon code `WELCOME20` on a qualifying subtotal.
  - *Then* the system deducts 20% from the subtotal and displays the discounted total before booking creation.

### US-CUST-03: Concurrency Overlap Protection
- **User Story**: As a customer, I want the system to ensure my requested provider is actually free, so that appointments do not conflict with existing jobs.
- **Acceptance Criteria**:
  - *Given* a provider already has an appointment from 14:00 to 15:00 on December 1st.
  - *When* I attempt to schedule an appointment with that provider at 14:30 on December 1st.
  - *Then* the API returns HTTP 409 Conflict with an informative message, prompting me to choose another slot.

### US-CUST-04: Digital Invoicing & Service Review
- **User Story**: As a customer, I want to pay for completed jobs securely and receive an itemized tax receipt and rate my technician, so that I maintain proof of service and reward good workmanship.
- **Acceptance Criteria**:
  - *Given* a booking is marked `completed`.
  - *When* I process demo checkout and view invoices.
  - *Then* an official tax receipt (`INV-YYYYMM-XXXXXX`) is displayed with print options, and I can submit a 1-5 star review.

---

## 2. Certified Service Provider User Stories

### US-PROV-01: Order Acceptance & Dispatch Queue
- **User Story**: As a service provider, I want to see incoming customer booking requests in real time with client address and scheduled window, so that I can review and accept or decline jobs.
- **Acceptance Criteria**:
  - *Given* a customer creates a new booking for my business.
  - *When* I view my Provider Dashboard (`/provider/dashboard`).
  - *Then* the order appears in the Pending Queue with inline **Accept** and **Decline** buttons.

### US-PROV-02: Field Technician Assignment
- **User Story**: As a provider, I want to assign a certified field technician to confirmed appointments, so that jobs are properly dispatched.
- **Acceptance Criteria**:
  - *Given* a booking is in `confirmed` status.
  - *When* I click "Assign Technician" and choose an available staff member.
  - *Then* the booking status updates to `provider_assigned`, and the job appears on the technician's mobile console.

### US-PROV-03: Financial Earnings & 10% Platform Fee Transparency
- **User Story**: As a provider, I want to inspect my gross bookings revenue, 10% platform fee deduction, and net take-home earnings, so that I have complete visibility into my payouts.
- **Acceptance Criteria**:
  - *Given* completed payments on my bookings.
  - *When* I navigate to the Earnings section (`/provider/earnings`).
  - *Then* gross amounts, 10% platform commissions, and 90% net take-home earnings are itemized with daily/weekly charts.

---

## 3. Field Technician User Stories

### US-TECH-01: Mobile Dispatch & GPS Directions
- **User Story**: As a mobile field technician, I want to view my daily work orders on my mobile device with 1-click GPS navigation, so that I can travel efficiently to customer premises.
- **Acceptance Criteria**:
  - *Given* I am logged into the Technician Dashboard (`/technician/dashboard`).
  - *When* I review an assigned work order.
  - *Then* the customer's street address, phone number, and a direct Google Maps link are accessible.

### US-TECH-02: Job State Progression & Arrival
- **User Story**: As a technician, I want to record my arrival on-site and mark work in-progress, so that both provider and customer are aware of job status.
- **Acceptance Criteria**:
  - *Given* an assigned work order.
  - *When* I tap "Mark Arrived on Site" and then "Start Work".
  - *Then* the assignment status updates to `in_progress`, and timestamps are recorded in the database.

### US-TECH-03: Work Log Photo Verification & Sign-Off
- **User Story**: As a technician, I want to attach before/after inspection photos and completion remarks, so that the customer and company have visual proof of service.
- **Acceptance Criteria**:
  - *Given* I am on-site executing a job.
  - *When* I upload an inspection photo via `/bookings/{id}/images` and tap "Sign Off & Complete".
  - *Then* images are persisted to the database and booking transitions to `completed`.

---

## 4. System & Super Administrator User Stories

### US-ADM-01: Global Platform Oversight & KPI Metrics
- **User Story**: As a Super Admin, I want to monitor global platform performance, active users, contractors, dispatches, and settled platform fees, so that I can evaluate business growth.
- **Acceptance Criteria**:
  - *Given* I am logged in with role `SUPER_ADMIN` or `ADMIN`.
  - *When* I load `/admin/dashboard`.
  - *Then* real-time metrics cards and 7-month revenue/bookings velocity charts load directly from MySQL queries.

### US-ADM-02: Provider Partner Verification Controls
- **User Story**: As an admin, I want to review contractor credentials and approve or revoke their verified status, so that only trustworthy professionals operate on the platform.
- **Acceptance Criteria**:
  - *Given* a newly registered or pending contractor (e.g. MasterCraft Carpentry).
  - *When* I click "Approve & Verify" or "Revoke / Suspend".
  - *Then* `PATCH /api/admin/providers/{id}/verify` updates `is_verified` in MySQL and immediately updates the badge in UI.

### US-ADM-03: 1-Click CSV Reporting Exports
- **User Story**: As an administrator, I want to export full platform booking records and financial revenue breakdowns to CSV files, so that I can perform offline accounting and audits.
- **Acceptance Criteria**:
  - *Given* I am on the Admin Dashboard.
  - *When* I click "Export Bookings CSV" or "Export Revenue CSV".
  - *Then* standard CSV formatted files download with complete transaction and customer metadata.

### US-ADM-04: Dispute Ticket Arbitration
- **User Story**: As an admin, I want to arbitrate customer dissatisfaction complaints, so that the platform's 100% Satisfaction Assurance guarantee is upheld.
- **Acceptance Criteria**:
  - *Given* an open customer dispute ticket (`CMP-YYYYMM-XXXXXX`).
  - *When* I review details and enter a resolution remark (e.g. courtesy credit issued).
  - *Then* ticket status transitions to `resolved` and customer is notified.
