# HomeServe Technologies – Database Schema Specification

**Database Engine:** MySQL 8.4 Community Server  
**ORM Framework:** SQLAlchemy 2.0 (Python 3.14 / PyMySQL Driver)  
**Encoding:** `utf8mb4` | **Collation:** `utf8mb4_unicode_ci`  
**Total Normalized Entities:** 20 Tables

---

## 1. Entity Overview & Data Dictionary

### 1. `users` (Core Identity & Authentication)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `email`: `VARCHAR(255) UNIQUE NOT NULL` (Indexed)
- `hashed_password`: `VARCHAR(255) NOT NULL` (Bcrypt salted hash `$2b$`)
- `full_name`: `VARCHAR(255) NOT NULL`
- `phone`: `VARCHAR(50) NULL`
- `role`: `ENUM('super_admin', 'admin', 'provider', 'technician', 'customer') NOT NULL DEFAULT 'customer'`
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
- `avatar_url`: `VARCHAR(512) NULL`
- `address`: `VARCHAR(255) NULL`
- `city`: `VARCHAR(100) NULL`
- `state`: `VARCHAR(50) NULL`
- `zip_code`: `VARCHAR(20) NULL`
- `created_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `updated_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

### 2. `customers` (Extended Homeowner Profile)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `user_id`: `INT UNIQUE NOT NULL` -> `users(id)` ON DELETE CASCADE
- `loyalty_points`: `INT NOT NULL DEFAULT 0`
- `preferred_payment_method`: `VARCHAR(50) NULL`
- `emergency_contact`: `VARCHAR(100) NULL`
- `notes`: `TEXT NULL`

### 3. `service_providers` (Contractor Business Profile)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `user_id`: `INT UNIQUE NOT NULL` -> `users(id)` ON DELETE CASCADE
- `business_name`: `VARCHAR(255) NOT NULL`
- `bio`: `TEXT NULL`
- `experience_years`: `INT NOT NULL DEFAULT 0`
- `hourly_rate`: `DECIMAL(10,2) NOT NULL DEFAULT 50.00`
- `service_area`: `VARCHAR(255) NULL`
- `is_verified`: `BOOLEAN NOT NULL DEFAULT FALSE` (Admin verified contractor badge)
- `license_number`: `VARCHAR(100) NULL`
- `commission_rate`: `DECIMAL(4,2) NOT NULL DEFAULT 0.10` (10% platform commission)
- `average_rating`: `DECIMAL(3,2) NOT NULL DEFAULT 5.00`
- `total_reviews`: `INT NOT NULL DEFAULT 0`
- `total_bookings`: `INT NOT NULL DEFAULT 0`

### 4. `technicians` (Field Dispatch Staff)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `user_id`: `INT UNIQUE NOT NULL` -> `users(id)` ON DELETE CASCADE
- `provider_id`: `INT NULL` -> `users(id)` ON DELETE SET NULL
- `badge_number`: `VARCHAR(50) UNIQUE NOT NULL`
- `skills`: `TEXT NULL`
- `vehicle_type`: `VARCHAR(100) NULL`
- `rating`: `DECIMAL(3,2) NOT NULL DEFAULT 5.00`
- `is_available`: `BOOLEAN NOT NULL DEFAULT TRUE`

### 5. `addresses` (Saved Customer Locations)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `user_id`: `INT NOT NULL` -> `users(id)` ON DELETE CASCADE
- `label`: `VARCHAR(100) NOT NULL DEFAULT 'Home'`
- `street_address`: `VARCHAR(255) NOT NULL`
- `unit`: `VARCHAR(50) NULL`
- `city`: `VARCHAR(100) NOT NULL`
- `state`: `VARCHAR(50) NOT NULL`
- `zip_code`: `VARCHAR(20) NOT NULL`
- `is_default`: `BOOLEAN NOT NULL DEFAULT FALSE`
- `created_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

### 6. `service_categories` (Catalog Verticals)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `name`: `VARCHAR(100) UNIQUE NOT NULL`
- `description`: `TEXT NULL`
- `icon`: `VARCHAR(50) NULL` (Lucide React icon name)
- `image_url`: `VARCHAR(512) NULL` (Thematic photography)
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`

### 7. `services` (Catalog Offerings)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `category_id`: `INT NOT NULL` -> `service_categories(id)` ON DELETE CASCADE
- `name`: `VARCHAR(255) NOT NULL`
- `description`: `TEXT NULL`
- `base_price`: `DECIMAL(10,2) NOT NULL`
- `duration_minutes`: `INT NOT NULL DEFAULT 60`
- `image_url`: `VARCHAR(512) NULL`
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`

### 8. `provider_services` (Many-to-Many Provider-Service Association)
- `provider_id`: `INT NOT NULL` -> `service_providers(id)` ON DELETE CASCADE
- `service_id`: `INT NOT NULL` -> `services(id)` ON DELETE CASCADE
- `PRIMARY KEY (provider_id, service_id)`

### 9. `service_areas` (Geographic Coverage)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `provider_id`: `INT NOT NULL` -> `service_providers(id)` ON DELETE CASCADE
- `city`: `VARCHAR(100) NOT NULL`
- `state`: `VARCHAR(50) NOT NULL`
- `zip_code`: `VARCHAR(20) NULL`
- `radius_km`: `DECIMAL(6,2) NOT NULL DEFAULT 25.0`
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`

### 10. `availability_slots` (Weekly Working Hours)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `provider_id`: `INT NOT NULL` -> `service_providers(id)` ON DELETE CASCADE
- `day_of_week`: `INT NOT NULL` (0 = Monday, 6 = Sunday)
- `start_time`: `TIME NOT NULL`
- `end_time`: `TIME NOT NULL`
- `is_available`: `BOOLEAN NOT NULL DEFAULT TRUE`

### 11. `bookings` (Primary Transactional Order)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `booking_reference`: `VARCHAR(50) UNIQUE NOT NULL` (e.g. `HS-BK-20261104-ABC123`)
- `customer_id`: `INT NOT NULL` -> `users(id)` ON DELETE CASCADE
- `provider_id`: `INT NULL` -> `users(id)` ON DELETE SET NULL
- `service_id`: `INT NOT NULL` -> `services(id)` ON DELETE CASCADE
- `scheduled_date`: `DATE NOT NULL`
- `scheduled_time`: `TIME NOT NULL`
- `duration_minutes`: `INT NOT NULL DEFAULT 60`
- `status`: `ENUM('pending', 'confirmed', 'provider_assigned', 'in_progress', 'completed', 'cancelled', 'rejected') NOT NULL DEFAULT 'pending'`
- `subtotal`: `DECIMAL(10,2) NOT NULL DEFAULT 0.00`
- `discount_amount`: `DECIMAL(10,2) NOT NULL DEFAULT 0.00`
- `tax_amount`: `DECIMAL(10,2) NOT NULL DEFAULT 0.00`
- `total_price`: `DECIMAL(10,2) NOT NULL DEFAULT 0.00`
- `coupon_id`: `INT NULL` -> `coupons(id)` ON DELETE SET NULL
- `address`: `VARCHAR(255) NOT NULL`
- `city`: `VARCHAR(100) NOT NULL`
- `zip_code`: `VARCHAR(20) NULL`
- `notes`: `TEXT NULL`
- `cancellation_reason`: `TEXT NULL`
- `created_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

### 12. `booking_assignments` (Technician Job Dispatches)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `booking_id`: `INT NOT NULL` -> `bookings(id)` ON DELETE CASCADE
- `technician_id`: `INT NOT NULL` -> `users(id)` ON DELETE CASCADE
- `assigned_by_id`: `INT NOT NULL` -> `users(id)` ON DELETE CASCADE
- `assigned_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `status`: `VARCHAR(50) NOT NULL DEFAULT 'assigned'`
- `notes`: `TEXT NULL`

### 13. `booking_images` (Work Verification Photos)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `booking_id`: `INT NOT NULL` -> `bookings(id)` ON DELETE CASCADE
- `image_url`: `VARCHAR(512) NOT NULL`
- `caption`: `VARCHAR(255) NULL`
- `image_type`: `ENUM('before', 'after', 'work_log', 'inspection') NOT NULL DEFAULT 'work_log'`
- `uploaded_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

### 14. `payments` (Financial Transactions & Fee Breakdown)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `booking_id`: `INT UNIQUE NOT NULL` -> `bookings(id)` ON DELETE CASCADE
- `user_id`: `INT NOT NULL` -> `users(id)` ON DELETE CASCADE
- `amount`: `DECIMAL(10,2) NOT NULL` (Gross total)
- `platform_fee`: `DECIMAL(10,2) NOT NULL DEFAULT 0.00` (10% platform commission)
- `provider_amount`: `DECIMAL(10,2) NOT NULL DEFAULT 0.00` (90% net provider payout)
- `payment_method`: `ENUM('credit_card', 'debit_card', 'wallet', 'cash') NOT NULL DEFAULT 'credit_card'`
- `status`: `ENUM('pending', 'completed', 'failed', 'refunded', 'paid') NOT NULL DEFAULT 'completed'`
- `transaction_id`: `VARCHAR(100) UNIQUE NOT NULL`
- `is_demo`: `BOOLEAN NOT NULL DEFAULT FALSE`
- `created_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

### 15. `invoices` (Automated Tax Invoicing)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `invoice_number`: `VARCHAR(50) UNIQUE NOT NULL` (e.g. `INV-202611-A1B2C3`)
- `booking_id`: `INT UNIQUE NOT NULL` -> `bookings(id)` ON DELETE CASCADE
- `customer_id`: `INT NOT NULL` -> `users(id)` ON DELETE CASCADE
- `subtotal`: `DECIMAL(10,2) NOT NULL`
- `discount_amount`: `DECIMAL(10,2) NOT NULL DEFAULT 0.00`
- `tax_amount`: `DECIMAL(10,2) NOT NULL DEFAULT 0.00`
- `total_amount`: `DECIMAL(10,2) NOT NULL`
- `status`: `VARCHAR(50) NOT NULL DEFAULT 'paid'`
- `issued_date`: `DATE NOT NULL`
- `due_date`: `DATE NOT NULL`

### 16. `coupons` (Promotion Engine)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `code`: `VARCHAR(50) UNIQUE NOT NULL` (e.g. `WELCOME20`, `SAVE10`)
- `discount_type`: `ENUM('percentage', 'flat') NOT NULL`
- `discount_value`: `DECIMAL(10,2) NOT NULL`
- `min_order_amount`: `DECIMAL(10,2) NOT NULL DEFAULT 0.00`
- `max_discount`: `DECIMAL(10,2) NULL`
- `usage_limit`: `INT NOT NULL DEFAULT 1000`
- `times_used`: `INT NOT NULL DEFAULT 0`
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`

### 17. `reviews` (Customer Star Feedback)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `booking_id`: `INT UNIQUE NOT NULL` -> `bookings(id)` ON DELETE CASCADE
- `customer_id`: `INT NOT NULL` -> `users(id)` ON DELETE CASCADE
- `provider_id`: `INT NOT NULL` -> `users(id)` ON DELETE CASCADE
- `rating`: `DECIMAL(2,1) NOT NULL` (1.0 to 5.0)
- `comment`: `TEXT NULL`
- `created_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

### 18. `complaints` (Disputes & Satisfaction Guarantee)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `ticket_number`: `VARCHAR(50) UNIQUE NOT NULL` (e.g. `CMP-202611-D1E2F3`)
- `booking_id`: `INT NOT NULL` -> `bookings(id)` ON DELETE CASCADE
- `customer_id`: `INT NOT NULL` -> `users(id)` ON DELETE CASCADE
- `subject`: `VARCHAR(255) NOT NULL`
- `description`: `TEXT NOT NULL`
- `priority`: `ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium'`
- `status`: `ENUM('open', 'under_investigation', 'resolved', 'closed') NOT NULL DEFAULT 'open'`
- `resolution`: `TEXT NULL`
- `created_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

### 19. `notifications` (Real-Time In-App Alerts)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `user_id`: `INT NOT NULL` -> `users(id)` ON DELETE CASCADE
- `title`: `VARCHAR(255) NOT NULL`
- `message`: `TEXT NOT NULL`
- `is_read`: `BOOLEAN NOT NULL DEFAULT FALSE`
- `link`: `VARCHAR(255) NULL` (Direct navigation path)
- `created_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

### 20. `provider_earnings` (Financial Ledger)
- `id`: `INT PRIMARY KEY AUTO_INCREMENT`
- `provider_id`: `INT NOT NULL` -> `users(id)` ON DELETE CASCADE
- `booking_id`: `INT UNIQUE NOT NULL` -> `bookings(id)` ON DELETE CASCADE
- `gross_amount`: `DECIMAL(10,2) NOT NULL`
- `platform_fee`: `DECIMAL(10,2) NOT NULL` (10% retained)
- `net_earnings`: `DECIMAL(10,2) NOT NULL` (90% payout)
- `status`: `VARCHAR(50) NOT NULL DEFAULT 'available'`
- `created_at`: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
