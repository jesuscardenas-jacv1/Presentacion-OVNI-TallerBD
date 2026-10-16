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

    /* ---------- 4. Plan de vuelo ---------- */
    {
      id: 'plan',
      tipo: 'ruta',
      seccion: 'Plan de vuelo',
      titulo: 'Seis paradas antes de aterrizar',
      paradas: [
        { nombre: 'El caso', detalle: 'Qué problema tiene el reparto y qué resolvemos.', ir: 'caso' },
        { nombre: 'Procedimientos', detalle: 'Con y sin parámetros.', ir: 'proc-concepto' },
        { nombre: 'Funciones', detalle: 'Con y sin parámetros, y su uso en un SELECT.', ir: 'func-concepto' },
        { nombre: 'Package', detalle: 'Qué es público y qué queda privado.', ir: 'pkg-demo' },
        { nombre: 'Triggers', detalle: 'A nivel de fila y a nivel de sentencia.', ir: 'trg-demo' },
        { nombre: 'Pruebas y bitácora de IA', detalle: 'Qué comprobamos y cómo trabajamos con la IA.', ir: 'pruebas' }
      ]
    },

    /* ---------- 3. El caso ---------- */
    {
      id: 'caso',
      tipo: 'caso',
      seccion: 'El caso',
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

    /* ---------- 4. Mapa de objetos ---------- */
    {
      id: 'mapa',
      tipo: 'mapa',
      seccion: 'La solución',
      titulo: 'Cómo se conectan los objetos',
      flujos: [
        {
          nombre: 'Cuando se registra una entrega',
          pasos: [
            { tipo: 'Quién', nombre: 'Repartidor', que: 'marca la entrega en la app' },
            { tipo: 'Procedimiento', nombre: 'registrar_entrega', que: 'valida y actualiza pedido y factura' },
            { tipo: 'Trigger de fila', nombre: 'trg_notificar_entrega', que: 'se dispara al cambiar el resultado' },
            { tipo: 'Tabla', nombre: 'notificacion', que: 'queda el aviso al cliente' }
          ]
        },
        {
          nombre: 'Cuando logística pide un reporte',
          pasos: [
            { tipo: 'Quién', nombre: 'Logística', que: 'consulta las rutas' },
            { tipo: 'Función', nombre: 'contar_pedidos_fallidos', que: 'cuenta los fallidos de una ruta' },
            { tipo: 'Tablas', nombre: 'pedido y factura', que: 'solo lectura' }
          ]
        }
      ],
      /* Se marcan solos como "por integrar" mientras su clave esté vacía en codigos.js */
      porIntegrar: [
        { nombre: 'Procedimiento sin parámetros', clave: 'proc_sin_parametros' },
        { nombre: 'Función sin parámetros', clave: 'func_sin_parametros' },
        { nombre: 'Trigger de sentencia', clave: 'trg_sentencia' }
      ],
      nota: 'Todo lo de reparto vive dentro del package pkg_reparto, salvo el trigger, que pertenece a la tabla factura.',
      preguntas: [
        '101. ¿Cómo se relacionan los procedimientos, funciones, packages y triggers de nuestro proyecto?',
        '103. ¿Qué objetos dependen de otros objetos?',
        '104. ¿En qué orden deben crearse o compilarse los objetos?',
        '109. ¿Qué errores pueden aparecer cuando los componentes funcionan por separado, pero no en conjunto?'
      ]
    },

    /* ---------- 5. Procedimientos: concepto ---------- */
    {
      id: 'proc-concepto',
      tipo: 'concepto',
      seccion: 'Procedimientos',
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

    /* ---------- 6. Procedimiento con parámetros ---------- */
    {
      id: 'proc-con',
      tipo: 'codigo',
      seccion: 'Procedimientos',
      titulo: 'registrar_entrega, con parámetros',
      resumen: [
        'Recibe el pedido, el resultado y la razón; devuelve un mensaje por el parámetro OUT.',
        'Si el resultado es FALLIDO exige una razón y la busca en el catálogo.',
        'Actualiza pedido y factura. Si el pedido no existe, SQL%ROWCOUNT queda en 0 y se avisa.',
        'COMMIT si todo sale bien, ROLLBACK ante cualquier excepción.'
      ],
      paneles: [
        { etiqueta: 'Código', clave: 'proc_registrar_entrega' },
        { etiqueta: 'Cómo se invoca', clave: 'uso_registrar_entrega' }
      ],
      preguntas: [
        '162. Seleccione un procedimiento y explique su funcionamiento paso a paso.',
        '50. ¿Qué ocurriría si un parámetro recibiera un valor inesperado?',
        '55. ¿Cómo identificaríamos si un procedimiento modifica más registros de los que debería?',
        '175. Si tuviera que modificar una condición del problema, ¿qué parte del código cambiaría?'
      ]
    },

    /* ---------- 7. Procedimiento sin parámetros ---------- */
    {
      id: 'proc-sin',
      tipo: 'codigo',
      seccion: 'Procedimientos',
      titulo: 'Procedimiento sin parámetros',
      resumen: [],
      queFalta: 'La pauta pide procedimientos con y sin parámetros. El repo solo tiene con parámetros; aquí va el que falta, con su ejecución.',
      paneles: [
        { etiqueta: 'Código', clave: 'proc_sin_parametros' },
        { etiqueta: 'Cómo se ejecuta', clave: 'uso_proc_sin_parametros' }
      ],
      preguntas: [
        '46. ¿Qué problema específico resuelve cada procedimiento de nuestro proyecto?',
        '51. ¿Cómo se ejecuta el procedimiento y cómo comprobamos su resultado?',
        '57. ¿Cómo podríamos adaptar el procedimiento si cambiara una regla de negocio?'
      ]
    },

    /* ---------- 8. Funciones: concepto ---------- */
    {
      id: 'func-concepto',
      tipo: 'concepto',
      seccion: 'Funciones',
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
        { titulo: 'Sin parámetros', puntos: ['Devuelve un dato que no depende de ninguna entrada, como un total general.'] }
      ],
      preguntas: [
        '60. ¿Qué diferencia existe entre una función almacenada y un procedimiento almacenado?',
        '65. ¿Qué restricciones debemos considerar al invocar una función desde SQL?',
        '68. ¿Cuándo sería preferible utilizar una consulta SQL en lugar de una función almacenada?'
      ]
    },

    /* ---------- 9. Función con parámetros ---------- */
    {
      id: 'func-con',
      tipo: 'codigo',
      seccion: 'Funciones',
      titulo: 'contar_pedidos_fallidos, con parámetros',
      resumen: [
        'Recibe una ruta y devuelve cuántas de sus entregas fallaron.',
        'Cruza pedido con factura y cuenta las de resultado FALLIDO.',
        'No modifica datos, por eso sirve dentro de un SELECT.',
        'Con COUNT siempre vuelve una fila: una ruta sin fallidos devuelve 0.'
      ],
      paneles: [
        { etiqueta: 'Código', clave: 'func_contar_pedidos_fallidos' },
        { etiqueta: 'Uso en un SELECT', clave: 'uso_contar_pedidos_fallidos' }
      ],
      preguntas: [
        '164. Explique una función almacenada e indique qué valor devuelve.',
        '165. ¿Cómo se utiliza esa función desde SQL?',
        '66. ¿Qué sucedería si la función recibiera valores nulos o datos inesperados?',
        '176. Si una función devolviera un resultado incorrecto, ¿cómo investigaría la causa?'
      ]
    },

    /* ---------- 10. Función sin parámetros ---------- */
    {
      id: 'func-sin',
      tipo: 'codigo',
      seccion: 'Funciones',
      titulo: 'Función sin parámetros',
      resumen: [],
      queFalta: 'La pauta pide funciones con y sin parámetros. El repo solo tiene con parámetros; aquí va la que falta, con la consulta que la usa.',
      paneles: [
        { etiqueta: 'Código', clave: 'func_sin_parametros' },
        { etiqueta: 'Uso en un SELECT', clave: 'uso_func_sin_parametros' }
      ],
      preguntas: [
        '59. ¿Qué necesidad del proyecto resuelve cada función?',
        '63. ¿Qué diferencia existe entre una función con parámetros y una sin parámetros?',
        '67. ¿Cómo comprobaríamos que el valor devuelto es correcto?'
      ]
    },

    /* ---------- 11. Package: demo público / privado ---------- */
    {
      id: 'pkg-demo',
      tipo: 'package',
      seccion: 'Package',
      titulo: 'pkg_reparto: lo que se ve desde fuera y lo que no',
      idea: 'La especificación son las ventanas de la nave. El cuerpo es la sala de máquinas. Elige un elemento y mira qué pasa si alguien lo usa desde fuera.',
      elementos: [
        { nombre: 'r_pedido_detalle', clase: 'tipo RECORD', publico: true,
          llamada: 'v_pedido pkg_reparto.r_pedido_detalle;',
          resultado: 'Compila: el tipo está declarado en la especificación.' },
        { nombre: 'registrar_entrega', clase: 'procedimiento', publico: true,
          llamada: "pkg_reparto.registrar_entrega(1, 'LOGRADO', NULL, v_msg);",
          resultado: 'Se ejecuta: está declarado en la especificación.' },
        { nombre: 'contar_pedidos_fallidos', clase: 'función', publico: true,
          llamada: 'SELECT pkg_reparto.contar_pedidos_fallidos(1) FROM dual;',
          resultado: 'Devuelve un número: está declarada en la especificación.' },
        { nombre: 'listar_pedidos_por_ruta', clase: 'procedimiento', publico: true,
          llamada: 'pkg_reparto.listar_pedidos_por_ruta(1);',
          resultado: 'Se ejecuta e imprime los pedidos de la ruta.' },
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
      porque: 'Nadie de fuera puede cambiar el catálogo de razones ni depender de cómo validamos. Así se puede reescribir el cuerpo sin romper a quien usa el package.',
      preguntas: [
        '72. ¿Qué diferencia existe entre la especificación y el cuerpo de un package?',
        '74. ¿Por qué decidimos exponer algunos procedimientos o funciones y mantener otros privados?',
        '79. ¿Qué cambios podrían afectar a los programas que utilizan los elementos públicos del package?',
        '167. ¿Por qué se tomó esa decisión de encapsulamiento?'
      ]
    },

    /* ---------- 12. Package: código ---------- */
    {
      id: 'pkg-codigo',
      tipo: 'codigo',
      seccion: 'Package',
      titulo: 'Especificación y cuerpo de pkg_reparto',
      resumen: [
        'La especificación declara qué existe: un tipo, dos procedimientos y una función.',
        'El cuerpo guarda cómo funciona y lo que nadie más necesita ver.',
        'Privados: el catálogo de razones y las dos excepciones de negocio.',
        'Si cambia el cuerpo y no la especificación, quien usa el package no se entera.'
      ],
      paneles: [
        { etiqueta: 'Especificación (público)', clave: 'pkg_especificacion' },
        { etiqueta: 'Cuerpo: lo privado', clave: 'pkg_privados' }
      ],
      preguntas: [
        '166. Explique la organización de su package y distinga sus elementos públicos y privados.',
        '78. ¿Qué ocurriría si necesitáramos modificar la implementación interna de una función privada?',
        '81. ¿Qué errores podrían aparecer si la especificación y el cuerpo del package no fueran coherentes?'
      ]
    },

    /* ---------- 13. Triggers: demo fila / sentencia ---------- */
    {
      id: 'trg-demo',
      tipo: 'disparos',
      seccion: 'Triggers',
      titulo: 'Fila o sentencia: cuántas veces dispara',
      idea: 'El rayo de fila abduce paquete por paquete. El de sentencia se enciende una sola vez por operación, cambie las filas que cambie.',
      sentencia: "UPDATE factura\nSET resultado_entrega = 'LOGRADO'\nWHERE id_pedido IN (...);",
      notas: [
        'De fila: lleva FOR EACH ROW y ve :OLD y :NEW de cada fila.',
        'De sentencia: no lleva FOR EACH ROW y no conoce :OLD ni :NEW.'
      ],
      preguntas: [
        '86. ¿Qué diferencia existe entre un trigger a nivel de fila y uno a nivel de sentencia?',
        '91. ¿Qué sucede si una operación afecta a varias filas?',
        '92. ¿Cómo verificaríamos cuántas veces se ejecuta un trigger durante una operación que modifica múltiples registros?',
        '96. ¿Qué es una tabla mutante y en qué circunstancias puede aparecer ese problema?'
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
        'FOR EACH ROW: crea una notificación por cada factura que cambia.',
        ':NEW.id_pedido trae el valor recién guardado en esa fila.',
        'WHEN filtra: solo actúa si el resultado no quedó nulo.',
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

    /* ---------- 15. Trigger de sentencia ---------- */
    {
      id: 'trg-sentencia',
      tipo: 'codigo',
      seccion: 'Triggers',
      titulo: 'Trigger a nivel de sentencia',
      resumen: [],
      queFalta: 'La pauta pide triggers a nivel de fila y de sentencia. El repo solo tiene el de fila; aquí va el de sentencia, con la prueba que muestra que dispara una vez.',
      paneles: [
        { etiqueta: 'Código', clave: 'trg_sentencia' },
        { etiqueta: 'Cómo se comprueba', clave: 'uso_trg_sentencia' }
      ],
      preguntas: [
        '85. ¿Qué regla de negocio o necesidad de control resuelve cada trigger?',
        '169. ¿Qué diferencia habría si ese trigger fuera a nivel de sentencia en lugar de fila, o viceversa?',
        '93. ¿Qué riesgos existen al utilizar triggers para implementar reglas de negocio?'
      ]
    },

    /* ---------- 16. Pruebas ---------- */
    {
      id: 'pruebas',
      tipo: 'pruebas',
      seccion: 'Pruebas',
      titulo: 'Lo que esperábamos y lo que salió',
      /* "obtenido" se llena solo después de ejecutar la prueba en SQL Developer */
      filas: [
        { objeto: 'registrar_entrega', prueba: 'Entrega fallida con razón del catálogo',
          datos: "Pedido 1, 'FALLIDO', 'CLIENTE_AUSENTE'",
          esperado: 'Entrega registrada correctamente', obtenido: '' },
        { objeto: 'registrar_entrega', prueba: 'Razón que no está en el catálogo',
          datos: "Pedido 1, 'FALLIDO', 'Razon inventada'",
          esperado: 'Error: razon de fallo no permitida', obtenido: '' },
        { objeto: 'contar_pedidos_fallidos', prueba: 'Reporte de fallidos por ruta',
          datos: 'SELECT sobre todas las rutas',
          esperado: 'Una fila por ruta con su total', obtenido: '' },
        { objeto: 'trg_notificar_entrega', prueba: 'La notificación se crea sola',
          datos: 'Registrar una entrega y consultar notificacion',
          esperado: 'Una notificación EMAIL nueva para ese pedido', obtenido: '' },
        { objeto: 'Trigger de sentencia', prueba: 'Dispara una vez aunque cambien varias filas',
          datos: '',
          esperado: '', obtenido: '' }
      ],
      preguntas: [
        '170. Muestre una prueba que permita comprobar el funcionamiento de uno de sus objetos.',
        '171. ¿Qué resultado esperaba y cómo interpreta el resultado obtenido?',
        '132. ¿Qué casos límite o excepcionales consideramos?',
        '141. ¿Qué escenarios todavía no hemos probado?'
      ]
    },

    /* ---------- 17. Bitácora de IA ---------- */
    {
      id: 'bitacora',
      tipo: 'evidencias',
      seccion: 'Bitácora de IA',
      titulo: 'Cuatro momentos reales del trabajo con IA',
      /* "registro" se llena con un caso que de verdad ocurrió (la pauta pide evidencias auténticas) */
      items: [
        { titulo: 'Una decisión técnica',
          guia: ['qué había que resolver', 'qué alternativas hubo, incluidas las de la IA', 'cuál se eligió y por qué'],
          registro: '' },
        { titulo: 'Un error o una respuesta que no servía',
          guia: ['qué problema apareció', 'qué sugirió la IA', 'cómo se encontró la causa', 'cómo se comprobó que quedó resuelto'],
          registro: '' },
        { titulo: 'Una prueba significativa',
          guia: ['qué se quería comprobar', 'con qué datos', 'qué se esperaba y qué salió', 'qué se concluyó'],
          registro: '' },
        { titulo: 'Un aprendizaje o un cambio',
          guia: ['qué concepto quedó más claro', 'qué se modificó en el código o en la forma de trabajar', 'qué se haría distinto'],
          registro: '' }
      ],
      preguntas: [
        '172. Seleccione un error que haya encontrado y explique cómo lo resolvió.',
        '173. ¿Qué respuesta de la IA tuvo que revisar, corregir o adaptar?',
        '174. ¿Cómo supo que la solución propuesta por la IA era correcta?',
        '184. ¿Qué responsabilidad asume sobre el código presentado, independientemente de quién o qué herramienta lo haya generado?'
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
        { titulo: 'Límites y mejoras', texto: '' },
        { titulo: 'Lo que aprendimos usando IA', texto: '' }
      ],
      preguntas: [
        '181. ¿Qué parte de su solución considera más sólida y qué parte necesita mejorar?',
        '183. ¿Qué cambiaría si tuviera que implementar nuevamente el proyecto?',
        '179. Si el proyecto tuviera que procesar muchos más registros, ¿qué aspectos evaluaría?'
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
