-- Trigger a nivel de FILA del equipo: crea una notificación al cliente cuando cambia resultado_entrega.
-- Ejecutar DESPUÉS de 01_base_datos (no necesita el package).

-- ------------------------------------------------------------
-- B. TRIGGER trg_notificar_entrega
-- ------------------------------------------------------------
-- Qué hace: se dispara SOLO cuando se actualiza el resultado de
-- una factura, y automáticamente crea una notificación para el
-- cliente. No requiere que nadie lo llame manualmente.
-- :NEW = valor después del cambio (lo que se acaba de guardar).
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
