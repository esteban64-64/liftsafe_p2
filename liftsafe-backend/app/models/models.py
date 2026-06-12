from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, Time, Double
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Rol(Base):
    __tablename__ = "rol"
    id_rol = Column(Integer, primary_key=True, index=True)
    nombre_rol = Column(String(50), unique=True, nullable=False)
    descripcion = Column(String(200))
    fecha_creacion = Column(DateTime, default=datetime.now)

class Usuario(Base):
    __tablename__ = "usuario"
    id_usuario = Column(Integer, primary_key=True, index=True)
    id_rol = Column(Integer, ForeignKey("rol.id_rol"), nullable=False)
    nombre_completo = Column(String(150), nullable=False)
    correo = Column(String(120), unique=True, nullable=False)
    contrasena = Column(String(255), nullable=False)
    telefono = Column(String(255))
    documento_identidad = Column(String(255))
    razon_social = Column(String(255))  # ← Verifica que exista
    nit = Column(String(255))            # ← Verifica que exista
    direccion = Column(String(255))      # ← Verifica que exista
    estado = Column(String(255), default="activo")
    fecha_registro = Column(DateTime, default=datetime.now)
    ultima_sesion = Column(DateTime)
    rol = relationship("Rol")

class Ascensor(Base):
    __tablename__ = "ascensor"
    id_ascensor = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    codigo_interno = Column(String(50), unique=True, nullable=False)
    marca = Column(String(80), nullable=False)
    modelo = Column(String(80), nullable=False)
    tipo_ascensor = Column(String(50), nullable=False)
    capacidad_kg = Column(Integer, nullable=False)
    ciudad = Column(String(100), nullable=False)
    estado = Column(String(255), default="Activo")
    cliente = relationship("Usuario")

class Inspeccion(Base):
    __tablename__ = "inspeccion"
    id_inspeccion = Column(Integer, primary_key=True, index=True)
    id_programacion = Column(Integer, ForeignKey("programacion.id_programacion"), nullable=False)
    id_ascensor = Column(Integer, ForeignKey("ascensor.id_ascensor"), nullable=False)
    id_inspector = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    fecha_inicio = Column(DateTime, nullable=False)
    fecha_fin = Column(DateTime)
    estado = Column(String(255), nullable=False)
    observaciones_generales = Column(Text)

class Programacion(Base):
    __tablename__ = "programacion"
    id_programacion = Column(Integer, primary_key=True, index=True)
    id_solicitud = Column(Integer, ForeignKey("solicitud.id_solicitud"), nullable=False)
    id_inspector = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    fecha_programada = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    estado = Column(String(255), nullable=False)

class Solicitud(Base):
    __tablename__ = "solicitud"
    id_solicitud = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    id_ascensor = Column(Integer, ForeignKey("ascensor.id_ascensor"), nullable=False)
    tipo_servicio = Column(String(100), nullable=False)
    prioridad = Column(String(255), nullable=False)
    estado = Column(String(255), nullable=False)
    
class Informe(Base):
    __tablename__ = "informe"
    id_informe = Column(Integer, primary_key=True, index=True)
    id_inspeccion = Column(Integer, ForeignKey("inspeccion.id_inspeccion"), nullable=False)
    numero_informe = Column(String(50), nullable=False)
    fecha_generacion = Column(DateTime)
    estado = Column(String(255), nullable=False)
    concepto_tecnico = Column(String(255))
    fecha_creacion = Column(DateTime, default=datetime.now)