-- ============================================================
-- APP DE GESTIÓN DE REPARTO — DATOS DE PRUEBA Y PRUEBAS
-- ============================================================
-- Orden: 1_base_datos.sql -> 2_pkg_reparto_y_triggers.sql -> este.
-- Ejecutar con F5 (Run Script) en SQL Developer, sobre un
-- esquema recién creado: los ID son IDENTITY y las pruebas
-- suponen que parten en 1.
--
-- Cada prueba dice qué se espera. Lo que salga de verdad se
-- anota en la columna "Se obtuvo" de la lámina de pruebas
-- (js/contenido.js, id 'pruebas').
-- ============================================================

SET SERVEROUTPUT ON


-- ------------------------------------------------------------
-- 1. DATOS DE PRUEBA
-- ------------------------------------------------------------

-- Catálogos. El orden importa: el código usa estos ID.
INSERT INTO rol(nombre_rol) VALUES ('OPERARIO');      -- 1
INSERT INTO rol(nombre_rol) VALUES ('EJECUTIVO');     -- 2

INSERT INTO estado_pedido(nombre_estado) VALUES ('CREADO');      -- 1
INSERT INTO estado_pedido(nombre_estado) VALUES ('EN_RUTA');     -- 2
INSERT INTO estado_pedido(nombre_estado) VALUES ('ENTREGADO');   -- 3
INSERT INTO estado_pedido(nombre_estado) VALUES ('FALLIDO');     -- 4
INSERT INTO estado_pedido(nombre_estado) VALUES ('REAGENDADO');  -- 5

INSERT INTO estado_ruta(nombre_estado) VALUES ('PENDIENTE');     -- 1
INSERT INTO estado_ruta(nombre_estado) VALUES ('EN_CURSO');      -- 2
INSERT INTO estado_ruta(nombre_estado) VALUES ('FINALIZADA');    -- 3

INSERT INTO estado_notificacion(nombre_estado) VALUES ('PENDIENTE');  -- 1
INSERT INTO estado_notificacion(nombre_estado) VALUES ('ENVIADA');    -- 2
INSERT INTO estado_notificacion(nombre_estado) VALUES ('FALLIDA');    -- 3

-- Usuarios: dos operarios y un ejecutivo.
INSERT INTO usuario(nombre, username, password_hash, id_rol) VALUES ('Operario Uno', 'op1', 'hash', 1);   -- 1
INSERT INTO usuario(nombre, username, password_hash, id_rol) VALUES ('Operario Dos', 'op2', 'hash', 1);   -- 2
INSERT INTO usuario(nombre, username, password_hash, id_rol) VALUES ('Ejecutiva', 'ejec1', 'hash', 2);    -- 3

INSERT INTO vehiculo(codigo, tipo, capacidad, id_operario) VALUES ('VAN-01', 'Furgon', 800, 1);  -- 1
INSERT INTO vehiculo(codigo, tipo, capacidad, id_operario) VALUES ('VAN-02', 'Furgon', 800, 2);  -- 2

-- Clientes con su dirección.
INSERT INTO direccion(region, provincia, comuna, calle, numero) VALUES ('Los Lagos', 'Llanquihue', 'Puerto Montt', 'Av. Angelmo', '100');
INSERT INTO direccion(region, provincia, comuna, calle, numero) VALUES ('Los Lagos', 'Llanquihue', 'Puerto Varas', 'Del Salvador', '200');
INSERT INTO direccion(region, provincia, comuna, calle, numero) VALUES ('Los Lagos', 'Osorno', 'Osorno', 'Ramirez', '300');

INSERT INTO cliente(nombre, id_direccion, email) VALUES ('Cliente A', 1, 'a@correo.cl');  -- 1
INSERT INTO cliente(nombre, id_direccion, email) VALUES ('Cliente B', 2, 'b@correo.cl');  -- 2
INSERT INTO cliente(nombre, id_direccion, email) VALUES ('Cliente C', 3, 'c@correo.cl');  -- 3

-- Dos rutas en curso.
INSERT INTO ruta(id_operario, id_vehiculo, fecha, id_estado_ruta) VALUES (1, 1, TRUNC(SYSDATE), 2);  -- ruta 1
INSERT INTO ruta(id_operario, id_vehiculo, fecha, id_estado_ruta) VALUES (2, 2, TRUNC(SYSDATE), 2);  -- ruta 2

-- Ruta 1 lleva los pedidos 1, 2 y 3. Ruta 2 lleva el pedido 4.
INSERT INTO pedido(id_cliente, id_ejecutivo, id_ruta, id_estado_pedido) VALUES (1, 3, 1, 2);  -- 1
INSERT INTO pedido(id_cliente, id_ejecutivo, id_ruta, id_estado_pedido) VALUES (2, 3, 1, 2);  -- 2
INSERT INTO pedido(id_cliente, id_ejecutivo, id_ruta, id_estado_pedido) VALUES (3, 3, 1, 2);  -- 3
INSERT INTO pedido(id_cliente, id_ejecutivo, id_ruta, id_estado_pedido) VALUES (1, 3, 2, 2);  -- 4

-- Una factura por pedido, todavía sin resultado.
INSERT INTO factura(id_pedido, numero_factura) VALUES (1, 'F-0001');
INSERT INTO factura(id_pedido, numero_factura) VALUES (2, 'F-0002');
INSERT INTO factura(id_pedido, numero_factura) VALUES (3, 'F-0003');
INSERT INTO factura(id_pedido, numero_factura) VALUES (4, 'F-0004');

COMMIT;


-- ------------------------------------------------------------
-- 2. registrar_entrega (procedimiento CON parámetros)
-- ------------------------------------------------------------

-- P1. Entrega fallida con razón del catálogo.
-- Esperado: "Entregas fallidas: 1" (lo imprime trg_contar_fallidas)
--           y luego "Entrega registrada correctamente".
DECLARE
    v_msg VARCHAR2(200);
BEGIN
    pkg_reparto.registrar_entrega(1, 'FALLIDO', 'CLIENTE_AUSENTE', v_msg);
    DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/

-- P2. Razón que no está en el catálogo.
-- Esperado: "Error: razon de fallo no permitida".
DECLARE
    v_msg VARCHAR2(200);
BEGIN
    pkg_reparto.registrar_entrega(2, 'FALLIDO', 'Razon inventada', v_msg);
    DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/

-- P3. Fallida sin razón.
-- Esperado: "Error: razon de fallo obligatoria".
DECLARE
    v_msg VARCHAR2(200);
BEGIN
    pkg_reparto.registrar_entrega(2, 'FALLIDO', NULL, v_msg);
    DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/

-- P4. Resultado que no existe (antes dejaba el pedido como FALLIDO).
-- Esperado: "Error: resultado de entrega no valido".
DECLARE
    v_msg VARCHAR2(200);
BEGIN
    pkg_reparto.registrar_entrega(2, 'ENTREGADO', NULL, v_msg);
    DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/

-- P5. Pedido que no existe.
-- Esperado: "Pedido no encontrado".
DECLARE
    v_msg VARCHAR2(200);
BEGIN
    pkg_reparto.registrar_entrega(999, 'LOGRADO', NULL, v_msg);
    DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/

-- Comprobación: solo el pedido 1 cambió (estado 4 = FALLIDO);
-- el 2 sigue en estado 2 porque P2, P3 y P4 hicieron ROLLBACK.
SELECT p.id_pedido, p.id_estado_pedido, f.resultado_entrega, f.razon_fallo
FROM pedido p JOIN factura f ON f.id_pedido = p.id_pedido
ORDER BY p.id_pedido;


-- ------------------------------------------------------------
-- 3. Funciones CON y SIN parámetros
-- ------------------------------------------------------------

-- P6. contar_pedidos_fallidos: una fila por ruta.
-- Esperado: ruta 1 -> 1, ruta 2 -> 0.
SELECT id_ruta,
       pkg_reparto.contar_pedidos_fallidos(id_ruta) AS fallidos
FROM ruta
ORDER BY id_ruta;

-- P7. total_pedidos_en_ruta: sin parámetros.
-- Esperado: 3 (pedidos 2, 3 y 4) si se ejecuta antes de P12. Al final del
-- script da 1, porque P12 ya dejó los pedidos 2 y 3 como ENTREGADO.
SELECT pkg_reparto.total_pedidos_en_ruta AS en_ruta
FROM dual;

-- Comprobación a mano de P7: tiene que dar lo mismo.
SELECT COUNT(*) AS en_ruta_a_mano
FROM pedido
WHERE id_estado_pedido = 2;


-- ------------------------------------------------------------
-- 4. Triggers de FILA y de SENTENCIA
-- ------------------------------------------------------------

-- P8. trg_notificar_entrega: P1 tuvo que dejar una notificación.
-- Esperado: 1 fila, pedido 1, tipo EMAIL, fecha de hoy.
SELECT id_notificacion, id_pedido, tipo, id_estado_notificacion, fecha_envio
FROM notificacion
WHERE id_pedido = 1;

-- P9. El trigger de fila NO se dispara si cambia otra columna.
-- Esperado: notificaciones del pedido 4 = 0 antes y después.
SELECT COUNT(*) AS antes FROM notificacion WHERE id_pedido = 4;
UPDATE factura SET foto_url = 'foto.jpg' WHERE id_pedido = 4;
SELECT COUNT(*) AS despues FROM notificacion WHERE id_pedido = 4;
ROLLBACK;

-- P10. Un UPDATE que cambia DOS filas.
-- Esperado: "2 rows updated", UNA sola línea "Entregas fallidas: 1"
-- (sentencia: una vez) y DOS notificaciones nuevas (fila: dos veces).
UPDATE factura
SET resultado_entrega = 'LOGRADO'
WHERE id_pedido IN (2, 3);

SELECT id_pedido, tipo, fecha_envio
FROM notificacion
WHERE id_pedido IN (2, 3);

-- Se deshace: fue un UPDATE directo, sin pasar por el procedimiento.
ROLLBACK;


-- ------------------------------------------------------------
-- 5. cerrar_rutas_completas (procedimiento SIN parámetros)
-- ------------------------------------------------------------

-- P11. Con pedidos pendientes no cierra nada.
-- Esperado: "Rutas cerradas: 0".
BEGIN
    pkg_reparto.cerrar_rutas_completas;
END;
/

-- Se terminan los pedidos 2 y 3 de la ruta 1.
DECLARE
    v_msg VARCHAR2(200);
BEGIN
    pkg_reparto.registrar_entrega(2, 'LOGRADO', NULL, v_msg);
    DBMS_OUTPUT.PUT_LINE(v_msg);
    pkg_reparto.registrar_entrega(3, 'logrado', NULL, v_msg);  -- minúsculas: se normaliza
    DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/

-- P12. Ahora la ruta 1 ya no tiene pendientes.
-- Esperado: "Rutas cerradas: 1"; la ruta 2 sigue EN_CURSO.
BEGIN
    pkg_reparto.cerrar_rutas_completas;
END;
/

SELECT r.id_ruta, e.nombre_estado
FROM ruta r JOIN estado_ruta e ON e.id_estado_ruta = r.id_estado_ruta
ORDER BY r.id_ruta;

-- P13. Ejecutarlo dos veces no hace daño.
-- Esperado: "Rutas cerradas: 0".
BEGIN
    pkg_reparto.cerrar_rutas_completas;
END;
/


-- ------------------------------------------------------------
-- 6. Elementos privados del package
-- ------------------------------------------------------------

-- P14. La función privada no se ve desde fuera.
-- Esperado: error PLS-00302: component 'ES_RAZON_VALIDA' must be declared.
-- Este bloque está comentado a propósito, porque el error corta el script.
-- Para mostrarlo en la defensa, descomentar y ejecutar solo este bloque.
-- BEGIN
--     IF pkg_reparto.es_razon_valida('CLIENTE_AUSENTE') THEN
--         DBMS_OUTPUT.PUT_LINE('No debería llegar aquí');
--     END IF;
-- END;
-- /
