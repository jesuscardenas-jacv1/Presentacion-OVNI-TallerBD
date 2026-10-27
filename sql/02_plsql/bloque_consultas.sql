-- Bloque de consultas con cursores anidados (maestro-detalle). Tomado del archivo 2 del equipo.

-- ------------------------------------------------------------
-- C. BLOQUE EJECUTABLE — Cursores anidados (maestro-detalle)
-- ------------------------------------------------------------
-- Qué hace: por cada ruta EN_CURSO (maestro), recorre sus
-- pedidos (detalle). El cursor detalle recibe la ruta como
-- PARÁMETRO, así se reutiliza para cada ruta sin reescribir la
-- consulta.
-- ------------------------------------------------------------

DECLARE
    CURSOR c_rutas IS
        SELECT id_ruta, id_operario
        FROM ruta
        WHERE id_estado_ruta = 2; -- EN_CURSO

    CURSOR c_pedidos_ruta(p_id_ruta NUMBER) IS
        SELECT id_pedido, id_cliente
        FROM pedido
        WHERE id_ruta = p_id_ruta;
BEGIN
    FOR v_ruta IN c_rutas LOOP
        FOR v_pedido IN c_pedidos_ruta(v_ruta.id_ruta) LOOP
            DBMS_OUTPUT.PUT_LINE('Ruta '||v_ruta.id_ruta||' - Pedido '||v_pedido.id_pedido);
        END LOOP;
    END LOOP;
END;
/


-- ------------------------------------------------------------
-- D. EJEMPLOS DE PRUEBA (para ejecutar en la defensa)
-- ------------------------------------------------------------

-- Ver pedidos fallidos de una ruta usando la función:
-- SELECT id_ruta, pkg_reparto.contar_pedidos_fallidos(id_ruta) AS fallidos
-- FROM ruta;

-- Registrar una entrega usando el procedimiento:
-- DECLARE
--     v_msg VARCHAR2(200);
-- BEGIN
--     pkg_reparto.registrar_entrega(1, 'FALLIDO', 'Cliente ausente', v_msg);
--     DBMS_OUTPUT.PUT_LINE(v_msg);
-- END;
-- /

-- Registrar una entrega fallida con razón FUERA del catálogo VARRAY
-- (debe devolver: Error: razon de fallo no permitida):
-- DECLARE
--     v_msg VARCHAR2(200);
-- BEGIN
--     pkg_reparto.registrar_entrega(1, 'FALLIDO', 'Razon inventada', v_msg);
--     DBMS_OUTPUT.PUT_LINE(v_msg);
-- END;
-- /

-- Listar pedidos de una ruta usando el cursor complejo:
-- BEGIN
--     pkg_reparto.listar_pedidos_por_ruta(1);
-- END;
-- /

