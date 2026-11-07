# Sistema de Gestión de Compras y Adquisiciones Locales

Aplicación Web Empresarial para el Control, Seguimiento y Auditoría del ciclo completo de **Compras y Adquisiciones Locales**. Desarrollada con arquitectura desacoplada: backend en **Node.js (Express REST API)**, base de datos en **Microsoft Azure SQL Database (T-SQL)** y un frontend reactivo tipo SPA con **HTML5, Tailwind CSS y Alpine.js**.

- 🌐 **Despliegue en Producción (Render):** [https://sistema-compras-locales.onrender.com](https://sistema-compras-locales.onrender.com)
- 🗄️ **Base de Datos en la Nube:** Microsoft Azure SQL Server (`sqlserver-estudiante-miumg.database.windows.net`)

---

## 🛠️ Stack Tecnológico

- **Backend**: Node.js, Express framework, JWT (JSON Web Tokens con expiración a 12h), `mssql` (Driver oficial de Microsoft para SQL Server).
- **Seguridad Criptográfica**: **Argon2id** (mediante `@node-rs/argon2`, estándar de referencia OWASP) con soporte de **migración transparente progresiva** desde hashes legados SHA2-512.
- **Base de Datos**: Microsoft Azure SQL Server / SQL Server local (T-SQL) con 13 tablas relacionales normalizadas, constraints e integridad referencial.
- **Frontend**: HTML5, Vanilla CSS, Tailwind CSS (Design System corporativo y Dark/Light Mode), Alpine.js (Estado reactivo global y modales), SheetJS (`xlsx`) para lectura y carga masiva de Excel en el navegador.

---

## 📁 Estructura del Proyecto

```
Sistema_Compras_Locales/
├── database/
│   ├── schema.sql                 # Scripts T-SQL (13 tablas, claves foráneas, índices, VARCHAR(255) para contraseñas)
│   └── seed.sql                   # Datos iniciales (Usuario admin JSL con Argon2id, Roles, Catálogos base)
├── server/
│   ├── package.json               # Dependencias (Express, @node-rs/argon2, mssql, jsonwebtoken, etc.)
│   ├── .env                       # Variables de entorno y conexión segura a Azure SQL
│   └── src/
│       ├── app.js                 # Servidor Express principal y entrega estática de la SPA
│       ├── config/
│       │   └── db.js              # Pool de conexiones optimizado para Azure SQL / SQL Server
│       ├── middleware/
│       │   ├── authMiddleware.js   # Verificación y decodificación de tokens JWT
│       │   └── roleMiddleware.js   # Control de acceso basado en roles (RBAC)
│       ├── utils/
│       │   └── dateUtils.js       # Conversión y formateo estricto de fechas dd/mm/yyyy <-> YYYY-MM-DD
│       │   └── passwordUtils.js   # Hashing y verificación con Argon2id y soporte legacy SHA-512
│       ├── controllers/           # Lógica de negocio (Auth, Usuarios, Catálogos, Pedidos, Compras, Dashboard)
│       └── routes/                # Enrutamiento de endpoints REST API protegidos
├── client/
│   ├── css/
│   │   └── custom.css             # Estilos personalizados, efectos glassmorphism y animaciones
│   ├── js/
│   │   ├── app.js                 # Estado global de la aplicación (Alpine.js) y cliente HTTP REST
│   │   └── excelParser.js         # Utilidad frontend para importación y validación masiva con SheetJS
│   └── index.html                 # Interfaz de Usuario SPA (Menú lateral, Dashboard, Vistas y Modales)
└── README.md                      # Documentación integral del sistema
```

---

## 🔄 Flujo Operativo del Sistema

El sistema implementa una trazabilidad lineal y auditable en 4 etapas:

```
[1. Catálogos] ➔ [2. Pedidos] ➔ [3. Órdenes de Compra] ➔ [4. Recepción & Factura]
```

1. **Gestión de Catálogos Maestros:** Alta y mantenimiento de Productos (asociados a su **renglón presupuestario**), Proveedores con **NIT**, Responsables institucionales y Tipos de Compra (Baja Cuantía, Compra Directa, etc.). Admite importación masiva en Excel.
2. **Ciclo de Pedidos:** Registro formal del requerimiento con cantidad y justificación de gasto. Asignación delegada de un responsable para dar trámite a la gestión.
3. **Ejecución de Compras y Expediente:**
   - Emisión de la Orden de Compra vinculada al pedido.
   - Control de plazos contractuales (Fecha de orden, fecha de notificación oficial al proveedor y fecha de vencimiento).
   - Entrega física y recepción de la orden con control de usuarios y fechas.
   - Traslado y entrega del expediente administrativo.
4. **Recepción de Almacén y Liquidación Fiscal:** Registro del ingreso físico de mercadería a bodega, serie y número de factura electrónica, NIT del proveedor y precio unitario con cálculo automático de montos totales y actualización a estado **Ingresado**.

---

## 🎯 Reglas de Negocio y Mejoras Recientes

### 1. Seguridad Avanzada con Argon2id (OWASP)
- **Cero SHA-512 directo:** Se reemplazó el uso de `HASHBYTES('SHA2_512', ...)` por el algoritmo **Argon2id** (`@node-rs/argon2`), brindando protección adaptativa de alto costo contra ataques de fuerza bruta por GPU/ASIC.
- **Migración Transparente (Lazy Migration):** Los usuarios que tenían contraseñas con el algoritmo antiguo son validados correctamente en su primer inicio de sesión, y en ese mismo instante el sistema re-hashea y actualiza su contraseña a Argon2id en Azure SQL de forma 100% invisible.
- **Auto-migración de esquema:** Comprobación y ajuste automático del campo `contrasena_hash` a `VARCHAR(255) NOT NULL`.

### 2. Integridad en Órdenes de Compra
- Al crear una nueva orden de compra, el selector y buscador **excluyen automáticamente los pedidos que ya tienen una orden asignada**, previniendo compras duplicadas o inconsistencias de stock.
- Validación de rechazo en el backend si se intenta enviar un número de pedido previamente asignado.

### 3. Control de Recepción de Compras y Facturación
- En el modal de registro de recepción de compra, el buscador de pedidos **solo muestra órdenes pendientes de recibir**, ocultando automáticamente los pedidos que ya fueron ingresados a almacén.
- Validación estricta en el backend contra registros duplicados de recepción.

---

## 📊 Tablero de Control (Dashboard Ejecutivo)

- **Métricas KPI en Tiempo Real:** Total de Pedidos, Pedidos Ingresados a Bodega, Pedidos Pendientes de Entrega y Monto Invertido acumulado en Quetzales.
- **Sub-Ventana 1 (Consolidado General):** Matriz completa que relaciona pedido, fechas, orden de compra, código de insumo, descripción, renglón, cantidades, precios y badges de estado (`Ingresado` / `Pendiente`).
- **Sub-Ventana 2 (Resumen por Renglón):** Agrupación y totalización financiera por renglón presupuestario con barras de avance porcentual. Al seleccionar un renglón, la vista consolidada se filtra instantáneamente.
- **Filtros Avanzados:** Filtrado por Cuatrimestres fiscales (1er, 2do y 3er cuatrimestre), estado de compra, búsqueda predictiva y exportación de datos a **CSV**.

---

## 🔐 Matriz de Control de Acceso por Roles (RBAC)

| Módulo | Funcionalidad | Roles con Permiso Total | Permiso Solo Consulta |
| :--- | :--- | :--- | :--- |
| **Administración** | Crear usuarios, resetear contraseñas, asignar roles | Jefe de bodega | Ninguno |
| **Catálogos** | Productos, Proveedores, Responsables, Tipos de Compra | Encargado de pedidos | Ninguno |
| **Pedidos** | Listado de pedidos y carga masiva | Encargado de pedidos | Jefe de bodega, Compras, Ingresos, Recepción |
| **Pedidos** | Asignación de Responsable | Encargado de pedidos | Ninguno |
| **Ejecución Compras** | Registro de Órdenes de Compra | Encargado de pedidos, Encargado de compras | Jefe de bodega, Ingresos, Recepción |
| **Ejecución Compras** | Entrega de Orden al Proveedor | Encargado de pedidos | Jefe de bodega, Compras, Recepción |
| **Ejecución Compras** | Recepción de Orden | Encargado de ingresos | Jefe de bodega, Pedidos, Recepción |
| **Ejecución Compras** | Entrega de Expediente | Encargado de pedidos | Jefe de bodega, Compras, Recepción |
| **Ejecución Compras** | Recepción de Almacén y Facturación | Encargado de pedidos, Ingresos, Recepción | Jefe de bodega, Compras |
| **Dashboard** | Métricas KPIs, Consolidado y Resumen por Renglón | **Todos los roles** | **Todos los roles** |

---

## 🚀 Despliegue y Ejecución

### Opción A: Despliegue en la Nube (Render + Azure SQL)
1. Alojar el repositorio en GitHub.
2. Crear un **Web Service** en Render conectado al repositorio:
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
3. Configurar variables de entorno en Render (**Environment**):
   ```env
   PORT=10000
   JWT_SECRET=tu_clave_secreta_jwt_larga_y_aleatoria
   DB_USER=sqladmin
   DB_PASSWORD=TuPasswordSeguroAzureSQL
   DB_SERVER=sqlserver-estudiante-miumg.database.windows.net
   DB_NAME=bd_compras_locales
   DB_PORT=1433
   DB_ENCRYPT=true
   TZ=America/Guatemala
   ```
4. En el firewall de Azure SQL Server, habilitar la opción: *"Permitir que los recursos y servicios de Azure accedan a este servidor"*.

---

### Opción B: Ejecución en Entorno Local

#### 1. Requisitos Previos
- Node.js versión 18.x o superior.
- SQL Server (Express, Developer o Azure SQL) con SSMS o Azure Data Studio.

#### 2. Base de Datos
- Ejecutar [`database/schema.sql`](database/schema.sql) para crear las tablas.
- Ejecutar [`database/seed.sql`](database/seed.sql) para insertar roles y el usuario administrador `JSL`.

#### 3. Backend y Servidor
```bash
cd server
npm install
npm start
```

#### 4. Acceso al Sistema
- **URL Local:** `http://localhost:3000`
- **Autenticación:** Ingrese con sus credenciales asignadas o configuradas durante el despliegue inicial.
- **Seguridad:** Por políticas de seguridad y buenas prácticas de protección de credenciales, los nombres de usuario y contraseñas de cuentas administradoras no se publican en este documento. Para pruebas o acceso inicial, solicite las credenciales al administrador del sistema.
