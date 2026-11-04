import logging
from datetime import time
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.database import engine, Base, SessionLocal
from app.models import user as user_model
from app.models import service as service_model
from app.models import provider as provider_model
from app.models import booking as booking_model
from app.models import payment as payment_model
from app.models import review as review_model
from app.models import notification as notification_model

from app.models.user import User, UserRole
from app.models.service import ServiceCategory, Service
from app.models.provider import ProviderProfile, ProviderAvailability

logger = logging.getLogger(__name__)


def init_db() -> None:
    """Create all tables and seed initial data."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully.")

    db: Session = SessionLocal()
    try:
        _seed_all_data(db)
    finally:
        db.close()


def _seed_all_data(db: Session) -> None:
    # 1. Seed Admin
    admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not admin:
        admin = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            full_name=settings.ADMIN_FULL_NAME,
            role=UserRole.ADMIN,
            phone="+1-800-555-0100",
            city="San Francisco",
            state="CA",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        logger.info(f"Admin user seeded: {settings.ADMIN_EMAIL}")

    # 2. Seed Demo Provider
    provider_user = db.query(User).filter(User.email == "provider@homeserve.com").first()
    if not provider_user:
        provider_user = User(
            email="provider@homeserve.com",
            hashed_password=hash_password("provider123"),
            full_name="Alex Masterson (ProFix)",
            phone="+1-800-555-0199",
            role=UserRole.PROVIDER,
            city="San Francisco",
            state="CA",
            zip_code="94103",
            address="456 Artisan Way",
            is_active=True,
        )
        db.add(provider_user)
        db.commit()
        db.refresh(provider_user)

        profile = ProviderProfile(
            user_id=provider_user.id,
            business_name="ProFix Home Solutions",
            bio="Licensed master technician with over 8 years experience in plumbing, electrical, and HVAC maintenance.",
            experience_years=8,
            hourly_rate=65.0,
            service_area="Greater Bay Area",
            is_verified=True,
            average_rating=4.9,
            total_reviews=42,
            total_bookings=56,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        # Add availability slots (Monday to Friday, 9:00 - 17:00)
        for day in range(5):
            slot = ProviderAvailability(
                provider_id=profile.id,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
                is_available=True,
            )
            db.add(slot)
        db.commit()
        logger.info("Demo Provider seeded: provider@homeserve.com")

    # 3. Seed Demo Customer
    customer = db.query(User).filter(User.email == "customer@homeserve.com").first()
    if not customer:
        customer = User(
            email="customer@homeserve.com",
            hashed_password=hash_password("customer123"),
            full_name="Emily Watson",
            phone="+1-800-555-0122",
            role=UserRole.CUSTOMER,
            city="San Francisco",
            state="CA",
            zip_code="94107",
            address="789 Pine Street, Apt 4B",
            is_active=True,
        )
        db.add(customer)
        db.commit()
        logger.info("Demo Customer seeded: customer@homeserve.com")

    # 4. Seed Demo Field Technician
    tech = db.query(User).filter(User.email == "technician@homeserve.com").first()
    if not tech:
        tech = User(
            email="technician@homeserve.com",
            hashed_password=hash_password("tech123"),
            full_name="Dave Miller (Field Specialist)",
            phone="+1-800-555-0155",
            role=UserRole.TECHNICIAN,
            city="San Francisco",
            state="CA",
            zip_code="94103",
            address="332 Mission St",
            is_active=True,
        )
        db.add(tech)
        db.commit()
        logger.info("Demo Technician seeded: technician@homeserve.com")

    # 4. Seed Categories and Services
    categories_data = [
        {
            "name": "Plumbing",
            "description": "Pipe repairs, drain cleaning, tap fixing, water heater installation",
            "icon": "Wrench",
            "services": [
                {"name": "Emergency Pipe Leak Repair", "description": "Immediate fix for bursting or leaking pipes", "base_price": 89.0, "duration_minutes": 60},
                {"name": "Drain Unclogging & Cleaning", "description": "High pressure chemical-free blockage removal", "base_price": 75.0, "duration_minutes": 45},
                {"name": "Water Heater Installation & Repair", "description": "Comprehensive inspection, element repair or new setup", "base_price": 149.0, "duration_minutes": 120},
                {"name": "Faucet & Sink Replacement", "description": "Removal of old fixtures and precision installation of new sinks", "base_price": 65.0, "duration_minutes": 45},
            ]
        },
        {
            "name": "Electrical",
            "description": "Wiring, switchboard repair, lighting setup, circuit breakers",
            "icon": "Zap",
            "services": [
                {"name": "Ceiling Fan & Chandelier Installation", "description": "Safe electrical mounting and balancing", "base_price": 69.0, "duration_minutes": 60},
                {"name": "Circuit Breaker Diagnostic & Repair", "description": "Troubleshoot tripping breakers and electrical surges", "base_price": 110.0, "duration_minutes": 90},
                {"name": "Smart Home Switches & Outlet Wiring", "description": "Upgrade home to IoT smart dimmers and grounded outlets", "base_price": 85.0, "duration_minutes": 60},
                {"name": "Full House Electrical Safety Audit", "description": "Thermal inspection, earthing test, and full safety report", "base_price": 129.0, "duration_minutes": 90},
            ]
        },
        {
            "name": "Deep Cleaning",
            "description": "Home sanitization, kitchen deep clean, carpet shampooing",
            "icon": "Sparkles",
            "services": [
                {"name": "Standard Home Deep Clean (2BHK/3BHK)", "description": "Floor scrubbing, dusting, window sills, disinfection", "base_price": 139.0, "duration_minutes": 180},
                {"name": "Kitchen Degreasing & Sanitization", "description": "Chimney, cabinets inside/out, stovetop grease removal", "base_price": 79.0, "duration_minutes": 120},
                {"name": "Bathroom Tile & Grout Restoration", "description": "Acid-free descaling, anti-fungal tile deep scrub", "base_price": 59.0, "duration_minutes": 75},
                {"name": "Upholstery & Sofa Shampooing", "description": "Fabric steam extraction and odor removal", "base_price": 89.0, "duration_minutes": 90},
            ]
        },
        {
            "name": "Appliance Repair",
            "description": "Air conditioner servicing, refrigerators, washing machines",
            "icon": "Cpu",
            "services": [
                {"name": "AC Gas Refill & Coil Deep Clean", "description": "Pressure wash outdoor/indoor units and refrigerant top-up", "base_price": 95.0, "duration_minutes": 90},
                {"name": "Refrigerator Cooling Diagnostic", "description": "Thermostat, compressor, and condenser troubleshooting", "base_price": 79.0, "duration_minutes": 60},
                {"name": "Washing Machine Drum & Motor Repair", "description": "Front/top load vibration fix and belt/bearing replacement", "base_price": 85.0, "duration_minutes": 75},
            ]
        },
        {
            "name": "Painting & Drywall",
            "description": "Wall painting, waterproof coating, plaster repair",
            "icon": "Paintbrush",
            "services": [
                {"name": "Interior Room Accent Wall Painting", "description": "Primer, 2 coats premium washable paint, clean edge taping", "base_price": 150.0, "duration_minutes": 240},
                {"name": "Drywall Patch & Crack Repair", "description": "Spackle, sand, and smooth texture matching", "base_price": 65.0, "duration_minutes": 60},
            ]
        }
    ]

    for cat_data in categories_data:
        cat = db.query(ServiceCategory).filter(ServiceCategory.name == cat_data["name"]).first()
        if not cat:
            cat = ServiceCategory(
                name=cat_data["name"],
                description=cat_data["description"],
                icon=cat_data["icon"],
                is_active=True,
            )
            db.add(cat)
            db.commit()
            db.refresh(cat)

            for s_data in cat_data["services"]:
                serv = Service(
                    category_id=cat.id,
                    name=s_data["name"],
                    description=s_data["description"],
                    base_price=s_data["base_price"],
                    duration_minutes=s_data["duration_minutes"],
                    is_active=True,
                )
                db.add(serv)
            db.commit()
            logger.info(f"Seeded category: {cat.name} with services")
