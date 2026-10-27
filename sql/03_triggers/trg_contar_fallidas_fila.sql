-- EJEMPLO DIDÁCTICO (lámina "La nave que cayó"): trigger a nivel de FILA que consulta la
-- misma tabla que lo dispara. Al ejecutar el UPDATE de abajo, Oracle lanza ORA-04091
-- (tabla FACTURA mutante). NO usar en la base real: sirve solo para explicar el error.
-- Ejecutar después de 01_base_datos.

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
