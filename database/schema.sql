-- ============================================================================
-- SCRIPT DE BASE DE DATOS T-SQL: SISTEMA DE COMPRAS Y ADQUISICIONES LOCALES
-- ============================================================================

-- 1. Tabla Usuarios
CREATE TABLE Usuarios (
    id_usuario CHAR(3) PRIMARY KEY,                   -- Siglas de 3 letras (ej. JSL)
    nombre_completo VARCHAR(150) NOT NULL,            -- Nombre del usuario
    usuario VARCHAR(50) NOT NULL UNIQUE,              -- Nombre de usuario único
    contrasena_hash VARCHAR(255) NOT NULL            -- Contraseña encriptada con Argon2id (OWASP)
);

-- 2. Tabla Roles / Perfiles
CREATE TABLE Roles (
    id_rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
);

-- 3. Tabla Intermedia para Asignación de Roles
CREATE TABLE Usuario_Roles (
    id_usuario CHAR(3) NOT NULL,
    id_rol INT NOT NULL,
    PRIMARY KEY (id_usuario, id_rol),
    CONSTRAINT FK_UR_Usuario FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT FK_UR_Rol FOREIGN KEY (id_rol) REFERENCES Roles(id_rol) ON DELETE CASCADE
);

-- 4. Tabla Productos
CREATE TABLE Productos(
    codigo VARCHAR(50) PRIMARY KEY,
    descripcion VARCHAR(250) NOT NULL,
    renglon VARCHAR(20)
);

-- 5. Tabla Responsables
CREATE TABLE Responsables(
    id_responsable CHAR(3) PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL
);

-- 6. Tabla TipoCompra
CREATE TABLE TipoCompra(
    id_tipo_compra CHAR(3) PRIMARY KEY,
    nombre_tipo VARCHAR(50) NOT NULL UNIQUE
);

-- 7. Tabla Proveedores
CREATE TABLE Proveedores(
    nit VARCHAR(25) PRIMARY KEY,
    nombre_proveedor VARCHAR(200) NOT NULL
);

-- 8. Tabla Pedidos
CREATE TABLE Pedidos(
    numero_pedido INT PRIMARY KEY,
    fecha_pedido DATE NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    justificacion VARCHAR(500) NOT NULL,
    CONSTRAINT FK_PedidoProducto
        FOREIGN KEY(codigo)
        REFERENCES Productos(codigo)
);

-- 9. Tabla ProcesoCompra (Asignación de Responsable)
CREATE TABLE ProcesoCompra(
    id_proceso INT IDENTITY(1,1) PRIMARY KEY,
    numero_pedido INT NOT NULL UNIQUE,
    id_responsable CHAR(3) NOT NULL,
    CONSTRAINT FK_ProcesoPedido
        FOREIGN KEY(numero_pedido)
        REFERENCES Pedidos(numero_pedido),
    CONSTRAINT FK_ProcesoResponsable
        FOREIGN KEY(id_responsable)
        REFERENCES Responsables(id_responsable)
);

-- 10. Tabla OrdenCompra
CREATE TABLE OrdenCompra(
    numero_orden_compra CHAR(10) PRIMARY KEY,
    numero_pedido INT NOT NULL,
    id_tipo_compra CHAR(3),
    fecha_orden DATE,
    fecha_notificacion DATE,
    fecha_vencimiento DATE,
    CONSTRAINT FK_OC_Pedido
        FOREIGN KEY(numero_pedido)
        REFERENCES Pedidos(numero_pedido),
    CONSTRAINT FK_OC_TipoCompra
        FOREIGN KEY(id_tipo_compra)
        REFERENCES TipoCompra(id_tipo_compra)
);

-- 11. Tabla EntregaOrdenCompra
CREATE TABLE EntregaOrdenCompra (
    id_entrega INT IDENTITY(1,1) PRIMARY KEY,
    numero_orden_compra CHAR(10) NOT NULL,
    fecha_entrega DATETIME2,
    usuario_entrega VARCHAR(50),
    fecha_recepcion DATETIME2,
    usuario_recepcion VARCHAR(50),
    CONSTRAINT FK_Entrega_OrdenCompra
        FOREIGN KEY(numero_orden_compra)
        REFERENCES OrdenCompra(numero_orden_compra),
    CONSTRAINT FK_Entrega_Usuario
        FOREIGN KEY(usuario_recepcion)
        REFERENCES Usuarios(usuario),
    CONSTRAINT FK_Entrega_UsuarioEntrego
        FOREIGN KEY(usuario_entrega)
        REFERENCES Usuarios(usuario)
);

-- 12. Tabla EntregaExpediente
CREATE TABLE EntregaExpediente (
    id_entrega INT IDENTITY(1,1) PRIMARY KEY,
    fecha_entrega_expediente DATE NOT NULL,
    numero_orden_compra CHAR(10) NOT NULL,
    CONSTRAINT FK_EntregaExpediente_OrdenCompra
        FOREIGN KEY(numero_orden_compra)
        REFERENCES OrdenCompra(numero_orden_compra)
);

-- 13. Tabla RecepcionCompra
CREATE TABLE RecepcionCompra(
    id_recepcion_compra INT IDENTITY (1,1) PRIMARY KEY,
    numero_orden_compra CHAR(10) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    serie_factura VARCHAR(30),
    numero_factura VARCHAR(30),
    nit VARCHAR(25),
    precio_unitario DECIMAL(18,2),
    CONSTRAINT FK_RecepcionOrden
        FOREIGN KEY(numero_orden_compra)
        REFERENCES OrdenCompra(numero_orden_compra),
    CONSTRAINT FK_RecepcionProveedor
        FOREIGN KEY(nit)
        REFERENCES Proveedores(nit)
);
