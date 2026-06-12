from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Usuario, Rol
from app.controllers.usuario_controller import get_user_profile, get_admin_stats, get_cliente_ascensores, get_inspector_inspecciones
router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

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
def listado_usuarios(db: Session = Depends(get_db)):
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
    
@router.get("/dashboard/cliente/{client_id}")
def dashboard_cliente(client_id: int, db: Session = Depends(get_db)):
    ascensores = db.query(Ascensor).filter(Ascensor.id_cliente == client_id).all()
    return [
        {
            "id_ascensor": a.id_ascensor,
            "codigo_interno": a.codigo_interno,
            "marca": a.marca,
            "modelo": a.modelo,
            "tipo_ascensor": a.tipo_ascensor,
            "ciudad": a.ciudad,
            "estado": a.estado
        }
        for a in ascensores
    ]
@router.get("/dashboard/inspector/{inspector_id}")
def dashboard_inspector(inspector_id: int, db: Session = Depends(get_db)):
    inspecciones = db.query(Inspeccion).filter(Inspeccion.id_inspector == inspector_id).all()
    return [
        {
            "id_inspeccion": i.id_inspeccion,
            "id_ascensor": i.id_ascensor,
            "fecha_inicio": i.fecha_inicio,
            "fecha_fin": i.fecha_fin,
            "estado": i.estado,
            "observaciones_generales": i.observaciones_generales
        }
        for i in inspecciones
    ]