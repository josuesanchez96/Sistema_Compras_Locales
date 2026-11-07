# Sistema de Gestión de Compras y Adquisiciones Locales

Aplicación Web Completa para la Gestión de Compras y Adquisiciones Locales desarrollada con un backend en **Node.js (Express REST API)**, base de datos en **SQL Server (T-SQL)** y un frontend reactivo con **HTML5, Tailwind CSS y Alpine.js**.

---

## 🛠️ Stack Tecnológico

- **Backend**: Node.js, Express framework, JWT (JSON Web Tokens), `mssql` (Driver oficial de Microsoft para SQL Server).
- **Base de Datos**: SQL Server (T-SQL) con encriptación de contraseñas de alta seguridad mediante **Argon2id** (`VARCHAR(255)`) con compatibilidad para hashes legados SHA2_512.
- **Frontend**: HTML5, Vanilla CSS, Tailwind CSS (Design System & Dark Mode), Alpine.js (Reactividad y Modales), SheetJS (`xlsx`) para lectura y carga masiva de Excel en el navegador.

---

## 📁 Estructura del Proyecto

```
Sistema_Compras_Locales/
├── database/
│   ├── schema.sql                 # Scripts T-SQL para creación de tablas y llaves foráneas
│   └── seed.sql                   # Datos de prueba iniciales (Usuario admin JSL, Roles, Catálogos)
├── server/
│   ├── package.json               # Dependencias del servidor Node.js
│   ├── .env                       # Variables de entorno y conexión a SQL Server
│   └── src/
│       ├── app.js                 # Servidor Express principal y entrega de archivos estáticos
│       ├── config/
│       │   └── db.js              # Conexión a la base de datos SQL Server
│       ├── middleware/
│       │   ├── authMiddleware.js   # Verificación de Token JWT
│       │   └── roleMiddleware.js   # Control de acceso basado en roles (RBAC)
│       ├── utils/
│       │   └── dateUtils.js       # Manejo y conversión de fechas dd/mm/yyyy <-> YYYY-MM-DD
│       ├── controllers/           # Lógica de negocio (Auth, Usuarios, Catálogos, Pedidos, Compras, Dashboard)
│       └── routes/                # Rutas REST API protegidas
├── client/
│   ├── css/
│   │   └── custom.css             # Estilos personalizados, tarjetas glassmorphic y animaciones
│   ├── js/
│   │   ├── app.js                 # Estado global en Alpine.js y cliente de API REST
│   │   └── excelParser.js         # Utilidad frontend para lectura de Excel mediante SheetJS
│   └── index.html                 # Interfaz de Usuario SPA (Menú lateral, Dashboard, Vistas y Modales)
└── README.md                      # Guía de instalación y uso del sistema
```

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de contar con los siguientes programas instalados en tu equipo:

1. **Node.js**: Versión 16.x o superior ([Descargar Node.js](https://nodejs.org/)).
2. **SQL Server**: Edición Express, Developer o Enterprise (2016 o posterior).
3. **SQL Server Management Studio (SSMS)** o Azure Data Studio.

---

## 🚀 Pasos para Ejecutar el Sistema

### Paso 1: Configurar la Base de Datos en SQL Server

1. Abre **SQL Server Management Studio (SSMS)** y conéctate a tu servidor local.
2. Crea una nueva base de datos llamada `Sistema_Compras_Locales`:
   ```sql
   CREATE DATABASE Sistema_Compras_Locales;
   GO
   USE Sistema_Compras_Locales;
   GO
   ```
3. Ejecuta el contenido del archivo [`database/schema.sql`](database/schema.sql) para crear las 13 tablas relacionales con sus restricciones de integridad.
4. Ejecuta el contenido del archivo [`database/seed.sql`](database/seed.sql) para poblar las tablas con los datos iniciales (Roles, Usuario Administrador `JSL`, Productos, Proveedores, Pedidos de prueba).

---

### Paso 2: Configurar el Backend (Node.js REST API)

1. Abre una terminal de comandos (PowerShell o CMD) y navega a la carpeta `server`:
   ```bash
   cd "c:\PROYECTOS Y EJERCICIOS\Sistema_Compras_Locales\server"
   ```

2. Revisa o edita las credenciales de conexión a SQL Server en el archivo `.env`:
   ```env
   PORT=3000
   JWT_SECRET=super_secret_jwt_key_compras_locales_2026

   DB_USER=sa
   DB_PASSWORD=TuPasswordSeguro123!
   DB_SERVER=localhost
   DB_NAME=Sistema_Compras_Locales
   DB_PORT=1433
   DB_ENCRYPT=false
   ```

3. Instala las dependencias necesarias:
   ```bash
   npm install
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```

Si la conexión es exitosa, verás el siguiente mensaje en la consola:
```
🚀 Servidor ejecutándose en http://localhost:3000
✅ Conexión establecida exitosamente con SQL Server
```

*(Nota: Si SQL Server no estuviera activo temporalmente, el backend cuenta con un modo de respaldo/demostración que permite probar todas las características de la aplicación en el navegador).*

---

### Paso 3: Acceder al Sistema en el Navegador Web

1. Abre tu navegador de preferencia y dirígete a:
   [http://localhost:3000](http://localhost:3000)

2. Utiliza las siguientes credenciales para iniciar sesión:
   - **Usuario**: `a201600577908`
   - **Contraseña**: `a201600577908` (o `123456`)
   - **Nombre de Usuario**: Josué David Sánchez López (`JSL`)
   - **Roles Asignados**: Jefe de bodega, Encargado de pedidos, Encargado de ingresos, Encargado de recepción, Encargado de compras (Acceso completo a todos los módulos).

---

## 🎯 Características Principales

### 1. Dashboard Consolidado (Pestaña Principal)
- **Tarjetas KPI**: Muestran el Total de Pedidos, Pedidos Ingresados, Pedidos Pendientes y Monto Invertido en Quetzales.
- **Sub-Ventana 2 (Resumen por Renglón)**: Tarjetas gráficas interactivas por renglón presupuestario con conteo y barra de progreso (% completado). Al hacer clic en un renglón se filtra automáticamente la Sub-Ventana 1.
- **Sub-Ventana 1 (Listado Consolidado)**: Tabla con columnas completas, badges de estado (`Ingresado` en Emerald / `Pendiente` en Amber), pie de tabla con **Monto Gran Total**, filtros por Cuatrimestre, Estado, Buscador reactivo, paginación de 50 registros y botón de **Exportación a CSV**.

### 2. Carga Masiva mediante Archivos Excel
- **Productos**: Columnas `codigo`, `descripcion`, `renglon`.
- **Proveedores**: Columnas `nit`, `nombre_proveedor`.
- **Pedidos**: Columnas `numero_pedido`, `fecha_pedido`, `codigo`, `cantidad`, `justificacion`.
- **Órdenes de Compra**: Columnas `numero_pedido`, `numero_orden_compra`, `id_tipo_compra`, `fecha_orden`, `fecha_notificacion`, `fecha_vencimiento`.

### 3. Manejo Estricto de Fechas (`dd/mm/yyyy`)
- El sistema convierte automáticamente las fechas ingresadas o cargadas desde Excel al formato `YYYY-MM-DD` de SQL Server y las formatea como `dd/mm/yyyy` en la interfaz para prevenir el error Msg 241.

### 4. Menú Lateral e Interfaz Minimalista
- Menú lateral en el lado izquierdo con opción de colapsar/expandir (`Toggle`) para ampliar las tablas en pantalla completa.
- Botón de **Cerrar Sesión** ubicado fijamente en la esquina inferior izquierda.

---

## 🔐 Matriz de Permisos por Rol

| Módulo | Submódulo | Permisos CRUD | Solo Consulta |
| :--- | :--- | :--- | :--- |
| **Administración** | Crear usuario | Jefe de bodega | Ninguno |
| **Catálogos** | Productos, Responsables, Tipo Compra, Proveedores | Encargado de pedidos | Ninguno |
| **Pedidos** | Listado de Pedidos | Encargado de pedidos | Jefe de bodega, Ingresos, Recepción, Compras |
| **Pedidos** | Asignación de Responsable | Encargado de pedidos | Ninguno |
| **Ejecución Compras** | Registrar orden compra | Encargado de pedidos, Compras | Jefe de bodega, Ingresos, Recepción |
| **Ejecución Compras** | Entrega Orden Compra | Encargado de pedidos | Jefe de bodega, Ingresos, Recepción |
| **Ejecución Compras** | Recepción Orden Compra | Encargado de ingresos | Jefe de bodega, Pedidos, Recepción |
| **Ejecución Compras** | Entrega Expediente | Encargado de pedidos | Jefe de bodega, Ingresos, Recepción |
| **Ejecución Compras** | Recepción de Compra | Pedidos, Ingresos, Recepción | Jefe de bodega, Compras |
| **Dashboard** | Principal | TODOS | TODOS |
