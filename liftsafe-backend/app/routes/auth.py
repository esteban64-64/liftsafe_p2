from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.schemas import UsuarioLogin, Token, UsuarioRegister, RecuperarClaveRequest, ResetClaveRequest, MessageResponse
from app.controllers.auth_controller import authenticate_user, create_access_token, hash_password, create_reset_token, verify_reset_token
from app.controllers.email_controller import send_reset_email
from app.models.models import Usuario, Rol
from fastapi import Depends
from app.database import get_db
from jose import jwt, JWTError
from app.config import settings
router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/login", response_model=Token)
def login(credentials: UsuarioLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.correo, credentials.contrasena)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    token = create_access_token({
        "sub": user.correo,
        "rol": user.rol.nombre_rol,
        "user_id": user.id_usuario  # ← Verifica que esto esté
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "rol": user.rol.nombre_rol,
        "nombre": user.nombre_completo
    }

@router.post("/register", response_model=MessageResponse)
def register(user_data: UsuarioRegister, db: Session = Depends(get_db)):
    # Verificar si el correo ya existe
    existing = db.query(Usuario).filter(Usuario.correo == user_data.correo).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    # Verificar que el rol existe
    rol = db.query(Rol).filter(Rol.id_rol == user_data.id_rol).first()
    if not rol:
        raise HTTPException(status_code=400, detail="Rol no válido")
    
    # Crear usuario
    new_user = Usuario(
        id_rol=user_data.id_rol,
        nombre_completo=user_data.nombre_completo,
        correo=user_data.correo,
        contrasena=hash_password(user_data.contrasena),
        telefono=user_data.telefono,
        documento_identidad=user_data.documento_identidad,
        estado="activo"
    )
    db.add(new_user)
    db.commit()
    
    return {"message": "Usuario registrado exitosamente"}

@router.post("/recuperar-clave", response_model=MessageResponse)
async def recuperar_clave(request: RecuperarClaveRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.correo == request.correo).first()
    if not user:
        # No revelar si el correo existe o no
        return {"message": "Si el correo existe, recibirás un enlace de recuperación"}
    
    token = create_reset_token(request.correo)
    await send_reset_email(request.correo, token)
    
    return {"message": "Si el correo existe, recibirás un enlace de recuperación"}

@router.post("/reset-clave", response_model=MessageResponse)
def reset_clave(request: ResetClaveRequest, db: Session = Depends(get_db)):
    correo = verify_reset_token(request.token)
    if not correo:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    
    user = db.query(Usuario).filter(Usuario.correo == correo).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.contrasena = hash_password(request.nueva_contrasena)
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}

@router.get("/me")
def get_current_user(db: Session = Depends(get_db), authorization: str = None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        correo = payload.get("sub")
        if not correo:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = db.query(Usuario, Rol.nombre_rol).join(Rol).filter(Usuario.correo == correo).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    u, rol = user
    return {
        "id_usuario": u.id_usuario,
        "nombre_completo": u.nombre_completo,
        "correo": u.correo,
        "rol": rol,
        "telefono": u.telefono,
        "documento_identidad": u.documento_identidad,
        "estado": u.estado,
        "fecha_registro": u.fecha_registro
    }