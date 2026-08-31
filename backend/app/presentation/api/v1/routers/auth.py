"""Router de autenticación (RF-028)."""
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.application.dto.auth import Credenciales
from app.application.use_cases.usuarios.autenticar_usuario import AutenticarUsuario
from app.presentation.api.deps import Hasher, Tokens, UsuarioRepo
from app.presentation.schemas.auth import Token

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token, summary="Iniciar sesión y obtener token")
def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    usuarios: UsuarioRepo,
    hasher: Hasher,
    tokens: Tokens,
) -> Token:
    """Autentica con **email** (campo *username*) y **contraseña**.

    Devuelve un token JWT para usar como `Bearer` en el resto de endpoints.
    """
    caso_uso = AutenticarUsuario(usuarios, hasher, tokens)
    resultado = caso_uso.ejecutar(
        Credenciales(email=form.username, password=form.password)
    )
    return Token(access_token=resultado.access_token, token_type=resultado.token_type)
