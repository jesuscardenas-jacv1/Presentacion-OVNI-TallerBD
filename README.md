# Objetos PL/SQL identificados — App de Gestión de Reparto

Presentación animada (Vue 3, sin instalación) de la evaluación parcial 2 de **Taller de Base de Datos (BDY1103, DUOC UC Puerto Montt)**, junto con los scripts SQL del proyecto.

- **Presentación:** abrir `index.html` en el navegador, o verla en GitHub Pages.
- **Scripts SQL:** carpeta `sql/`, ordenada según el orden de ejecución.
- **Proyecto del equipo original:** `github.com/KanninoX/TallerBD`.

## Estructura

```
index.html, css/, js/, fuentes/, vendor/   presentación web (no tocar para ejecutar SQL)
LEEME.txt                                  controles de la presentación
sql/
  01_base_datos/
    1_app_reparto_base_datos.sql           tablas, restricciones y tipo de razones de fallo (archivo 1 del equipo)
  02_plsql/
    pkg_reparto.sql                        package: especificación y cuerpo (registrar_entrega, contar_pedidos_fallidos, ...)
    bloque_consultas.sql                   bloque con cursores anidados maestro-detalle (archivo 2 del equipo)
  03_triggers/
    trg_notificar_entrega.sql              trigger de FILA del equipo: crea notificación al cliente
    trg_contar_fallidas_fila.sql           EJEMPLO que produce ORA-04091 (tabla mutante), lámina "La nave que cayó"
    trg_contar_fallidas_sentencia.sql      CORRECCIÓN a nivel de SENTENCIA, lámina "La corrección"
  04_pruebas/
    pruebas_basicas.sql                    llamadas de prueba a registrar_entrega y contar_pedidos_fallidos
```

## Orden de ejecución (SQL Developer)

1. `01_base_datos/1_app_reparto_base_datos.sql`
2. `02_plsql/pkg_reparto.sql`
3. `02_plsql/bloque_consultas.sql` (opcional, demuestra cursores anidados)
4. `03_triggers/trg_notificar_entrega.sql`
5. `04_pruebas/pruebas_basicas.sql` (con `SET SERVEROUTPUT ON`)

Los archivos de `03_triggers/trg_contar_fallidas_*.sql` son ejemplos didácticos del error de tabla mutante. El primero **provoca el error a propósito**; ejecútalo solo para mostrarlo, y luego usa el de sentencia.

## Pendiente antes de presentar

- Procedimiento y función **sin parámetros**: todavía no están escritos en `sql/` (la pauta los exige; en la presentación aparecen como pendientes).
- Trigger de **sentencia** de la pauta: el ejemplo de corrección existe, pero falta una prueba que muestre que dispara una sola vez por sentencia.
- Resultados reales de las pruebas: la salida de `DBMS_OUTPUT` (hoy hay un valor de ejemplo) y la columna "obtenido" de la lámina de pruebas.
- Mensajes ORA y PLS-00302 mostrados en la presentación: confirmarlos en Oracle antes de defender.

## Notas del equipo detectadas

- En el archivo original, la llamada de ejemplo usa `'Cliente ausente'` (no existe en el catálogo). La versión de `pruebas_basicas.sql` usa `'CLIENTE_AUSENTE'`, que sí existe.
- El handler `NO_DATA_FOUND` de `contar_pedidos_fallidos` no es alcanzable, porque un `COUNT(*)` nunca lanza esa excepción.
- En el catálogo de razones aparece `VEHICULO_AVEARIADO` (typo de la palabra "AVERIADO").

## Créditos

Equipo: Jesús Cárdenas, Ramón Osorio y Lucas Saldivia. Trabajo desarrollado con apoyo de IA.
