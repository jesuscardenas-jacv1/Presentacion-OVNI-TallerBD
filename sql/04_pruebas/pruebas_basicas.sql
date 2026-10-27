-- Pruebas de los objetos principales. Ejecutar en SQL Developer con SET SERVEROUTPUT ON.
-- Requiere 01_base_datos y 02_plsql/pkg_reparto.sql.

-- 1) Procedimiento con parámetros: registrar una entrega fallida.
DECLARE
    v_msg VARCHAR2(200);
BEGIN
    pkg_reparto.registrar_entrega(1, 'FALLIDO', 'CLIENTE_AUSENTE', v_msg);
    DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/

-- 2) Función con parámetros: contar pedidos fallidos por ruta.

SELECT id_ruta,
       pkg_reparto.contar_pedidos_fallidos(id_ruta) AS fallidos
FROM ruta;
