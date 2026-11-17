"""
app/api/v1/auth.py
──────────────────
Authentication router providing JWT token issuance, session verification,
and demo user switching for judicial roles.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Header, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _verify_password(plain: str, hashed: str) -> bool:
    """Verify bcrypt hash; also allow legacy demo plain-prefix for seeded demo users."""
    if hashed.startswith("demo_"):
        return True  # demo seed – password check skipped
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """
    Extract user from Bearer JWT.
    If no header is provided, falls back to the primary default user (judge or clerk)
    to maintain seamless legal workstation demo flow.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email:
                user = db.query(User).filter(User.email == email).first()
                if user:
                    return user
        except JWTError:
            pass

    # Fallback to first active user in database
    default_user = db.query(User).filter(User.is_active == True).first()
    if default_user:
        return default_user

    # In-memory fallback if DB has no users yet
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No active user session found.",
    )


def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role).lower()
        if user_role not in [r.lower() for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of roles {allowed_roles}, your role is {user_role}",
            )
        return current_user
    return role_checker


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user")
def read_current_user(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
        is_active=current_user.is_active,
    )


@router.post("/login", response_model=TokenResponse, summary="Log in with email and password")
def login(request: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == request.email).first()
    # Verify bcrypt password; also allow demo plain-text hash prefix for seeded demo users
    if not user or not _verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(data={"sub": user.email, "role": str(user.role)})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            is_active=user.is_active,
        ),
    )


@router.get("/demo-users", response_model=List[UserResponse], summary="List available demo profiles")
def list_demo_users(db: Session = Depends(get_db)) -> List[UserResponse]:
    if not settings.demo_mode:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Demo mode is disabled.")
    users = db.query(User).filter(User.is_active == True).all()
    return [
        UserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role.value if hasattr(u.role, "value") else str(u.role),
            is_active=u.is_active,
        )
        for u in users
    ]


@router.post("/demo-switch/{role}", response_model=TokenResponse, summary="Switch demo role and receive valid JWT")
def demo_switch_role(role: str, db: Session = Depends(get_db)) -> TokenResponse:
    if not settings.demo_mode:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Demo mode is disabled.")
    target_role = role.lower()
    user = db.query(User).filter(User.role == target_role).first()
    if not user:
        # Create a user for this role if not present
        full_names = {
            "judge": "Justice K. Sharma (Presiding Judge)",
            "clerk": "Rajesh Verma (Court Clerk)",
            "researcher": "Pooja Iyer (Law Researcher)",
        }
        role_enum = UserRole[target_role] if target_role in UserRole.__members__ else UserRole.clerk
        user = User(
            email=f"{target_role}@ecourts.gov.in",
            hashed_password="demo_hashed_password",
            full_name=full_names.get(target_role, f"Registry {target_role.title()}"),
            role=role_enum,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": user.email, "role": str(user.role)})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            is_active=user.is_active,
        ),
    )
