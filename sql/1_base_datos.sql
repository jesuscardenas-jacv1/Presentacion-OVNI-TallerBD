-- ============================================================
-- APP DE GESTIÓN DE REPARTO — BASE DE DATOS (Oracle)
-- Anexo 1: Código Fuente — Estructura de la Base de Datos
-- ============================================================
-- Este archivo SOLO crea las tablas y tipos. No contiene lógica
-- de negocio (esa está en el archivo 2: consultas y PL/SQL).
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLAS DE CATÁLOGO / SOPORTE (sin dependencias)
--    Guardan valores fijos que otras tablas reutilizan.
-- ------------------------------------------------------------

CREATE TABLE rol (
    id_rol      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_rol  VARCHAR2(20) CHECK (nombre_rol IN ('OPERARIO','EJECUTIVO','ADMINISTRADOR')) NOT NULL
);

CREATE TABLE dispositivo (
    id_dispositivo      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    identificador       VARCHAR2(100) NOT NULL UNIQUE,
    autorizado          NUMBER(1) DEFAULT 0 CHECK (autorizado IN (0,1)),
    fecha_autorizacion  DATE
);

CREATE TABLE direccion (
    id_direccion    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    region          VARCHAR2(100) NOT NULL,
    provincia       VARCHAR2(100) NOT NULL,
    comuna          VARCHAR2(100) NOT NULL,
    calle           VARCHAR2(150) NOT NULL,
    numero          VARCHAR2(20),
    depto_oficina   VARCHAR2(50),
    referencia      VARCHAR2(255)
);

CREATE TABLE estado_pedido (
    id_estado_pedido   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_estado      VARCHAR2(20) CHECK (nombre_estado IN ('CREADO','EN_RUTA','ENTREGADO','FALLIDO','REAGENDADO')) NOT NULL
);

CREATE TABLE estado_ruta (
    id_estado_ruta   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_estado    VARCHAR2(20) CHECK (nombre_estado IN ('PENDIENTE','EN_CURSO','FINALIZADA')) NOT NULL
);

CREATE TABLE estado_notificacion (
    id_estado_notificacion   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_estado            VARCHAR2(20) CHECK (nombre_estado IN ('PENDIENTE','ENVIADA','FALLIDA')) NOT NULL
);

-- ------------------------------------------------------------
-- 2. USUARIO Y VEHÍCULO
--    usuario depende de rol y dispositivo.
--    vehiculo depende de usuario (el operario que lo conduce).
-- ------------------------------------------------------------

CREATE TABLE usuario (
    id_usuario       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           VARCHAR2(100) NOT NULL,
    username         VARCHAR2(50)  NOT NULL UNIQUE,
    password_hash    VARCHAR2(255) NOT NULL,
    id_rol           NUMBER NOT NULL REFERENCES rol(id_rol),
    id_dispositivo   NUMBER REFERENCES dispositivo(id_dispositivo)
);

CREATE TABLE vehiculo (
    id_vehiculo    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo         VARCHAR2(20) NOT NULL UNIQUE,
    tipo           VARCHAR2(50),
    capacidad      NUMBER(10,2),
    id_operario    NUMBER UNIQUE REFERENCES usuario(id_usuario)
);

-- ------------------------------------------------------------
-- 3. CLIENTE
--    depende de direccion.
-- ------------------------------------------------------------

CREATE TABLE cliente (
    id_cliente     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR2(150) NOT NULL,
    id_direccion   NUMBER NOT NULL REFERENCES direccion(id_direccion),
    telefono       VARCHAR2(20),
    email          VARCHAR2(100)
);

-- ------------------------------------------------------------
-- 4. RUTA
--    depende de usuario (operario), vehiculo y estado_ruta.
-- ------------------------------------------------------------

CREATE TABLE ruta (
    id_ruta          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_operario      NUMBER NOT NULL REFERENCES usuario(id_usuario),
    id_vehiculo      NUMBER NOT NULL REFERENCES vehiculo(id_vehiculo),
    fecha            DATE NOT NULL,
    id_estado_ruta   NUMBER NOT NULL REFERENCES estado_ruta(id_estado_ruta)
);

-- ------------------------------------------------------------
-- 5. PEDIDO
--    depende de cliente, usuario (ejecutivo), ruta y estado_pedido.
--    Es la tabla central del negocio.
-- ------------------------------------------------------------

CREATE TABLE pedido (
    id_pedido          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_cliente         NUMBER NOT NULL REFERENCES cliente(id_cliente),
    id_ejecutivo       NUMBER NOT NULL REFERENCES usuario(id_usuario),
    id_ruta            NUMBER REFERENCES ruta(id_ruta),
    fecha_creacion     DATE DEFAULT SYSDATE,
    id_estado_pedido   NUMBER NOT NULL REFERENCES estado_pedido(id_estado_pedido)
);

-- ------------------------------------------------------------
-- 6. FACTURA
--    depende de pedido (1 a 1: cada pedido tiene una factura).
-- ------------------------------------------------------------

CREATE TABLE factura (
    id_factura           NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido            NUMBER NOT NULL UNIQUE REFERENCES pedido(id_pedido),
    numero_factura       VARCHAR2(50) NOT NULL,
    foto_url             VARCHAR2(255),
    firma_url            VARCHAR2(255),
    geolocalizacion      VARCHAR2(100),
    resultado_entrega    VARCHAR2(10) CHECK (resultado_entrega IN ('LOGRADO','FALLIDO')),
    razon_fallo          VARCHAR2(255),
    fecha_entrega        DATE
);

-- ------------------------------------------------------------
-- 7. COMENTARIO
--    depende de factura (varios comentarios por factura).
-- ------------------------------------------------------------

CREATE TABLE comentario (
    id_comentario   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_factura      NUMBER NOT NULL REFERENCES factura(id_factura),
    texto           VARCHAR2(4000) NOT NULL,
    fecha           DATE DEFAULT SYSDATE
);

-- ------------------------------------------------------------
-- 8. NOTIFICACION
--    depende de pedido y estado_notificacion.
-- ------------------------------------------------------------

CREATE TABLE notificacion (
    id_notificacion          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido                NUMBER NOT NULL REFERENCES pedido(id_pedido),
    tipo                     VARCHAR2(10) CHECK (tipo IN ('SMS','EMAIL')) NOT NULL,
    id_estado_notificacion   NUMBER NOT NULL REFERENCES estado_notificacion(id_estado_notificacion),
    fecha_envio              DATE
);

-- ------------------------------------------------------------
-- 9. REAGENDAMIENTO
--    depende de pedido.
-- ------------------------------------------------------------

CREATE TABLE reagendamiento (
    id_reagendamiento   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido            NUMBER NOT NULL REFERENCES pedido(id_pedido),
    nueva_fecha          DATE NOT NULL,
    motivo               VARCHAR2(255)
);

-- ------------------------------------------------------------
-- 10. TIPO COMPUESTO VARRAY
--     Catálogo FIJO y acotado de razones de fallo (máx. 10).
--     Se usa VARRAY porque el número de elementos tiene un
--     límite conocido de negocio (no crece indefinidamente).
-- ------------------------------------------------------------

CREATE OR REPLACE TYPE t_razones_fallo IS VARRAY(10) OF VARCHAR2(100);
/

-- Nota: el tipo RECORD (r_pedido_detalle) se declara dentro del
-- package en el archivo 2, porque solo se usa ahí (en el cursor
-- maestro-detalle), no como estructura de almacenamiento de la BD.
