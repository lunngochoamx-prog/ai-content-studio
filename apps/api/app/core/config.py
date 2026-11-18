import os
import base64
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jose import jwt, JWTError

SECRET_KEY = os.getenv("SECRET_KEY", "content-studio-super-secret-jwt-key-2026-change-in-prod")
ENCRYPTION_SECRET = os.getenv("ENCRYPTION_SECRET", "content-studio-aes256-encryption-secret-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres@127.0.0.1:5432/content_studio",
)
SYSTEM_9ROUTER_BASE_URL = os.getenv("SYSTEM_9ROUTER_BASE_URL", "http://127.0.0.1:20128/v1")
SYSTEM_9ROUTER_API_KEY = os.getenv("SYSTEM_9ROUTER_API_KEY", "sk-9router-system-free")
SYSTEM_9ROUTER_DEFAULT_MODEL = os.getenv("SYSTEM_9ROUTER_DEFAULT_MODEL", "auto")
DAILY_FREE_QUOTA_DEFAULT = int(os.getenv("DAILY_FREE_QUOTA_DEFAULT", "50"))


def _aes_key() -> bytes:
    return hashlib.sha256(ENCRYPTION_SECRET.encode("utf-8")).digest()


def encrypt_api_key(plain_key: str) -> str:
    if not plain_key:
        return ""
    aesgcm = AESGCM(_aes_key())
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plain_key.encode("utf-8"), None)
    return base64.urlsafe_b64encode(nonce + ct).decode("ascii")


def decrypt_api_key(token: str) -> str:
    if not token:
        return ""
    try:
        raw = base64.urlsafe_b64decode(token.encode("ascii"))
        nonce, ct = raw[:12], raw[12:]
        aesgcm = AESGCM(_aes_key())
        return aesgcm.decrypt(nonce, ct, None).decode("utf-8")
    except Exception:
        return ""


def mask_api_key(plain_key: str) -> str:
    if not plain_key:
        return ""
    if len(plain_key) <= 8:
        return "****"
    return f"{plain_key[:4]}...{plain_key[-4:]}"


def hash_password(password: str) -> str:
    salt = "cs_salt_2026"
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000).hex()


def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash


def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": user_id, "email": email, "role": role, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
