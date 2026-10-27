# Objetos PL/SQL identificados — App de Gestión de Reparto

Presentación animada (Vue 3, sin instalación) de la Evaluación Parcial N.º 2 de **Taller de Base de Datos (BDY1103, DUOC UC Puerto Montt)**, junto con los scripts SQL del proyecto.

- **Presentación:** abrir `index.html` en el navegador, o verla en GitHub Pages.
- **Proyecto original del equipo:** `github.com/KanninoX/TallerBD`.

## Estructura

```
index.html, css/, js/, fuentes/, vendor/   presentación web
LEEME.txt                                  controles de la presentación
sql/
  1_base_datos.sql                         tablas, restricciones, catálogos y tipo VARRAY t_razones_fallo
  2_pkg_reparto_y_triggers.sql             package pkg_reparto (público y privado) y triggers de fila y de sentencia
  3_datos_y_pruebas.sql                    datos de prueba y pruebas P1 a P13, con el resultado esperado de cada una
```

## Orden de ejecución (SQL Developer, Run Script con F5)

1. `sql/1_base_datos.sql`
2. `sql/2_pkg_reparto_y_triggers.sql`
3. `sql/3_datos_y_pruebas.sql`

Ejecutar sobre un esquema recién creado, porque los ID son IDENTITY y las pruebas suponen que empiezan en 1.

En `3_datos_y_pruebas.sql`, el bloque P14 (función privada desde fuera del package) está comentado: produce el error PLS-00302 a propósito y corta el script. Para mostrarlo en la defensa, descomentar y ejecutar solo ese bloque.

## Pendiente antes de presentar

- Anotar la salida real de cada prueba en la columna "Se obtuvo" de la lámina de pruebas (`js/contenido.js`, id `pruebas`).
- Los mensajes ORA y PLS-00302 mostrados en la presentación se deben confirmar en Oracle.

## Créditos

Equipo: Jesús Cárdenas, Ramón Osorio y Lucas Saldivia. Trabajo desarrollado con apoyo de IA.
