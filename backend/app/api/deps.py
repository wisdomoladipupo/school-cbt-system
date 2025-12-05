from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Union, Iterable
from ..core.db import get_db
from ..core.security import decode_access_token
from ..services.user_service import get_user
import logging

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    user = get_user(db, payload.get("user_id"))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_role(role: Union[str, Iterable[str]]):
    """Dependency factory to require a role or any of a set of roles.

    Accepts either a single role string (e.g. "teacher") or an iterable
    of role strings (e.g. ["teacher", "admin"]). Admin users always bypass
    the check.
    """
    def role_checker(current_user = Depends(get_current_user)):
        allowed = [role] if isinstance(role, str) else list(role)
        # Admin always allowed
        if current_user.role == "admin":
            return current_user
        if current_user.role not in allowed:
            raise HTTPException(status_code=403, detail="Operation not permitted")
        return current_user

    return role_checker
