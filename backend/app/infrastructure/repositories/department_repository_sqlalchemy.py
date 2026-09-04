"""Implementación SQLAlchemy del Repositorio de Departments (Módulo Tardanzas - RF-031)."""
from sqlalchemy.orm import Session

from app.domain.entities.department import Department
from app.domain.repositories.department_repository import DepartmentRepository
from app.infrastructure.models.department import Department as DepartmentModel


class DepartmentRepositorySQLAlchemy(DepartmentRepository):
    def __init__(self, session: Session):
        self.session = session

    def listar(self) -> list[Department]:
        rows = self.session.query(DepartmentModel).filter_by(is_active=True, is_deleted=False).all()
        return [self._to_domain(r) for r in rows]

    def listar_con_eliminados(self) -> list[Department]:
        rows = self.session.query(DepartmentModel).all()
        return [self._to_domain(r) for r in rows]

    def obtener_por_id(self, department_id: int) -> Department | None:
        row = self.session.query(DepartmentModel).filter_by(id=department_id).first()
        return self._to_domain(row) if row else None

    def obtener_por_nombre(self, nombre: str) -> Department | None:
        row = self.session.query(DepartmentModel).filter_by(name=nombre, is_deleted=False).first()
        return self._to_domain(row) if row else None

    def existe_nombre(self, nombre: str, excluir_id: int | None = None) -> bool:
        query = self.session.query(DepartmentModel).filter_by(name=nombre, is_deleted=False)
        if excluir_id:
            query = query.filter(DepartmentModel.id != excluir_id)
        return query.first() is not None

    def crear(self, department: Department) -> Department:
        nuevo = DepartmentModel(
            name=department.name,
            is_active=department.is_active,
            notes=department.notes,
        )
        self.session.add(nuevo)
        self.session.commit()
        return self._to_domain(nuevo)

    def actualizar(self, department_id: int, datos: Department) -> Department:
        row = self.session.query(DepartmentModel).filter_by(id=department_id).first()
        if row:
            row.name = datos.name
            row.notes = datos.notes
            self.session.commit()
        return self._to_domain(row) if row else None

    def cambiar_estado(self, department_id: int, es_activo: bool) -> Department:
        row = self.session.query(DepartmentModel).filter_by(id=department_id).first()
        if row:
            row.is_active = es_activo
            self.session.commit()
        return self._to_domain(row) if row else None

    def eliminar(self, department_id: int) -> None:
        row = self.session.query(DepartmentModel).filter_by(id=department_id).first()
        if row:
            row.is_deleted = True
            self.session.commit()

    def restaurar(self, department_id: int) -> Department:
        row = self.session.query(DepartmentModel).filter_by(id=department_id).first()
        if row:
            row.is_deleted = False
            self.session.commit()
        return self._to_domain(row) if row else None

    @staticmethod
    def _to_domain(row: DepartmentModel) -> Department:
        if not row:
            return None
        return Department(
            id=row.id,
            name=row.name,
            is_active=row.is_active,
            is_deleted=row.is_deleted,
            notes=row.notes,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
