/* ============================================================
   CÓDIGOS Y CONSULTAS DE LA PRESENTACIÓN
   ------------------------------------------------------------
   Aquí se pega el PL/SQL que aparece en las láminas.

   Cómo agregar o cambiar un código:
     1. Busca la clave (por ejemplo  proc_sin_parametros).
     2. Pega el código ENTRE las dos comillas invertidas  `  `.
     3. Guarda y recarga la presentación (F5).

   Una clave vacía se muestra en la lámina como "Falta cargar
   este código", así se ve de inmediato qué falta.

   Lo único que no puede ir dentro del código es la comilla
   invertida ( ` ) ni la secuencia  ${  (PL/SQL no las usa).
   ============================================================ */

window.CODIGOS = {

  /* ---------- ANIMACIÓN DE LA NAVE (lámina 2) ---------- */

  // Lo que el alien escribe en la pantalla antes de apretar START.
  // Es un error a propósito: un trigger de FILA que consulta la misma tabla que lo dispara.
  caida_sql: String.raw`
CREATE OR REPLACE TRIGGER trg_contar_fallidas
AFTER UPDATE OF resultado_entrega ON factura
FOR EACH ROW
DECLARE
    v_fallidas NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_fallidas
    FROM factura
    WHERE resultado_entrega = 'FALLIDO';
END;
/

UPDATE factura SET resultado_entrega = 'FALLIDO'
WHERE id_pedido = 1;
`,

  // Lo que responde Oracle (una línea por mensaje).
  caida_error: String.raw`
Trigger TRG_CONTAR_FALLIDAS compiled
ORA-04091: table FACTURA is mutating, trigger/function may not see it
ORA-06512: at "TRG_CONTAR_FALLIDAS", line 4
ORA-04088: error during execution of trigger 'TRG_CONTAR_FALLIDAS'
`,

  /* ---------- ANIMACIÓN DE LA CORRECCIÓN (lámina 3) ---------- */

  // El mismo trigger, corregido: se quitó FOR EACH ROW, así que es de SENTENCIA.
  // Corre una sola vez, cuando el UPDATE ya terminó, y puede consultar factura.
  correccion_sql: String.raw`
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

UPDATE factura SET resultado_entrega = 'FALLIDO'
WHERE id_pedido = 1;
`,

  // Lo que responde Oracle. El número depende de los datos de prueba:
  // cámbienlo por lo que les salga al ejecutarlo en SQL Developer.
  correccion_salida: String.raw`
Trigger TRG_CONTAR_FALLIDAS compiled
1 row updated.
Entregas fallidas: 1
`,

  /* ---------- PROCEDIMIENTOS ---------- */

  // Procedimiento CON parámetros. Viene del repo TallerBD (archivo 2), con dos cambios:
  // valida que el resultado sea LOGRADO o FALLIDO y WHEN OTHERS ya no relanza.
  // El código completo y ejecutable está en sql/2_pkg_reparto_y_triggers.sql.
  proc_registrar_entrega: String.raw`
PROCEDURE registrar_entrega(
    p_id_pedido   IN  NUMBER,
    p_resultado   IN  VARCHAR2,
    p_razon       IN  VARCHAR2 DEFAULT NULL,
    p_mensaje     OUT VARCHAR2
) IS
    v_resultado  VARCHAR2(4000);
BEGIN
    -- Se normaliza aquí y no en la declaración: un error en la
    -- declaración no lo atraparía el EXCEPTION de abajo.
    v_resultado := UPPER(TRIM(p_resultado));

    -- Regla de negocio: solo hay dos resultados posibles.
    IF v_resultado IS NULL OR v_resultado NOT IN ('LOGRADO', 'FALLIDO') THEN
        RAISE_APPLICATION_ERROR(-20003, 'Resultado de entrega no valido');
    END IF;

    -- Regla de negocio: si es FALLIDO, la razón es obligatoria
    -- y tiene que estar en el catálogo (función privada).
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
`,

  // Cómo se invoca registrar_entrega.
  uso_registrar_entrega: String.raw`
DECLARE
    v_msg VARCHAR2(200);
BEGIN
    pkg_reparto.registrar_entrega(1, 'FALLIDO', 'CLIENTE_AUSENTE', v_msg);
    DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/
`,

  // Procedimiento SIN parámetros (punto 1 de la pauta).
  proc_sin_parametros: String.raw`
-- Sin parámetros: siempre revisa TODAS las rutas.
-- Cierra (3 = FINALIZADA) cada ruta EN_CURSO (2) que tiene pedidos
-- y ya no le queda ninguno CREADO (1) ni EN_RUTA (2).
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
`,

  // Cómo se ejecuta el procedimiento sin parámetros.
  uso_proc_sin_parametros: String.raw`
SET SERVEROUTPUT ON

-- Sin paréntesis ni argumentos.
BEGIN
    pkg_reparto.cerrar_rutas_completas;
END;
/
-- En SQL Developer también sirve:
-- EXEC pkg_reparto.cerrar_rutas_completas;

-- Comprobación: qué rutas quedaron FINALIZADA.
SELECT r.id_ruta, e.nombre_estado
FROM ruta r
JOIN estado_ruta e ON e.id_estado_ruta = r.id_estado_ruta;

-- Ejecutarlo otra vez imprime "Rutas cerradas: 0".
`,

  // Procedimiento con CURSOR EXPLÍCITO y RECORD.
  proc_listar_pedidos: String.raw`
PROCEDURE listar_pedidos_por_ruta(p_id_ruta IN NUMBER) IS
    -- Cursor con JOIN de 3 tablas (pedido, cliente, estado_pedido).
    CURSOR c_pedidos(p_ruta NUMBER) IS
        SELECT p.id_pedido, c.nombre AS cliente_nombre,
               e.nombre_estado, p.fecha_creacion
        FROM pedido p
        JOIN cliente c ON c.id_cliente = p.id_cliente
        JOIN estado_pedido e ON e.id_estado_pedido = p.id_estado_pedido
        WHERE p.id_ruta = p_ruta;

    -- Variable de tipo RECORD declarada en la especificación del package.
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
`,

  // Cómo se ejecuta listar_pedidos_por_ruta.
  uso_listar_pedidos: String.raw`
SET SERVEROUTPUT ON

-- Invoca el procedimiento pasando la ruta deseada (P15).
BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Detalle de pedidos Ruta 1 ---');
    pkg_reparto.listar_pedidos_por_ruta(1);
END;
/
-- Salida obtenida:
--   1 - Cliente A - FALLIDO
--   2 - Cliente B - ENTREGADO
--   3 - Cliente C - ENTREGADO
`,

  /* ---------- FUNCIONES ---------- */

  // Función CON parámetros (copiada del repo TallerBD, archivo 2).
  func_contar_pedidos_fallidos: String.raw`
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
`,

  // La función usada dentro de un SELECT.
  uso_contar_pedidos_fallidos: String.raw`
SELECT id_ruta,
       pkg_reparto.contar_pedidos_fallidos(id_ruta) AS fallidos
FROM ruta;
`,

  // Función SIN parámetros (punto 2 de la pauta).
  func_sin_parametros: String.raw`
-- Sin parámetros: el resultado no depende de ninguna entrada.
-- Cuántos pedidos siguen EN_RUTA (2) ahora, en todas las rutas.
FUNCTION total_pedidos_en_ruta RETURN NUMBER IS
    v_total NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_total
    FROM pedido
    WHERE id_estado_pedido = 2;

    RETURN v_total;
END total_pedidos_en_ruta;
`,

  // Consulta que usa la función sin parámetros.
  uso_func_sin_parametros: String.raw`
-- Como no recibe nada, se consulta desde DUAL.
SELECT pkg_reparto.total_pedidos_en_ruta AS en_ruta
FROM dual;

-- Comprobación a mano: tiene que dar el mismo número.
SELECT COUNT(*) AS en_ruta_a_mano
FROM pedido
WHERE id_estado_pedido = 2;
`,

  /* ---------- PACKAGE ---------- */

  // Especificación: lo público (TallerBD, archivo 2, más los dos objetos sin parámetros).
  pkg_especificacion: String.raw`
CREATE OR REPLACE PACKAGE pkg_reparto IS

    -- RECORD: pedido + cliente + estado (viene de un JOIN).
    TYPE r_pedido_detalle IS RECORD (
        id_pedido        pedido.id_pedido%TYPE,
        cliente_nombre   cliente.nombre%TYPE,
        estado_nombre    estado_pedido.nombre_estado%TYPE,
        fecha_creacion   pedido.fecha_creacion%TYPE
    );

    -- Procedimiento CON parámetros: registra una entrega.
    PROCEDURE registrar_entrega(
        p_id_pedido   IN  NUMBER,
        p_resultado   IN  VARCHAR2,
        p_razon       IN  VARCHAR2 DEFAULT NULL,
        p_mensaje     OUT VARCHAR2
    );

    -- Procedimiento SIN parámetros: cierra rutas terminadas.
    PROCEDURE cerrar_rutas_completas;

    -- Función CON parámetros: fallidos de una ruta.
    FUNCTION contar_pedidos_fallidos(p_id_ruta IN NUMBER) RETURN NUMBER;

    -- Función SIN parámetros: pedidos que siguen en ruta.
    FUNCTION total_pedidos_en_ruta RETURN NUMBER;

    -- Procedimiento con cursor complejo + RECORD.
    PROCEDURE listar_pedidos_por_ruta(p_id_ruta IN NUMBER);

END pkg_reparto;
`,

  // Inicio del cuerpo: los elementos privados (TallerBD, archivo 2, más la excepción -20003).
  pkg_privados: String.raw`
CREATE OR REPLACE PACKAGE BODY pkg_reparto IS

    -- Excepciones PERSONALIZADAS: reglas de negocio nuestras.
    e_razon_obligatoria EXCEPTION;
    PRAGMA EXCEPTION_INIT(e_razon_obligatoria, -20001);

    e_razon_no_valida EXCEPTION;
    PRAGMA EXCEPTION_INIT(e_razon_no_valida, -20002);

    e_resultado_no_valido EXCEPTION;
    PRAGMA EXCEPTION_INIT(e_resultado_no_valido, -20003);

    -- VARRAY t_razones_fallo (tipo del archivo 1): catálogo FIJO
    -- y acotado (máx. 10) de razones de fallo válidas.
    v_razones_fallo t_razones_fallo := t_razones_fallo(
        'CLIENTE_AUSENTE', 'DIRECCION_INCORRECTA', 'RECHAZADO_POR_CLIENTE',
        'DOMICILIO_CERRADO', 'NO_CONCERTADA', 'VEHICULO_AVERIADO',
        'FALTA_MERCADERIA', 'PRODUCTO_DANADO'
    );
`,

  // La función privada del cuerpo.
  pkg_func_privada: String.raw`
    -- Función PRIVADA: no está en la especificación.
    -- Solo la usa registrar_entrega. Devuelve BOOLEAN, que SQL
    -- no entiende, así que tampoco tendría sentido exponerla.
    -- Va antes de registrar_entrega porque esa la llama.
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

    -- Desde fuera del package:
    --   pkg_reparto.es_razon_valida('CLIENTE_AUSENTE')
    --   PLS-00302: component 'ES_RAZON_VALIDA' must be declared
`,

  /* ---------- TRIGGERS ---------- */

  // Trigger a nivel de FILA (copiado del repo TallerBD, archivo 2).
  trg_notificar_entrega: String.raw`
CREATE OR REPLACE TRIGGER trg_notificar_entrega
AFTER UPDATE OF resultado_entrega ON factura
FOR EACH ROW
WHEN (NEW.resultado_entrega IS NOT NULL)
BEGIN
    INSERT INTO notificacion(id_pedido, tipo, id_estado_notificacion, fecha_envio)
    VALUES (:NEW.id_pedido, 'EMAIL', 1, SYSDATE);
END;
/
`,

  // Consultas que demuestran que el trigger de fila creó la notificación, y cuándo no.
  uso_trg_notificar_entrega: String.raw`
-- 1. Se registra la entrega con el procedimiento.
--    Nadie llama al trigger: lo dispara el UPDATE de factura.
DECLARE
    v_msg VARCHAR2(200);
BEGIN
    pkg_reparto.registrar_entrega(1, 'FALLIDO', 'CLIENTE_AUSENTE', v_msg);
    DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/

-- 2. Apareció la notificación: pedido 1, EMAIL, fecha de hoy.
SELECT id_notificacion, id_pedido, tipo, fecha_envio
FROM notificacion
WHERE id_pedido = 1;

-- 3. Si cambia OTRA columna, no se dispara (AFTER UPDATE OF).
UPDATE factura SET foto_url = 'foto.jpg' WHERE id_pedido = 4;
SELECT COUNT(*) FROM notificacion WHERE id_pedido = 4;  -- sigue en 0
ROLLBACK;
`,

  // Trigger a nivel de SENTENCIA (punto 4 de la pauta): el de la animación de la corrección.
  trg_sentencia: String.raw`
-- El mismo trigger de la nave, ya corregido.
-- Sin FOR EACH ROW: se dispara UNA vez por sentencia, cuando el
-- UPDATE ya terminó. Por eso sí puede leer factura.
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
`,

  // Prueba que demuestra que dispara una sola vez por sentencia.
  uso_trg_sentencia: String.raw`
SET SERVEROUTPUT ON

-- UNA sentencia que cambia DOS facturas.
UPDATE factura
SET resultado_entrega = 'LOGRADO'
WHERE id_pedido IN (2, 3);

-- Salida esperada:
--   2 rows updated.
--   Entregas fallidas: 1     <- una sola línea: sentencia, 1 vez

-- El de fila, en cambio, corrió dos veces:
SELECT id_pedido, tipo FROM notificacion
WHERE id_pedido IN (2, 3);          -- 2 filas

ROLLBACK;  -- fue solo una prueba
`,

  /* ---------- PAQUETE EJECUTADO EN BLOQUE ANÓNIMO (lámina de paquetes) ---------- */

  uso_paquete_bloque: String.raw`
SET SERVEROUTPUT ON

DECLARE
    v_msg VARCHAR2(200);
BEGIN
    pkg_reparto.registrar_entrega(1, 'FALLIDO', 'CLIENTE_AUSENTE', v_msg);
    DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/

-- Salida esperada:
--   Entregas fallidas: 1           <- lo imprime trg_contar_fallidas
--   Entrega registrada correctamente
ROLLBACK;  -- fue solo una prueba
`,

};
