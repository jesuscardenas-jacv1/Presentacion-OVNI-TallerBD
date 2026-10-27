-- ============================================================
-- APP DE GESTIÓN DE REPARTO — LÓGICA PL/SQL (Oracle)
-- Evaluación Parcial N.º 2: versión completa de pkg_reparto
-- y de los dos triggers. Reemplaza al archivo 2 de TallerBD.
-- ============================================================
-- Requiere haber ejecutado antes 1_base_datos.sql.
--
-- Qué cambió respecto del archivo 2 de TallerBD:
--   + Procedimiento SIN parámetros: cerrar_rutas_completas.
--   + Función SIN parámetros: total_pedidos_en_ruta.
--   + Función PRIVADA: es_razon_valida (solo existe en el cuerpo).
--   + Trigger de SENTENCIA: trg_contar_fallidas.
--   * registrar_entrega valida que el resultado sea LOGRADO o
--     FALLIDO (antes cualquier otro valor dejaba el pedido como
--     fallido) y guarda la razón normalizada.
--   * WHEN OTHERS ya no relanza el error: así el mensaje del
--     parámetro OUT sí le llega a quien llamó.
--   * Catálogo: 'VEHICULO_AVEARIADO' corregido a 'VEHICULO_AVERIADO'.
-- ============================================================


-- ------------------------------------------------------------
-- A. PACKAGE pkg_reparto
-- ------------------------------------------------------------

-- --- A.1 Specification (interfaz pública: QUÉ existe) --------

CREATE OR REPLACE PACKAGE pkg_reparto IS

    -- RECORD: agrupa en una sola variable los campos de un
    -- pedido + su cliente + su estado (viene de un JOIN).
    TYPE r_pedido_detalle IS RECORD (
        id_pedido        pedido.id_pedido%TYPE,
        cliente_nombre   cliente.nombre%TYPE,
        estado_nombre    estado_pedido.nombre_estado%TYPE,
        fecha_creacion   pedido.fecha_creacion%TYPE
    );

    -- Procedimiento CON parámetros: registra una entrega.
    -- IN = datos que entran, OUT = mensaje de resultado que sale.
    PROCEDURE registrar_entrega(
        p_id_pedido   IN  NUMBER,
        p_resultado   IN  VARCHAR2,
        p_razon       IN  VARCHAR2 DEFAULT NULL,
        p_mensaje     OUT VARCHAR2
    );

    -- Procedimiento SIN parámetros: cierra las rutas en curso
    -- que ya no tienen entregas pendientes.
    PROCEDURE cerrar_rutas_completas;

    -- Función CON parámetros: fallidos de una ruta.
    FUNCTION contar_pedidos_fallidos(p_id_ruta IN NUMBER) RETURN NUMBER;

    -- Función SIN parámetros: pedidos que siguen en ruta.
    FUNCTION total_pedidos_en_ruta RETURN NUMBER;

    -- Procedimiento con cursor complejo + RECORD.
    PROCEDURE listar_pedidos_por_ruta(p_id_ruta IN NUMBER);

END pkg_reparto;
/

-- --- A.2 Body (implementación: CÓMO funciona) ----------------

CREATE OR REPLACE PACKAGE BODY pkg_reparto IS

    -- ===== Elementos PRIVADOS (no están en la especificación) =====

    -- Excepción PERSONALIZADA: toda entrega fallida necesita razón.
    e_razon_obligatoria EXCEPTION;
    PRAGMA EXCEPTION_INIT(e_razon_obligatoria, -20001);

    -- Excepción PERSONALIZADA: la razón no está en el catálogo.
    e_razon_no_valida EXCEPTION;
    PRAGMA EXCEPTION_INIT(e_razon_no_valida, -20002);

    -- Excepción PERSONALIZADA: el resultado no es LOGRADO ni FALLIDO.
    e_resultado_no_valido EXCEPTION;
    PRAGMA EXCEPTION_INIT(e_resultado_no_valido, -20003);

    -- Uso del VARRAY t_razones_fallo (tipo definido en el archivo 1):
    -- catálogo FIJO y acotado (máx. 10) de razones de fallo válidas.
    v_razones_fallo t_razones_fallo := t_razones_fallo(
        'CLIENTE_AUSENTE', 'DIRECCION_INCORRECTA', 'RECHAZADO_POR_CLIENTE',
        'DOMICILIO_CERRADO', 'NO_CONCERTADA', 'VEHICULO_AVERIADO',
        'FALTA_MERCADERIA', 'PRODUCTO_DANADO'
    );

    -- ----------------------------------------------------------
    -- es_razon_valida: función PRIVADA. Revisa si la razón está
    -- en el catálogo. Devuelve BOOLEAN, así que solo sirve dentro
    -- de PL/SQL; nadie fuera del package la necesita.
    -- Se escribe antes de registrar_entrega porque la usa.
    -- ----------------------------------------------------------
    FUNCTION es_razon_valida(p_razon IN VARCHAR2) RETURN BOOLEAN IS
    BEGIN
        -- FOR i IN 1..COUNT recorre solo los elementos llenos.
        FOR i IN 1..v_razones_fallo.COUNT LOOP
            IF v_razones_fallo(i) = UPPER(TRIM(p_razon)) THEN
                RETURN TRUE;
            END IF;
        END LOOP;
        RETURN FALSE;
    END es_razon_valida;

    -- ===== Elementos PÚBLICOS (declarados en la especificación) =====

    -- ----------------------------------------------------------
    -- registrar_entrega: actualiza el estado del pedido y su
    -- factura cuando el operario marca una entrega como
    -- LOGRADO o FALLIDO.
    -- ----------------------------------------------------------
    PROCEDURE registrar_entrega(
        p_id_pedido   IN  NUMBER,
        p_resultado   IN  VARCHAR2,
        p_razon       IN  VARCHAR2 DEFAULT NULL,
        p_mensaje     OUT VARCHAR2
    ) IS
        v_resultado  VARCHAR2(4000);
    BEGIN
        -- Se normaliza en el cuerpo y no en la declaración: un error
        -- en la declaración no lo atraparía el EXCEPTION de abajo.
        v_resultado := UPPER(TRIM(p_resultado));

        -- Regla de negocio: solo hay dos resultados posibles.
        IF v_resultado IS NULL OR v_resultado NOT IN ('LOGRADO', 'FALLIDO') THEN
            RAISE_APPLICATION_ERROR(-20003, 'Resultado de entrega no valido');
        END IF;

        -- Regla de negocio: si es FALLIDO, la razón es obligatoria
        -- y tiene que estar en el catálogo.
        IF v_resultado = 'FALLIDO' THEN
            IF p_razon IS NULL THEN
                RAISE_APPLICATION_ERROR(-20001, 'Debe indicar razon de fallo en la entrega');
            END IF;
            IF NOT es_razon_valida(p_razon) THEN
                RAISE_APPLICATION_ERROR(-20002, 'Razon de fallo no permitida');
            END IF;
        END IF;

        UPDATE pedido
        SET id_estado_pedido = CASE WHEN v_resultado = 'LOGRADO' THEN 3 ELSE 4 END
        WHERE id_pedido = p_id_pedido;

        -- Si no actualizó ninguna fila, el pedido no existe.
        IF SQL%ROWCOUNT = 0 THEN
            RAISE NO_DATA_FOUND;
        END IF;

        -- Una entrega lograda no guarda razón de fallo.
        UPDATE factura
        SET resultado_entrega = v_resultado,
            razon_fallo = CASE WHEN v_resultado = 'FALLIDO' THEN UPPER(TRIM(p_razon)) END,
            fecha_entrega = SYSDATE
        WHERE id_pedido = p_id_pedido;

        p_mensaje := 'Entrega registrada correctamente';
        COMMIT;

    EXCEPTION
        -- Excepción PREDEFINIDA de Oracle (pedido no existe).
        WHEN NO_DATA_FOUND THEN
            ROLLBACK;
            p_mensaje := 'Pedido no encontrado';
        -- Excepciones PERSONALIZADAS (reglas de negocio).
        WHEN e_resultado_no_valido THEN
            ROLLBACK;
            p_mensaje := 'Error: resultado de entrega no valido';
        WHEN e_razon_obligatoria THEN
            ROLLBACK;
            p_mensaje := 'Error: razon de fallo obligatoria';
        WHEN e_razon_no_valida THEN
            ROLLBACK;
            p_mensaje := 'Error: razon de fallo no permitida';
        -- Red de seguridad. No se relanza: si se relanzara, el
        -- parámetro OUT no le llegaría a quien llamó.
        WHEN OTHERS THEN
            ROLLBACK;
            p_mensaje := 'Error inesperado: '||SQLCODE||' - '||SQLERRM;
    END registrar_entrega;

    -- ----------------------------------------------------------
    -- cerrar_rutas_completas: procedimiento SIN parámetros.
    -- Pasa a FINALIZADA (3) cada ruta EN_CURSO (2) que tiene
    -- pedidos y ya no le queda ninguno CREADO (1) ni EN_RUTA (2).
    -- No necesita datos de entrada: siempre revisa todas las rutas.
    -- ----------------------------------------------------------
    PROCEDURE cerrar_rutas_completas IS
        v_cerradas NUMBER;
    BEGIN
        UPDATE ruta r
        SET r.id_estado_ruta = 3
        WHERE r.id_estado_ruta = 2
          AND EXISTS (SELECT 1 FROM pedido p
                      WHERE p.id_ruta = r.id_ruta)
          AND NOT EXISTS (SELECT 1 FROM pedido p
                          WHERE p.id_ruta = r.id_ruta
                            AND p.id_estado_pedido IN (1, 2));

        v_cerradas := SQL%ROWCOUNT;
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('Rutas cerradas: ' || v_cerradas);
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END cerrar_rutas_completas;

    -- ----------------------------------------------------------
    -- contar_pedidos_fallidos: cuántas entregas fallaron en una
    -- ruta. Se puede usar en un SELECT.
    -- ----------------------------------------------------------
    FUNCTION contar_pedidos_fallidos(p_id_ruta IN NUMBER) RETURN NUMBER IS
        v_total NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_total
        FROM pedido p
        JOIN factura f ON f.id_pedido = p.id_pedido
        WHERE p.id_ruta = p_id_ruta
          AND f.resultado_entrega = 'FALLIDO';

        RETURN v_total;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN 0;
    END contar_pedidos_fallidos;

    -- ----------------------------------------------------------
    -- total_pedidos_en_ruta: función SIN parámetros. Cuántos
    -- pedidos siguen EN_RUTA (2) en este momento, sumando todas
    -- las rutas. No modifica datos, así que sirve en un SELECT.
    -- ----------------------------------------------------------
    FUNCTION total_pedidos_en_ruta RETURN NUMBER IS
        v_total NUMBER;
    BEGIN
        SELECT COUNT(*)
        INTO v_total
        FROM pedido
        WHERE id_estado_pedido = 2;

        RETURN v_total;
    END total_pedidos_en_ruta;

    -- ----------------------------------------------------------
    -- listar_pedidos_por_ruta: CURSOR COMPLEJO (JOIN de 3 tablas)
    -- que carga cada fila en el RECORD r_pedido_detalle.
    -- ----------------------------------------------------------
    PROCEDURE listar_pedidos_por_ruta(p_id_ruta IN NUMBER) IS

        CURSOR c_pedidos(p_ruta NUMBER) IS
            SELECT p.id_pedido, c.nombre AS cliente_nombre,
                   e.nombre_estado, p.fecha_creacion
            FROM pedido p
            JOIN cliente c ON c.id_cliente = p.id_cliente
            JOIN estado_pedido e ON e.id_estado_pedido = p.id_estado_pedido
            WHERE p.id_ruta = p_ruta;

        v_pedido r_pedido_detalle;
    BEGIN
        OPEN c_pedidos(p_id_ruta);
        LOOP
            FETCH c_pedidos INTO v_pedido;
            EXIT WHEN c_pedidos%NOTFOUND;
            DBMS_OUTPUT.PUT_LINE(v_pedido.id_pedido||' - '||v_pedido.cliente_nombre||' - '||v_pedido.estado_nombre);
        END LOOP;
        CLOSE c_pedidos;
    END listar_pedidos_por_ruta;

END pkg_reparto;
/


-- ------------------------------------------------------------
-- B. TRIGGER DE FILA trg_notificar_entrega
-- ------------------------------------------------------------
-- Se dispara una vez POR CADA factura cuyo resultado cambia y
-- crea la notificación para ese pedido. Usa :NEW para saber
-- qué pedido fue. Solo inserta en notificacion: nunca lee
-- factura, por eso no tiene problema de tabla mutante.
-- ------------------------------------------------------------

CREATE OR REPLACE TRIGGER trg_notificar_entrega
AFTER UPDATE OF resultado_entrega ON factura
FOR EACH ROW
WHEN (NEW.resultado_entrega IS NOT NULL)
BEGIN
    INSERT INTO notificacion(id_pedido, tipo, id_estado_notificacion, fecha_envio)
    VALUES (:NEW.id_pedido, 'EMAIL', 1, SYSDATE);
END;
/


-- ------------------------------------------------------------
-- C. TRIGGER DE SENTENCIA trg_contar_fallidas
-- ------------------------------------------------------------
-- Sin FOR EACH ROW: se dispara UNA vez por sentencia UPDATE,
-- cuando ya terminó, cambie las filas que cambie. Por eso sí
-- puede leer factura (la versión de fila daba ORA-04091).
-- Informa el total de entregas fallidas después del cambio.
-- No conoce :OLD ni :NEW.
-- ------------------------------------------------------------

CREATE OR REPLACE TRIGGER trg_contar_fallidas
AFTER UPDATE OF resultado_entrega ON factura
DECLARE
    v_fallidas NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_fallidas
    FROM factura
    WHERE resultado_entrega = 'FALLIDO';
    DBMS_OUTPUT.PUT_LINE('Entregas fallidas: ' || v_fallidas);
END;
/
