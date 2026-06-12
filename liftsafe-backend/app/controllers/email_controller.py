from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.config import settings
import logging

logger = logging.getLogger(__name__)

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True if settings.MAIL_PASSWORD else False
)

async def send_reset_email(email: str, token: str):
    # Si no hay config de email, solo loguea el token (modo desarrollo)
    if not settings.MAIL_PASSWORD or settings.MAIL_PASSWORD == "":
        logger.info(f"Modo desarrollo - Token para {email}: {token}")
        return True
    
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    message = MessageSchema(
        subject="Recuperación de contraseña - LiftSafe",
        recipients=[email],
        body=f"""
        <h3>Recuperación de contraseña</h3>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="{reset_link}">{reset_link}</a>
        <p>Este enlace expira en 1 hora.</p>
        """,
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)
    return True