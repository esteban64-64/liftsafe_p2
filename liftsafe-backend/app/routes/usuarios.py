from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Usuario, Rol
from app.schemas.schemas import UsuarioCreate, MessageResponse
from app.controllers.usuario_controller import get_user_profile, get_admin_stats, get_cliente_ascensores, get_inspector_inspecciones
from app.controllers.auth_controller import hash_password
from app.utils.auth_deps import require_admin

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

DOC_LABELS = {"CC": "Cédula de ciudadanía", "NIT": "NIT", "PPE": "PPE", "CE": "Cédula de extranjería"}


def format_document(user: Usuario) -> str:
    doc = user.nit or user.documento_identidad or ""
    if user.tipo_documento:
        label = DOC_LABELS.get(user.tipo_documento, user.tipo_documento)
        return f"{label}: {doc}" if doc else label
    return doc


@router.post("", response_model=MessageResponse)
def crear_usuario(request: Request, user_data: UsuarioCreate, db: Session = Depends(get_db)):
    require_admin(request)

    existing = db.query(Usuario).filter(Usuario.correo == user_data.correo).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    rol = db.query(Rol).filter(Rol.id_rol == user_data.id_rol).first()
    if not rol:
        raise HTTPException(status_code=400, detail="Rol no válido")

    new_user = Usuario(
        id_rol=user_data.id_rol,
        nombre_completo=user_data.nombre_completo,
        correo=user_data.correo,
        contrasena=hash_password(user_data.contrasena),
        telefono=user_data.telefono,
        tipo_documento=user_data.tipo_documento,
        documento_identidad=user_data.documento_identidad,
        nit=user_data.nit if user_data.tipo_documento == "NIT" else None,
        razon_social=user_data.razon_social if user_data.tipo_documento == "NIT" else None,
        estado="activo",
    )
    db.add(new_user)
    db.commit()
    return {"message": f"Usuario {rol.nombre_rol} creado exitosamente"}


@router.get("/perfil/{user_id}")
def perfil(user_id: int, db: Session = Depends(get_db)):
    profile = get_user_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user, rol = profile
    return {
        "id_usuario": user.id_usuario,
        "nombre_completo": user.nombre_completo,
        "correo": user.correo,
        "rol": rol,
        "telefono": user.telefono,
        "estado": user.estado
    }

@router.get("/dashboard/admin")
def dashboard_admin(db: Session = Depends(get_db)):
    return get_admin_stats(db)

@router.get("/dashboard/cliente/{client_id}")
def dashboard_cliente(client_id: int, db: Session = Depends(get_db)):
    return get_cliente_ascensores(db, client_id)

@router.get("/dashboard/inspector/{inspector_id}")
def dashboard_inspector(inspector_id: int, db: Session = Depends(get_db)):
    return get_inspector_inspecciones(db, inspector_id)

@router.get("/listado")
def listado_usuarios(request: Request, db: Session = Depends(get_db)):
    require_admin(request)
    usuarios = db.query(Usuario, Rol.nombre_rol).join(Rol).all()
    return [
        {
            "id_usuario": u.id_usuario,
            "nombre_completo": u.nombre_completo,
            "correo": u.correo,
            "rol": rol,
            "telefono": u.telefono,
            "documento_identidad": u.documento_identidad,
            "estado": u.estado,
            "fecha_registro": u.fecha_registro
        }
        for u, rol in usuarios
    ]
