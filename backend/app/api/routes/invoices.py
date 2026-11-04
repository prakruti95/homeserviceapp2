from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import DB, CurrentUser, AdminUser
from app.models.payment import Invoice
from app.models.booking import Booking
from app.models.user import UserRole
from app.schemas.payment import InvoiceResponse

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("", response_model=list[InvoiceResponse])
def list_invoices(
    db: DB,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[InvoiceResponse]:
    """List invoices visible to the current authenticated user."""
    query = db.query(Invoice)
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        query = query.filter(Invoice.customer_id == current_user.id)
    invoices = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()
    return [InvoiceResponse.model_validate(inv) for inv in invoices]


@router.get("/booking/{booking_id}", response_model=InvoiceResponse)
def get_invoice_by_booking(booking_id: int, db: DB, current_user: CurrentUser) -> InvoiceResponse:
    """Retrieve invoice by booking ID."""
    invoice = db.query(Invoice).filter(Invoice.booking_id == booking_id).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found for this booking")
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN) and invoice.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return InvoiceResponse.model_validate(invoice)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: DB, current_user: CurrentUser) -> InvoiceResponse:
    """Get single invoice details."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN) and invoice.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return InvoiceResponse.model_validate(invoice)
