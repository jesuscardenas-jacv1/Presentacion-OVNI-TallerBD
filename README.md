# Objetos PL/SQL identificados — App de Gestión de Reparto

Presentación animada (Vue 3, sin instalación) de la Evaluación Parcial N.º 2 de **Taller de Base de Datos (BDY1103, DUOC UC Puerto Montt)**, junto con los scripts SQL del proyecto.

- **Presentación:** abrir `index.html` en el navegador, o verla en GitHub Pages.
- **Proyecto original del equipo:** `github.com/KanninoX/TallerBD`.

## Estructura

```
index.html, css/, js/, fuentes/, vendor/   presentación web
LEEME.txt                                  controles de la presentación
sql/
  0_usuario_proyecto.sql                   creación de usuario reparto_ovni y permisos (opcional / admin)
  1_base_datos.sql                         tablas, restricciones, catálogos y tipo VARRAY t_razones_fallo
  2_pkg_reparto_y_triggers.sql             package pkg_reparto (público y privado) y triggers de fila y de sentencia
  3_datos_y_pruebas.sql                    datos de prueba, pruebas P1 a P15 y prueba masiva de volumen
```

## Orden de ejecución (SQL Developer, Run Script con F5)

0. `sql/0_usuario_proyecto.sql` (opcional, como admin para crear `reparto_ovni`)
1. `sql/1_base_datos.sql`
2. `sql/2_pkg_reparto_y_triggers.sql`
3. `sql/3_datos_y_pruebas.sql`

Ejecutar sobre un esquema recién creado, porque los ID son IDENTITY y las pruebas suponen que empiezan en 1.

En `3_datos_y_pruebas.sql`, el bloque P14 (función privada desde fuera del package) está comentado: produce el error PLS-00302 a propósito y corta el script. Para mostrarlo en la defensa, descomentar y ejecutar solo ese bloque.

## Estado de las pruebas y evidencias

- Se incorporó la prueba **P15** para validar el cursor explícito con registro (`listar_pedidos_por_ruta`).
- Se incorporó la **Sección 7 (Prueba de volumen masivo con 200 registros y ROLLBACK)** para comprobar procesamiento en lote.
- Se completó la columna "Se obtuvo" en la lámina de pruebas de la presentación (`js/contenido.js`).
- Se documentaron las 4 evidencias de uso de IA y conclusiones en la bitácora (`js/contenido.js`).
- El bloque P14 documenta el error `PLS-00302` ante intentos de acceso a la función privada `es_razon_valida`.

## Créditos

Equipo: Jesús Cárdenas, Ramón Osorio y Lucas Saldivia. Trabajo desarrollado con apoyo de IA.
