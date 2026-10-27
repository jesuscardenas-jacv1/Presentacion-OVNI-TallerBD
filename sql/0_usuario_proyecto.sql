-- ============================================================
-- APP DE GESTIÓN DE REPARTO — USUARIO PROPIO DEL PROYECTO
-- ============================================================
-- Crea un esquema nuevo para el proyecto. Sus tablas viven en ese
-- esquema, así que no chocan con las tablas de las prácticas del
-- profesor (aunque se llamen igual, como "cliente" o "ruta").
--
-- EJECUTAR como ADMIN (usuario con privilegios de DBA), NO como el
-- usuario del proyecto. Cambiar la clave antes de ejecutar.
-- Si estás en una base PDB (por ejemplo FREEPDB1), conéctate a esa
-- PDB con la conexión de Admin antes de ejecutar.
-- ============================================================

-- Solo si quieres empezar de cero (borra el usuario y todas sus tablas):
-- DROP USER reparto_ovni CASCADE;

CREATE USER reparto_ovni IDENTIFIED BY "CambiarEstaClave_123"
    DEFAULT TABLESPACE users
    QUOTA UNLIMITED ON users;

GRANT CREATE SESSION,
      CREATE TABLE,
      CREATE VIEW,
      CREATE SEQUENCE,
      CREATE PROCEDURE,
      CREATE TRIGGER,
      CREATE TYPE
TO reparto_ovni;

-- Después de esto:
--   1. Crear una conexión nueva en SQL Developer con usuario reparto_ovni.
--   2. Ejecutar en ese usuario, en orden:
--      1_base_datos.sql, 2_pkg_reparto_y_triggers.sql, 3_datos_y_pruebas.sql
