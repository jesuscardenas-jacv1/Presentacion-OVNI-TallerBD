-- ============================================================
-- APP DE GESTIÓN DE REPARTO — CONSULTAS Y LÓGICA PL/SQL (Oracle)
-- Anexo 2: Código Fuente — Procedimientos, Función, Package,
--          Trigger, Cursores y uso del VARRAY t_razones_fallo
-- ============================================================
-- Requiere haber ejecutado antes el archivo 1 (base de datos).
-- ============================================================
-- Package pkg_reparto (especificación y cuerpo). Ejecutar DESPUÉS de 01_base_datos.



-- ------------------------------------------------------------
-- A. PACKAGE pkg_reparto — módulo central de lógica de negocio
-- ------------------------------------------------------------
-- Qué es: agrupa toda la lógica de reparto en un solo módulo.
-- Por qué: evita repetir código y centraliza las reglas de
-- negocio en un solo lugar (fácil de mantener).
-- Contiene: 1 RECORD, 1 procedimiento, 1 función y 1 cursor
-- complejo con parámetro.
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

    -- Procedimiento: ejecuta una ACCIÓN (no retorna valor).
    -- IN = datos que entran, OUT = mensaje de resultado que sale.
    PROCEDURE registrar_entrega(
        p_id_pedido   IN  NUMBER,
        p_resultado   IN  VARCHAR2,
        p_razon       IN  VARCHAR2 DEFAULT NULL,
        p_mensaje     OUT VARCHAR2
    );

    -- Función: SIEMPRE retorna un valor, se puede usar en un SELECT.
    FUNCTION contar_pedidos_fallidos(p_id_ruta IN NUMBER) RETURN NUMBER;

    -- Procedimiento con cursor complejo + RECORD (ejemplo de uso).
    PROCEDURE listar_pedidos_por_ruta(p_id_ruta IN NUMBER);

END pkg_reparto;
/

-- --- A.2 Body (implementación: CÓMO funciona) ----------------

CREATE OR REPLACE PACKAGE BODY pkg_reparto IS

    -- Excepción PERSONALIZADA: no es un error de Oracle, es una
    -- regla de negocio nuestra ("toda entrega fallida necesita razón").
    e_razon_obligatoria EXCEPTION;
    PRAGMA EXCEPTION_INIT(e_razon_obligatoria, -20001);

    -- Segunda excepción personalizada: la razón no está en el catálogo.
    e_razon_no_valida EXCEPTION;
    PRAGMA EXCEPTION_INIT(e_razon_no_valida, -20002);

    -- Uso del VARRAY t_razones_fallo (tipo definido en el archivo 1):
    -- catálogo FIJO y acotado (máx. 10) de razones de fallo válidas.
    -- Se recorre con COUNT para validar la razón que escribe el operario.
    v_razones_fallo t_razones_fallo := t_razones_fallo(
        'CLIENTE_AUSENTE', 'DIRECCION_INCORRECTA', 'RECHAZADO_POR_CLIENTE',
        'DOMICILIO_CERRADO', 'NO_CONCERTADA', 'VEHICULO_AVEARIADO',
        'FALTA_MERCADERIA', 'PRODUCTO_DANADO'
    );

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
        v_razon_valida  BOOLEAN := FALSE;
    BEGIN
        -- Regla de negocio: si es FALLIDO, la razón es obligatoria.
        IF p_resultado = 'FALLIDO' AND p_razon IS NULL THEN
            RAISE_APPLICATION_ERROR(-20001, 'Debe indicar razon de fallo en la entrega');
        END IF;

        -- Regla de negocio (usa el VARRAY): la razón debe existir en el
        -- catálogo. FOR i IN 1..COUNT recorre solo los elementos
        -- realmente llenos (el VARRAY es de longitud variable).
        IF p_resultado = 'FALLIDO' THEN
            FOR i IN 1..v_razones_fallo.COUNT LOOP
                IF UPPER(v_razones_fallo(i)) = UPPER(p_razon) THEN
                    v_razon_valida := TRUE;
                    EXIT;
                END IF;
            END LOOP;
            IF NOT v_razon_valida THEN
                RAISE_APPLICATION_ERROR(-20002, 'Razon de fallo no permitida');
            END IF;
        END IF;

        UPDATE pedido
        SET id_estado_pedido = CASE WHEN p_resultado = 'LOGRADO' THEN 3 ELSE 4 END
        WHERE id_pedido = p_id_pedido;

        -- Si no actualizó ninguna fila, el pedido no existe.
        IF SQL%ROWCOUNT = 0 THEN
            RAISE NO_DATA_FOUND;
        END IF;

        UPDATE factura
        SET resultado_entrega = p_resultado,
            razon_fallo = p_razon,
            fecha_entrega = SYSDATE
        WHERE id_pedido = p_id_pedido;

        p_mensaje := 'Entrega registrada correctamente';
        COMMIT;

    EXCEPTION
        -- Excepción PREDEFINIDA de Oracle (pedido no existe).
        WHEN NO_DATA_FOUND THEN
            ROLLBACK;
            p_mensaje := 'Pedido no encontrado';
        -- Excepción PERSONALIZADA (regla de negocio).
        WHEN e_razon_obligatoria THEN
            ROLLBACK;
            p_mensaje := 'Error: razon de fallo obligatoria';
        -- Excepción PERSONALIZADA (regla de negocio, usa el VARRAY).
        WHEN e_razon_no_valida THEN
            ROLLBACK;
            p_mensaje := 'Error: razon de fallo no permitida';
        -- Red de seguridad para cualquier otro error no previsto.
        WHEN OTHERS THEN
            ROLLBACK;
            p_mensaje := 'Error inesperado: '||SQLCODE||' - '||SQLERRM;
            RAISE;
    END registrar_entrega;

    -- ----------------------------------------------------------
    -- contar_pedidos_fallidos: función que calcula cuántas
    -- entregas fallaron en una ruta. Se puede usar en un SELECT.
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
    -- listar_pedidos_por_ruta: ejemplo de CURSOR COMPLEJO
    -- (JOIN entre 3 tablas) que carga cada fila en el RECORD
    -- r_pedido_detalle definido en el spec.
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
