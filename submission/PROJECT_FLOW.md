# HomeServe Technologies – Comprehensive Project Flow & Architecture

This document contains architectural diagrams, sequence flows, and lifecycle state machines detailing how data and events traverse **HomeServe Technologies**.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (React 19 + Vite + Tailwind CSS)"]
        SPA["Single Page Application (Vite Dev / Vercel Edge)"]
        Router["React Router v7"]
        AxiosClient["Axios Interceptor (Bearer JWT)"]
        State["Auth Context & LocalStorage"]
    end

    subgraph APILayer ["API & Business Logic Layer (FastAPI)"]
        Proxy["CORS Middleware & Reverse Proxy"]
        AuthRouter["/api/auth (JWT + Bcrypt)"]
        BookingRouter["/api/bookings (Overlap Check & State Machine)"]
        PayRouter["/api/payments (10% Commission Engine)"]
        TechRouter["/api/technicians (Dispatch Hub)"]
        AdminRouter["/api/admin (Metrics & CSV Exports)"]
        HealthProbe["/health (DB Probe)"]
    end

    subgraph DataLayer ["Data & Persistence Layer (MySQL 8.4)"]
        ORM["SQLAlchemy 2.0 ORM Engine"]
        Pool["Connection Pool (pool_pre_ping=True)"]
        MySQL[("MySQL 8.4 Database (20 Entities)")]
    end

    SPA --> Router
    Router --> AxiosClient
    AxiosClient --> State
    AxiosClient -->|"HTTPS / JSON"| Proxy
    Proxy --> AuthRouter
    Proxy --> BookingRouter
    Proxy --> PayRouter
    Proxy --> TechRouter
    Proxy --> AdminRouter
    Proxy --> HealthProbe

    AuthRouter --> ORM
    BookingRouter --> ORM
    PayRouter --> ORM
    TechRouter --> ORM
    AdminRouter --> ORM
    HealthProbe --> ORM

    ORM --> Pool
    Pool --> MySQL
```

---

## 2. End-to-End Customer Booking Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as React Frontend
    participant API as FastAPI Backend
    participant DB as MySQL Database
    actor Provider
    actor Technician

    Customer->>Frontend: Select Service & Provider
    Frontend->>API: GET /providers/{id}/availability
    API->>DB: Query active availability slots
    DB-->>API: Return operating hours
    API-->>Frontend: Display open slots

    Customer->>Frontend: Enter Promo Code "WELCOME20"
    Frontend->>API: POST /coupons/validate
    API->>DB: Verify minimum order & usage limit
    DB-->>API: Valid (-20% discount)
    API-->>Frontend: Display final subtotal

    Customer->>Frontend: Submit Booking Reservation
    Frontend->>API: POST /bookings (date, time, address)
    API->>DB: Execute Concurrency Overlap Check
    alt Overlap Detected
        API-->>Frontend: HTTP 409 Conflict ("Time slot overlapping")
    else Slot Free
        API->>DB: INSERT booking (status: 'pending')
        DB-->>API: Booking ID & Reference HS-BK-...
        API-->>Frontend: HTTP 201 Created
    end

    Provider->>Frontend: View Incoming Orders
    Frontend->>API: PATCH /bookings/{id}/status (status: 'confirmed')
    API->>DB: Update booking status to 'confirmed'
    API-->>Frontend: Booking Confirmed

    Provider->>Frontend: Dispatch Field Technician
    Frontend->>API: POST /bookings/{id}/assign (tech_id)
    API->>DB: INSERT booking_assignment; status = 'provider_assigned'
    API-->>Frontend: Assignment Recorded

    Technician->>Frontend: Mobile Console - Mark Arrived & Start
    Frontend->>API: PATCH /bookings/{id}/status (status: 'in_progress')
    API->>DB: Update status to 'in_progress'

    Technician->>Frontend: Log Before/After Photo & Complete
    Frontend->>API: POST /bookings/{id}/images
    Frontend->>API: PATCH /bookings/{id}/status (status: 'completed')
    API->>DB: Record photo log; set status = 'completed'

    Customer->>Frontend: Sandbox Demo Payment
    Frontend->>API: POST /payments/process-demo
    API->>DB: Calculate 10% Platform Fee & 90% Provider Payout
    API->>DB: Auto-generate Tax Invoice INV-YYYYMM-...
    API-->>Frontend: Payment Success & Invoice Modal

    Customer->>Frontend: Post 5-Star Review
    Frontend->>API: POST /reviews
    API->>DB: INSERT review & recalculate provider avg rating
    API-->>Frontend: Review Recorded
```

---

## 3. Booking Lifecycle State Machine Flow

```mermaid
flowchart LR
    Pending["1. PENDING (Created by Customer)"] --> Confirmed["2. CONFIRMED (Accepted by Provider)"]
    Pending --> Rejected["REJECTED (Declined by Provider)"]
    Pending --> Cancelled["CANCELLED (Customer with Reason)"]

    Confirmed --> Assigned["3. PROVIDER_ASSIGNED (Technician Dispatched)"]
    Confirmed --> Cancelled

    Assigned --> InProgress["4. IN_PROGRESS (Technician On-Site)"]
    Assigned --> Cancelled

    InProgress --> Completed["5. COMPLETED (Signed Off + Photo Log)"]

    Completed --> Paid["6. PAID (Demo Checkout + 10% Fee)"]
    Paid --> Reviewed["7. REVIEWED (5-Star Rating Feedback)"]
```

---

## 4. Provider Lifecycle & Financial Settlement Flow

```mermaid
flowchart TD
    Order["Customer Booking Placed (Pending)"] --> Decision{"Provider Review"}
    Decision -->|"Decline"| RejectOrder["Booking Marked Rejected"]
    Decision -->|"Accept"| ConfirmOrder["Booking Marked Confirmed"]

    ConfirmOrder --> DispatchTech["Assign Technician from Staff List"]
    DispatchTech --> TechWork["Technician Performs On-Site Service"]
    TechWork --> JobDone["Technician Signs Off Service as Completed"]

    JobDone --> CustomerCheckout["Customer Completes Demo Payment"]
    CustomerCheckout --> DeductFee["System Calculates 10% Platform Commission"]
    DeductFee --> NetPayout["90% Net Earnings Credited to Provider Ledger"]
    NetPayout --> EarningDashboard["Reflected on Provider Earnings Portal"]
```

---

## 5. Dispute & Complaint Resolution Flow

```mermaid
flowchart TD
    CustDispute["Customer Files Complaint on Completed Booking"] --> TicketGen["System Generates Ticket CMP-YYYYMM-XXXXXX"]
    TicketGen --> AdminQueue["Appears in Admin Support Operations Hub"]
    AdminQueue --> Investigation["Admin Reviews Booking Notes, Work Photos, & Tech Log"]
    Investigation --> ResolutionAction["Admin Enters Resolution (e.g. Courtesy Credit / Retraining)"]
    ResolutionAction --> ResolveTicket["Status Updated to 'Resolved'"]
    ResolveTicket --> NotifyUser["Notification Pushed to Customer Dashboard"]
```
