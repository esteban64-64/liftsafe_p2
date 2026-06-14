from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from app.database import get_db
from app.models.models import Inspeccion, Ascensor, Usuario, Informe, Rol
from jose import jwt, JWTError
from app.config import settings
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_current_user_role(request: Request):
    authorization = request.headers.get('authorization') or request.headers.get('Authorization')
    logger.debug(f"Header recibido: {authorization}")
    
    if not authorization:
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    
    if authorization.startswith("Bearer "):
        token = authorization[7:]
    else:
        token = authorization
    
    logger.debug(f"Token limpio: {token[:30]}...")
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        logger.debug(f"Payload OK: {payload}")
        return payload.get("rol"), payload.get("sub"), payload.get("user_id")
    except JWTError as e:
        logger.error(f"JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")


def get_inspecciones_query(db: Session, rol: str, user_id: int):
    """Retorna la query base de inspecciones filtrada por rol"""
    query = db.query(Inspeccion).options(
        joinedload(Inspeccion.ascensor).joinedload(Ascensor.cliente)
    )
    
    if rol == "Administrador":
        # Admin ve todo
        return query
    
    elif rol == "Director Técnico":
        # Director ve todo
        return query
    
    elif rol == "Coordinador":
        # Coordinador ve todo
        return query
    
    elif rol == "Inspector":
        # Inspector: solo sus inspecciones asignadas
        return query.filter(Inspeccion.id_inspector == user_id)
    
    elif rol == "Asesor":
        # Asesor: inspecciones de clientes que tiene asignados
        # Buscar clientes del asesor (usuarios con rol Cliente asignados a este asesor)
        return query.join(Ascensor).filter(
            Ascensor.id_cliente.in_(
                db.query(UsuarioAscensor.id_usuario).filter(
                    UsuarioAscensor.id_usuario == user_id
                )
            )
        )
    
    elif rol == "Cliente":
        # Cliente: solo inspecciones de sus ascensores
        return query.join(Ascensor).filter(Ascensor.id_cliente == user_id)
    
    else:
        raise HTTPException(status_code=403, detail=f"Rol '{rol}' no autorizado")


def get_ascensores_query(db: Session, rol: str, user_id: int):
    """Retorna la query base de ascensores filtrada por rol"""
    query = db.query(Ascensor)
    
    if rol in ["Administrador", "Director Técnico", "Coordinador"]:
        return query
    
    elif rol == "Inspector":
        # Inspector: ascensores asignados a él
        return query.join(UsuarioAscensor).filter(UsuarioAscensor.id_usuario == user_id)
    
    elif rol == "Asesor":
        # Asesor: ascensores de sus clientes
        return query.join(UsuarioAscensor).filter(UsuarioAscensor.id_usuario == user_id)
    
    elif rol == "Cliente":
        # Cliente: solo sus ascensores
        return query.filter(Ascensor.id_cliente == user_id)
    
    else:
        raise HTTPException(status_code=403, detail=f"Rol '{rol}' no autorizado")


def get_usuarios_query(db: Session, rol: str, user_id: int):
    """Retorna la query base de usuarios filtrada por rol"""
    query = db.query(Usuario)
    
    if rol == "Administrador":
        return query
    
    elif rol == "Director Técnico":
        # Director: todos excepto otros admin
        return query.join(Rol).filter(Rol.nombre_rol != "Administrador")
    
    elif rol == "Coordinador":
        # Coordinador: inspectores, clientes, asesores
        return query.join(Rol).filter(
            Rol.nombre_rol.in_(["Inspector", "Cliente", "Asesor"])
        )
    
    elif rol == "Inspector":
        # Inspector: solo su propio perfil
        return query.filter(Usuario.id_usuario == user_id)
    
    elif rol == "Asesor":
        # Asesor: solo sus clientes
        return query.join(UsuarioAscensor).filter(UsuarioAscensor.id_usuario == user_id)
    
    elif rol == "Cliente":
        # Cliente: solo su propio perfil
        return query.filter(Usuario.id_usuario == user_id)
    
    else:
        raise HTTPException(status_code=403, detail=f"Rol '{rol}' no autorizado")


# ============ RUTAS DE GRÁFICAS ============

@router.get("/graficas/tendencia")
def tendencia_inspecciones(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    # Aplicar filtro por rol
    query = get_inspecciones_query(db, rol, user_id)
    
    resultado = query.with_entities(
        extract('month', Inspeccion.fecha_inicio).label('mes'),
        func.count(Inspeccion.id_inspeccion).label('total')
    ).group_by('mes').order_by('mes').all()
    
    meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    data = {meses[int(r.mes)-1]: r.total for r in resultado if r.mes}
    return data


@router.get("/graficas/estados")
def estados_inspecciones(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    query = get_inspecciones_query(db, rol, user_id)
    
    resultado = query.with_entities(
        Inspeccion.estado,
        func.count(Inspeccion.id_inspeccion).label('total')
    ).group_by(Inspeccion.estado).all()
    
    return {r.estado: r.total for r in resultado}


@router.get("/graficas/edificios")
def inspecciones_por_edificio(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    # Solo admin, director y coordinador pueden ver esta gráfica
    if rol in ["Inspector", "Asesor", "Cliente"]:
        return {}
    
    resultado = db.query(
        Usuario.nombre_completo.label('cliente'),
        func.count(Inspeccion.id_inspeccion).label('total')
    ).join(Ascensor, Usuario.id_usuario == Ascensor.id_cliente)\
     .join(Inspeccion, Ascensor.id_ascensor == Inspeccion.id_ascensor)\
     .group_by(Usuario.id_usuario)\
     .order_by(func.count(Inspeccion.id_inspeccion).desc())\
     .limit(5).all()
    
    return {r.cliente: r.total for r in resultado}


# ============ RUTAS PARA EL FRONTEND ============

@router.get("/stats")
def get_stats(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    hoy = datetime.now()
    primer_dia_mes = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Contar según rol
    usuarios_query = get_usuarios_query(db, rol, user_id)
    ascensores_query = get_ascensores_query(db, rol, user_id)
    inspecciones_query = get_inspecciones_query(db, rol, user_id)
    
    return {
        "usuarios_activos": usuarios_query.count(),
        "ascensores_registrados": ascensores_query.count(),
        "inspecciones_mes": inspecciones_query.filter(Inspeccion.fecha_inicio >= primer_dia_mes).count(),
        "informes_emitidos": inspecciones_query.count(),
        "variaciones": {
            "usuarios_activos": 0,
            "ascensores_registrados": 0,
            "inspecciones_mes": 0,
            "informes_emitidos": 0
        }
    }


@router.get("/charts")
def get_charts(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    hoy = datetime.now()
    meses_nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    # Query base filtrada por rol
    base_query = get_inspecciones_query(db, rol, user_id)
    
    monthly_inspections = []
    for i in range(5, -1, -1):
        mes_objetivo = hoy.month - i
        año_objetivo = hoy.year
        
        while mes_objetivo <= 0:
            mes_objetivo += 12
            año_objetivo -= 1
        
        primer_dia = datetime(año_objetivo, mes_objetivo, 1)
        if mes_objetivo == 12:
            ultimo_dia = datetime(año_objetivo + 1, 1, 1)
        else:
            ultimo_dia = datetime(año_objetivo, mes_objetivo + 1, 1)
        
        # Aplicar filtros de fecha sobre la query base
        total = base_query.filter(
            Inspeccion.fecha_inicio >= primer_dia,
            Inspeccion.fecha_inicio < ultimo_dia
        ).count()
        
        aprobadas = base_query.filter(
            Inspeccion.fecha_inicio >= primer_dia,
            Inspeccion.fecha_inicio < ultimo_dia,
            Inspeccion.estado == "Aprobada"
        ).count()
        
        pendientes = total - aprobadas
        
        monthly_inspections.append({
            "month": meses_nombres[mes_objetivo - 1],
            "total": total,
            "aprobadas": aprobadas,
            "pendientes": pendientes
        })

    # Estados de inspecciones filtrados por rol
    estados_result = base_query.with_entities(
        Inspeccion.estado,
        func.count(Inspeccion.id_inspeccion).label('total')
    ).group_by(Inspeccion.estado).all()
    
    inspection_status_data = []
    colores = {
        'Aprobada': '#0E7C4A', 
        'Finalizada': '#0E7C4A',
        'Pendiente': '#C97B1A', 
        'Borrador': '#C97B1A',
        'En Proceso': '#C97B1A',
        'Observaciones': '#C0392B',
        'No Cumple': '#C0392B'
    }
    
    for r in estados_result:
        if r.estado:
            inspection_status_data.append({
                "name": r.estado,
                "value": r.total,
                "color": colores.get(r.estado, '#0066CC')
            })
    
    if not inspection_status_data:
        inspection_status_data = [
            {"name": "Aprobadas", "value": 0, "color": "#0E7C4A"},
            {"name": "Pendientes", "value": 0, "color": "#C97B1A"},
            {"name": "Observaciones", "value": 0, "color": "#C0392B"}
        ]

    return {
        "monthlyInspections": monthly_inspections,
        "inspectionStatusData": inspection_status_data
    }


@router.get("/inspecciones")
def get_inspecciones(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    # Aplicar filtro por rol
    inspecciones = get_inspecciones_query(db, rol, user_id).all()
    
    resultado = []
    
    for insp in inspecciones:
        ascensor = insp.ascensor
        
        building_name = "Sin edificio"
        if ascensor:
            building_name = ascensor.direccion_completa or "Sin dirección"
        
        fecha_inicio = insp.fecha_inicio
        fecha_str = fecha_inicio.strftime("%Y-%m-%d") if fecha_inicio else ""
        next_date = (fecha_inicio + timedelta(days=30)).strftime("%Y-%m-%d") if fecha_inicio else ""
        
        inspector_name = "Por asignar"
        if insp.inspector_rel:
            inspector_name = insp.inspector_rel.nombre_completo
        
        resultado.append({
            "id": insp.id_inspeccion,
            "status": insp.estado or "Pendiente",
            "elevator": ascensor.codigo_interno if ascensor else "N/A",
            "building": building_name,
            "date": fecha_str,
            "nextDate": next_date,
            "type": getattr(insp, 'tipo_servicio', "Regular"),
            "inspector": inspector_name,
            "reportNumber": insp.id_informe if hasattr(insp, 'id_informe') else None
        })
    
    return resultado


@router.get("/edificios")
def get_edificios(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    # Aplicar filtro por rol
    ascensores = get_ascensores_query(db, rol, user_id).options(
        joinedload(Ascensor.cliente)
    ).all()
    
    # Agrupar por dirección completa
    edificios_dict = {}
    for asc in ascensores:
        direccion = asc.direccion_completa or "Sin dirección"
        
        if direccion not in edificios_dict:
            edificios_dict[direccion] = {
                "id": asc.id_ascensor,
                "name": direccion,
                "address": f"{asc.ubicacion_exacta or 'Sin ubicación'}, {asc.ciudad or 'Sin ciudad'}",
                "elevators": 0,
                "manager": asc.cliente.nombre_completo if asc.cliente else "Sin gestor",
                "phone": asc.cliente.telefono if asc.cliente else "Sin teléfono",
                "status": asc.estado or "Activo"
            }
        
        edificios_dict[direccion]["elevators"] += 1
    
    return list(edificios_dict.values())


@router.get("/ascensores")
def get_ascensores(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    # Aplicar filtro por rol
    ascensores = get_ascensores_query(db, rol, user_id).options(
        joinedload(Ascensor.cliente)
    ).all()
    
    resultado = []
    
    for asc in ascensores:
        # Obtener última inspección
        ultima_insp = db.query(Inspeccion).filter(
            Inspeccion.id_ascensor == asc.id_ascensor
        ).order_by(Inspeccion.fecha_inicio.desc()).first()
        
        resultado.append({
            "id": asc.id_ascensor,
            "code": asc.codigo_interno,
            "brand": asc.marca,
            "model": asc.modelo,
            "type": asc.tipo_ascensor,
            "building": asc.direccion_completa,
            "location": asc.ubicacion_exacta,
            "city": asc.ciudad,
            "status": asc.estado,
            "capacity": asc.capacidad_kg,
            "client": asc.cliente.nombre_completo if asc.cliente else "Sin cliente",
            "lastInspection": ultima_insp.fecha_inicio.strftime("%Y-%m-%d") if ultima_insp and ultima_insp.fecha_inicio else "No registrada",
            "nextInspection": "No programada"
        })
    
    return resultado


@router.get("/usuarios")
def get_usuarios(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    # Aplicar filtro por rol
    usuarios = get_usuarios_query(db, rol, user_id).all()
    resultado = []
    
    for user in usuarios:
        resultado.append({
            "id": user.id_usuario,
            "name": user.nombre_completo or "Sin nombre",
            "email": user.correo or "",
            "role": user.rol.nombre_rol if hasattr(user, 'rol') and user.rol else "Usuario",
            "status": user.estado or "Activo",
            "phone": user.telefono or ""
        })
    
    return resultado


@router.get("/informes")
def get_informes(request: Request, db: Session = Depends(get_db)):
    rol, correo, user_id = get_current_user_role(request)
    
    # Aplicar filtro por rol
    base_query = get_inspecciones_query(db, rol, user_id)
    
    # Informes = inspecciones completadas/aprobadas
    informes = base_query.filter(
        Inspeccion.estado.in_(["Aprobada", "Finalizada", "Completada"])
    ).all()
    
    resultado = []
    
    for inf in informes:
        ascensor = inf.ascensor
        
        resultado.append({
            "id": inf.id_inspeccion,
            "elevator": ascensor.codigo_interno if ascensor else "N/A",
            "building": ascensor.direccion_completa if ascensor else "Sin edificio",
            "date": inf.fecha_inicio.strftime("%Y-%m-%d") if inf.fecha_inicio else "Sin fecha",
            "status": inf.estado,
            "inspector": inf.inspector_rel.nombre_completo if inf.inspector_rel else "No asignado"
        })
    
    return resultado