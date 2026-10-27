-- CORRECCIÓN (lámina "La corrección"): trigger a nivel de SENTENCIA. Sin FOR EACH ROW se
-- dispara una sola vez, cuando el UPDATE ya terminó, y puede consultar FACTURA sin ORA-04091.
-- Pendiente: confirmar en Oracle la salida real de DBMS_OUTPUT (reemplazar el ejemplo).
-- Ejecutar después de 01_base_datos y con SET SERVEROUTPUT ON.

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
