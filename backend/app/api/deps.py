from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# In-memory revocation cache for logged-out JWT tokens
REVOKED_TOKENS: set[str] = set()


def revoke_token(token: str) -> None:
    """Add a token to the revocation blacklist."""
    REVOKED_TOKENS.add(token)


def is_token_revoked(token: str) -> bool:
    """Check if token is in the revocation blacklist."""
    return token in REVOKED_TOKENS


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Extract and validate the current user from the JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if is_token_revoked(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been logged out/revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return user


def require_role(*roles: UserRole):
    """Return a dependency that ensures the current user has one of the specified roles."""
    # If ADMIN is in required roles, SUPER_ADMIN automatically has access
    expanded_roles = set(roles)
    if UserRole.ADMIN in expanded_roles:
        expanded_roles.add(UserRole.SUPER_ADMIN)

    def _checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in expanded_roles and current_user.role.value not in [r.value for r in expanded_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role(s): {[r.value for r in expanded_roles]}",
            )
        return current_user

    return _checker


# Convenience aliases
CurrentUser = Annotated[User, Depends(get_current_user)]
SuperAdminUser = Annotated[User, Depends(require_role(UserRole.SUPER_ADMIN))]
AdminUser = Annotated[User, Depends(require_role(UserRole.ADMIN))]
ProviderUser = Annotated[User, Depends(require_role(UserRole.PROVIDER))]
CustomerUser = Annotated[User, Depends(require_role(UserRole.CUSTOMER))]
TechnicianUser = Annotated[User, Depends(require_role(UserRole.TECHNICIAN))]
ProviderOrAdmin = Annotated[User, Depends(require_role(UserRole.PROVIDER, UserRole.ADMIN))]
WorkerUser = Annotated[User, Depends(require_role(UserRole.PROVIDER, UserRole.TECHNICIAN, UserRole.ADMIN))]
DB = Annotated[Session, Depends(get_db)]
CurrentToken = Annotated[str, Depends(oauth2_scheme)]
