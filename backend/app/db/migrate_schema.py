import logging
from sqlalchemy import text, inspect
from app.db.database import engine, Base
import app.models  # ensure all models are registered with Base.metadata

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_migrations():
    logger.info("Starting schema migration...")
    with engine.connect() as conn:
        # 1. Update users.role ENUM
        try:
            conn.execute(text(
                "ALTER TABLE users MODIFY COLUMN role "
                "ENUM('SUPER_ADMIN','ADMIN','PROVIDER','CUSTOMER','TECHNICIAN') NOT NULL DEFAULT 'CUSTOMER'"
            ))
            conn.commit()
            logger.info("Updated users.role enum")
        except Exception as e:
            logger.warning(f"users.role alter: {e}")

        # 2. Update bookings.status ENUM
        try:
            conn.execute(text(
                "ALTER TABLE bookings MODIFY COLUMN status "
                "ENUM('PENDING','CONFIRMED','PROVIDER_ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED','REJECTED') "
                "NOT NULL DEFAULT 'PENDING'"
            ))
            conn.commit()
            logger.info("Updated bookings.status enum")
        except Exception as e:
            logger.warning(f"bookings.status alter: {e}")

        # 3. Add booking columns
        b_cols = [
            ("booking_reference", "VARCHAR(50) NULL UNIQUE"),
            ("subtotal", "FLOAT NOT NULL DEFAULT 0.0"),
            ("discount_amount", "FLOAT NOT NULL DEFAULT 0.0"),
            ("tax_amount", "FLOAT NOT NULL DEFAULT 0.0"),
            ("coupon_id", "INT NULL"),
        ]
        for col_name, col_def in b_cols:
            try:
                conn.execute(text(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_def}"))
                conn.commit()
                logger.info(f"Added {col_name} to bookings")
            except Exception as e:
                pass

        # 4. Update payments.status ENUM and fields
        try:
            conn.execute(text(
                "ALTER TABLE payments MODIFY COLUMN status "
                "ENUM('PENDING','PAID','COMPLETED','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING'"
            ))
            conn.commit()
            logger.info("Updated payments.status enum")
        except Exception as e:
            logger.warning(f"payments.status alter: {e}")

        p_cols = [
            ("platform_fee", "FLOAT NOT NULL DEFAULT 0.0"),
            ("provider_amount", "FLOAT NOT NULL DEFAULT 0.0"),
            ("is_demo", "BOOLEAN NOT NULL DEFAULT 1"),
        ]
        for col_name, col_def in p_cols:
            try:
                conn.execute(text(f"ALTER TABLE payments ADD COLUMN {col_name} {col_def}"))
                conn.commit()
                logger.info(f"Added {col_name} to payments")
            except Exception as e:
                pass

    # 5. Create all new tables
    Base.metadata.create_all(bind=engine)
    logger.info("Base.metadata.create_all completed.")

    insp = inspect(engine)
    tables = insp.get_table_names()
    logger.info(f"Total tables in database ({len(tables)}): {sorted(tables)}")
    return tables


if __name__ == "__main__":
    run_migrations()
