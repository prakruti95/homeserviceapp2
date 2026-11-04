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
            "name": "Electrical",
            "description": "Wiring, circuit breakers, light fixtures, switchboards, and smart devices",
            "icon": "Zap",
            "image_url": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
            "services": [
                {"name": "Ceiling Fan & Chandelier Installation", "description": "Safe electrical mounting, balancing, and fixture setup", "base_price": 69.0, "duration_minutes": 60, "image_url": "https://images.unsplash.com/photo-1540518614846-7ede433c4ef9?auto=format&fit=crop&w=800&q=80"},
                {"name": "Circuit Breaker Diagnostic & Repair", "description": "Troubleshoot tripping breakers and electrical surges", "base_price": 110.0, "duration_minutes": 90, "image_url": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80"},
                {"name": "Smart Home Switches & Outlet Wiring", "description": "Upgrade home to IoT smart dimmers and grounded outlets", "base_price": 85.0, "duration_minutes": 60, "image_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80"},
                {"name": "Full House Electrical Safety Audit", "description": "Thermal inspection, earthing test, and full safety report", "base_price": 129.0, "duration_minutes": 90, "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"},
            ]
        },
        {
            "name": "Plumbing",
            "description": "Pipe repairs, leak detection, drain clearing, and bathroom fixture installations",
            "icon": "Wrench",
            "image_url": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
            "services": [
                {"name": "Emergency Pipe Leak Repair", "description": "Immediate fix for bursting or leaking residential water pipes", "base_price": 89.0, "duration_minutes": 60, "image_url": "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80"},
                {"name": "Drain Unclogging & Hydro-Jetting", "description": "Chemical-free blockage removal and pipeline clearance", "base_price": 75.0, "duration_minutes": 45, "image_url": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80"},
                {"name": "Water Heater Installation & Repair", "description": "Comprehensive heater inspection, heating element swap, or install", "base_price": 149.0, "duration_minutes": 120, "image_url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"},
                {"name": "Faucet & Sink Replacement", "description": "Precision mounting of modern kitchen and bathroom sink fixtures", "base_price": 65.0, "duration_minutes": 45, "image_url": "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80"},
            ]
        },
        {
            "name": "AC Repair",
            "description": "Air conditioner cooling diagnostics, refrigerant gas refills, and HVAC maintenance",
            "icon": "Snowflake",
            "image_url": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
            "services": [
                {"name": "AC Deep Foam Cleaning & Filter Wash", "description": "High-pressure chemical coil wash and anti-bacterial blower flush", "base_price": 79.0, "duration_minutes": 60, "image_url": "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80"},
                {"name": "AC Gas Leak Check & Refrigerant Refill", "description": "Freon / R32 gas pressure top-up and condenser line vacuum seal", "base_price": 95.0, "duration_minutes": 90, "image_url": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80"},
                {"name": "Complete Central HVAC Diagnostics", "description": "Thermostat troubleshooting, duct inspection, and airflow audit", "base_price": 120.0, "duration_minutes": 90, "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"},
                {"name": "New Split AC Mounting & Setup", "description": "Indoor and outdoor brackets mounting, copper piping, and testing", "base_price": 175.0, "duration_minutes": 180, "image_url": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80"},
            ]
        },
        {
            "name": "Home Cleaning",
            "description": "Full home deep sanitization, kitchen degreasing, bathroom descaling, and sofa care",
            "icon": "Sparkles",
            "image_url": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
            "services": [
                {"name": "Standard Full Home Deep Clean", "description": "Floor scrubbing, glass cleaning, dusting, and eco-friendly sanitization", "base_price": 139.0, "duration_minutes": 180, "image_url": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80"},
                {"name": "Kitchen Degreasing & Sanitization", "description": "Exhaust hood, stovetop, inside oven, and cabinets degreasing", "base_price": 79.0, "duration_minutes": 120, "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"},
                {"name": "Bathroom Tile & Grout Restoration", "description": "Acid-free limescale removal and grout anti-mold scrub", "base_price": 59.0, "duration_minutes": 75, "image_url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"},
                {"name": "Upholstery & Sofa Shampooing", "description": "Industrial fabric steam extraction, stain treatment, and deodorizing", "base_price": 89.0, "duration_minutes": 90, "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"},
            ]
        },
        {
            "name": "Painting",
            "description": "Interior and exterior wall painting, waterproof coatings, and plaster crack touch-ups",
            "icon": "Paintbrush",
            "image_url": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
            "services": [
                {"name": "Interior Room Accent Wall Painting", "description": "Surface prep, primer, 2 coats washable premium emulsion, edge taping", "base_price": 150.0, "duration_minutes": 240, "image_url": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80"},
                {"name": "Drywall Patch & Crack Restoration", "description": "Putty filling, sanding to smooth texture, and spot color matching", "base_price": 65.0, "duration_minutes": 60, "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"},
                {"name": "Full Living Room Repainting", "description": "Complete ceiling and wall refresh with dust-free sanding and roller coat", "base_price": 280.0, "duration_minutes": 360, "image_url": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80"},
            ]
        },
        {
            "name": "Carpentry",
            "description": "Custom wood crafting, furniture assembly, hinge replacements, and cabinet modifications",
            "icon": "Hammer",
            "image_url": "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
            "services": [
                {"name": "Furniture Assembly & Hardware Fitting", "description": "Assembly of flat-pack beds, wardrobes, desks, and shelf mounts", "base_price": 59.0, "duration_minutes": 60, "image_url": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80"},
                {"name": "Custom Wood Shelving & Cabinet Fix", "description": "Custom measurements, shelf brackets installation, and door alignment", "base_price": 99.0, "duration_minutes": 120, "image_url": "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80"},
                {"name": "Door Lock, Hinge & Latch Installation", "description": "Precision mortise cutting, high-security deadbolt and handle setup", "base_price": 75.0, "duration_minutes": 60, "image_url": "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80"},
            ]
        },
        {
            "name": "Appliance Repair",
            "description": "Troubleshooting and precision repair for refrigerators, washing machines, and ovens",
            "icon": "Cpu",
            "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
            "services": [
                {"name": "Refrigerator Cooling & Compressor Diagnostic", "description": "Defrost thermostat, relay switch, compressor gas, and door gasket check", "base_price": 79.0, "duration_minutes": 60, "image_url": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80"},
                {"name": "Washing Machine Drum & Motor Repair", "description": "Drainage pump clearing, belt drive replacement, and bearing fix", "base_price": 85.0, "duration_minutes": 75, "image_url": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80"},
                {"name": "Microwave & Oven Heating Element Fix", "description": "Magnetron replacement, door interlock safety, and heating coil service", "base_price": 65.0, "duration_minutes": 60, "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"},
            ]
        },
        {
            "name": "Pest Control",
            "description": "Targeted pest extermination, termite barriers, bed bug eradication, and eco-friendly sprays",
            "icon": "ShieldAlert",
            "image_url": "https://images.unsplash.com/photo-1632923891392-747656608552?auto=format&fit=crop&w=800&q=80",
            "services": [
                {"name": "General Pest & Insect Control", "description": "Odorless spray treatment targeting cockroaches, ants, and spiders", "base_price": 75.0, "duration_minutes": 60, "image_url": "https://images.unsplash.com/photo-1632923891392-747656608552?auto=format&fit=crop&w=800&q=80"},
                {"name": "Termite Inspection & Anti-Termite Barrier", "description": "Drill-fill-seal chemical barrier protection with warranty certificate", "base_price": 199.0, "duration_minutes": 180, "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"},
                {"name": "Bedbug Eradication & Steam Heat Treatment", "description": "Dual-action high temperature steam and targeted insecticide spray", "base_price": 140.0, "duration_minutes": 120, "image_url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"},
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
                image_url=cat_data.get("image_url"),
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
                    image_url=s_data.get("image_url"),
                    is_active=True,
                )
                db.add(serv)
            db.commit()
            logger.info(f"Seeded category: {cat.name} with services")
