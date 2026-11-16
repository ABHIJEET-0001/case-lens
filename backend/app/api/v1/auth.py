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
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import User, UserRole
from app.db.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

ALGORITHM = "HS256"


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
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # In production use passlib bcrypt; for demo match or verify
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
