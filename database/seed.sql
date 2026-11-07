-- ============================================================================
-- SCRIPT DE DATOS INICIALES (SEED DATA): SISTEMA DE COMPRAS Y ADQUISICIONES
-- ============================================================================

-- 1. Insertar el usuario administrador inicial
INSERT INTO Usuarios (id_usuario, nombre_completo, usuario, contrasena_hash)
VALUES (
    'JSL', 
    'Josué David Sánchez López', 
    'a201600577908', 
    '$argon2id$v=19$m=19456,t=2,p=1$589/lQZmrw9cpgKzBUKM3g$zSp0RL+02+xfj6v0zqOFv6J/Ic2zdnMu1N9PJz0jRwc'
);

-- 2. Insertar Roles del sistema
INSERT INTO Roles (nombre_rol) VALUES 
('Jefe de bodega'),
('Encargado de pedidos'),
('Encargado de ingresos'),
('Encargado de recepción'),
('Encargado de compras');

-- 3. Asignar todos los roles al usuario principal (JSL)
INSERT INTO Usuario_Roles (id_usuario, id_rol) VALUES 
('JSL', 1), -- Jefe de bodega
('JSL', 2), -- Encargado de pedidos
('JSL', 3), -- Encargado de ingresos
('JSL', 4), -- Encargado de recepción
('JSL', 5); -- Encargado de compras

-- 4. Insertar Productos de prueba
INSERT INTO Productos (codigo, descripcion, renglon) VALUES
('7', 'Clindamicina clorhidrato Cápsula 300 mg', '266'),
('10534', 'Sitagliptina Fosfato Comprimido recubierto 100 mg', '266'),
('354', 'Metformina Tableta de liberación prolongada 1000 mg', '266'),
('599', 'Hierro aminoquelado + ácido fólico Tableta 30 mg + 250-300 mcg', '266');

-- 5. Insertar Responsables de prueba
INSERT INTO Responsables (id_responsable, nombre_completo) VALUES 
('SHN', 'Sheny Magaly'),
('ANA', 'Ana Luisa'),
('DEN', 'Dennise Orozco'),
('MAB', 'Maby Soc');

-- 6. Insertar Tipos de Compra
INSERT INTO TipoCompra (id_tipo_compra, nombre_tipo) VALUES
('CD', 'Compra Directa'),
('CA', 'Contrato Abierto'),
('BC', 'Baja Cuantía'),
('CT', 'Cotización'),
('LP', 'Licitación Pública');

-- 7. Insertar Proveedores
INSERT INTO Proveedores (nit, nombre_proveedor) VALUES
('2342855', 'Instituto Guatemalteco de Seguridad Social'),
('1234567', 'Droguería Guatemala, S. A.');

-- 8. Insertar Pedidos iniciales
INSERT INTO Pedidos (numero_pedido, fecha_pedido, codigo, cantidad, justificacion) VALUES 
(1000, '2026-07-21', '7', 10000, 'Segunda Programación Cuatrimestral de Compras 2026'),
(1005, '2026-07-21', '354', 1200, 'Segunda Programación Cuatrimestral de Compras 2026'),
(1006, '2026-07-21', '7', 200, 'Segunda Programación Cuatrimestral de Compras 2026'),
(1007, '2026-07-21', '599', 11200, 'Segunda Programación Cuatrimestral de Compras 2026');

-- 9. Insertar Asignación en ProcesoCompra
INSERT INTO ProcesoCompra (numero_pedido, id_responsable) VALUES 
(1000, 'SHN'),
(1005, 'ANA'),
(1006, 'DEN'),
(1007, 'MAB');

-- 10. Insertar Orden de Compra de prueba
INSERT INTO OrdenCompra (numero_orden_compra, numero_pedido, id_tipo_compra, fecha_orden, fecha_notificacion, fecha_vencimiento) VALUES
('123123', 1000, 'BC', '2026-07-20', '2026-07-21', '2026-07-31');

-- 11. Insertar Entrega de Orden de Compra
INSERT INTO EntregaOrdenCompra (fecha_entrega, numero_orden_compra, usuario_entrega, fecha_recepcion) VALUES 
('2026-07-22', '123123', 'a201600577908', '2026-07-23');

-- 12. Insertar Entrega de Expediente
INSERT INTO EntregaExpediente (fecha_entrega_expediente, numero_orden_compra) VALUES 
('2026-07-25', '123123');

-- 13. Insertar Recepción de Compra
INSERT INTO RecepcionCompra (numero_orden_compra, fecha_ingreso, serie_factura, numero_factura, nit, precio_unitario) VALUES 
('123123', '2026-07-25', 'ABC123ABC', '22223330', '2342855', 0.50);
