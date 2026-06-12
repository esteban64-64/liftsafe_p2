from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.models import Inspeccion, Ascensor, Usuario
from jose import jwt, JWTError
from app.config import settings

router = APIRouter(prefix="/inspecciones", tags=["Inspecciones"])

def get_current_user_role(request: Request):
    authorization = request.headers.get('authorization')
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("rol"), payload.get("sub"), payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@router.get("/mis-inspecciones")
def mis_inspecciones(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    if rol in ['Administrador', 'Director Técnico']:
        result = db.execute(text("SELECT * FROM vista_resumen_inspecciones")).mappings().all()
        return [dict(row) for row in result]
    
    elif rol == 'Inspector':
        result = db.query(Inspeccion, Ascensor.codigo_interno).join(Ascensor, Inspeccion.id_ascensor == Ascensor.id_ascensor).filter(Inspeccion.id_inspector == user_id).all()
        return [
            {
                "id_inspeccion": i.id_inspeccion,
                "codigo_ascensor": codigo,
                "fecha_inicio": i.fecha_inicio,
                "fecha_fin": i.fecha_fin,
                "estado": i.estado,
                "observaciones_generales": i.observaciones_generales
            }
            for i, codigo in result
        ]
    
    elif rol == 'Cliente':
        result = db.query(Inspeccion, Ascensor.codigo_interno).join(Ascensor, Inspeccion.id_ascensor == Ascensor.id_ascensor).filter(Ascensor.id_cliente == user_id).all()
        return [
            {
                "id_inspeccion": i.id_inspeccion,
                "codigo_ascensor": codigo,
                "fecha_inicio": i.fecha_inicio,
                "fecha_fin": i.fecha_fin,
                "estado": i.estado,
                "observaciones_generales": i.observaciones_generales
            }
            for i, codigo in result
        ]
    
    else:
        raise HTTPException(status_code=403, detail="Rol no autorizado")