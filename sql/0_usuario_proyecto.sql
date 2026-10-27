-- ============================================================
-- APP DE GESTIÓN DE REPARTO — USUARIO PROPIO DEL PROYECTO
-- ============================================================
-- Ejecutar CONECTADO COMO ADMIN (usuario con privilegios de DBA).
-- Cambiar la clave antes de ejecutar.
-- Después, conectarse en VS Code con el usuario reparto_ovni y
-- ejecutar en ese usuario: 1_base_datos.sql, 2_pkg_reparto_y_triggers.sql,
-- 3_datos_y_pruebas.sql (en ese orden).
-- ============================================================

-- Permite crear un usuario sin el prefijo C## (igual que en clases).
-- En una PDB no hace daño.
ALTER SESSION SET "_ORACLE_SCRIPT" = TRUE;

-- Solo si quieres empezar de cero (borra el usuario y sus tablas):
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
