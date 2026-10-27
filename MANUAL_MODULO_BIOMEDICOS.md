# Manual de uso — Módulo de Equipos Biomédicos

**Sistema de Gestión CMVA**

| | |
|---|---|
| **Versión del manual** | 1.0 |
| **Fecha** | ____________________ |
| **Dirigido a** | Ingeniero biomédico · Auxiliares de sistemas · Líder de sistemas |
| **Elaborado por** | ____________________ |

> 🖼️ **Portada / logo institucional:** _inserte aquí el logo y los datos de la institución._

---

## Contenido

1. [Introducción](#1-introducción)
2. [Conceptos básicos](#2-conceptos-básicos)
3. [Acceso al sistema](#3-acceso-al-sistema)
4. [Panel de inicio](#4-panel-de-inicio)
5. [Registrar un equipo (Inventario)](#5-registrar-un-equipo-inventario)
6. [Importar equipos desde Excel](#6-importar-equipos-desde-excel)
7. [Consultar equipos (Equipos)](#7-consultar-equipos-equipos)
8. [Hoja de vida del equipo](#8-hoja-de-vida-del-equipo)
9. [Documentos del equipo](#9-documentos-del-equipo)
10. [Traslados e historial de ubicaciones](#10-traslados-e-historial-de-ubicaciones)
11. [Mantenimiento (órdenes de trabajo y rutinas)](#11-mantenimiento-órdenes-de-trabajo-y-rutinas)
12. [Maestros: Sedes, Servicios y Representantes](#12-maestros-sedes-servicios-y-representantes)
13. [Preguntas frecuentes y errores comunes](#13-preguntas-frecuentes-y-errores-comunes)
14. [Anexo: glosario de campos](#14-anexo-glosario-de-campos)

---

## 1. Introducción

El **Módulo de Equipos Biomédicos** permite llevar el inventario y la trazabilidad completa de los equipos biomédicos de la institución: su registro, ubicación, documentación, mantenimientos y hoja de vida.

Con este módulo usted puede:

- Registrar equipos con toda su información técnica, de adquisición y de garantía.
- Generar e imprimir la **hoja de vida** de cada equipo.
- Adjuntar documentos (manuales, facturas, certificados, etc.).
- Registrar **traslados** entre sedes y servicios, con su historial.
- Programar y ejecutar **mantenimientos** (órdenes de trabajo y rutinas con checklist).
- Administrar los maestros de **sedes, servicios y representantes**.
- Controlar alertas de **garantía** y **registro INVIMA** próximos a vencer.

> 🖼️ **Captura:** _vista general del módulo recién ingresado (barra lateral + panel de inicio)._

---

## 2. Conceptos básicos

| Término | Qué significa |
|---|---|
| **Equipo** | Cada activo biomédico registrado (monitor, bomba de infusión, desfibrilador, etc.). |
| **Código interno** | Identificador único que la institución asigna al equipo. |
| **Hoja de vida** | Documento PDF con toda la información del equipo y su historial de mantenimientos. |
| **Orden de trabajo (OT)** | Registro de un mantenimiento realizado o programado sobre un equipo. |
| **Rutina / checklist** | Lista de pasos a verificar durante un mantenimiento. |
| **Representante** | Empresa que representa/distribuye el equipo (datos de contacto). |
| **Sede / Servicio** | Ubicación del equipo (sede física y servicio o área dentro de ella). |
| **INVIMA** | Registro sanitario del equipo y su fecha de vencimiento. |

---

## 3. Acceso al sistema

### 3.1 Iniciar sesión

1. Abra el navegador e ingrese a la dirección del sistema: `____________________` _(escriba aquí la URL del servidor)_.
2. Escriba su **correo** y **contraseña**.
3. Haga clic en **Iniciar sesión**.

> 🖼️ **Captura:** _pantalla de inicio de sesión._

### 3.2 Seleccionar el módulo

Después de iniciar sesión verá la pantalla **"Tus módulos"**. Haga clic en la tarjeta **Equipos Biomédicos**.

> 🖼️ **Captura:** _pantalla "Tus módulos" con la tarjeta de Equipos Biomédicos resaltada._

### 3.3 La barra lateral

Dentro del módulo, a la izquierda encontrará el menú con las secciones:

- **Inicio** — tablero con indicadores y alertas.
- **Equipos** — consultar equipos y generar hojas de vida.
- **Inventario** — registrar, editar e importar equipos.
- **Sedes** — administrar las sedes.
- **Servicios** — administrar los servicios/áreas.
- **Representantes** — administrar los representantes.
- **Mantenimiento** — órdenes de trabajo y rutinas.

Para volver a la lista de módulos use **Módulos**; para salir del sistema, **Cerrar sesión**.

> 🖼️ **Captura:** _barra lateral del módulo._

---

## 4. Panel de inicio

La sección **Inicio** muestra un resumen del estado del inventario: cantidad de equipos, alertas de **garantías** y **registros INVIMA** próximos a vencer, y los principales indicadores.

Úselo como punto de partida cada día para identificar qué requiere atención.

> 🖼️ **Captura:** _panel de inicio con sus indicadores y alertas._

---

## 5. Registrar un equipo (Inventario)

En la sección **Inventario** se da de alta un equipo nuevo.

1. Haga clic en **Nuevo equipo** (o en el botón de registrar).
2. Complete el formulario, organizado por secciones (ver abajo).
3. Al terminar, haga clic en **Guardar**.

> 🖼️ **Captura:** _botón "Nuevo equipo" y tabla de inventario._
>
> 🖼️ **Captura:** _formulario de registro completo._

> **Campos obligatorios:** los marcados con asterisco (**\***) son obligatorios; sin ellos el sistema no deja guardar.

### 5.1 Identificación

| Campo | Descripción |
|---|---|
| **Código interno \*** | Identificador único del equipo en la institución. |
| **Serial del fabricante \*** | Número de serie que trae el equipo de fábrica. |
| **Nombre del equipo \*** | Nombre genérico (ej.: "Monitor de signos vitales"). |
| **Marca** | Marca del equipo. |
| **Modelo** | Modelo del equipo. |
| **Número de activo** | Número de placa/activo fijo contable, si aplica. |

### 5.2 Ubicación

| Campo | Descripción |
|---|---|
| **Sede** | Sede donde está el equipo (se elige de la lista). |
| **Servicio / Área** | Servicio o área dentro de la sede. |
| **Piso** | Piso o ubicación específica. |

> 💡 Las sedes y servicios se crean antes en sus propias secciones (ver [punto 12](#12-maestros-sedes-servicios-y-representantes)).

### 5.3 Clasificación

| Campo | Descripción |
|---|---|
| **Clase biomédica** | Clasificación biomédica del equipo. |
| **Clase de uso** | Uso del equipo. |
| **Clasificación de riesgo** | Nivel de riesgo (se elige de la lista). |
| **Tecnología predominante** | Tipo de tecnología del equipo. |

### 5.4 Fabricante

Datos de quien **fabrica** el equipo: **Fabricante**, **Año de fabricación**, **País**, **Ciudad**, **Dirección**, **Teléfono** y **Correo**.

### 5.5 Representante

Datos de la empresa que **representa/distribuye** el equipo.

- En **"Elegir representante"** puede seleccionar uno ya creado y el sistema **autocompleta** los campos (Representante, País, Ciudad, Dirección, Teléfono, Correo).
- Los campos quedan **editables** por si necesita ajustar algún dato puntual, o puede escribirlos manualmente si el representante no está en la lista.

> 💡 Los representantes se administran en la sección **Representantes** ([punto 12](#12-maestros-sedes-servicios-y-representantes)).

> 🖼️ **Captura:** _sección Representante con el selector "Elegir representante"._

### 5.6 Especificaciones técnicas

Características eléctricas y físicas del equipo: **Voltaje de operación/máximo**, **Corriente máxima/mínima**, **Potencia consumida**, **Frecuencia**, **Presión**, **Velocidad**, **Temperatura**, **Peso**, **Capacidad** y **Fuentes de alimentación** (selección múltiple).

Complete solo lo que aplique a cada equipo.

### 5.7 Documentación

Marque qué documentación tiene el equipo: **Manuales**, **Planos** y **Recomendaciones del fabricante** (selección múltiple).

> 💡 Esto indica *qué documentación existe*; los archivos se adjuntan en **Documentos del equipo** ([punto 9](#9-documentos-del-equipo)).

### 5.8 Adquisición y garantía

| Campo | Descripción |
|---|---|
| **Modo de adquisición** | Cómo se adquirió (compra, donación, etc.). |
| **Propiedad** | Si es propio, alquilado, en préstamo, comodato, etc. |
| **Fecha de adquisición** | Fecha en que se adquirió. |
| **Costo** | Valor de adquisición. |
| **Orden de compra** / **Factura** | Referencias de la compra. |
| **Garantía: inicio / fin** | Fechas de vigencia de la garantía. |

> 💡 El sistema usa las fechas de garantía para **avisar** cuando están próximas a vencer.

### 5.9 Instalación

**Fecha de instalación** y **Fecha de puesta en funcionamiento** del equipo.

### 5.10 Registro sanitario (INVIMA)

**Registro INVIMA** y **Fecha de vencimiento del INVIMA**. El sistema alerta cuando el registro está por vencer.

### 5.11 Mantenimiento y operación

| Campo | Descripción |
|---|---|
| **Periodicidad de mantenimiento** | Cada cuánto se le hace mantenimiento. |
| **Fecha de último mantenimiento** | Si se deja vacío, se calcula a partir de las órdenes de trabajo. |
| **Calibración (sí/no)** | Si el equipo requiere calibración. |
| **Equipo móvil / fijo** | Tipo de instalación. |
| **Accesorios** | Accesorios que incluye. |
| **Descripción funcional** | Para qué sirve el equipo. |

### 5.12 Foto y observaciones

Puede subir una **foto** del equipo (aparece en la hoja de vida) y registrar **observaciones** generales.

> 🖼️ **Captura:** _carga de foto del equipo._

### 5.13 Editar un equipo

En la tabla de **Inventario**, use el ícono de **editar** (lápiz) en la fila del equipo, cambie lo necesario y **Guarde**.

> 🖼️ **Captura:** _acciones de fila (editar) en la tabla de inventario._

---

## 6. Importar equipos desde Excel

Si necesita cargar muchos equipos a la vez:

1. En **Inventario**, descargue la **plantilla** de Excel.
2. Llene una fila por equipo, respetando las columnas de la plantilla.
3. Use la opción **Importar Excel** y seleccione el archivo.
4. El sistema mostrará cuántos equipos se crearon y, si hubo errores, en qué fila y por qué.

> ⚠️ Respete el formato de las fechas (AAAA-MM-DD) y los valores de las listas indicados en la plantilla.

> 🖼️ **Captura:** _botones de "Plantilla" e "Importar Excel"._
>
> 🖼️ **Captura:** _resultado de la importación (creados / errores)._

---

## 7. Consultar equipos (Equipos)

La sección **Equipos** sirve para **buscar y consultar** la información de un equipo.

1. Use el **buscador** (por nombre, código, serial o marca).
2. Haga clic en el ícono de **ver resumen** (ojo) de un equipo para abrir su ficha.

En la ficha del equipo verá sus datos organizados (Identificación, Ubicación, Clasificación, INVIMA, Garantía, Documentación, Mantenimiento) y los botones para:

- **Documentación** — ver/adjuntar archivos.
- **Generar hoja de vida** — ver e imprimir el PDF.
- Pestañas de **Documentos**, **Historial de ubicaciones** y **Órdenes de trabajo**.

> 🖼️ **Captura:** _lista de equipos con el buscador._
>
> 🖼️ **Captura:** _ficha/resumen de un equipo con sus botones._

---

## 8. Hoja de vida del equipo

La **hoja de vida** es el documento PDF oficial del equipo. Incluye sus datos, representante, especificaciones y el historial de mantenimientos.

1. Abra la ficha del equipo (sección **Equipos**).
2. Haga clic en **Generar hoja de vida**.
3. Revise el PDF en pantalla y, si lo requiere, **descárguelo o imprímalo**.

> 🖼️ **Captura:** _hoja de vida generada (PDF)._

---

## 9. Documentos del equipo

Permite adjuntar y consultar archivos del equipo (manuales, facturas, certificados, actas, etc.).

1. En la ficha del equipo, abra **Documentación**.
2. Para **agregar**: seleccione el archivo y súbalo.
3. Para **ver/descargar**: haga clic en el documento en la lista.

> 🖼️ **Captura:** _ventana de documentos del equipo._

---

## 10. Traslados e historial de ubicaciones

Cuando un equipo cambia de sede o servicio, registre el **traslado** para mantener la trazabilidad.

1. En la ficha del equipo, abra **Historial de ubicaciones**.
2. Registre el nuevo destino (sede/servicio), el **motivo** y el **responsable**.
3. El sistema actualiza la ubicación actual y guarda el movimiento en el historial.

> 🖼️ **Captura:** _historial de ubicaciones / registro de traslado._

---

## 11. Mantenimiento (órdenes de trabajo y rutinas)

La sección **Mantenimiento** permite gestionar los mantenimientos de los equipos.

### 11.1 Órdenes de trabajo (OT)

- Cada **OT** representa un mantenimiento sobre un equipo.
- Desde la ficha del equipo (pestaña **Órdenes de trabajo**) o desde la sección **Mantenimiento** puede crear y consultar las OT.
- Una OT marcada como **completada** queda bloqueada para edición.

> 🖼️ **Captura:** _listado de órdenes de trabajo de un equipo._

### 11.2 Checklist / rutina

- Cada OT puede tener un **checklist** (lista de pasos) que el técnico va marcando a medida que realiza el mantenimiento.
- Al finalizar, se genera la **hoja de rutina** (acta), que se puede **firmar y guardar**.

> 🖼️ **Captura:** _checklist de la rutina dentro de una OT._
>
> 🖼️ **Captura:** _hoja de rutina para firmar._

### 11.3 Cambios de estado en lote

El sistema permite cambiar el estado de varias OT a la vez. Tenga en cuenta: para que un acta/hoja de rutina quede **firmada**, debe hacerse desde **"Ver hoja de rutina → Firmar y guardar"**.

> 🖼️ **Captura:** _acciones de estado en lote._

---

## 12. Maestros: Sedes, Servicios y Representantes

Los **maestros** son las listas base que se usan al registrar equipos. Conviene crearlos **antes** de registrar equipos.

### 12.1 Sedes

En **Sedes** puede crear, editar y consultar las sedes físicas de la institución.

> 🖼️ **Captura:** _administración de sedes._

### 12.2 Servicios

En **Servicios** se administran los servicios o áreas (ej.: UCI, Urgencias, Hospitalización).

> 🖼️ **Captura:** _administración de servicios._

### 12.3 Representantes

En **Representantes** se administran las empresas representantes/distribuidoras.

1. Haga clic en **Nuevo representante**.
2. Complete: **Representante** (nombre), **País**, **Ciudad**, **Dirección**, **Teléfono** y **Correo**.
3. Guarde.

Estos representantes son los que luego aparecen en el selector **"Elegir representante"** del formulario de equipos ([punto 5.5](#55-representante)).

> 🖼️ **Captura:** _administración de representantes._

---

## 13. Preguntas frecuentes y errores comunes

**No puedo guardar un equipo.**
Revise que estén completos los campos obligatorios (marcados con **\***): código interno, serial y nombre.

**No aparece la sede / el servicio / el representante en la lista.**
Créelo primero en su sección correspondiente (Sedes, Servicios o Representantes).

**La importación de Excel marcó errores.**
El sistema indica la fila y el motivo. Lo más común: fechas con formato incorrecto (use AAAA-MM-DD) o valores que no coinciden con las listas de la plantilla.

**No veo la foto en la hoja de vida.**
Asegúrese de haber subido la foto del equipo desde el formulario de registro/edición.

**No encuentro un equipo.**
Use el buscador de la sección **Equipos** (busca por nombre, código, serial o marca).

**Una orden de trabajo no me deja editarla.**
Si está **completada**, queda bloqueada. Verifique su estado.

---

## 14. Anexo: glosario de campos

> 🖼️ **Espacio opcional:** _si lo desea, agregue aquí una tabla con los valores exactos de las listas desplegables (estados del equipo, clasificación de riesgo, propiedad, modo de adquisición, etc.) tal como aparecen en su instalación._

| Lista | Valores (complete según su instalación) |
|---|---|
| Estado del equipo | ____________________ |
| Clasificación de riesgo | ____________________ |
| Propiedad | ____________________ |
| Modo de adquisición | ____________________ |
| Clase biomédica / Clase de uso | ____________________ |

---

_Fin del manual._
