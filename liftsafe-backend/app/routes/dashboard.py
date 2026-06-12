from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app.models.models import Inspeccion, Ascensor, Usuario
from jose import jwt, JWTError
from app.config import settings

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

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

@router.get("/graficas/tendencia")
def tendencia_inspecciones(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    # Contar inspecciones por mes
    resultado = db.query(
        extract('month', Inspeccion.fecha_inicio).label('mes'),
        func.count(Inspeccion.id_inspeccion).label('total')
    ).group_by('mes').order_by('mes').all()
    
    meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    data = {meses[int(r.mes)-1]: r.total for r in resultado if r.mes}
    
    return data

@router.get("/graficas/estados")
def estados_inspecciones(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    resultado = db.query(
        Inspeccion.estado,
        func.count(Inspeccion.id_inspeccion).label('total')
    ).group_by(Inspeccion.estado).all()
    
    return {r.estado: r.total for r in resultado}

@router.get("/graficas/edificios")
def inspecciones_por_edificio(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    resultado = db.query(
        Usuario.nombre_completo.label('cliente'),
        func.count(Inspeccion.id_inspeccion).label('total')
    ).join(Ascensor, Usuario.id_usuario == Ascensor.id_cliente)\
     .join(Inspeccion, Ascensor.id_ascensor == Inspeccion.id_ascensor)\
     .group_by(Usuario.id_usuario)\
     .order_by(func.count(Inspeccion.id_inspeccion).desc())\
     .limit(5).all()
    
    return {r.cliente: r.total for r in resultado}