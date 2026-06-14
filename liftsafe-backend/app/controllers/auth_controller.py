from sqlalchemy.orm import Session
from app.models.models import Usuario, Rol
from app.schemas.schemas import UsuarioLogin
import bcrypt  # <-- Cambio: bcrypt nativo en vez de passlib
from jose import jwt, JWTError
from app.config import settings
from datetime import datetime, timedelta  # Quitar timezone

# ============ HASHING CON BCRYPT NATIVO ============

def hash_password(password: str) -> str:
    """Hashea la contraseña usando bcrypt nativo."""
    # bcrypt requiere bytes, codificamos UTF-8
    password_bytes = password.encode('utf-8')
    # bcrypt internamente trunca a 72 bytes, no necesitamos hacerlo manualmente
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')  # Guardamos como string en la BD

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash."""
    plain_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_bytes, hash_bytes)


# ============ AUTENTICACIÓN ============

def authenticate_user(db: Session, correo: str, password: str):
    user = db.query(Usuario).join(Rol).filter(Usuario.correo == correo).first()
    if not user or not verify_password(password, user.contrasena):
        return None
    return user


# ============ TOKENS JWT ============


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    # Usar utcnow() SIN timezone (naive datetime)
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_reset_token(correo: str):
    expire = datetime.utcnow() + timedelta(hours=1)
    return jwt.encode({"sub": correo, "exp": expire, "type": "reset"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_reset_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "reset":
            return None
        return payload.get("sub")
    except JWTError:
        return None