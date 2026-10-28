/* ============================================================
   CONTENIDO DE LA PRESENTACIÓN
   ------------------------------------------------------------
   Aquí están los textos de cada lámina. El PL/SQL NO va aquí:
   va en  js/codigos.js  y las láminas lo buscan por su "clave".

   Todo lo que quede con comillas vacías ('') se muestra en la
   lámina como pendiente, para que se note qué falta completar.
   ============================================================ */

window.PRESENTACION = {

  equipo: {
    ramo: 'Taller de Base de Datos, BDY1103',
    evaluacion: 'Evaluación Parcial N.º 2',
    integrantes: ['Jesús Cárdenas', 'Ramón Osorio', 'Lucas Saldivia'],
    repo: 'github.com/jesuscardenas-jacv1'
  },

  /* Pruebas para el modo ensayo: lo que mostró SQL y qué decir en la defensa.
     Lo que aún no está confirmado en Oracle va en "pendiente". */
  pruebasDefensa: [
    { id: 'P1', titulo: 'Entrega fallida con razón válida',
      consulta: "pkg_reparto.registrar_entrega(1, 'FALLIDO', 'CLIENTE_AUSENTE', v_msg);",
      salida: ['Entregas fallidas: 1', 'Entrega registrada correctamente'],
      decir: ['El procedimiento recibe los datos por IN y devuelve el resultado por OUT. Las reglas están en la base, no en la aplicación.',
              'El trigger de sentencia imprime el total de fallidos, y el de fila crea el aviso al cliente.'] },
    { id: 'P2', titulo: 'Razón que no está en el catálogo',
      consulta: "pkg_reparto.registrar_entrega(2, 'FALLIDO', 'Razon inventada', v_msg);",
      salida: ['Error: razon de fallo no permitida'],
      decir: ['Cada caso tiene su excepción con PRAGMA EXCEPTION_INIT, así el error tiene nombre y mensaje propio.',
              'Hace ROLLBACK, por eso nada queda a medias.'] },
    { id: 'P3', titulo: 'Fallida sin razón',
      consulta: "pkg_reparto.registrar_entrega(2, 'FALLIDO', NULL, v_msg);",
      salida: ['Error: razon de fallo obligatoria'],
      decir: ['Cuando el resultado es FALLIDO, la razón es obligatoria. Es una regla de negocio que vive en el package.'] },
    { id: 'P4', titulo: 'Resultado que no existe',
      consulta: "pkg_reparto.registrar_entrega(2, 'ENTREGADO', NULL, v_msg);",
      salida: ['Error: resultado de entrega no valido'],
      decir: ['Antes, cualquier valor distinto dejaba el pedido como FALLIDO. Ahora el resultado se valida primero.'] },
    { id: 'P5', titulo: 'Pedido que no existe',
      consulta: "pkg_reparto.registrar_entrega(999, 'LOGRADO', NULL, v_msg);",
      salida: ['Pedido no encontrado'],
      decir: ['El UPDATE no afecta filas, así que se lanza NO_DATA_FOUND. El WHEN OTHERS no relanza el error, para que el OUT llegue a quien llamó.'] },
    { id: 'P6', titulo: 'Función con parámetros en un SELECT',
      consulta: "SELECT id_ruta, pkg_reparto.contar_pedidos_fallidos(id_ruta) AS fallidos FROM ruta ORDER BY id_ruta;",
      tabla: { columnas: ['ID_RUTA', 'FALLIDOS'], filas: [[1, 1], [2, 0]] },
      decir: ['Devuelve un número que depende de la ruta, y se usa directo en el SELECT.',
              'Reconocer que el WHEN NO_DATA_FOUND nunca se ejecuta, porque COUNT(*) siempre devuelve una fila.'] },
    { id: 'P7', titulo: 'Función sin parámetros',
      consulta: "SELECT pkg_reparto.total_pedidos_en_ruta AS en_ruta FROM dual;",
      tabla: { columnas: ['EN_RUTA'], filas: [[1]] },
      nota: 'Al final del script da 1. Antes de P12 daba 3, porque P12 dejó los pedidos 2 y 3 como ENTREGADO.',
      decir: ['No depende de ninguna entrada. El valor cambia según el momento en que se consulta, porque lee datos vivos.'] },
    { id: 'P8', titulo: 'Trigger de fila: un aviso por factura',
      consulta: "SELECT id_notificacion, id_pedido, tipo, id_estado_notificacion, fecha_envio FROM notificacion ORDER BY id_notificacion;",
      tabla: { columnas: ['ID_NOTIFICACION', 'ID_PEDIDO', 'TIPO', 'ID_ESTADO_NOTIFICACION', 'FECHA_ENVIO'],
               filas: [[1, 1, 'EMAIL', 1, '27/10/26'], [4, 2, 'EMAIL', 1, '27/10/26'], [5, 3, 'EMAIL', 1, '27/10/26']] },
      nota: 'Los ids 2 y 3 quedaron libres por el ROLLBACK de P10: la secuencia no se revierte.',
      decir: ['Usa AFTER, FOR EACH ROW y :NEW. Solo inserta en notificacion y nunca lee factura, así que no tiene el problema de tabla mutante.'] },
    { id: 'P9', titulo: 'Otra columna no dispara el trigger',
      consulta: "SELECT COUNT(*) FROM notificacion WHERE id_pedido = 4; UPDATE factura SET foto_url = 'foto.jpg' WHERE id_pedido = 4; SELECT COUNT(*) ...; ROLLBACK;",
      salida: ['1 fila actualizadas.', 'Rollback terminado.'],
      pendiente: 'Faltan los dos conteos (antes y después). Se espera 0 y 0.',
      decir: ['UPDATE OF solo dispara si la columna está en el SET. Cambiar foto_url no genera aviso.'] },
    { id: 'P10', titulo: 'UPDATE de dos filas',
      consulta: "UPDATE factura SET resultado_entrega = 'LOGRADO' WHERE id_pedido IN (2, 3); SELECT notificaciones de 2 y 3; ROLLBACK;",
      salida: ['2 filas actualizadas.', 'Entregas fallidas: 1'],
      pendiente: 'Falta confirmar los avisos nuevos de esta consulta.',
      decir: ['El trigger de sentencia se ejecuta una vez por operación, sin importar cuántas filas cambien.',
              'El de fila se ejecuta una vez por fila: insertó dos avisos. El ROLLBACK los deshizo, pero los ids 2 y 3 de notificacion quedaron sin usar (se ve en P8).',
              'Aquí los pedidos 2 y 3 todavía no tenían resultado: P10 corre antes de P12. Que el trigger dispare aunque el valor no cambie es cierto (basta con que la columna esté en el SET), pero esta prueba no lo muestra.'] },
    { id: 'P11', titulo: 'Cerrar rutas con pendientes',
      consulta: "BEGIN pkg_reparto.cerrar_rutas_completas; END;",
      salida: ['Rutas cerradas: 0'],
      decir: ['Es un procedimiento sin parámetros que trabaja por conjuntos: un UPDATE con EXISTS y NOT EXISTS, sin recorrer las rutas una por una.'] },
    { id: 'P12', titulo: 'Ruta terminada',
      consulta: "BEGIN pkg_reparto.cerrar_rutas_completas; END; (tras entregar los pedidos 2 y 3); SELECT r.id_ruta, e.nombre_estado FROM ruta r JOIN estado_ruta e ...;",
      salida: ['Rutas cerradas: 1'],
      tabla: { columnas: ['ID_RUTA', 'NOMBRE_ESTADO'], filas: [[1, 'FINALIZADA'], [2, 'EN_CURSO']] },
      decir: ['La ruta 2 sigue abierta porque su pedido 4 sigue EN_RUTA.',
              'Una ruta se cierra solo cuando no le quedan pedidos CREADO ni EN_RUTA.'] },
    { id: 'P13', titulo: 'Ejecutar dos veces',
      consulta: "BEGIN pkg_reparto.cerrar_rutas_completas; END; (segunda vez)",
      salida: ['Rutas cerradas: 0'],
      decir: ['Es idempotente: la segunda ejecución no encuentra rutas que cumplan la condición.',
              'Tiene COMMIT adentro, así que quien lo llama no puede deshacerlo. Es una limitación que conviene reconocer.'] },
    { id: 'P14', titulo: 'Función privada desde fuera',
      consulta: "BEGIN IF pkg_reparto.es_razon_valida('CLIENTE_AUSENTE') THEN ... END IF; END;",
      salida: [],
      pendiente: 'Error PLS-00302: component ES_RAZON_VALIDA must be declared. Falta confirmarlo en Oracle, ejecutando este bloque solo.',
      decir: ['Es encapsulamiento: es_razon_valida solo existe en el cuerpo. Se puede cambiar la implementación sin romper a quien usa el package.'] },
    { id: 'P15', titulo: 'Cursor explícito con RECORD',
      consulta: "BEGIN pkg_reparto.listar_pedidos_por_ruta(1); END;",
      salida: ['1 - Cliente A - FALLIDO', '2 - Cliente B - ENTREGADO', '3 - Cliente C - ENTREGADO'],
      decir: ['Recorre c_pedidos (JOIN de 3 tablas) cargando cada fila en el RECORD r_pedido_detalle.',
              'Demuestra el uso de cursores explícitos con OPEN, FETCH, EXIT WHEN %NOTFOUND y CLOSE.'] },
    { id: 'Volumen', titulo: 'Procesamiento masivo en lote',
      consulta: "Bloque anónimo PL/SQL con 200 pedidos masivos vía CONNECT BY y ROLLBACK",
      salida: ['Ruta masiva - Pedidos fallidos contados: 40 (Esperado: 40)', 'Notificaciones individuales generadas: 200 (Esperado: 200)', 'ROLLBACK ejecutado: Esquema de pruebas limpio.'],
      decir: ['Demuestra que los triggers y funciones escalan eficientemente con cientos de filas.',
              'Termina en ROLLBACK para asegurar la limpieza del esquema.'] }
  ],

  laminas: [

    /* ---------- 1. Portada ---------- */
    {
      id: 'portada',
      tipo: 'portada',
      seccion: 'Inicio',
      titulo: 'Objetos PL/SQL identificados',
      lineas: ['Objetos', 'PL/SQL', 'identificados'],
      bajada: 'Procedimientos, funciones, packages y triggers de la App de Gestión de Reparto.'
    },

    /* ---------- 3. El caso ---------- */
    {
      id: 'caso',
      tipo: 'caso',
      seccion: 'Introducción',
      titulo: 'Entregas que nadie puede seguir',
      problemas: [
        { titulo: 'Cada repartidor informa a su manera', texto: 'No hay un formato común para confirmar una entrega.' },
        { titulo: 'Los fallos quedan sin motivo claro', texto: 'La causa se escribe en texto libre o no se registra.' },
        { titulo: 'Los avisos al cliente son manuales', texto: 'Alguien revisa y avisa a mano, tarde y con errores.' }
      ],
      objetivo: 'Registrar cada entrega con reglas que la base de datos hace cumplir, estandarizar los motivos de fallo y avisar al cliente en el momento, todo con PL/SQL.',
      preguntas: [
        '1. ¿Qué problema de negocio aborda nuestro proyecto?',
        '5. ¿Qué reglas de negocio deben respetarse?',
        '9. ¿Qué parte del problema no se resuelve simplemente mediante una consulta SQL?',
        '161. Explique el problema de negocio y la solución desarrollada por su equipo.'
      ]
    },

    /* ---------- 5. Procedimientos: concepto ---------- */
    {
      id: 'proc-concepto',
      tipo: 'concepto',
      seccion: 'Funciones y procedimientos',
      titulo: 'Procedimiento: una orden que la base ejecuta',
      idea: 'En la nave sería un protocolo de misión: se da la orden y la tripulación actúa. No trae nada de vuelta, salvo lo que deje en un parámetro OUT.',
      columnas: [
        {
          titulo: 'Con parámetros',
          puntos: [
            'Recibe datos para saber sobre qué actuar: IN entra, OUT sale, IN OUT hace las dos cosas.',
            'registrar_entrega recibe el pedido, el resultado y la razón, y devuelve un mensaje.',
            'Sirve para cualquier pedido sin tocar el código.'
          ]
        },
        {
          titulo: 'Sin parámetros',
          puntos: [
            'Hace siempre la misma tarea completa; no necesita que le digan sobre qué.',
            'Calza con procesos de cierre o mantención que corren igual cada vez.'
          ]
        },
        {
          titulo: 'Por qué no un UPDATE suelto',
          puntos: [
            'Las reglas viven en un solo lugar y la app no puede saltárselas.',
            'Pedido y factura cambian juntos o no cambia ninguno.',
            'Se da permiso sobre el procedimiento, no sobre las tablas.'
          ]
        }
      ],
      preguntas: [
        '47. ¿Por qué decidimos implementar un procedimiento en lugar de ejecutar directamente una sentencia SQL?',
        '48. ¿Qué diferencia existe entre un procedimiento con parámetros y uno sin parámetros?',
        '53. ¿Qué ventajas ofrece encapsular una operación de negocio en un procedimiento?',
        '56. ¿Qué ocurriría si la operación se ejecutara dos veces?'
      ]
    },

    /* ---------- 8. Funciones: concepto ---------- */
    {
      id: 'func-concepto',
      tipo: 'concepto',
      seccion: 'Funciones y procedimientos',
      titulo: 'Función: una sonda que siempre vuelve con un dato',
      idea: 'Sale, mide y regresa con un valor. Por eso se puede usar dentro de un SELECT, cosa que un procedimiento no permite.',
      tabla: {
        encabezados: ['', 'Procedimiento', 'Función'],
        filas: [
          ['Qué entrega', 'Nada directo; puede dejar valores en parámetros OUT', 'Siempre un valor, con RETURN'],
          ['Cómo se llama', 'Como una instrucción, dentro de BEGIN y END', 'Dentro de una expresión o de un SELECT'],
          ['En nuestro caso', 'Registrar una entrega: cambia datos', 'Contar fallidos de una ruta: calcula'],
          ['Desde SQL', 'No se puede usar en un SELECT', 'Sí, mientras no haga INSERT, UPDATE ni DELETE']
        ]
      },
      columnas: [
        { titulo: 'Con parámetros', puntos: ['El resultado depende de lo que se le pase: contar_pedidos_fallidos(p_id_ruta).'] },
        { titulo: 'Sin parámetros', puntos: ['Devuelve un dato que no depende de ninguna entrada: total_pedidos_en_ruta.'] }
      ],
      preguntas: [
        '60. ¿Qué diferencia existe entre una función almacenada y un procedimiento almacenado?',
        '65. ¿Qué restricciones debemos considerar al invocar una función desde SQL?',
        '68. ¿Cuándo sería preferible utilizar una consulta SQL en lugar de una función almacenada?'
      ]
    },

    /* ---------- 14. Trigger de fila ---------- */
    {
      id: 'trg-fila',
      tipo: 'codigo',
      seccion: 'Triggers',
      titulo: 'trg_notificar_entrega, a nivel de fila',
      resumen: [
        'Evento: después de actualizar resultado_entrega en la tabla factura.',
        'FOR EACH ROW: crea una notificación por cada fila afectada donde se actualiza resultado_entrega.',
        ':NEW.id_pedido trae el valor recién guardado en esa fila.',
        'WHEN filtra: solo actúa si el resultado no quedó nulo (:NEW.resultado_entrega IS NOT NULL).',
        'Va en la misma transacción: si el INSERT falla, también se deshace la entrega.'
      ],
      paneles: [
        { etiqueta: 'Código', clave: 'trg_notificar_entrega' },
        { etiqueta: 'Cómo se comprueba', clave: 'uso_trg_notificar_entrega' }
      ],
      preguntas: [
        '168. Seleccione un trigger y explique qué evento lo activa.',
        '87. ¿Qué diferencia existe entre ejecutar un trigger antes o después de una operación?',
        '99. ¿Por qué elegimos utilizar un trigger y no otra alternativa?',
        '100. ¿Qué pruebas realizamos para comprobar que el trigger no se activa en situaciones incorrectas?'
      ]
    },
    /* ---------- Triggers: estado antes y después ---------- */
    {
      id: 'trg-estado',
      tipo: 'concepto',
      seccion: 'Triggers',
      titulo: 'Cómo revisamos el efecto del trigger',
      idea: 'Miramos la tabla notificacion antes del UPDATE y otra vez después. Lo que cambió entre las dos consultas es lo que dejó el trigger.',
      columnas: [
        {
          titulo: 'Antes del UPDATE',
          puntos: [
            'Se consulta notificacion y se anota qué avisos existen para cada pedido.',
            'Luego se hace el UPDATE sobre factura: resultado_entrega pasa a FALLIDO o LOGRADO.'
          ]
        },
        {
          titulo: 'Después del UPDATE',
          puntos: [
            'El trigger de fila agregó un aviso por cada factura que cambió.',
            'En la prueba P8 quedaron avisos para los pedidos 1, 2 y 3.'
          ]
        },
        {
          titulo: 'Qué hay que tener en cuenta',
          puntos: [
            'Los ids de la secuencia no se reutilizan, aunque la operación se deshaga.',
            'Si el UPDATE cambia solo otra columna, no se crea aviso nuevo.'
          ]
        }
      ],
      preguntas: [
        '92. ¿Cómo verificaríamos cuántas veces se ejecuta un trigger durante una operación que modifica múltiples registros?',
        '87. ¿Qué diferencia existe entre ejecutar un trigger antes o después de una operación?'
      ]
    },

    /* ---------- Triggers: P8 en pantalla (un aviso por factura) ---------- */
    {
      id: 'trg-p8',
      tipo: 'terminal',
      seccion: 'Triggers',
      titulo: 'P8 en pantalla: un aviso por cada factura',
      idea: 'Así se ve la comprobación del trigger de fila en SQL Developer.',
      lineas: [
        { tipo: 'sql', texto: 'SELECT id_notificacion, id_pedido, tipo' },
        { tipo: 'sql', texto: 'FROM notificacion ORDER BY id_notificacion;' },
        { tipo: 'salida', texto: 'ID_NOTIFICACION   ID_PEDIDO   TIPO' },
        { tipo: 'salida', texto: '1                 1          EMAIL' },
        { tipo: 'salida', texto: '4                 2          EMAIL' },
        { tipo: 'salida', texto: '5                 3          EMAIL', destacar: true, nota: 'un aviso por pedido, creado por el trigger de fila' },
        { tipo: 'nota', texto: 'El trigger de fila crea un aviso por cada factura que se actualiza.' }
      ],
      preguntas: [
        '87. ¿Qué diferencia existe entre ejecutar un trigger antes o después de una operación?'
      ]
    },

    /* ---------- 2. Animación: la nave que cayó ----------
       El código y el error que aparecen en la pantalla de la nave
       están en js/codigos.js (claves caida_sql y caida_error). */
    {
      id: 'mision',
      tipo: 'caida',
      seccion: 'Bitácora del capitán',
      titulo: 'El día que la nave cayó',
      final: {
        titulo: 'Misión abortada',
        error: 'ORA-04091: la tabla FACTURA está mutando',
        parrafos: [
          'El trigger es FOR EACH ROW y consulta factura, la misma tabla que lo disparó. Oracle no deja leerla mientras el UPDATE la está cambiando.',
          'Cómo se evita: hacer el conteo en un trigger de sentencia, que corre cuando el UPDATE ya terminó. Por eso trg_notificar_entrega solo inserta en notificacion y nunca lee factura.'
        ],
        ir: 'mision-ok',
        irTexto: 'Ver la corrección'
      },
      preguntas: [
        '96. ¿Qué es una tabla mutante y en qué circunstancias puede aparecer ese problema?',
        '97. ¿Cómo podríamos evitar una implementación que produzca errores de tabla mutante?',
        '116. ¿Qué mensaje de error obtuvimos y qué significaba?',
        '95. ¿Qué ocurriría si una operación activara indirectamente otros triggers?'
      ]
    },

    /* ---------- 3. Animación: la corrección ----------
       Código y salida en js/codigos.js (claves correccion_sql y correccion_salida). */
    {
      id: 'mision-ok',
      tipo: 'caida',
      modo: 'exito',
      codigo: 'correccion_sql',
      salida: 'correccion_salida',
      seccion: 'Bitácora del capitán',
      titulo: 'La corrección: misión cumplida',
      final: {
        titulo: 'Misión cumplida',
        error: 'Sin FOR EACH ROW: trigger de sentencia',
        parrafos: [
          'Quitamos FOR EACH ROW. Ahora el trigger se dispara una sola vez, cuando el UPDATE ya terminó, y en ese momento sí puede consultar factura.',
          'Lo que se pierde: un trigger de sentencia no ve :OLD ni :NEW, así que no sabe qué pedido cambió. Si se necesitara, habría que usar un COMPOUND TRIGGER.'
        ],
        ir: 'mision',
        irTexto: 'Ver el error otra vez'
      },
      preguntas: [
        '169. ¿Qué diferencia habría si ese trigger fuera a nivel de sentencia en lugar de fila, o viceversa?',
        '97. ¿Cómo podríamos evitar una implementación que produzca errores de tabla mutante?',
        '174. ¿Cómo supo que la solución propuesta por la IA era correcta?',
        '89. ¿Qué información puede consultar un trigger a nivel de fila mediante los valores :OLD y :NEW?'
      ]
    },


    /* ---------- 11. Package: demo público / privado ---------- */
    {
      id: 'pkg-demo',
      tipo: 'package',
      seccion: 'Paquetes',
      titulo: 'pkg_reparto: lo que se ve desde fuera y lo que no',
      idea: 'La especificación son las ventanas de la nave. El cuerpo es la sala de máquinas. Elige un elemento y mira qué pasa si alguien lo usa desde fuera.',
      elementos: [
        { nombre: 'r_pedido_detalle', clase: 'tipo RECORD', publico: true,
          llamada: 'v_pedido pkg_reparto.r_pedido_detalle;',
          resultado: 'Compila: el tipo está declarado en la especificación.' },
        { nombre: 'listar_pedidos_por_ruta', clase: 'procedimiento con cursor y RECORD', publico: true,
          llamada: 'pkg_reparto.listar_pedidos_por_ruta(1);',
          resultado: 'Se ejecuta: recorre c_pedidos y muestra id, cliente y estado.' },
        { nombre: 'registrar_entrega', clase: 'procedimiento', publico: true,
          llamada: "pkg_reparto.registrar_entrega(1, 'LOGRADO', NULL, v_msg);",
          resultado: 'Se ejecuta: está declarado en la especificación.' },
        { nombre: 'contar_pedidos_fallidos', clase: 'función', publico: true,
          llamada: 'SELECT pkg_reparto.contar_pedidos_fallidos(1) FROM dual;',
          resultado: 'Devuelve un número: está declarada en la especificación.' },
        { nombre: 'cerrar_rutas_completas', clase: 'procedimiento sin parámetros', publico: true,
          llamada: 'pkg_reparto.cerrar_rutas_completas;',
          resultado: 'Se ejecuta e imprime cuántas rutas cerró.' },
        { nombre: 'total_pedidos_en_ruta', clase: 'función sin parámetros', publico: true,
          llamada: 'SELECT pkg_reparto.total_pedidos_en_ruta FROM dual;',
          resultado: 'Devuelve un número: está declarada en la especificación.' },
        { nombre: 'es_razon_valida', clase: 'función privada', publico: false,
          llamada: "pkg_reparto.es_razon_valida('CLIENTE_AUSENTE')",
          resultado: "PLS-00302: component 'ES_RAZON_VALIDA' must be declared" },
        { nombre: 'v_razones_fallo', clase: 'VARRAY con el catálogo', publico: false,
          llamada: 'pkg_reparto.v_razones_fallo(1)',
          resultado: "PLS-00302: component 'V_RAZONES_FALLO' must be declared" },
        { nombre: 'e_razon_obligatoria', clase: 'excepción -20001', publico: false,
          llamada: 'WHEN pkg_reparto.e_razon_obligatoria THEN ...',
          resultado: "PLS-00302: component 'E_RAZON_OBLIGATORIA' must be declared" },
        { nombre: 'e_razon_no_valida', clase: 'excepción -20002', publico: false,
          llamada: 'WHEN pkg_reparto.e_razon_no_valida THEN ...',
          resultado: "PLS-00302: component 'E_RAZON_NO_VALIDA' must be declared" }
      ],
      porque: 'Nadie de fuera puede cambiar el catálogo de razones ni depender de cómo validamos: es_razon_valida es un detalle interno de registrar_entrega. Así se puede reescribir el cuerpo sin romper a quien usa el package.',
      preguntas: [
        '72. ¿Qué diferencia existe entre la especificación y el cuerpo de un package?',
        '74. ¿Por qué decidimos exponer algunos procedimientos o funciones y mantener otros privados?',
        '79. ¿Qué cambios podrían afectar a los programas que utilizan los elementos públicos del package?',
        '167. ¿Por qué se tomó esa decisión de encapsulamiento?'
      ]
    },
    /* ---------- Paquetes: ejecución en bloque anónimo ---------- */
    {
      id: 'pkg-ejecutar',
      tipo: 'codigo',
      seccion: 'Paquetes',
      titulo: 'Ejecutamos el paquete en un bloque anónimo',
      resumen: [
        'Se llama al procedimiento con el prefijo del paquete: pkg_reparto.registrar_entrega(...).',
        'El resultado vuelve por el parámetro OUT, y DBMS_OUTPUT lo muestra con SET SERVEROUTPUT ON.',
        'Después de la prueba se hace ROLLBACK, así la base queda como estaba.'
      ],
      paneles: [
        { etiqueta: 'Bloque anónimo', clave: 'uso_paquete_bloque' }
      ],
      preguntas: [
        '53. ¿Qué ventajas ofrece encapsular una operación de negocio en un procedimiento?'
      ]
    },

    /* ---------- 18. Conclusiones ---------- */
    {
      id: 'conclusiones',
      tipo: 'conclusiones',
      seccion: 'Conclusiones',
      titulo: 'Qué se llevan de vuelta a su planeta',
      bloques: [
        { titulo: 'Lo que construimos',
          texto: 'La lógica del reparto vive en la base de datos: pkg_reparto registra las entregas y valida las razones de fallo, y el trigger avisa al cliente sin que nadie tenga que acordarse.' },
        { titulo: 'Qué cambia para el negocio',
          texto: 'Los motivos de fallo quedan estandarizados, pedido y factura nunca quedan a medias y el aviso al cliente sale en el momento.' },
        { titulo: 'Competencias que nos llevamos',
          texto: 'Diseñar reglas de negocio dentro de la base (package, procedimientos, funciones, triggers, cursores y excepciones) y probarlas con datos antes de darlas por buenas. Para nuestra formación como ingenieros de software, esto sirve para razonar sobre la integridad de los datos y revisar cualquier propuesta, también la de una IA, antes de aceptarla.' },
        { titulo: 'Límites y mejoras',
          texto: 'Como límites identificamos el uso de IDs de estado fijos (hardcodeados del 1 al 5) en lugar de constantes de package o búsquedas dinámicas, y la inclusión de COMMIT dentro de los procedimientos, lo que resta control transaccional a la aplicación consumidora. Como mejora a futuro, eliminaríamos el COMMIT interno y optimizaríamos contar_pedidos_fallidos para evitar consultas repetitivas tipo N+1 en grandes volúmenes.' },
        { titulo: 'Lo que aprendimos usando IA',
          texto: 'La IA aceleró la estructuración de la especificación y cuerpo del package, pero no anticipó restricciones intrínsecas de Oracle como la tabla mutante (ORA-04091) ni el comportamiento de COUNT(*) ante excepciones. Aprendimos a usar la IA como asistente de borrador y no como juez de diseño, validando cada regla con pruebas de estrés en el motor.' }
      ],
      preguntas: [
        '181. ¿Qué parte de su solución considera más sólida y qué parte necesita mejorar?',
        '183. ¿Qué cambiaría si tuviera que implementar nuevamente el proyecto?',
        '179. Si el proyecto tuviera que procesar muchos más registros, ¿qué aspectos evaluaría?'
      ]
    },

    /* ---------- 17. Bitácora de IA ---------- */
    {
      id: 'bitacora',
      tipo: 'evidencias',
      seccion: 'Bitácora de IA',
      titulo: 'Cuatro momentos reales del trabajo con IA',
      items: [
        /* POR CONFIRMAR (Lucas): la pauta exige casos reales. El VARRAY ya venía del repo TallerBD;
           esta evidencia solo vale si la conversación con la IA sobre tabla o Nested Table ocurrió de verdad. */
        { titulo: 'Una decisión técnica',
          guia: ['qué había que resolver', 'qué alternativas hubo, incluidas las de la IA', 'cuál se eligió y por qué'],
          registro: 'Para validar razones de fallo, la IA propuso una tabla relacional extra o una Nested Table. Elegimos definir t_razones_fallo como VARRAY(10) en el package: al ser un catálogo fijo (8 razones) de solo lectura durante la entrega, el VARRAY ahorra lecturas a disco en cada despacho y mantiene la regla centralizada en la base de datos.' },
        /* POR CONFIRMAR (Lucas): solo vale si el ORA-04091 apareció de verdad al desarrollar
           y la IA propuso tablas temporales. Si fue el ejemplo armado para la animación, no sirve. */
        { titulo: 'Un error o una respuesta que no servía',
          guia: ['qué problema apareció', 'qué sugirió la IA', 'cómo se encontró la causa', 'cómo se comprobó que quedó resuelto'],
          registro: 'Al auditar entregas fallidas desde un trigger de fila (AFTER UPDATE ON factura FOR EACH ROW), surgió el error ORA-04091 (tabla mutante) al consultar la misma tabla. La IA proponía tablas temporales. La solución limpia fue separar responsabilidades: la notificación en el trigger de fila y la auditoría en un trigger de sentencia, que corre con la tabla consistente.' },
        { titulo: 'Una prueba significativa',
          guia: ['qué se quería comprobar', 'con qué datos', 'qué se esperaba y qué salió', 'qué se concluyó'],
          registro: 'En P8 comprobamos que el trigger de fila crea un aviso por cada factura que se actualiza. Al consultar notificacion aparecieron avisos para los pedidos 1, 2 y 3, uno por pedido.' },
        { titulo: 'Un aprendizaje o un cambio',
          guia: ['qué concepto quedó más claro', 'qué se modificó en el código o en la forma de trabajar', 'qué se haría distinto'],
          registro: 'Al revisar con IA el registrar_entrega de la entrega anterior vimos que su WHEN OTHERS asignaba p_mensaje y luego hacía RAISE: el OUT nunca llegaba a quien llamaba. Aprendimos que un OUT no se devuelve si el procedimiento termina en error. Quitamos el RAISE, agregamos la excepción -20003 para resultados que no son LOGRADO ni FALLIDO y lo comprobamos en Oracle con P2 a P5. Haríamos distinto: probar desde el inicio los casos inválidos, no solo el caso feliz.' }
      ],
      preguntas: [
        '172. Seleccione un error que haya encontrado y explique cómo lo resolvió.',
        '173. ¿Qué respuesta de la IA tuvo que revisar, corregir o adaptar?',
        '174. ¿Cómo supo que la solución propuesta por la IA era correcta?',
        '184. ¿Qué responsabilidad asume sobre el código presentado, independientemente de quién o qué herramienta lo haya generado?'
      ]
    },

    /* ---------- 19. Cierre ---------- */
    {
      id: 'cierre',
      tipo: 'cierre',
      seccion: 'Cierre',
      titulo: '¿Preguntas, terrícolas?',
      lineas: ['¿Preguntas,', 'terrícolas?'],
      bajada: 'Fin de la transmisión. El código está en mi GitHub.'
    }
  ]
};
