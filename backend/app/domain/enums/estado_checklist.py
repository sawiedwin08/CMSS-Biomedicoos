"""Estados de cada paso del checklist de mantenimiento."""
from enum import Enum


class EstadoChecklist(str, Enum):
    """Estados posibles para cada paso de un checklist de mantenimiento."""
    REALIZADO = "R"
    NO_REALIZADO = "NR"
    PRESENTA_ANOMALIA = "PA"
