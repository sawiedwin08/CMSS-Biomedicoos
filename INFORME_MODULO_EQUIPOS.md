# Informe del Módulo de Equipos Biomédicos — CMSS-Biomédico

> Documento funcional del módulo de Inventario / Equipos Biomédicos.
> Describe cada pantalla, modal, formulario, campo y acción tal como están implementados.
> Fecha: 2026-10-14

---

## 1. Visión general

El módulo gira en torno al **equipo biomédico** y se compone de dos pantallas principales más un conjunto de modales:

| Pantalla | Propósito | Permiso para ver |
|---|---|---|
| **Inventario** (`InventarioPage`) | Gestión completa: crear, editar, eliminar, importar. | `inventario:ver` |
| **Equipos** (`EquiposPage`) | Vista de consulta (solo lectura) con resumen, documentos, movimientos y mantenimiento. | `inventario:ver` |

### Permisos (RBAC)
Las acciones se habilitan/ocultan según el permiso del usuario:

- `inventario:ver` — ver listados, resúmenes, documentos, movimientos.
- `inventario:crear` — botón "Registrar equipo", "Importar Excel", descargar plantilla.
- `inventario:editar` — editar equipos, subir/eliminar documentos, foto, registrar movimientos.
- `inventario:eliminar` — eliminar equipos.

---

## 2. Pantalla "Inventario" — gestión completa

Título: **Inventario de equipos biomédicos**.

### 2.1 Barra superior (acciones)
- **Importar Excel** (si `inventario:crear`) → abre el modal de importación.
- **+ Registrar equipo** (si `inventario:crear` **y** existe al menos una sede) → abre el formulario de alta.
  - Si no hay sedes, en lugar del botón se muestra el aviso: *"Registra una sede antes de crear equipos."*

### 2.2 Barra de filtros
Formulario con búsqueda y filtros; cada cambio recarga la tabla desde el backend:

| Control | Tipo | Filtra por |
|---|---|---|
| Texto libre | input | nombre, código, serial, marca o N° de activo |
| Todas las sedes | select | sede |
| Todos los estados | select | estado del equipo |
| Todo riesgo | select | clasificación de riesgo |
| Toda propiedad | select | propiedad |
| **Buscar** | botón | aplica el texto |

### 2.3 Tabla de equipos
Tabla TanStack (`DataTable`), paginada (50 por página), modo compacto. Columnas:

`Cod` · `Nombre` · `Marca` · `Modelo` · `Serial` · `N° activo` · `Clase biomédica` · `Riesgo` · `INVIMA` (registro) · **`Venc. INVIMA`** · `Propiedad` · acciones.

- **Venc. INVIMA** muestra la fecha con **semáforo de color** (ver §7) y un tooltip con los días restantes ("Vence en N días" / "Vencido hace N días" / "Vence hoy").
- Acciones por fila:
  - ✏️ **Editar** (si `inventario:editar`) → formulario de edición.
  - 🗑️ **Eliminar** (si `inventario:eliminar`) → confirmación y borrado. Al eliminar se borra también la carpeta física de documentos del equipo.

### 2.4 Mensajes
- Verde (`alert-ok`): confirmaciones ("Equipo registrado/actualizado/eliminado", "N equipo(s) importado(s)").
- Rojo (`alert-error`): errores de carga, filtro o guardado.

---

## 3. Modal "Registrar / Editar equipo" (formulario principal)

Formulario único reutilizado para alta y edición (`EquipoForm`). Título: **Registrar equipo** o **Editar equipo**.
Organizado por secciones:

### 3.1 Identificación
| Campo | Tipo | Reglas |
|---|---|---|
| Código interno | texto | Opcional al crear (si se deja vacío el sistema genera `EQ-0001`…). **Obligatorio** al editar. |
| Serial del fabricante * | texto | Obligatorio. **Único**: se valida al salir del campo y al guardar; si existe, se marca en rojo con *"Este serial ya existe."* |
| Nombre * | texto | Obligatorio, mínimo 2 caracteres. |
| Marca | texto | — |
| Modelo | texto | — |
| N° de activo (placa) | texto | **Único**: validación en vivo + al guardar, error en rojo *"Este N° de activo ya existe."* |
| Estado | select | Operativo / En mantenimiento / Fuera de servicio / Dado de baja. |

**Foto del equipo**: previsualización + subir (JPG/PNG/WEBP, máx. 5 MB) + botón "Quitar foto". La foto se sube en un segundo paso, ya con el ID del equipo.

### 3.2 Ubicación
- **Sede** (select). Al cambiar la sede se limpia el servicio.
- **Servicio** (select, deshabilitado si no hay sede). Solo muestra **servicios activos** de esa sede; si el equipo ya tenía uno inactivo asignado, se conserva marcado como "(inactivo)".
- **Piso** (texto).

> Al editar, si cambia la sede o el servicio, el backend **registra automáticamente un movimiento** de ubicación (trazabilidad RF-004) con motivo "Actualización de ubicación".

### 3.3 Clasificación
Selects con vocabularios fijos:
- **Clase biomédica**: Descripcion, Diagnostico, Tratamiento y Mantenimiento de la Vida, Prevencion, Rehabilitacion, Analisis de Laboratorio, No Aplica.
- **Clase de uso**: Medico, Basico, Apoyo, Uso, No Aplica.
- **Clasificación según riesgo**: I, IIa, IIb, III, NR.
- **Tecnología predominante**: Eléctrico, Mecanico, Neumático, Electrónica, Electromecánico, A vapor, Hidráulico, Otro.

### 3.4 Fabricante
Fabricante · Año de fabricación (número 1900–2100) · País · Ciudad · Dirección · **Teléfono** (solo números) · **Correo** (validación email).

### 3.5 Representante
Representante · País · Ciudad · Dirección · **Teléfono** (solo números) · **Correo** (email).

### 3.6 Especificaciones técnicas
Campos de texto libre (admiten descripciones largas): Voltaje de operación, Voltaje máximo, Corriente máxima, Corriente mínima, Potencia consumida, Frecuencia, Presión, Velocidad, Temperatura, Peso, Capacidad.
- **Fuente de alimentación** (selección múltiple): Agua, Derivados de petroleo, O2, Vapor, Ninguno, Aire, Gas, Electricidad, Nitrogeno, Energia solar, CO2, Gasolina.

### 3.7 Documentación (listas)
- **Manuales** (múltiple): Operación, Mantenimiento, Partes, Despieces, Ninguno.
- **Planos** (múltiple): Eléctrico, Electrónicos, Hidraulicos, Neumaticos, Ninguno.
- **Recomendaciones del fabricante**: textarea, una por línea.

### 3.8 Adquisición y garantía
Modo de adquisición (Compra Directa / Comodato) · Propiedad (Propio / Alquilado / Leasing / Préstamo) · Proveedor (select) · Fecha de adquisición · Costo · Orden de compra · Fecha inicial de garantía · Fecha final de garantía.

### 3.9 Instalación
Fecha de instalación · Fecha de funcionamiento.

### 3.10 Registro sanitario (INVIMA)
- Registro INVIMA (texto).
- Fecha de vencimiento INVIMA (fecha) → alimenta el semáforo de la tabla y del resumen.

### 3.11 Mantenimiento y operación
- **Periodicidad de mantenimiento** (select): Semestral, Trimestral, Anual, No aplica. (Si hay un valor antiguo distinto, se conserva como "(valor anterior)").
- **Último mantenimiento realizado** (fecha, opcional). *Si se deja vacío, se usa la fecha de la última orden de trabajo completada.*
- Casillas: Calibración SÍ · Calibración NO · Equipo móvil · Equipo fijo.
- **Accesorios** (textarea) · **Descripción funcional** (textarea).

### 3.12 Pie del formulario
- **Cancelar** (cierra sin guardar).
- **Guardar** (deshabilitado mientras guarda; muestra "Guardando…").

---

## 4. Modal "Importar equipos desde Excel"

- Texto de ayuda: descargar plantilla, completarla y subirla; en campos de selección múltiple separar valores con **punto y coma (;)**; las filas con error se reportan sin detener las demás.
- **⬇ Descargar plantilla** → baja `plantilla_equipos.xlsx`.
- **Selector de archivo** (`.xlsx`).
- **Importar** → procesa y muestra el resultado:
  - Resumen: *Procesadas: N · Creadas: N · Con error: N*.
  - Si hay errores, tabla **Fila / Error** con el detalle de cada fila fallida (p. ej. serial duplicado, servicio inexistente).
- **Cerrar**.

Backend: `POST /equipos/importar` (requiere `inventario:crear`). Procesa fila por fila y devuelve `total`, `creados` y lista de `errores`.

---

## 5. Pantalla "Equipos" — consulta (solo lectura)

Título: **Equipos**. Igual estructura de filtros (texto, sede, estado) y tabla, pero orientada a consulta.

### 5.1 Tabla
`Código interno` · `Nombre de equipo` · `Marca` · `Modelo` · `Serial` · `Ubicación` (sede / servicio) · **`Estado`** (badge de color) · acción.
- Única acción por fila: 👁️ **Ver resumen** → abre el modal de resumen.

---

## 6. Modal "Resumen del equipo" (solo lectura)

Encabezado: nombre + código interno. Botones:
- 📁 **Documentos** → modal de gestión documental completa (ver §6.1).
- 📄 **Generar hoja de vida** → abre la **Hoja de Vida** imprimible (formato oficial GDB-HV1, con logo y datos del Centro Médico Valle de Atriz; botón de impresión).
- ✕ **Cerrar**.

### Columna izquierda
- **Foto** del equipo (o "Sin foto").
- **Documentos** → carpetas:
  - 📂 **Documentación** (documentos sin año).
  - 📂 carpetas por **año** (últimos 3 años con documentos de mantenimiento).
- **Movimientos** → 📍 **Historial de Ubicaciones**.
- **Mantenimiento** → 🔧 **Órdenes de Trabajo**.

### Columna derecha (datos agrupados)
- **Identificación**: Marca, Modelo, Serial, N° activo, Estado.
- **Ubicación**: Sede, Servicio, Piso.
- **Clasificación**: Clase biomédica, Clase de uso, Riesgo, Tecnología, Propiedad.
- **Registro INVIMA**: Registro + **Vencimiento con semáforo**.
- **Garantía**: Inicio + **Vencimiento con semáforo**.
- **Documentación**: Fuente de alimentación, Manuales, Planos.
- **Mantenimiento**: Periodicidad, **Último mantenimiento** (con semáforo según el próximo mantenimiento calculado), Requiere calibración, Móvil/Fijo.

### 6.1 Sub-modal "Documentos del equipo"
Componente `DocumentosEquipo`. Permite (si `inventario:editar`):
- **Formulario de carga**:
  - *¿Dónde va?*: **Mantenimiento (con año)** o **Documentación Equipos**.
  - *Tipo de documento* (depende de la categoría):
    - Mantenimiento: Mantenimientos Preventivos, Correctivo, Reportes, Calibración.
    - Documentación: Hoja de Vida, Invima, Factura, Importación, Manual, Plano, Ficha Técnica, Guía Rápida, Otros.
  - *Archivo* (PDF, Word, Excel, imágenes, TXT, PPTX). Máx. 50 MB.
  - *Año del documento* (solo para mantenimiento).
  - *Descripción* (opcional, máx. 500).
  - **Subir documento**.
- **Descargar todos** (ZIP) si hay documentos.
- **Tabla** de documentos: Tipo (con icono) · Nombre · Año · Usuario · Acciones (⬇ Descargar · 🗑️ Eliminar).

#### Sub-modales de carpeta (año / documentación)
Abren una tabla filtrada de documentos (`TablaDocumentos`) con acciones **Visualizar** (PDF e imágenes se ven embebidos; otros formatos ofrecen descarga), **Descargar** y **Eliminar**.

### 6.2 Sub-modal "Historial de Ubicaciones"
Componente `HistorialMovimientos` (timeline). Lista cada movimiento: origen → destino (sede/servicio), motivo, responsable y fecha. Si `inventario:editar`, permite 🗑️ eliminar un movimiento. El registro se crea automáticamente al cambiar la ubicación de un equipo.

### 6.3 Sub-modal "Mantenimiento" (Órdenes de Trabajo)
Componente `OrdenesTrabajo` del módulo de Mantenimiento, embebido y filtrado por este equipo. Permite ver/gestionar las OT del equipo y firmar la hoja de rutina (que genera el acta en la carpeta de mantenimiento del año correspondiente). Los cambios de documentos refrescan al instante el resumen.

---

## 7. Semáforos de vencimiento

Función `semaforoVencimiento(fecha)` — usada en INVIMA, garantía y mantenimiento:

| Color | Condición | Significado |
|---|---|---|
| 🔴 Rojo | ≤ 8 días o ya vencido | Crítico / límite |
| 🟡 Amarillo | 9 a 30 días | Próximo a vencer |
| 🟢 Verde | > 30 días | Vigente |

**Próximo mantenimiento** = último mantenimiento + periodicidad (mensual +1 mes, trimestral +3, semestral +6, anual +12; semanal +7 días, quincenal +15; `no_aplica` → sin cálculo). Sobre esa fecha se aplica el mismo semáforo.

---

## 8. Endpoints backend del módulo

Prefijo `/equipos` (tag *Inventario · Equipos*):

| Método | Ruta | Acción | Permiso |
|---|---|---|---|
| GET | `/equipos` | Listar con búsqueda y filtros | `inventario:ver` |
| GET | `/equipos/{id}` | Obtener un equipo | `inventario:ver` |
| POST | `/equipos` | Registrar equipo | `inventario:crear` |
| PUT | `/equipos/{id}` | Editar (y auto-registrar movimiento si cambia ubicación) | `inventario:editar` |
| DELETE | `/equipos/{id}` | Eliminar (borra carpeta de documentos) | `inventario:eliminar` |
| GET | `/equipos/existe-serial` | Verificar serial duplicado | `inventario:ver` |
| GET | `/equipos/existe-numero-activo` | Verificar N° activo duplicado | `inventario:ver` |
| GET | `/equipos/plantilla` | Descargar plantilla Excel | `inventario:crear` |
| POST | `/equipos/importar` | Carga masiva desde Excel | `inventario:crear` |
| POST/GET/DELETE | `/equipos/{id}/foto` | Subir / obtener / eliminar foto (máx. 5 MB, JPG/PNG/WEBP) | ver/editar |
| GET/POST/DELETE | `/equipos/{id}/documentos[...]` | Listar / subir / descargar / eliminar documentos; descargar todos en ZIP (máx. 50 MB/archivo) | ver/editar |
| GET/POST/DELETE | `/equipos/{id}/movimientos[...]` | Historial / registrar / eliminar movimiento de ubicación | ver/editar |

---

## 9. Reglas de negocio destacadas

1. **Serial y N° de activo únicos** — validación en vivo (al salir del campo) y definitiva al guardar; el error se muestra en rojo junto al campo.
2. **Código interno automático** — si se deja vacío al crear, se genera `EQ-0001`, `EQ-0002`…
3. **Servicios inactivos** — no se pueden asignar equipos a servicios inactivos; solo se conserva el ya asignado para no romper la edición.
4. **Trazabilidad de ubicaciones (RF-004)** — todo cambio de sede/servicio queda registrado como movimiento automáticamente.
5. **Documentos organizados** — por categoría (Mantenimiento con año / Documentación) y por tipo; carpeta física por equipo que se elimina junto con el equipo.
6. **Último mantenimiento efectivo** — manual si se indica; si no, se deriva de la última OT completada.
7. **Especificaciones técnicas** — texto libre (no limitado a 50 caracteres) para admitir descripciones.
