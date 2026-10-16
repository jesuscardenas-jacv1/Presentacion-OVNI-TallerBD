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

  // Procedimiento CON parámetros (copiado del repo TallerBD, archivo 2).
  proc_registrar_entrega: String.raw`
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

  // PENDIENTE — procedimiento SIN parámetros (lo exige el punto 1 de la pauta).
  proc_sin_parametros: String.raw`
`,

  // PENDIENTE — cómo se ejecuta el procedimiento sin parámetros.
  uso_proc_sin_parametros: String.raw`
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

  // PENDIENTE — función SIN parámetros (lo exige el punto 2 de la pauta).
  func_sin_parametros: String.raw`
`,

  // PENDIENTE — consulta que usa la función sin parámetros.
  uso_func_sin_parametros: String.raw`
`,

  /* ---------- PACKAGE ---------- */

  // Especificación: lo público (copiada del repo TallerBD, archivo 2).
  pkg_especificacion: String.raw`
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
`,

  // Inicio del cuerpo: los elementos privados (copiado del repo TallerBD, archivo 2).
  pkg_privados: String.raw`
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

  // PENDIENTE — consulta que demuestra que el trigger de fila creó la notificación.
  uso_trg_notificar_entrega: String.raw`
`,

  // PENDIENTE — trigger a nivel de SENTENCIA (lo exige el punto 4 de la pauta).
  trg_sentencia: String.raw`
`,

  // PENDIENTE — prueba que demuestra que dispara una sola vez por sentencia.
  uso_trg_sentencia: String.raw`
`,

};
