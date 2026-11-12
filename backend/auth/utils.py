"""Authentication utility functions: password hashing and JWT management."""

import os
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from ..config import settings
from ..schemas.user import TokenData


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against a stored salt$hash representation."""
    if not hashed_password or "$" not in hashed_password:
        return False
    try:
        salt_hex, hash_hex = hashed_password.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        test_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
        return test_hash.hex() == hash_hex
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 100,000 rounds and random salt."""
    salt = os.urandom(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}${hashed.hex()}"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> TokenData:
    """Decode and validate a JWT access token."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    user_id: str = payload.get("sub")
    username: str = payload.get("username")
    return TokenData(user_id=user_id, username=username)
