import logging
import uuid
from datetime import datetime, date, time, timedelta, timezone
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models.user import User, UserRole, Customer, Address
from app.models.provider import (
    ProviderProfile, ServiceProvider, Technician, ServiceArea, AvailabilitySlot, ProviderAvailability
)
from app.models.service import ServiceCategory, Service
from app.models.booking import Booking, BookingStatus, BookingAssignment, BookingImage
from app.models.payment import Payment, PaymentMethod, PaymentStatus, Invoice, Coupon, ProviderEarning
from app.models.review import Review
from app.models.complaint import Complaint
from app.models.notification import Notification

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_demo_data():
    db: Session = SessionLocal()
    try:
        logger.info("Starting safe, idempotent database seeding...")

        # -------------------------------------------------------------
        # 1. ROLES & DEMO USERS
        # -------------------------------------------------------------
        users_data = [
            # Super Admin & Admin
            {
                "email": "superadmin@homeserve.com",
                "password": "superadmin123",
                "full_name": "Chief Executive (Super Admin)",
                "role": UserRole.SUPER_ADMIN,
                "phone": "+1-800-555-0001",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94105",
                "address": "500 Howard Street, Suite 400",
            },
            {
                "email": "admin@homeserve.com",
                "password": "admin123",
                "full_name": "Platform Administrator",
                "role": UserRole.ADMIN,
                "phone": "+1-800-555-0100",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94105",
                "address": "500 Howard Street, Operations Desk",
            },
            # Customers
            {
                "email": "customer@homeserve.com",
                "password": "customer123",
                "full_name": "Emily Watson",
                "role": UserRole.CUSTOMER,
                "phone": "+1-800-555-0122",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94107",
                "address": "789 Pine Street, Apt 4B",
            },
            {
                "email": "jason.customer@homeserve.com",
                "password": "customer123",
                "full_name": "Jason Brooks",
                "role": UserRole.CUSTOMER,
                "phone": "+1-800-555-0144",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94114",
                "address": "421 Castro Street",
            },
            {
                "email": "lisa.customer@homeserve.com",
                "password": "customer123",
                "full_name": "Lisa Chen",
                "role": UserRole.CUSTOMER,
                "phone": "+1-800-555-0166",
                "city": "Oakland",
                "state": "CA",
                "zip_code": "94612",
                "address": "1200 Grand Avenue, Unit 8",
            },
            # Providers
            {
                "email": "provider@homeserve.com",
                "password": "provider123",
                "full_name": "Alex Masterson",
                "role": UserRole.PROVIDER,
                "phone": "+1-800-555-0199",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94103",
                "address": "456 Artisan Way",
            },
            {
                "email": "spark@homeserve.com",
                "password": "provider123",
                "full_name": "Elena Rostova",
                "role": UserRole.PROVIDER,
                "phone": "+1-800-555-0211",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94102",
                "address": "880 Market St, Suite 300",
            },
            {
                "email": "cleanpro@homeserve.com",
                "password": "provider123",
                "full_name": "Mateo Hernandez",
                "role": UserRole.PROVIDER,
                "phone": "+1-800-555-0233",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94110",
                "address": "2500 Mission Street",
            },
            {
                "email": "craft@homeserve.com",
                "password": "provider123",
                "full_name": "Liam O'Connor",
                "role": UserRole.PROVIDER,
                "phone": "+1-800-555-0255",
                "city": "San Mateo",
                "state": "CA",
                "zip_code": "94401",
                "address": "150 B Street",
            },
            # Technicians
            {
                "email": "technician@homeserve.com",
                "password": "tech123",
                "full_name": "Dave Miller (HVAC & Lead)",
                "role": UserRole.TECHNICIAN,
                "phone": "+1-800-555-0155",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94103",
                "address": "332 Mission St",
            },
            {
                "email": "marcus.tech@homeserve.com",
                "password": "tech123",
                "full_name": "Marcus Vance (Electrical Specialist)",
                "role": UserRole.TECHNICIAN,
                "phone": "+1-800-555-0177",
                "city": "San Francisco",
                "state": "CA",
                "zip_code": "94109",
                "address": "1420 Van Ness Ave",
            },
            {
                "email": "sarah.tech@homeserve.com",
                "password": "tech123",
                "full_name": "Sarah Lin (Plumbing & Diagnostics)",
                "role": UserRole.TECHNICIAN,
                "phone": "+1-800-555-0188",
                "city": "Oakland",
                "state": "CA",
                "zip_code": "94607",
                "address": "550 7th Street",
            },
        ]

        users_by_email = {}
        for u_data in users_data:
            existing = db.query(User).filter(User.email == u_data["email"]).first()
            if not existing:
                user = User(
                    email=u_data["email"],
                    hashed_password=hash_password(u_data["password"]),
                    full_name=u_data["full_name"],
                    role=u_data["role"],
                    phone=u_data["phone"],
                    city=u_data["city"],
                    state=u_data["state"],
                    zip_code=u_data["zip_code"],
                    address=u_data["address"],
                    is_active=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info(f"Seeded user: {user.email} ({user.role.value})")
                users_by_email[u_data["email"]] = user
            else:
                users_by_email[u_data["email"]] = existing

        # -------------------------------------------------------------
        # 2. SEED CUSTOMER PROFILES & ADDRESSES
        # -------------------------------------------------------------
        for email in ["customer@homeserve.com", "jason.customer@homeserve.com", "lisa.customer@homeserve.com"]:
            c_user = users_by_email[email]
            cp = db.query(Customer).filter(Customer.user_id == c_user.id).first()
            if not cp:
                cp = Customer(
                    user_id=c_user.id,
                    loyalty_points=150,
                    preferred_payment_method="credit_card",
                    emergency_contact="+1-800-555-9111",
                    notes="Preferred morning arrival windows.",
                )
                db.add(cp)

            addr = db.query(Address).filter(Address.user_id == c_user.id, Address.label == "Primary Home").first()
            if not addr:
                addr = Address(
                    user_id=c_user.id,
                    label="Primary Home",
                    street_address=c_user.address or "123 Market St",
                    city=c_user.city or "San Francisco",
                    state=c_user.state or "CA",
                    zip_code=c_user.zip_code or "94103",
                    is_default=True,
                )
                db.add(addr)
        db.commit()

        # -------------------------------------------------------------
        # 3. SEED MULTIPLE PROVIDER PROFILES
        # -------------------------------------------------------------
        providers_spec = [
            {
                "email": "provider@homeserve.com",
                "business_name": "ProFix Home Solutions",
                "bio": "Licensed master contractors specialized in plumbing, HVAC maintenance, and general home repair.",
                "experience_years": 8,
                "hourly_rate": 65.0,
                "service_area": "Greater Bay Area",
                "is_verified": True,
                "rating": 4.9,
                "reviews": 46,
                "bookings": 62,
            },
            {
                "email": "spark@homeserve.com",
                "business_name": "SparkVolt Electrical & Smart Home",
                "bio": "Certified electrical contractors, smart switch installation, circuit diagnostics, and EV charging points.",
                "experience_years": 10,
                "hourly_rate": 80.0,
                "service_area": "San Francisco & Peninsula",
                "is_verified": True,
                "rating": 4.95,
                "reviews": 38,
                "bookings": 54,
            },
            {
                "email": "cleanpro@homeserve.com",
                "business_name": "EcoClean & PestGuard Solutions",
                "bio": "Eco-friendly deep cleaning, commercial sanitization, odorless pest control, and anti-termite barriers.",
                "experience_years": 6,
                "hourly_rate": 55.0,
                "service_area": "San Francisco, Oakland & Berkeley",
                "is_verified": True,
                "rating": 4.88,
                "reviews": 29,
                "bookings": 41,
            },
            {
                "email": "craft@homeserve.com",
                "business_name": "MasterCraft Carpentry & Interiors",
                "bio": "Bespoke woodwork, cabinetry, flat-pack assembly, drywall restoration, and modern hardware installation.",
                "experience_years": 5,
                "hourly_rate": 60.0,
                "service_area": "San Mateo & South Bay",
                "is_verified": False,  # Pending verification for demoing Admin approval/rejection!
                "rating": 4.75,
                "reviews": 12,
                "bookings": 18,
            },
        ]

        provider_profiles_by_email = {}
        for ps in providers_spec:
            p_user = users_by_email[ps["email"]]
            prof = db.query(ProviderProfile).filter(ProviderProfile.user_id == p_user.id).first()
            if not prof:
                prof = ProviderProfile(
                    user_id=p_user.id,
                    business_name=ps["business_name"],
                    bio=ps["bio"],
                    experience_years=ps["experience_years"],
                    hourly_rate=ps["hourly_rate"],
                    service_area=ps["service_area"],
                    is_verified=ps["is_verified"],
                    average_rating=ps["rating"],
                    total_reviews=ps["reviews"],
                    total_bookings=ps["bookings"],
                )
                db.add(prof)
                db.commit()
                db.refresh(prof)

                # Add availability slots
                for day in range(6):  # Monday - Saturday
                    slot = ProviderAvailability(
                        provider_id=prof.id,
                        day_of_week=day,
                        start_time=time(8, 30),
                        end_time=time(17, 30),
                        is_available=True,
                    )
                    db.add(slot)
                db.commit()
                logger.info(f"Seeded ProviderProfile: {prof.business_name} (Verified: {prof.is_verified})")
            provider_profiles_by_email[ps["email"]] = prof

        # -------------------------------------------------------------
        # 4. SEED AT LEAST 3 TECHNICIANS
        # -------------------------------------------------------------
        tech_specs = [
            {
                "email": "technician@homeserve.com",
                "provider_email": "provider@homeserve.com",
                "badge": "TECH-SF-0104",
                "skills": "HVAC Cooling, Hydro-Jetting, Emergency Plumbing, Safety Inspections",
                "vehicle": "Ford Transit Custom (Equipped)",
                "rating": 4.95,
            },
            {
                "email": "marcus.tech@homeserve.com",
                "provider_email": "spark@homeserve.com",
                "badge": "TECH-SF-0209",
                "skills": "Electrical Rewiring, Smart Home Dimmers, Breaker Panels, EV Chargers",
                "vehicle": "Nissan NV200 Cargo Van",
                "rating": 4.90,
            },
            {
                "email": "sarah.tech@homeserve.com",
                "provider_email": "cleanpro@homeserve.com",
                "badge": "TECH-SF-0315",
                "skills": "Deep Sanitization, Steam Upholstery, Chemical Soil Clearing, Pest Eradication",
                "vehicle": "Rivian Service Utility Truck",
                "rating": 4.98,
            },
        ]

        for ts in tech_specs:
            t_user = users_by_email[ts["email"]]
            p_user = users_by_email[ts["provider_email"]]
            tech_rec = db.query(Technician).filter(Technician.user_id == t_user.id).first()
            if not tech_rec:
                tech_rec = Technician(
                    user_id=t_user.id,
                    provider_id=p_user.id,
                    badge_number=ts["badge"],
                    skills=ts["skills"],
                    vehicle_type=ts["vehicle"],
                    is_available=True,
                    rating=ts["rating"],
                )
                db.add(tech_rec)
                db.commit()
                logger.info(f"Seeded Technician: {t_user.full_name} ({ts['badge']})")

        # -------------------------------------------------------------
        # 5. SEED BOOKINGS COVERING ALL STATUSES WITH INTERCONNECTED DATA
        # -------------------------------------------------------------
        all_services = db.query(Service).all()
        if not all_services:
            logger.warning("No services found in database; please ensure catalog is seeded.")
            return

        srv_by_name = {s.name: s for s in all_services}
        # Fallback service
        default_srv = all_services[0]

        customer1 = users_by_email["customer@homeserve.com"]
        customer2 = users_by_email["jason.customer@homeserve.com"]
        customer3 = users_by_email["lisa.customer@homeserve.com"]

        prov1 = users_by_email["provider@homeserve.com"]
        prov2 = users_by_email["spark@homeserve.com"]
        prov3 = users_by_email["cleanpro@homeserve.com"]

        tech1 = users_by_email["technician@homeserve.com"]
        tech2 = users_by_email["marcus.tech@homeserve.com"]
        tech3 = users_by_email["sarah.tech@homeserve.com"]

        demo_bookings_spec = [
            # 1. PENDING (New request awaiting provider response)
            {
                "reference": "HS-BK-DEMO-PEND01",
                "customer": customer1,
                "provider": prov1,
                "service": srv_by_name.get("Emergency Pipe Leak Repair", default_srv),
                "status": BookingStatus.PENDING,
                "date": date.today() + timedelta(days=2),
                "time": time(10, 0),
                "notes": "Water dripping under kitchen sink, please arrive with pipe fittings",
                "payment_status": None,
            },
            # 2. PENDING (New electrical request awaiting provider response)
            {
                "reference": "HS-BK-DEMO-PEND02",
                "customer": customer2,
                "provider": prov2,
                "service": srv_by_name.get("Smart Home Switches & Outlet Wiring", default_srv),
                "status": BookingStatus.PENDING,
                "date": date.today() + timedelta(days=3),
                "time": time(14, 0),
                "notes": "Install 4 smart dimmers in master bedroom",
                "payment_status": None,
            },
            # 3. CONFIRMED (Accepted by provider, waiting for field dispatch)
            {
                "reference": "HS-BK-DEMO-CONF01",
                "customer": customer3,
                "provider": prov3,
                "service": srv_by_name.get("Standard Full Home Deep Clean", default_srv),
                "status": BookingStatus.CONFIRMED,
                "date": date.today() + timedelta(days=1),
                "time": time(9, 30),
                "notes": "Eco-friendly supplies preferred. Key under door mat.",
                "payment_status": PaymentStatus.COMPLETED,
            },
            # 4. PROVIDER_ASSIGNED (Technician assigned, preparing dispatch)
            {
                "reference": "HS-BK-DEMO-ASGN01",
                "customer": customer1,
                "provider": prov2,
                "service": srv_by_name.get("Circuit Breaker Diagnostic & Repair", default_srv),
                "status": BookingStatus.PROVIDER_ASSIGNED,
                "date": date.today() + timedelta(days=1),
                "time": time(11, 0),
                "notes": "Main panel trips when dryer is turned on",
                "assigned_tech": tech2,
                "payment_status": PaymentStatus.COMPLETED,
            },
            # 5. IN_PROGRESS (Technician on site currently working)
            {
                "reference": "HS-BK-DEMO-PROG01",
                "customer": customer2,
                "provider": prov1,
                "service": srv_by_name.get("AC Deep Foam Cleaning & Filter Wash", default_srv),
                "status": BookingStatus.IN_PROGRESS,
                "date": date.today(),
                "time": time(9, 0),
                "notes": "Split AC in living room needs chemical wash",
                "assigned_tech": tech1,
                "payment_status": PaymentStatus.COMPLETED,
            },
            # 6. COMPLETED (Finished, paid, tax invoice generated & reviewed)
            {
                "reference": "HS-BK-DEMO-COMP01",
                "customer": customer1,
                "provider": prov1,
                "service": srv_by_name.get("Drain Unclogging & Hydro-Jetting", default_srv),
                "status": BookingStatus.COMPLETED,
                "date": date.today() - timedelta(days=2),
                "time": time(13, 0),
                "notes": "Main drainage cleared cleanly and checked with camera",
                "assigned_tech": tech1,
                "payment_status": PaymentStatus.COMPLETED,
                "review": {
                    "rating": 5,
                    "comment": "Outstanding work! Dave arrived exactly on time and cleared the stubborn kitchen line completely.",
                },
            },
            # 7. COMPLETED (Finished electrical inspection)
            {
                "reference": "HS-BK-DEMO-COMP02",
                "customer": customer2,
                "provider": prov2,
                "service": srv_by_name.get("Full House Electrical Safety Audit", default_srv),
                "status": BookingStatus.COMPLETED,
                "date": date.today() - timedelta(days=4),
                "time": time(10, 0),
                "notes": "Safety compliance inspection for tenant move-in",
                "assigned_tech": tech2,
                "payment_status": PaymentStatus.COMPLETED,
                "review": {
                    "rating": 5,
                    "comment": "Marcus was extremely thorough, identified two hazardous ungrounded sockets, and fixed them on the spot.",
                },
            },
            # 8. COMPLETED (Pest Control & Sanitization)
            {
                "reference": "HS-BK-DEMO-COMP03",
                "customer": customer3,
                "provider": prov3,
                "service": srv_by_name.get("General Pest & Insect Control", default_srv),
                "status": BookingStatus.COMPLETED,
                "date": date.today() - timedelta(days=5),
                "time": time(15, 0),
                "notes": "Seasonal perimeter ant barrier spray",
                "assigned_tech": tech3,
                "payment_status": PaymentStatus.COMPLETED,
                "review": {
                    "rating": 4,
                    "comment": "Prompt service and odorless spray. Very professional crew.",
                },
            },
            # 9. CANCELLED (Customer requested cancellation with reason)
            {
                "reference": "HS-BK-DEMO-CANC01",
                "customer": customer2,
                "provider": prov1,
                "service": srv_by_name.get("Water Heater Installation & Repair", default_srv),
                "status": BookingStatus.CANCELLED,
                "date": date.today() - timedelta(days=1),
                "time": time(16, 0),
                "notes": "Cancelled due to emergency travel conflict",
                "cancellation_reason": "Customer had to travel unexpectedly for business",
                "payment_status": None,
            },
            # 10. COMPLETED (AC Gas leak check)
            {
                "reference": "HS-BK-DEMO-COMP04",
                "customer": customer3,
                "provider": prov1,
                "service": srv_by_name.get("AC Gas Leak Check & Refrigerant Refill", default_srv),
                "status": BookingStatus.COMPLETED,
                "date": date.today() - timedelta(days=6),
                "time": time(11, 30),
                "notes": "Refrigerant pressure checked and sealed",
                "assigned_tech": tech1,
                "payment_status": PaymentStatus.COMPLETED,
                "review": {
                    "rating": 5,
                    "comment": "AC is cooling like brand new. Great upfront pricing with zero surprises.",
                },
            },
        ]

        for b_spec in demo_bookings_spec:
            b_ref = b_spec["reference"]
            existing_b = db.query(Booking).filter(Booking.booking_reference == b_ref).first()
            if not existing_b:
                srv = b_spec["service"]
                c_user = b_spec["customer"]
                p_user = b_spec["provider"]
                subtotal = srv.base_price
                discount = 0.0
                total_price = subtotal - discount

                booking = Booking(
                    booking_reference=b_ref,
                    customer_id=c_user.id,
                    provider_id=p_user.id,
                    service_id=srv.id,
                    status=b_spec["status"],
                    scheduled_date=b_spec["date"],
                    scheduled_time=b_spec["time"],
                    duration_minutes=srv.duration_minutes,
                    subtotal=subtotal,
                    discount_amount=discount,
                    tax_amount=0.0,
                    total_price=total_price,
                    address=c_user.address or "123 Market St",
                    city=c_user.city or "San Francisco",
                    zip_code=c_user.zip_code or "94103",
                    notes=b_spec.get("notes"),
                    cancellation_reason=b_spec.get("cancellation_reason"),
                )
                db.add(booking)
                db.commit()
                db.refresh(booking)

                # Assignment
                if "assigned_tech" in b_spec:
                    tech_u = b_spec["assigned_tech"]
                    assign = BookingAssignment(
                        booking_id=booking.id,
                        technician_id=tech_u.id,
                        assigned_by_id=p_user.id,
                        status="assigned" if b_spec["status"] != BookingStatus.COMPLETED else "completed",
                        notes="Priority service call",
                    )
                    db.add(assign)
                    db.commit()

                # Payment & Invoice & Provider Earnings
                if b_spec.get("payment_status") == PaymentStatus.COMPLETED:
                    amount = booking.total_price
                    platform_fee = round(amount * 0.10, 2)
                    provider_amount = round(amount - platform_fee, 2)
                    txn_id = f"TXN-DEMO-{uuid.uuid4().hex[:10].upper()}"

                    payment = Payment(
                        booking_id=booking.id,
                        user_id=c_user.id,
                        amount=amount,
                        platform_fee=platform_fee,
                        provider_amount=provider_amount,
                        payment_method=PaymentMethod.CREDIT_CARD,
                        status=PaymentStatus.COMPLETED,
                        transaction_id=txn_id,
                        is_demo=True,
                    )
                    db.add(payment)
                    db.commit()
                    db.refresh(payment)

                    # Invoice
                    inv_num = f"INV-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
                    inv = Invoice(
                        invoice_number=inv_num,
                        booking_id=booking.id,
                        customer_id=c_user.id,
                        subtotal=subtotal,
                        discount_amount=discount,
                        tax_amount=0.0,
                        total_amount=amount,
                        status="paid",
                        issued_date=b_spec["date"],
                        due_date=b_spec["date"],
                    )
                    db.add(inv)

                    # Provider Earnings
                    earning = ProviderEarning(
                        provider_id=p_user.id,
                        booking_id=booking.id,
                        gross_amount=amount,
                        platform_fee=platform_fee,
                        net_earnings=provider_amount,
                        status="available",
                    )
                    db.add(earning)
                    db.commit()

                # Review
                if "review" in b_spec and b_spec["status"] == BookingStatus.COMPLETED:
                    r_info = b_spec["review"]
                    rev = Review(
                        booking_id=booking.id,
                        customer_id=c_user.id,
                        provider_id=p_user.id,
                        rating=r_info["rating"],
                        comment=r_info["comment"],
                    )
                    db.add(rev)
                    db.commit()

                logger.info(f"Seeded Booking: {booking.booking_reference} ({booking.status.value})")

        # -------------------------------------------------------------
        # 6. SEED COMPLAINTS WITH DIFFERENT STATUSES
        # -------------------------------------------------------------
        complaints_spec = [
            {
                "ticket": "CMP-202611-OPEN01",
                "customer": customer1,
                "subject": "Arrival window delay question",
                "description": "Technician arrived 25 minutes after schedule window. Requesting confirmation of credit voucher policy.",
                "priority": "low",
                "status": "open",
                "resolution": None,
            },
            {
                "ticket": "CMP-202611-INVG01",
                "customer": customer2,
                "subject": "Drywall paint color touch-up",
                "description": "Small 2-inch patch on the corner requires one additional coat of paint matching the accent wall.",
                "priority": "medium",
                "status": "under_investigation",
                "resolution": None,
            },
            {
                "ticket": "CMP-202611-RESL01",
                "customer": customer3,
                "subject": "Warranty follow-up confirmation",
                "description": "Requesting official warranty certificate for the replaced water pressure regulator valve.",
                "priority": "low",
                "status": "resolved",
                "resolution": "Official 90-day parts and labor warranty certificate issued and emailed to homeowner.",
            },
        ]

        # Find any existing booking for complaints
        first_b = db.query(Booking).first()
        if first_b:
            for cs in complaints_spec:
                existing_c = db.query(Complaint).filter(Complaint.ticket_number == cs["ticket"]).first()
                if not existing_c:
                    comp = Complaint(
                        ticket_number=cs["ticket"],
                        booking_id=first_b.id,
                        customer_id=cs["customer"].id,
                        subject=cs["subject"],
                        description=cs["description"],
                        priority=cs["priority"],
                        status=cs["status"],
                        resolution_notes=cs["resolution"],
                        resolved_at=datetime.now(timezone.utc) if cs["status"] == "resolved" else None,
                    )
                    db.add(comp)
            db.commit()
            logger.info("Seeded complaints across statuses (open, under_investigation, resolved).")

        # -------------------------------------------------------------
        # 7. SEED NOTIFICATIONS FOR ALL 4 ROLES
        # -------------------------------------------------------------
        admin_user = users_by_email["admin@homeserve.com"]
        notifications_spec = [
            # Customer Notifications
            {
                "user_id": customer1.id,
                "title": "Booking Confirmed",
                "message": "Your booking for AC Deep Foam Cleaning has been scheduled for tomorrow at 10:00 AM.",
                "link": "/customer/bookings",
                "is_read": False,
            },
            {
                "user_id": customer1.id,
                "title": "Field Technician Assigned",
                "message": "Dave Miller (Badge #TECH-104) has been assigned to your service request.",
                "link": "/customer/bookings",
                "is_read": False,
            },
            {
                "user_id": customer1.id,
                "title": "Official Tax Invoice Ready",
                "message": "Invoice #INV-202611-345AF9 is now ready for digital print in your payments center.",
                "link": "/customer/payments",
                "is_read": True,
            },
            # Provider Notifications
            {
                "user_id": prov1.id,
                "title": "New Booking Request",
                "message": "Homeowner Emily Watson submitted an Emergency Pipe Leak Repair reservation.",
                "link": "/provider/bookings",
                "is_read": False,
            },
            {
                "user_id": prov1.id,
                "title": "Payout Deposited",
                "message": "$56.88 has been released to your available balance for booking #HS-BK-DEMO-COMP01.",
                "link": "/provider/earnings",
                "is_read": True,
            },
            # Technician Notifications
            {
                "user_id": tech1.id,
                "title": "New Work Order Dispatched",
                "message": "Dispatch assignment #104: Emergency Pipe Leak Repair at 789 Pine Street.",
                "link": "/technician/dashboard",
                "is_read": False,
            },
            {
                "user_id": tech2.id,
                "title": "Work Order Schedule Confirmed",
                "message": "Upcoming service at 421 Castro Street scheduled for 11:00 AM tomorrow.",
                "link": "/technician/dashboard",
                "is_read": False,
            },
            # Admin Notifications
            {
                "user_id": admin_user.id,
                "title": "New Partner Application",
                "message": "MasterCraft & Interiors (Liam O'Connor) submitted credentials for verification.",
                "link": "/admin/dashboard",
                "is_read": False,
            },
            {
                "user_id": admin_user.id,
                "title": "Customer Dispute Ticket Filed",
                "message": "Ticket #CMP-202611-OPEN01 was submitted under the 100% Satisfaction Guarantee.",
                "link": "/admin/complaints",
                "is_read": False,
            },
        ]

        for ns in notifications_spec:
            existing_n = db.query(Notification).filter(
                Notification.user_id == ns["user_id"],
                Notification.title == ns["title"],
            ).first()
            if not existing_n:
                notif = Notification(
                    user_id=ns["user_id"],
                    title=ns["title"],
                    message=ns["message"],
                    link=ns["link"],
                    is_read=ns["is_read"],
                )
                db.add(notif)
        db.commit()
        logger.info("Seeded notifications for Customer, Provider, Technician, and Admin roles.")

        logger.info("SAFE IDEMPOTENT DATABASE SEEDING COMPLETED SUCCESSFULLY!")

    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {str(e)}", exc_info=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
