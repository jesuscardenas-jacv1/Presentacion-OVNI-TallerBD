/* ============================================================
   APP DE LA PRESENTACIÓN (Vue 3 por CDN, sin instalación)
   ------------------------------------------------------------
   Normalmente no hay que tocar este archivo:
     - los textos están en  js/contenido.js
     - el PL/SQL está en    js/codigos.js
   ============================================================ */

(function () {
  'use strict';

  const { createApp, reactive, computed, ref, onMounted, onBeforeUnmount, watch } = Vue;

  const DATOS = window.PRESENTACION;
  const CODIGOS = window.CODIGOS || {};

  /* Estado compartido entre el marco y las láminas */
  const ui = reactive({ ampliado: false, pestana: 0, reproducir: null });

  const codigoDe = (clave) => String(CODIGOS[clave] || '').replace(/^\s*\n/, '').replace(/\s+$/, '');
  const hayCodigo = (clave) => codigoDe(clave).trim().length > 0;

  /* ------------------------------------------------------------
     Resaltado de PL/SQL (propio, para no depender de más CDN)
     ------------------------------------------------------------ */
  const PALABRAS = new Set(('CREATE OR REPLACE PACKAGE BODY PROCEDURE FUNCTION TRIGGER IS AS BEGIN END DECLARE ' +
    'EXCEPTION WHEN THEN ELSE ELSIF IF LOOP FOR IN OUT EXIT RETURN RAISE CURSOR OPEN FETCH CLOSE INTO ' +
    'SELECT FROM WHERE JOIN ON AND NOT NULL UPDATE SET INSERT VALUES DELETE COMMIT ROLLBACK AFTER BEFORE ' +
    'EACH ROW OF TYPE RECORD VARRAY DEFAULT CASE PRAGMA OTHERS WHILE GROUP BY ORDER HAVING LEFT RIGHT INNER ' +
    'OUTER DISTINCT BETWEEN LIKE EXISTS UNION ALL TABLE ALTER DROP INDEX CONSTANT REFERENCING NEW OLD ' +
    'INSTEAD ENABLE DISABLE EXEC EXECUTE IMMEDIATE BULK COLLECT FORALL SAVEPOINT').split(' '));
  const TIPOS = new Set('NUMBER VARCHAR2 VARCHAR CHAR DATE BOOLEAN INTEGER PLS_INTEGER TIMESTAMP CLOB'.split(' '));
  const NATIVAS = new Set(('SYSDATE DBMS_OUTPUT PUT_LINE RAISE_APPLICATION_ERROR UPPER LOWER COUNT SUM AVG MIN MAX NVL ' +
    'TO_CHAR TO_DATE TRUNC ROUND SQLCODE SQLERRM TRUE FALSE NO_DATA_FOUND TOO_MANY_ROWS EXCEPTION_INIT DUAL ' +
    'INSERTING UPDATING DELETING USER').split(' '));

  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function resaltar(codigo) {
    const re = /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\n]|'')*')|(\b\d+(?:\.\d+)?\b)|(:(?:NEW|OLD)\b|[A-Za-z_][A-Za-z0-9_$#]*%(?:TYPE|ROWTYPE|ROWCOUNT|NOTFOUND|FOUND|ISOPEN))|([A-Za-z_][A-Za-z0-9_$#]*)/gi;
    const trozos = [];
    let ultimo = 0, m;
    while ((m = re.exec(codigo)) !== null) {
      if (m.index > ultimo) trozos.push(['', codigo.slice(ultimo, m.index)]);
      let clase = '';
      if (m[1]) clase = 'c';
      else if (m[2]) clase = 's';
      else if (m[3]) clase = 'n';
      else if (m[4]) clase = 'e';
      else {
        const p = m[5].toUpperCase();
        clase = PALABRAS.has(p) ? 'k' : TIPOS.has(p) ? 't' : NATIVAS.has(p) ? 'b' : '';
      }
      trozos.push([clase, m[0]]);
      ultimo = re.lastIndex;
    }
    if (ultimo < codigo.length) trozos.push(['', codigo.slice(ultimo)]);

    /* Se devuelve línea por línea para poder numerarlas */
    const lineas = [''];
    for (const [clase, texto] of trozos) {
      const partes = texto.split('\n');
      partes.forEach((parte, i) => {
        if (i > 0) lineas.push('');
        if (parte) lineas[lineas.length - 1] += clase ? '<span class="' + clase + '">' + esc(parte) + '</span>' : esc(parte);
      });
    }
    return lineas;
  }

  /* ------------------------------------------------------------
     Qué le falta a cada lámina (para el índice y los avisos)
     ------------------------------------------------------------ */
  function faltantes(lamina) {
    switch (lamina.tipo) {
      case 'codigo':
        return lamina.paneles.filter((p) => !hayCodigo(p.clave)).length;
      case 'pruebas':
        return lamina.filas.filter((f) => !f.obtenido).length;
      case 'evidencias':
        return lamina.items.filter((i) => !i.registro).length;
      case 'conclusiones':
        return lamina.bloques.filter((b) => !b.texto).length;
      default:
        return 0;
    }
  }

  function textoFaltante(lamina) {
    const n = faltantes(lamina);
    if (!n) return '';
    const que = {
      codigo: n === 1 ? 'código' : 'códigos',
      pruebas: n === 1 ? 'resultado' : 'resultados',
      evidencias: n === 1 ? 'evidencia' : 'evidencias',
      conclusiones: n === 1 ? 'bloque' : 'bloques'
    }[lamina.tipo];
    return (n === 1 ? 'Falta ' : 'Faltan ') + n + ' ' + que;
  }

  /* ------------------------------------------------------------
     Piezas de dibujo: platillo y camión
     ------------------------------------------------------------ */
  const Platillo = {
    props: { paquete: { type: Boolean, default: false }, rayo: { type: Boolean, default: true } },
    template: `
      <svg class="platillo-grande" viewBox="0 0 520 600" aria-hidden="true">
        <defs>
          <linearGradient id="haz" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#D4F56A" stop-opacity=".78"/>
            <stop offset="1" stop-color="#D4F56A" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="casco" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#DCE6F0"/>
            <stop offset=".55" stop-color="#A9BCD0"/>
            <stop offset="1" stop-color="#5E6F86"/>
          </linearGradient>
          <linearGradient id="cupula" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#BFF3F0" stop-opacity=".95"/>
            <stop offset="1" stop-color="#5B8FB8" stop-opacity=".75"/>
          </linearGradient>
        </defs>
        <polygon v-if="rayo" class="haz" points="196,196 324,196 452,590 68,590" fill="url(#haz)"/>
        <g v-if="paquete" class="paquete">
          <rect x="226" y="372" width="68" height="58" rx="4" fill="#D9A066"/>
          <rect x="254" y="372" width="12" height="58" fill="#B97C43"/>
          <rect x="226" y="372" width="68" height="10" fill="#C48B52"/>
          <rect x="236" y="404" width="14" height="16" rx="2" fill="#F7ECD5"/>
        </g>
        <g class="nave">
          <path d="M164 150 C164 34 356 34 356 150 Z" fill="url(#cupula)"/>
          <ellipse cx="260" cy="106" rx="30" ry="34" fill="#8FE05A"/>
          <ellipse cx="247" cy="102" rx="9" ry="13" fill="#150F36" transform="rotate(18 247 102)"/>
          <ellipse cx="273" cy="102" rx="9" ry="13" fill="#150F36" transform="rotate(-18 273 102)"/>
          <path d="M188 116 C196 76 224 58 246 56" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/>
          <ellipse cx="260" cy="160" rx="236" ry="50" fill="url(#casco)"/>
          <ellipse cx="260" cy="150" rx="150" ry="20" fill="#EEF4FA" fill-opacity=".55"/>
          <ellipse cx="260" cy="192" rx="92" ry="15" fill="#3A2A6B"/>
          <ellipse cx="260" cy="194" rx="66" ry="9" fill="#D4F56A" class="tobera"/>
          <circle v-for="(l, i) in luces" :key="i" class="luz" :style="{ animationDelay: (i * 0.18) + 's' }" :cx="l.x" :cy="l.y" r="8"/>
        </g>
      </svg>`,
    setup() {
      const luces = [-190, -128, -64, 0, 64, 128, 190].map((dx) => ({
        x: 260 + dx,
        y: 168 + 24 * Math.sqrt(Math.max(0, 1 - (dx * dx) / (236 * 236)))
      }));
      return { luces };
    }
  };

  const Paisaje = {
    props: { progreso: Number, viajando: Boolean },
    template: `
      <div class="paisaje" aria-hidden="true">
        <svg class="cerros" viewBox="0 0 1600 170" preserveAspectRatio="none">
          <path d="M0 96 L110 74 L250 92 L380 62 L520 90 L700 76 L860 96 L1010 80 L1096 52 L1182 6 L1268 52 L1362 84 L1484 70 L1600 90 L1600 170 L0 170 Z" fill="#2B1557"/>
          <path d="M1182 6 L1148 30 L1164 27 L1178 39 L1193 27 L1216 30 Z" fill="#F7ECD5" fill-opacity=".9"/>
          <path d="M0 116 Q400 96 800 112 T1600 106 L1600 170 L0 170 Z" fill="#0D0926"/>
          <rect x="0" y="138" width="1600" height="20" fill="#1C1340"/>
          <line x1="0" y1="148" x2="1600" y2="148" stroke="#F7ECD5" stroke-opacity=".55" stroke-width="2" stroke-dasharray="26 22"/>
        </svg>
        <div class="ovni" :class="{ activo: viajando }" :style="{ left: (x - 18) + 'px' }">
          <svg viewBox="0 0 120 150" width="120" height="150">
            <defs>
              <linearGradient id="hazchico" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#D4F56A" stop-opacity=".8"/>
                <stop offset="1" stop-color="#D4F56A" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <polygon class="hazchico" points="46,40 74,40 104,150 16,150" fill="url(#hazchico)"/>
            <path d="M40 28 C40 4 80 4 80 28 Z" fill="#9FDDE6"/>
            <ellipse cx="60" cy="31" rx="56" ry="12" fill="#A9BCD0"/>
            <ellipse cx="60" cy="38" rx="22" ry="4" fill="#3A2A6B"/>
            <circle cx="22" cy="33" r="3" fill="#F47C3C"/><circle cx="41" cy="37" r="3" fill="#F47C3C"/>
            <circle cx="79" cy="37" r="3" fill="#F47C3C"/><circle cx="98" cy="33" r="3" fill="#F47C3C"/>
          </svg>
        </div>
        <div class="camion" :style="{ left: x + 'px' }">
          <svg viewBox="0 0 84 46" width="84" height="46">
            <rect x="2" y="4" width="52" height="30" rx="3" fill="#F7ECD5"/>
            <rect x="2" y="22" width="52" height="5" fill="#F47C3C"/>
            <path d="M54 12 H70 L80 24 V34 H54 Z" fill="#C2356E"/>
            <path d="M58 15 H68 L75 24 H58 Z" fill="#BFF3F0"/>
            <circle cx="18" cy="37" r="7" fill="#0D0926" stroke="#A9BCD0" stroke-width="3"/>
            <circle cx="64" cy="37" r="7" fill="#0D0926" stroke="#A9BCD0" stroke-width="3"/>
          </svg>
        </div>
      </div>`,
    setup(props) {
      const x = computed(() => Math.round(70 + props.progreso * 1370));
      return { x };
    }
  };

  /* ------------------------------------------------------------
     Panel de código con pestañas, numeración y modo ampliado
     ------------------------------------------------------------ */
  const PanelCodigo = {
    props: { paneles: Array, queFalta: String },
    template: `
      <section class="panel-codigo" :class="{ ampliado: ui.ampliado }">
        <div class="pestanas" role="tablist">
          <button v-for="(p, i) in paneles" :key="p.clave" role="tab" class="pestana"
                  :class="{ activa: i === activa, vacia: !hay(p.clave) }"
                  :aria-selected="i === activa" @click="ui.pestana = i">
            {{ p.etiqueta }}
          </button>
          <button class="ampliar" @click="ui.ampliado = !ui.ampliado" :aria-pressed="ui.ampliado">
            {{ ui.ampliado ? 'Reducir (Z)' : 'Ampliar (Z)' }}
          </button>
        </div>
        <ol v-if="hay(panel.clave)" class="lineas" tabindex="0">
          <li v-for="(linea, i) in lineas" :key="i"><code v-html="linea || '&nbsp;'"></code></li>
        </ol>
        <div v-else class="sin-codigo">
          <svg viewBox="0 0 120 80" width="120" height="80" aria-hidden="true">
            <path d="M40 30 C40 8 80 8 80 30 Z" fill="none" stroke="#D4F56A" stroke-width="3" stroke-dasharray="6 6"/>
            <ellipse cx="60" cy="34" rx="54" ry="12" fill="none" stroke="#D4F56A" stroke-width="3" stroke-dasharray="6 6"/>
            <path d="M48 52 L40 76 M60 52 V76 M72 52 L80 76" stroke="#D4F56A" stroke-width="3" stroke-dasharray="4 7" stroke-linecap="round"/>
          </svg>
          <p class="sin-titulo">Falta cargar este código</p>
          <p v-if="queFalta">{{ queFalta }}</p>
          <p class="sin-donde">Pégalo en <code>js/codigos.js</code>, en la clave <code>{{ panel.clave }}</code>, y recarga con F5.</p>
        </div>
      </section>`,
    setup(props) {
      const activa = computed(() => Math.min(ui.pestana, props.paneles.length - 1));
      const panel = computed(() => props.paneles[activa.value]);
      const lineas = computed(() => resaltar(codigoDe(panel.value.clave)));
      return { ui, activa, panel, lineas, hay: hayCodigo };
    }
  };

  /* ------------------------------------------------------------
     Láminas
     ------------------------------------------------------------ */
  const LPortada = {
    props: { lamina: Object },
    components: { Platillo },
    template: `
      <div class="l-portada">
        <div class="portada-texto">
          <h1 class="rotulo">
            <span v-for="(l, i) in lamina.lineas" :key="i" :style="{ animationDelay: (0.15 + i * 0.16) + 's' }">{{ l }}</span>
          </h1>
          <p class="bajada">{{ lamina.bajada }}</p>
          <ul class="tripulacion">
            <li v-for="n in equipo.integrantes" :key="n">{{ n }}</li>
          </ul>
          <p class="ramo">{{ equipo.ramo }}<br>{{ equipo.evaluacion }}</p>
        </div>
        <Platillo class="portada-nave" :paquete="true"/>
      </div>`,
    setup() { return { equipo: DATOS.equipo }; }
  };

  const LCierre = {
    props: { lamina: Object },
    components: { Platillo },
    template: `
      <div class="l-portada l-cierre">
        <div class="portada-texto">
          <h1 class="rotulo">
            <span v-for="(l, i) in lamina.lineas" :key="i" :style="{ animationDelay: (0.1 + i * 0.16) + 's' }">{{ l }}</span>
          </h1>
          <p class="bajada">{{ lamina.bajada }}</p>
          <p class="ramo">{{ equipo.repo }}</p>
        </div>
        <Platillo class="portada-nave" :paquete="false"/>
      </div>`,
    setup() { return { equipo: DATOS.equipo }; }
  };

  const LRuta = {
    props: { lamina: Object },
    emits: ['ir'],
    template: `
      <ol class="l-ruta">
        <li v-for="(p, i) in lamina.paradas" :key="p.nombre">
          <button class="parada" @click="$emit('ir', p.ir)">
            <span class="parada-n">{{ i + 1 }}</span>
            <span class="parada-t">
              <strong>{{ p.nombre }}</strong>
              <span>{{ p.detalle }}</span>
            </span>
          </button>
        </li>
      </ol>`
  };

  const LCaso = {
    props: { lamina: Object },
    template: `
      <div class="l-caso">
        <ul class="problemas">
          <li v-for="p in lamina.problemas" :key="p.titulo">
            <strong>{{ p.titulo }}</strong>
            <span>{{ p.texto }}</span>
          </li>
        </ul>
        <div class="objetivo">
          <h2>Lo que nos propusimos</h2>
          <p>{{ lamina.objetivo }}</p>
        </div>
      </div>`
  };

  const LMapa = {
    props: { lamina: Object },
    template: `
      <div class="l-mapa">
        <div v-for="f in lamina.flujos" :key="f.nombre" class="flujo">
          <h2>{{ f.nombre }}</h2>
          <ol class="pasos">
            <li v-for="p in f.pasos" :key="p.nombre" :class="'paso paso-' + clase(p.tipo)">
              <span class="paso-tipo">{{ p.tipo }}</span>
              <strong>{{ p.nombre }}</strong>
              <span class="paso-que">{{ p.que }}</span>
            </li>
          </ol>
        </div>
        <div class="mapa-pie">
          <p class="mapa-nota">{{ lamina.nota }}</p>
          <ul class="por-integrar">
            <li v-for="o in lamina.porIntegrar" :key="o.clave" :class="{ listo: hay(o.clave) }">
              {{ o.nombre }}<span>{{ hay(o.clave) ? 'cargado' : 'por integrar' }}</span>
            </li>
          </ul>
        </div>
      </div>`,
    setup() {
      const clase = (t) => (t === 'Quién' ? 'quien' : /^Tabla/.test(t) ? 'tabla' : 'objeto');
      return { clase, hay: hayCodigo };
    }
  };

  const LConcepto = {
    props: { lamina: Object },
    template: `
      <div class="l-concepto" :class="{ 'con-tabla': lamina.tabla }">
        <p class="idea">{{ lamina.idea }}</p>
        <table v-if="lamina.tabla" class="comparar">
          <thead><tr><th v-for="e in lamina.tabla.encabezados" :key="e" scope="col">{{ e }}</th></tr></thead>
          <tbody>
            <tr v-for="f in lamina.tabla.filas" :key="f[0]">
              <th scope="row">{{ f[0] }}</th><td>{{ f[1] }}</td><td>{{ f[2] }}</td>
            </tr>
          </tbody>
        </table>
        <div class="columnas" :style="{ gridTemplateColumns: 'repeat(' + lamina.columnas.length + ', 1fr)' }">
          <section v-for="c in lamina.columnas" :key="c.titulo">
            <h2>{{ c.titulo }}</h2>
            <ul><li v-for="p in c.puntos" :key="p">{{ p }}</li></ul>
          </section>
        </div>
      </div>`
  };

  const LCodigo = {
    props: { lamina: Object },
    components: { PanelCodigo },
    template: `
      <div class="l-codigo" :class="{ 'sin-resumen': !lamina.resumen.length }">
        <ul v-if="lamina.resumen.length" class="resumen">
          <li v-for="r in lamina.resumen" :key="r">{{ r }}</li>
        </ul>
        <PanelCodigo :paneles="lamina.paneles" :que-falta="lamina.queFalta"/>
      </div>`
  };

  const LPackage = {
    props: { lamina: Object },
    template: `
      <div class="l-package">
        <p class="idea">{{ lamina.idea }}</p>
        <div class="pkg-zonas">
          <section class="pkg-zona publica">
            <h2>Público: está en la especificación</h2>
            <button v-for="e in publicos" :key="e.nombre" class="pkg-el" :class="{ elegido: e.nombre === elegido.nombre }" @click="elegido = e">
              <strong>{{ e.nombre }}</strong><span>{{ e.clase }}</span>
            </button>
          </section>
          <section class="pkg-zona privada">
            <h2>Privado: solo existe en el cuerpo</h2>
            <button v-for="e in privados" :key="e.nombre" class="pkg-el" :class="{ elegido: e.nombre === elegido.nombre }" @click="elegido = e">
              <strong>{{ e.nombre }}</strong><span>{{ e.clase }}</span>
            </button>
            <p class="pkg-porque">{{ lamina.porque }}</p>
          </section>
        </div>
        <div class="consola" :class="elegido.publico ? 'ok' : 'error'" aria-live="polite">
          <p class="consola-rotulo">Desde fuera del package</p>
          <pre class="consola-llamada">{{ elegido.llamada }}</pre>
          <p class="consola-salida">{{ elegido.publico ? 'Funciona.' : 'No compila.' }} {{ elegido.resultado }}</p>
        </div>
      </div>`,
    setup(props) {
      const publicos = props.lamina.elementos.filter((e) => e.publico);
      const privados = props.lamina.elementos.filter((e) => !e.publico);
      const elegido = ref(publicos[1] || publicos[0]);
      return { publicos, privados, elegido };
    }
  };

  const LDisparos = {
    props: { lamina: Object },
    template: `
      <div class="l-disparos">
        <div class="disp-mando">
          <p class="idea">{{ lamina.idea }}</p>
          <pre class="disp-sql">{{ lamina.sentencia }}</pre>
          <div class="disp-filas" role="group" aria-label="Filas que cumplen el WHERE">
            <span>Filas que cumplen el WHERE</span>
            <button v-for="n in opciones" :key="n" :class="{ elegido: n === cantidad }" :disabled="corriendo" @click="elegir(n)">{{ n }}</button>
          </div>
          <button class="disp-ejecutar" :disabled="corriendo" @click="ejecutar">
            {{ corriendo ? 'Ejecutando…' : 'Ejecutar el UPDATE' }}
          </button>
        </div>

        <div class="disp-tabla">
          <h2>Tabla factura</h2>
          <p v-if="cantidad === 0" class="disp-vacio">Ninguna fila cumple el WHERE.</p>
          <ul>
            <li v-for="(f, i) in filas" :key="f.pedido" :class="{ apuntada: activa === i, hecha: f.hecha }">
              <span class="disp-caja" aria-hidden="true"></span>
              <span class="disp-pedido">Pedido {{ f.pedido }}</span>
              <span class="disp-estado">{{ f.hecha ? 'LOGRADO' : 'sin resultado' }}</span>
              <span class="disp-aviso" :class="{ visible: f.hecha }">notificación creada</span>
            </li>
          </ul>
        </div>

        <div class="disp-conteo" aria-live="polite">
          <div class="contador" :class="{ pulso: pulso === 'sentencia' }">
            <span class="cuenta">{{ sentencia }}</span>
            <span class="cuenta-t">De sentencia<small>una vez por UPDATE</small></span>
          </div>
          <div class="contador fila" :class="{ pulso: pulso === 'fila' }">
            <span class="cuenta">{{ fila }}</span>
            <span class="cuenta-t">De fila<small>una vez por fila cambiada</small></span>
          </div>
          <p class="disp-lectura">{{ lectura }}</p>
          <ul class="disp-notas"><li v-for="n in lamina.notas" :key="n">{{ n }}</li></ul>
        </div>
      </div>`,
    setup() {
      const opciones = [0, 1, 3, 5];
      const cantidad = ref(3);
      const filas = ref([]);
      const activa = ref(-1);
      const sentencia = ref(0);
      const fila = ref(0);
      const pulso = ref('');
      const corriendo = ref(false);
      const lectura = ref('Elige cuántas filas cambia el UPDATE y ejecútalo.');
      let vivo = true;
      let pasada = 0;

      const armar = () => {
        filas.value = Array.from({ length: cantidad.value }, (_, i) => ({ pedido: 101 + i, hecha: false }));
        activa.value = -1; sentencia.value = 0; fila.value = 0; pulso.value = '';
      };
      const elegir = (n) => {
        cantidad.value = n; armar();
        lectura.value = 'Elige cuántas filas cambia el UPDATE y ejecútalo.';
      };
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      const marcar = async (cual) => { pulso.value = ''; await espera(20); pulso.value = cual; };

      const ejecutar = async () => {
        const yo = ++pasada;
        const sigue = () => vivo && yo === pasada;
        armar();
        corriendo.value = true;
        lectura.value = 'Empieza la sentencia.';
        await espera(350); if (!sigue()) return;
        sentencia.value = 1; await marcar('sentencia');
        lectura.value = 'El trigger de sentencia dispara una vez, antes de mirar las filas.';
        await espera(1100); if (!sigue()) return;
        for (let i = 0; i < filas.value.length; i++) {
          activa.value = i;
          lectura.value = 'Fila ' + (i + 1) + ' de ' + filas.value.length + ': el trigger de fila dispara con su :NEW.';
          await espera(520); if (!sigue()) return;
          filas.value[i].hecha = true; fila.value += 1; await marcar('fila');
          await espera(520); if (!sigue()) return;
        }
        activa.value = -1;
        const n = filas.value.length;
        lectura.value = n === 0
          ? 'Cero filas cambiadas: el de fila no disparó, pero el de sentencia sí, una vez.'
          : 'Un UPDATE y ' + n + (n === 1 ? ' fila' : ' filas') + ': el de sentencia disparó 1 vez; el de fila, ' + n + (n === 1 ? ' vez.' : ' veces.');
        corriendo.value = false;
      };

      armar();
      onBeforeUnmount(() => { vivo = false; });
      return { opciones, cantidad, filas, activa, sentencia, fila, pulso, corriendo, lectura, elegir, ejecutar };
    }
  };

  const LPruebas = {
    props: { lamina: Object },
    template: `
      <div class="l-pruebas">
        <table class="pruebas">
          <thead>
            <tr><th scope="col">Qué se prueba</th><th scope="col">Datos</th><th scope="col">Se esperaba</th><th scope="col">Se obtuvo</th></tr>
          </thead>
          <tbody>
            <tr v-for="f in lamina.filas" :key="f.prueba">
              <th scope="row"><strong>{{ f.prueba }}</strong><code>{{ f.objeto }}</code></th>
              <td><span v-if="f.datos">{{ f.datos }}</span><span v-else class="hueco">por definir</span></td>
              <td><span v-if="f.esperado">{{ f.esperado }}</span><span v-else class="hueco">por definir</span></td>
              <td><span v-if="f.obtenido">{{ f.obtenido }}</span><span v-else class="hueco">por ejecutar</span></td>
            </tr>
          </tbody>
        </table>
      </div>`
  };

  const LEvidencias = {
    props: { lamina: Object },
    template: `
      <div class="l-evidencias">
        <section v-for="e in lamina.items" :key="e.titulo" :class="{ vacia: !e.registro }">
          <h2>{{ e.titulo }}</h2>
          <p v-if="e.registro" class="registro">{{ e.registro }}</p>
          <template v-else>
            <p class="hueco">Por registrar con un caso que haya pasado de verdad.</p>
            <p class="guia">Debe contar: {{ e.guia.join('; ') }}.</p>
          </template>
        </section>
      </div>`
  };

  const LConclusiones = {
    props: { lamina: Object },
    template: `
      <div class="l-conclusiones">
        <section v-for="b in lamina.bloques" :key="b.titulo" :class="{ vacia: !b.texto }">
          <h2>{{ b.titulo }}</h2>
          <p v-if="b.texto">{{ b.texto }}</p>
          <p v-else class="hueco">Por escribir cuando el proyecto esté terminado.</p>
        </section>
      </div>`
  };

  /* ------------------------------------------------------------
     Lámina animada: el alien ejecuta un trigger con error,
     la nave entra en alerta y cae en un maizal.
     ------------------------------------------------------------ */
  const LCaida = {
    props: { lamina: Object },
    emits: ['ir'],
    template: `
      <div class="l-caida" :class="['fase-' + fase, 'modo-' + modo]">

        <!-- ============ CABINA ============ -->
        <div class="cabina">
          <svg class="cabina-svg" viewBox="0 0 1600 900" aria-hidden="true">
            <defs>
              <linearGradient id="pared" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2A1C5E"/><stop offset="1" stop-color="#150F36"/>
              </linearGradient>
              <linearGradient id="mesa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#3A2A6B"/><stop offset="1" stop-color="#140E33"/>
              </linearGradient>
              <clipPath id="vidrio"><circle cx="270" cy="230" r="138"/></clipPath>
            </defs>
            <rect width="1600" height="900" fill="url(#pared)"/>
            <path d="M0 58 H1600 M560 58 V620 M1540 58 V610" stroke="#43206B" stroke-width="4"/>
            <circle v-for="x in remaches" :key="'r' + x" :cx="x" cy="40" r="5" fill="#5A4A8B"/>

            <!-- ventana redonda con la Tierra -->
            <g class="ventana">
              <circle cx="270" cy="230" r="150" fill="#07051A"/>
              <g clip-path="url(#vidrio)">
                <circle v-for="(e, i) in estrellasVentana" :key="'v' + i" :cx="e[0]" :cy="e[1]" r="2.5" fill="#F7ECD5"/>
                <g class="tierra">
                  <circle cx="330" cy="330" r="140" fill="#3D7FC1"/>
                  <path d="M240 250 C280 230 300 270 330 262 C360 255 350 300 320 312 C290 322 270 300 250 300 Z" fill="#5FAF5A"/>
                  <path d="M350 350 C390 340 420 370 410 400 C398 430 360 420 352 395 Z" fill="#5FAF5A"/>
                  <path d="M215 330 C240 320 262 350 245 372 C228 390 205 365 215 330 Z" fill="#5FAF5A"/>
                </g>
                <rect class="ventana-roja" x="120" y="80" width="300" height="300" fill="#E8324A"/>
              </g>
              <circle cx="270" cy="230" r="150" fill="none" stroke="#A9BCD0" stroke-width="18"/>
              <circle v-for="(r, i) in remachesVentana" :key="'rv' + i" :cx="r[0]" :cy="r[1]" r="5" fill="#5E6F86"/>
            </g>

            <!-- baliza de alarma -->
            <g class="baliza">
              <rect x="490" y="58" width="60" height="12" fill="#5E6F86"/>
              <g class="haz-baliza">
                <polygon points="520,90 260,0 260,180" fill="#E8324A" opacity=".35"/>
                <polygon points="520,90 780,0 780,180" fill="#E8324A" opacity=".35"/>
              </g>
              <path d="M492 70 A28 28 0 0 0 548 70 Z" class="foco"/>
            </g>

            <!-- marco de la pantalla -->
            <rect x="590" y="104" width="920" height="488" rx="22" fill="#0D0926" stroke="#A9BCD0" stroke-width="10"/>

            <!-- mesa de mandos -->
            <path d="M0 640 L1600 610 L1600 900 L0 900 Z" fill="url(#mesa)"/>
            <path d="M0 640 L1600 610 L1600 630 L0 660 Z" fill="#5A4A8B"/>
            <g class="lucecitas">
              <circle v-for="(l, i) in lucecitas" :key="'l' + i" :cx="l.x" :cy="l.y" r="9" :fill="l.c" :style="{ animationDelay: l.d + 's' }"/>
            </g>
            <g v-for="(p, i) in palancas" :key="'p' + i">
              <rect :x="p - 6" y="720" width="12" height="70" rx="6" fill="#0D0926"/>
              <circle class="perilla" :cx="p" :cy="740 + i * 14" r="15" fill="#A9BCD0"/>
            </g>

            <!-- botón START -->
            <g class="start">
              <ellipse cx="720" cy="738" rx="76" ry="27" fill="#0D0926"/>
              <g class="tapa">
                <rect x="662" y="714" width="116" height="16" fill="#8E2350"/>
                <ellipse cx="720" cy="730" rx="58" ry="21" fill="#8E2350"/>
                <ellipse cx="720" cy="714" rx="58" ry="21" class="tapa-cara"/>
                <ellipse cx="702" cy="707" rx="20" ry="6" fill="#fff" opacity=".35"/>
              </g>
              <rect x="648" y="772" width="144" height="38" rx="6" fill="#0D0926"/>
              <text x="720" y="800" text-anchor="middle" class="start-texto">START</text>
            </g>

            <!-- silla y alien -->
            <rect x="250" y="560" width="230" height="360" rx="44" fill="#2B1557" stroke="#43206B" stroke-width="6"/>
            <g class="alien">
              <path d="M290 900 C290 710 330 625 400 625 C470 625 510 710 510 900 Z" fill="#5A3FA0"/>
              <path d="M400 640 V900" stroke="#43206B" stroke-width="5"/>
              <rect x="384" y="555" width="32" height="75" fill="#7BC94E"/>
              <ellipse cx="400" cy="626" rx="62" ry="15" fill="#A9BCD0"/>
              <g class="cabeza">
                <path d="M365 340 C350 300 335 270 322 248" stroke="#7BC94E" stroke-width="7" fill="none" stroke-linecap="round"/>
                <path d="M432 336 C445 296 462 268 478 246" stroke="#7BC94E" stroke-width="7" fill="none" stroke-linecap="round"/>
                <circle class="antena" cx="320" cy="244" r="13"/>
                <circle class="antena" cx="480" cy="242" r="13"/>
                <ellipse cx="400" cy="452" rx="110" ry="124" fill="#8FE05A"/>
                <ellipse cx="350" cy="420" rx="40" ry="60" fill="#A6EA78" opacity=".55"/>
                <g class="ojos">
                  <ellipse cx="412" cy="452" rx="22" ry="36" fill="#150F36" transform="rotate(-24 412 452)"/>
                  <ellipse cx="478" cy="444" rx="19" ry="32" fill="#150F36" transform="rotate(-24 478 444)"/>
                  <circle cx="420" cy="438" r="6" fill="#fff"/>
                  <circle cx="484" cy="431" r="5" fill="#fff"/>
                </g>
                <path class="boca" d="M440 522 Q458 530 474 518" stroke="#150F36" stroke-width="5" fill="none" stroke-linecap="round"/>
                <path class="sonrisa" d="M428 512 Q456 548 486 508 Z" fill="#150F36"/>
                <ellipse class="boca-susto" cx="458" cy="526" rx="13" ry="17" fill="#150F36"/>
                <path class="gota" d="M318 392 C310 408 306 418 318 422 C330 418 326 408 318 392 Z" fill="#BFF3F0"/>
              </g>
              <text class="nombre-alien" x="400" y="206">Carlitos</text>
              <text class="sustos" x="520" y="330">!!</text>
              <path class="visto" d="M520 300 L548 330 L600 262" stroke="#D4F56A" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              <g class="brazo">
                <rect x="470" y="636" width="70" height="30" rx="14" fill="#5A3FA0"/>
                <rect class="antebrazo" x="470" y="639" width="258" height="24" rx="12" fill="#8FE05A"/>
                <g class="mano">
                  <circle cx="728" cy="651" r="20" fill="#8FE05A"/>
                  <ellipse cx="748" cy="640" rx="9" ry="6" fill="#8FE05A"/>
                  <ellipse cx="751" cy="653" rx="9" ry="6" fill="#8FE05A"/>
                  <ellipse cx="745" cy="665" rx="9" ry="6" fill="#8FE05A"/>
                </g>
              </g>
            </g>
          </svg>

          <!-- pantalla con el código -->
          <div class="pantalla">
            <div class="pantalla-barra">
              <span>Consola de vuelo</span>
              <span class="estado">{{ estado }}</span>
            </div>
            <ol class="pantalla-codigo">
              <li v-for="(l, i) in lineas" :key="i"><code v-html="l || '&nbsp;'"></code><span v-if="i === lineas.length - 1 && (fase === 'cabina' || fase === 'espera')" class="cursor"></span></li>
            </ol>
            <ul class="pantalla-error">
              <li v-for="(e, i) in errorVisible" :key="i" :class="/^ORA-/.test(e) ? 'mal' : 'bien'">{{ e }}</li>
            </ul>
          </div>
          <div class="chispas" aria-hidden="true"><i v-for="n in 7" :key="n" :style="{ '--a': (n * 26 - 100) + 'deg', animationDelay: (n * 0.13) + 's' }"></i></div>
          <div class="alarma" aria-hidden="true"></div>
          <p class="alerta-texto" aria-hidden="true">Alerta</p>
        </div>

        <!-- ============ AFUERA: EL MAIZAL ============ -->
        <div class="afuera">
          <svg class="afuera-svg" viewBox="0 0 1600 900" aria-hidden="true">
            <defs>
              <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#150F36"/><stop offset=".45" stop-color="#43206B"/>
                <stop offset=".62" stop-color="#A92F6C"/><stop offset=".72" stop-color="#F47C3C"/>
              </linearGradient>
              <linearGradient id="campo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#3B3A1C"/><stop offset="1" stop-color="#1E1A0E"/>
              </linearGradient>
            </defs>
            <rect width="1600" height="900" fill="url(#cielo)"/>
            <circle v-for="(e, i) in estrellasCielo" :key="'c' + i" :cx="e[0]" :cy="e[1]" :r="e[2]" fill="#F7ECD5" opacity=".7"/>
            <path d="M0 600 L180 560 L380 590 L560 548 L760 585 L980 556 L1180 590 L1380 552 L1600 584 L1600 660 L0 660 Z" fill="#2B1557"/>
            <rect y="628" width="1600" height="272" fill="url(#campo)"/>
            <path v-for="y in surcos" :key="'s' + y" :d="'M0 ' + y + ' H1600'" stroke="#2A2412" stroke-width="3"/>

            <!-- granero, silo y vaca -->
            <g>
              <rect x="300" y="470" width="62" height="180" fill="#A9BCD0"/>
              <ellipse cx="331" cy="470" rx="31" ry="18" fill="#DCE6F0"/>
              <rect x="90" y="520" width="215" height="130" fill="#A8322D"/>
              <polygon points="78,526 197,446 317,526" fill="#7A1F2A"/>
              <rect x="160" y="574" width="76" height="76" fill="#F7ECD5"/>
              <path d="M164 578 L232 646 M232 578 L164 646" stroke="#A8322D" stroke-width="8"/>
              <path d="M380 662 H560 M380 640 H560" stroke="#7A5A3A" stroke-width="5"/>
              <rect v-for="x in [384, 444, 504, 556]" :key="'f' + x" :x="x" y="628" width="8" height="46" fill="#7A5A3A"/>
            </g>
            <!-- vaca: origen (0,0) = entre las patas, mirando a la izquierda -->
            <g transform="translate(662 686)">
              <g class="vaca">
                <g class="vaca-cuerpo">
                  <g class="polvo-vaca">
                    <circle v-for="n in 8" :key="'pv' + n" :cx="40 + (n % 3) * 12" cy="-8" r="17" :style="{ animationDelay: (n * 0.07) + 's' }"/>
                  </g>
                  <path class="cola" d="M56 -60 C72 -52 74 -34 70 -14" stroke="#F7ECD5" stroke-width="5" fill="none" stroke-linecap="round"/>
                  <ellipse class="cola" cx="70" cy="-10" rx="6" ry="9" fill="#150F36"/>
                  <g class="pata atras" style="transform-origin: 40px -32px"><rect x="35" y="-34" width="11" height="30" rx="4" fill="#E9DDC4"/><rect x="34" y="-7" width="13" height="8" rx="2" fill="#3A2A1A"/></g>
                  <g class="pata adelante" style="transform-origin: -34px -32px"><rect x="-39" y="-34" width="11" height="30" rx="4" fill="#E9DDC4"/><rect x="-40" y="-7" width="13" height="8" rx="2" fill="#3A2A1A"/></g>
                  <path d="M-58 -50 C-60 -78 -40 -84 0 -82 C40 -84 62 -76 60 -50 C60 -30 46 -26 0 -26 C-46 -26 -58 -30 -58 -50 Z" fill="#F7ECD5"/>
                  <path d="M-30 -82 C-18 -70 -26 -56 -12 -52 C2 -48 6 -66 2 -82 Z" fill="#150F36"/>
                  <path d="M22 -80 C34 -82 46 -76 46 -64 C46 -52 30 -50 24 -58 C18 -66 14 -76 22 -80 Z" fill="#150F36"/>
                  <ellipse cx="-6" cy="-36" rx="12" ry="7" fill="#150F36"/>
                  <ellipse cx="26" cy="-25" rx="13" ry="7" fill="#F3B6D0"/>
                  <g class="pata atras" style="transform-origin: 28px -32px"><rect x="23" y="-34" width="12" height="32" rx="4" fill="#F7ECD5"/><rect x="22" y="-6" width="14" height="8" rx="2" fill="#3A2A1A"/></g>
                  <g class="pata adelante" style="transform-origin: -46px -32px"><rect x="-51" y="-34" width="12" height="32" rx="4" fill="#F7ECD5"/><rect x="-52" y="-6" width="14" height="8" rx="2" fill="#3A2A1A"/></g>
                  <g class="cabeza-vaca" v-html="dibujoCabezaVaca"></g>
                  <text class="susto-vaca" x="-74" y="-122" text-anchor="middle">!</text>
                </g>
              </g>
            </g>

            <ellipse class="crater" cx="820" cy="712" rx="210" ry="36" fill="#120C06"/>

            <g v-for="m in matasFondo" :key="m.id" :transform="'translate(' + m.x + ' ' + m.y + ') scale(' + m.s + ')'">
              <g class="mata" :style="{ transform: aplastadas && m.ang ? 'rotate(' + m.ang + 'deg)' : 'none' }" v-html="dibujoMata"></g>
            </g>
          </svg>

          <i v-for="h in humo" :key="h.id" class="bocanada" :style="{ left: (h.x - 30) + 'px', top: (h.y - 30) + 'px' }"></i>

          <div class="fuego" :style="{ left: nave.x + 'px', top: nave.y + 'px', transform: 'rotate(' + nave.rumbo + 'deg)' }"></div>

          <div class="nave-cae" :style="{ left: (nave.x - 120) + 'px', top: (nave.y - 70) + 'px', transform: 'rotate(' + nave.giro + 'deg)' }">
            <svg viewBox="0 0 240 140" width="240" height="140">
              <g class="piloto">
                <ellipse cx="120" cy="34" rx="26" ry="30" fill="#8FE05A"/>
                <path d="M104 30 l10 10 m0 -10 l-10 10 M126 30 l10 10 m0 -10 l-10 10" stroke="#150F36" stroke-width="4" stroke-linecap="round"/>
                <g class="mareo">
                  <path v-for="a in [0, 120, 240]" :key="a" :transform="'rotate(' + a + ' 120 -4) translate(120 -26)'" d="M0 -9 L3 -3 L9 -2 L4 2 L6 9 L0 5 L-6 9 L-4 2 L-9 -2 L-3 -3 Z" fill="#D4F56A"/>
                </g>
              </g>
              <path d="M64 74 C64 18 176 18 176 74 Z" fill="#9FDDE6" opacity=".85"/>
              <ellipse cx="120" cy="80" rx="114" ry="26" fill="#A9BCD0"/>
              <ellipse cx="120" cy="74" rx="76" ry="10" fill="#EEF4FA" opacity=".55"/>
              <ellipse cx="120" cy="96" rx="44" ry="8" fill="#3A2A6B"/>
              <circle v-for="x in [30, 66, 104, 140, 176, 210]" :key="x" :cx="x" :cy="x < 50 || x > 190 ? 86 : 92" r="5" class="luz-nave"/>
            </svg>
          </div>

          <div class="polvo" aria-hidden="true"><i v-for="n in 6" :key="n" :style="{ '--n': n }"></i></div>

          <svg class="afuera-frente" viewBox="0 0 1600 900" aria-hidden="true">
            <g v-for="m in matasFrente" :key="m.id" :transform="'translate(' + m.x + ' ' + m.y + ') scale(' + m.s + ')'">
              <g class="mata" :style="{ transform: aplastadas && m.ang ? 'rotate(' + m.ang + 'deg)' : 'none' }" v-html="dibujoMata"></g>
            </g>
          </svg>

          <i v-for="e in escombros" :key="e.id" class="escombro" :class="e.tipo"
             :style="{ '--dx': e.dx + 'px', '--dy': e.dy + 'px', '--r': e.r + 'deg', animationDelay: e.d + 's' }"></i>

          <div class="destello" aria-hidden="true"></div>
          <div class="rayo-tractor" aria-hidden="true" :style="{ left: (nave.x - 95) + 'px', top: (nave.y + 18) + 'px' }"></div>
        </div>

        <!-- ============ VIAJE: alien y vaca con jugo ============ -->
        <div v-if="modo === 'exito'" class="viaje">
          <svg class="viaje-svg" viewBox="0 0 1600 900" aria-hidden="true">
            <defs>
              <linearGradient id="pared2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2A1C5E"/><stop offset="1" stop-color="#150F36"/>
              </linearGradient>
              <clipPath id="vidrio2"><rect x="1100" y="90" width="460" height="560" rx="44"/></clipPath>
            </defs>
            <rect width="1600" height="900" fill="url(#pared2)"/>
            <circle v-for="x in remaches" :key="'r2' + x" :cx="x" cy="40" r="5" fill="#5A4A8B"/>
            <rect x="0" y="700" width="1600" height="200" fill="#1C1340"/>
            <path d="M0 700 H1600" stroke="#43206B" stroke-width="6"/>

            <!-- ventana al espacio -->
            <rect x="1100" y="90" width="460" height="560" rx="44" fill="#07051A"/>
            <g clip-path="url(#vidrio2)">
              <g class="tierra-lejos"><circle cx="1330" cy="560" r="120" fill="#3D7FC1"/>
                <path d="M1250 500 C1290 480 1310 520 1340 512 C1370 505 1360 550 1330 562 C1300 572 1280 550 1260 550 Z" fill="#5FAF5A"/></g>
              <rect v-for="(e, i) in estelas" :key="'e' + i" class="estela" :x="e.x" :y="e.y" :width="e.l" height="3" rx="1.5"
                    fill="#F7ECD5" :style="{ animationDuration: e.v + 's', animationDelay: -e.d + 's' }"/>
            </g>
            <rect x="1100" y="90" width="460" height="560" rx="44" fill="none" stroke="#A9BCD0" stroke-width="16"/>

            <!-- sillón -->
            <rect x="620" y="470" width="470" height="170" rx="40" fill="#8E2350"/>
            <rect x="600" y="610" width="510" height="80" rx="24" fill="#C2356E"/>
            <rect x="580" y="560" width="60" height="130" rx="26" fill="#A92F6C"/>
            <rect x="1070" y="560" width="60" height="130" rx="26" fill="#A92F6C"/>
            <rect x="640" y="690" width="16" height="22" fill="#43206B"/><rect x="1060" y="690" width="16" height="22" fill="#43206B"/>

            <!-- vaca sentada en el sillón, apoyada hacia atrás, relajada -->
            <g class="vaca-sentada">
              <g transform="translate(948 640) scale(-1.6 1.6)">
                <g class="vaca-relax">
                  <g transform="rotate(28 50 -26)">
                    <path d="M58 -54 C74 -50 78 -40 74 -30" stroke="#F7ECD5" stroke-width="5" fill="none" stroke-linecap="round"/>
                    <ellipse cx="73" cy="-27" rx="5" ry="7" fill="#150F36"/>
                    <path d="M-58 -50 C-60 -78 -40 -84 0 -82 C40 -84 62 -76 60 -50 C60 -30 46 -24 0 -24 C-46 -24 -58 -30 -58 -50 Z" fill="#F7ECD5"/>
                    <path d="M-30 -82 C-18 -70 -26 -56 -12 -52 C2 -48 6 -66 2 -82 Z" fill="#150F36"/>
                    <path d="M22 -80 C34 -82 46 -76 46 -64 C46 -52 30 -50 24 -58 C18 -66 14 -76 22 -80 Z" fill="#150F36"/>
                    <ellipse cx="-6" cy="-36" rx="12" ry="7" fill="#150F36"/>
                    <ellipse cx="30" cy="-28" rx="13" ry="7" fill="#F3B6D0"/>
                  </g>
                  <!-- pata trasera doblada sobre el cojín -->
                  <path d="M54 -30 C42 -36 24 -32 14 -24" stroke="#E9DDC4" stroke-width="15" fill="none" stroke-linecap="round"/>
                  <rect x="2" y="-31" width="13" height="14" rx="3" fill="#3A2A1A"/>
                  <!-- patas delanteras -->
                  <rect x="-50" y="-80" width="13" height="64" rx="5" fill="#E9DDC4"/>
                  <rect x="-52" y="-22" width="16" height="9" rx="3" fill="#3A2A1A"/>
                  <rect x="-36" y="-80" width="13" height="64" rx="5" fill="#F7ECD5"/>
                  <rect x="-38" y="-22" width="16" height="9" rx="3" fill="#3A2A1A"/>
                  <g class="cabeza-relax">
                    <g transform="translate(28 -50)"><g class="cabeza-vaca" v-html="dibujoCabezaVaca"></g></g>
                  </g>
                </g>
              </g>
              <!-- vaso de jugo apoyado en el brazo del sillón; la bombilla llega al hocico -->
              <g v-html="dibujoVaso" transform="translate(1074 562)"></g>
            </g>

            <!-- alien sentado, mirando la ventana -->
            <g class="alien-sentado">
              <path d="M700 620 C690 540 720 500 770 500 C820 500 846 540 836 620 Z" fill="#5A3FA0"/>
              <rect x="790" y="604" width="90" height="26" rx="13" fill="#5A3FA0"/>
              <rect x="862" y="604" width="22" height="86" rx="10" fill="#5A3FA0"/>
              <ellipse cx="882" cy="692" rx="20" ry="9" fill="#8FE05A"/>
              <rect x="756" y="450" width="26" height="56" fill="#7BC94E"/>
              <ellipse cx="770" cy="500" rx="48" ry="12" fill="#A9BCD0"/>
              <g class="cabeza-sentada">
                <path d="M752 352 C744 320 736 300 726 284" stroke="#7BC94E" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M796 350 C806 318 818 298 832 284" stroke="#7BC94E" stroke-width="6" fill="none" stroke-linecap="round"/>
                <circle cx="724" cy="280" r="11" fill="#D4F56A"/><circle cx="834" cy="280" r="11" fill="#D4F56A"/>
                <text class="nombre-alien" x="778" y="246">Carlitos</text>
                <ellipse cx="776" cy="418" rx="74" ry="84" fill="#8FE05A"/>
                <ellipse cx="808" cy="410" rx="15" ry="25" fill="#150F36" transform="rotate(-20 808 410)"/>
                <ellipse cx="840" cy="404" rx="11" ry="21" fill="#150F36" transform="rotate(-20 840 404)"/>
                <circle cx="813" cy="400" r="4" fill="#fff"/><circle cx="843" cy="395" r="3" fill="#fff"/>
                <path d="M818 458 Q834 468 848 454" stroke="#150F36" stroke-width="4" fill="none" stroke-linecap="round"/>
              </g>
              <g class="vaso vaso-alien" style="transform-origin: 870px 590px">
                <path d="M808 528 C830 560 846 584 860 584" stroke="#5A3FA0" stroke-width="18" fill="none" stroke-linecap="round"/>
                <g v-html="dibujoVaso" transform="translate(870 590)"></g>
                <circle cx="862" cy="578" r="12" fill="#8FE05A"/>
              </g>
            </g>

</svg>
        </div>

        <!-- ============ FINAL ============ -->
        <section class="tarjeta-mision" aria-live="polite">
          <h2>{{ lamina.final.titulo }}</h2>
          <p class="tarjeta-error">{{ lamina.final.error }}</p>
          <p v-for="p in lamina.final.parrafos" :key="p">{{ p }}</p>
          <div class="tarjeta-botones">
            <button class="ctl" @click="correr">Repetir la misión</button>
            <button class="ctl" @click="$emit('ir', lamina.final.ir)">{{ lamina.final.irTexto }}</button>
          </div>
        </section>

        <button v-if="fase === 'espera'" class="play" @click="reproducir">
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M7 4 L20 12 L7 20 Z" fill="currentColor"/></svg>
          Ejecutar
        </button>
        <button v-if="fase !== 'final'" class="ctl saltar" @click="saltar">Saltar al final</button>

        <svg width="0" height="0" style="position:absolute"><path ref="trayecto" :d="RUTA"/></svg>
      </div>`,
    setup(props) {
      const RUTA = 'M1500 -140 C1380 60 1180 120 1120 300 S900 470 940 580 S860 690 820 700';
      const RUTA_LLEGADA = 'M1700 -120 C1450 60 1150 120 980 260 S720 410 662 420';
      const RUTA_SALIDA = 'M662 420 C700 300 900 120 1300 -200';
      const VACA = { x: 662, y: 420 };
      const modo = props.lamina.modo || 'falla';
      const IMPACTO = { x: 820, y: 700 };

      const sql = codigoDe(props.lamina.codigo || 'caida_sql');
      const errores = codigoDe(props.lamina.salida || 'caida_error').split('\n').filter((l) => l.trim());

      const fase = ref('cabina');
      const escritos = ref(0);
      const errorVisible = ref([]);
      const humo = ref([]);
      const escombros = ref([]);
      const aplastadas = ref(false);
      const nave = reactive({ x: 1500, y: -140, giro: 0, rumbo: 0 });
      const trayecto = ref(null);

      const lineas = computed(() => resaltar(sql.slice(0, escritos.value)));
      const estado = computed(() => ({
        cabina: 'Escribiendo…', espera: 'Listo para ejecutar', boton: 'Ejecutando…', alerta: 'Error en el trigger', exito: 'Ejecutado sin errores'
      }[fase.value] || ''));

      /* Decorado fijo (mismo dibujo en cada carga) */
      let semilla = 11;
      const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
      const remaches = Array.from({ length: 30 }, (_, i) => 30 + i * 54);
      const remachesVentana = Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return [270 + Math.cos(a) * 150, 230 + Math.sin(a) * 150];
      });
      const estrellasVentana = Array.from({ length: 22 }, () => [130 + azar() * 280, 90 + azar() * 160]);
      const estrellasCielo = Array.from({ length: 50 }, () => [azar() * 1600, azar() * 420, azar() > 0.8 ? 2.5 : 1.5]);
      const lucecitas = [];
      for (let f = 0; f < 3; f++) for (let c = 0; c < 9; c++) {
        lucecitas.push({ x: 1000 + c * 56, y: 690 + f * 46 - c * 1.6, c: ['#D4F56A', '#F47C3C', '#8FDCF2'][(c + f) % 3], d: +(azar() * 2).toFixed(2) });
      }
      const palancas = [860, 910];
      const surcos = [660, 690, 730, 780, 840];

      const dibujoMata =
        '<path d="M0 0 V-170" stroke="#4E8A3A" stroke-width="6"/>' +
        '<path d="M0 -40 Q-42 -62 -64 -30" stroke="#5FA34A" stroke-width="8" fill="none" stroke-linecap="round"/>' +
        '<path d="M0 -78 Q42 -102 66 -70" stroke="#5FA34A" stroke-width="8" fill="none" stroke-linecap="round"/>' +
        '<path d="M0 -122 Q-36 -144 -54 -114" stroke="#5FA34A" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="9" cy="-100" rx="8" ry="22" fill="#F2C94C"/>' +
        '<path d="M2 -82 Q4 -112 12 -124 Q14 -104 16 -82 Z" fill="#7FBF5A"/>' +
        '<path d="M0 -170 l-10 -22 M0 -170 l0 -26 M0 -170 l10 -22" stroke="#E7C76A" stroke-width="4" stroke-linecap="round"/>';

      const dibujoCabezaVaca =
        '<path d="M-76 -96 C-84 -104 -92 -108 -100 -110" stroke="#F2E3B3" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<path d="M-60 -96 C-54 -104 -48 -108 -40 -112" stroke="#F2E3B3" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="-96" cy="-86" rx="14" ry="6" fill="#E9DDC4" transform="rotate(20 -96 -86)"/>' +
        '<ellipse cx="-42" cy="-88" rx="14" ry="6" fill="#E9DDC4" transform="rotate(-20 -42 -88)"/>' +
        '<path d="M-88 -92 C-88 -100 -48 -100 -48 -92 L-50 -62 C-52 -54 -84 -54 -86 -62 Z" fill="#F7ECD5"/>' +
        '<path d="M-62 -98 C-54 -96 -50 -88 -52 -78 C-60 -82 -64 -90 -62 -98 Z" fill="#150F36"/>' +
        '<ellipse cx="-68" cy="-56" rx="22" ry="14" fill="#F3B6D0"/>' +
        '<ellipse cx="-76" cy="-56" rx="3" ry="4" fill="#9C4A6A"/>' +
        '<ellipse cx="-60" cy="-56" rx="3" ry="4" fill="#9C4A6A"/>' +
        '<g class="ojos-vaca">' +
          '<circle cx="-78" cy="-78" r="5" fill="#150F36"/><circle cx="-58" cy="-78" r="5" fill="#150F36"/>' +
          '<circle cx="-77" cy="-80" r="1.6" fill="#fff"/><circle cx="-57" cy="-80" r="1.6" fill="#fff"/>' +
        '</g>' +
        '<g class="ojos-susto-vaca">' +
          '<circle cx="-78" cy="-79" r="8" fill="#fff"/><circle cx="-58" cy="-79" r="8" fill="#fff"/>' +
          '<circle cx="-79" cy="-79" r="3" fill="#150F36"/><circle cx="-59" cy="-79" r="3" fill="#150F36"/>' +
        '</g>' +
        '<g class="ojos-saltones">' +
          '<g class="ojo-salton" style="transform-origin: -80px -80px"><circle cx="-80" cy="-80" r="11.5" fill="#fff" stroke="#150F36" stroke-width="1.5"/><circle cx="-81" cy="-78" r="5" fill="#150F36"/><circle cx="-79" cy="-81" r="1.6" fill="#fff"/></g>' +
          '<g class="ojo-salton" style="transform-origin: -56px -80px"><circle cx="-56" cy="-80" r="11.5" fill="#fff" stroke="#150F36" stroke-width="1.5"/><circle cx="-57" cy="-78" r="5" fill="#150F36"/><circle cx="-55" cy="-81" r="1.6" fill="#fff"/></g>' +
        '</g>' +
        '<g class="ojos-relax">' +
          '<path d="M-87 -80 Q-80 -72 -73 -80" stroke="#150F36" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          '<path d="M-63 -80 Q-56 -72 -49 -80" stroke="#150F36" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          '<path d="M-90 -86 Q-80 -90 -71 -86 M-65 -86 Q-56 -90 -47 -86" stroke="#E9DDC4" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          '<ellipse cx="-84" cy="-68" rx="5" ry="3" fill="#F3B6D0" opacity=".8"/><ellipse cx="-52" cy="-68" rx="5" ry="3" fill="#F3B6D0" opacity=".8"/>' +
        '</g>' +
        '<path d="M-84 -46 Q-68 -38 -52 -46" stroke="#5E6F86" stroke-width="3" fill="none"/>' +
        '<circle cx="-68" cy="-38" r="6" fill="#F2C94C" stroke="#B98E2A" stroke-width="2"/>';

      /* vaso de jugo; origen = base del vaso */
      const dibujoVaso =
        '<path d="M-14 -52 L14 -52 L11 0 L-11 0 Z" fill="#F7ECD5" fill-opacity=".35" stroke="#F7ECD5" stroke-width="2.5"/>' +
        '<path class="jugo" d="M-12.6 -40 L12.6 -40 L11 -2 L-11 -2 Z" fill="#F4A13C"/>' +
        '<path d="M4 -46 L-6 -78 L-20 -86" stroke="#D4F56A" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<circle cx="14" cy="-52" r="9" fill="#F7B84B" stroke="#F4A13C" stroke-width="3"/>';

      const estelas = Array.from({ length: 34 }, () => ({
        x: 1100 + azar() * 460, y: 100 + azar() * 540, l: 30 + azar() * 90, v: +(0.5 + azar() * 1.1).toFixed(2), d: +(azar() * 2).toFixed(2)
      }));

      const matas = (filas) => {
        const out = [];
        filas.forEach((f, fi) => {
          for (let i = 0; i < f.n; i++) {
            const x = Math.round((i + 0.3 + azar() * 0.4) * (1640 / f.n) - 20);
            if (x > 70 && x < 730 && fi < 2) continue; /* que no tapen el granero */
            const dist = x - IMPACTO.x;
            const ang = Math.abs(dist) < f.radio ? Math.sign(dist || 1) * (68 + azar() * 18) : 0;
            out.push({ id: fi + '-' + i, x, y: f.y + Math.round(azar() * 8), s: f.s, ang });
          }
        });
        return out;
      };
      const matasFondo = matas([{ y: 676, s: 0.5, n: 30, radio: 170 }, { y: 728, s: 0.7, n: 24, radio: 190 }]);
      const matasFrente = matas([{ y: 872, s: 1.08, n: 15, radio: 140 }]);

      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      let vivo = true;
      let pasada = 0;
      let idHumo = 0;

      const reiniciar = () => {
        fase.value = 'cabina'; escritos.value = 0; errorVisible.value = [];
        humo.value = []; escombros.value = []; aplastadas.value = false;
        Object.assign(nave, { x: 1500, y: -140, giro: 0, rumbo: 0 });
      };

      const caer = (sigue) => new Promise((listo) => {
        const camino = trayecto.value;
        if (!camino) { listo(); return; }
        const largo = camino.getTotalLength();
        const dur = 3000;
        const t0 = performance.now();
        let ultimoHumo = 0;
        const cuadro = (ahora) => {
          if (!sigue()) { listo(); return; }
          const t = Math.min(1, (ahora - t0) / dur);
          const e = 0.25 * t + 0.75 * t * t;
          const p = camino.getPointAtLength(e * largo);
          const q = camino.getPointAtLength(Math.max(0, e * largo - 6));
          nave.x = p.x; nave.y = p.y;
          nave.giro = t * 1080 + Math.sin(t * 30) * 12;
          nave.rumbo = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
          if (ahora - ultimoHumo > 55) {
            ultimoHumo = ahora;
            humo.value.push({ id: ++idHumo, x: q.x, y: q.y });
            if (humo.value.length > 45) humo.value.shift();
          }
          if (t < 1) requestAnimationFrame(cuadro); else listo();
        };
        requestAnimationFrame(cuadro);
      });

      const volar = (d, dur, suave, sigue) => new Promise((listo) => {
        const camino = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        camino.setAttribute('d', d);
        const largo = camino.getTotalLength();
        const t0 = performance.now();
        const cuadro = (ahora) => {
          if (!sigue()) { listo(); return; }
          const t = Math.min(1, (ahora - t0) / dur);
          const e = suave === 'llegar' ? 1 - Math.pow(1 - t, 3) : t * t * t;
          const p = camino.getPointAtLength(e * largo);
          nave.x = p.x; nave.y = p.y;
          nave.giro = Math.sin(ahora / 260) * 6 * (1 - e * (suave === 'llegar' ? 0.7 : 0));
          if (t < 1) requestAnimationFrame(cuadro); else listo();
        };
        requestAnimationFrame(cuadro);
      });

      const lanzarEscombros = () => {
        escombros.value = Array.from({ length: 16 }, (_, i) => ({
          id: i,
          tipo: i % 3 === 0 ? 'hoja' : 'choclo',
          dx: Math.round((azar() - 0.5) * 900),
          dy: -Math.round(140 + azar() * 260),
          r: Math.round((azar() - 0.5) * 900),
          d: +(azar() * 0.12).toFixed(2)
        }));
      };

      const correr = async () => {
        const yo = ++pasada;
        const sigue = () => vivo && yo === pasada;
        soltarPausa();
        reiniciar();
        await espera(500); if (!sigue()) return;
        while (escritos.value < sql.length) {
          const salto = sql[escritos.value] === '\n' ? 1 : 3;
          escritos.value = Math.min(sql.length, escritos.value + salto);
          await espera(salto === 1 ? 90 : 22); if (!sigue()) return;
        }
        /* Pausa: se espera a que el presentador explique la consulta y le dé play */
        fase.value = 'espera';
        await new Promise((seguir) => {
          continuar = seguir;
          ui.reproducir = reproducir;
        });
        if (!sigue()) return;
        fase.value = 'boton';
        await espera(1300); if (!sigue()) return;
        if (modo === 'exito') { await vueloExitoso(sigue); return; }
        fase.value = 'alerta';
        for (const e of errores) {
          errorVisible.value.push(e);
          await espera(260); if (!sigue()) return;
        }
        await espera(2600); if (!sigue()) return;
        fase.value = 'caida';
        await espera(450); if (!sigue()) return;
        await caer(sigue); if (!sigue()) return;
        Object.assign(nave, { x: IMPACTO.x, y: IMPACTO.y, giro: -22 });
        fase.value = 'impacto';
        aplastadas.value = true;
        lanzarEscombros();
        await espera(2200); if (!sigue()) return;
        fase.value = 'final';
      };

      const vueloExitoso = async (sigue) => {
        fase.value = 'exito';
        for (const e of errores) {
          errorVisible.value.push(e);
          await espera(300); if (!sigue()) return;
        }
        await espera(2200); if (!sigue()) return;
        Object.assign(nave, { x: 1700, y: -120, giro: 0 });
        fase.value = 'descenso';
        await espera(350); if (!sigue()) return;
        await volar(RUTA_LLEGADA, 2600, 'llegar', sigue); if (!sigue()) return;
        fase.value = 'abduccion';
        await espera(3600); if (!sigue()) return;
        fase.value = 'despegue';
        await volar(RUTA_SALIDA, 1500, 'salir', sigue); if (!sigue()) return;
        fase.value = 'viaje';
        await espera(3200); if (!sigue()) return;
        fase.value = 'final';
      };

      let continuar = null;
      function soltarPausa() {
        ui.reproducir = null;
        if (continuar) { const c = continuar; continuar = null; c(); }
      }
      const reproducir = soltarPausa;

      const saltar = () => {
        soltarPausa();
        pasada++;
        escritos.value = sql.length; errorVisible.value = errores.slice();
        humo.value = []; escombros.value = []; aplastadas.value = true;
        if (modo === 'exito') Object.assign(nave, { x: 1700, y: -300, giro: 0 });
        else Object.assign(nave, { x: IMPACTO.x, y: IMPACTO.y, giro: -22 });
        fase.value = 'final';
      };

      onMounted(correr);
      onBeforeUnmount(() => { vivo = false; soltarPausa(); });

      return {
        RUTA, modo, dibujoCabezaVaca, dibujoVaso, estelas, fase, reproducir, lineas, estado, errorVisible, humo, escombros, aplastadas, nave, trayecto,
        remaches, remachesVentana, estrellasVentana, estrellasCielo, lucecitas, palancas, surcos,
        dibujoMata, matasFondo, matasFrente, correr, saltar
      };
    }
  };

  /* ------------------------------------------------------------
     Marco general: navegación, teclado, índice y modo ensayo
     ------------------------------------------------------------ */
  const Raiz = {
    components: {
      Paisaje,
      'l-portada': LPortada, 'l-caida': LCaida, 'l-cierre': LCierre, 'l-ruta': LRuta, 'l-caso': LCaso, 'l-mapa': LMapa,
      'l-concepto': LConcepto, 'l-codigo': LCodigo, 'l-package': LPackage, 'l-disparos': LDisparos,
      'l-pruebas': LPruebas, 'l-evidencias': LEvidencias, 'l-conclusiones': LConclusiones
    },
    template: `
      <div class="marco">
        <div class="escenario" :class="'en-' + actual.tipo" :style="{ transform: 'translate(-50%, -50%) scale(' + escala + ')' }">
          <div class="estrellas" aria-hidden="true">
            <i v-for="(e, i) in estrellas" :key="i" :class="{ titila: e.t }"
               :style="{ left: e.x + 'px', top: e.y + 'px', width: e.r + 'px', height: e.r + 'px', animationDelay: e.d + 's' }"></i>
          </div>

          <header v-if="conCabecera" class="cabecera">
            <p class="seccion">{{ actual.seccion }}</p>
            <h1 class="titulo">{{ actual.titulo }}</h1>
          </header>

          <main class="cuerpo">
            <transition name="lamina" mode="out-in">
              <component :is="'l-' + actual.tipo" :key="actual.id" :lamina="actual" @ir="irA"/>
            </transition>
          </main>

          <Paisaje v-if="actual.tipo !== 'caida'" :progreso="progreso" :viajando="viajando"/>

          <nav class="controles" aria-label="Navegación">
            <button class="ctl" @click="alternar('indice')" :aria-pressed="vista === 'indice'" title="Índice (G)">Índice</button>
            <button class="ctl" @click="alternar('ensayo')" :aria-pressed="vista === 'ensayo'" title="Modo ensayo (P)">Ensayo</button>
            <button class="ctl redondo" @click="anterior" :disabled="indice === 0" aria-label="Lámina anterior">‹</button>
            <span class="cuenta-laminas">{{ indice + 1 }} / {{ total }}</span>
            <button class="ctl redondo" @click="siguiente" :disabled="indice === total - 1" aria-label="Lámina siguiente">›</button>
          </nav>

          <p v-if="aviso" class="aviso-falta">{{ aviso }}</p>

          <aside v-if="vista === 'ensayo'" class="ensayo">
            <h2>Modo ensayo</h2>
            <p class="ensayo-como">Preguntas de la guía que el profe puede hacer en esta lámina. Respóndelas en voz alta antes de mirar el código.</p>
            <ul v-if="actual.preguntas && actual.preguntas.length">
              <li v-for="q in actual.preguntas" :key="q">{{ q }}</li>
            </ul>
            <p v-else class="hueco">Esta lámina no tiene preguntas asociadas.</p>
            <button class="ctl" @click="vista = ''">Cerrar (P)</button>
          </aside>

          <section v-if="vista === 'indice'" class="indice" aria-label="Índice de láminas">
            <div class="indice-cab">
              <h2>Índice</h2>
              <p>{{ totalFaltas ? 'Quedan ' + totalFaltas + ' cosas por cargar antes de presentar.' : 'Todo cargado.' }}</p>
              <button class="ctl" @click="vista = ''">Cerrar (G)</button>
            </div>
            <ol>
              <li v-for="(l, i) in laminas" :key="l.id">
                <button :class="{ aqui: i === indice }" @click="ir(i); vista = ''">
                  <span class="indice-n">{{ i + 1 }}</span>
                  <span class="indice-t">{{ l.titulo }}</span>
                  <span v-if="falta(l)" class="indice-falta">{{ falta(l) }}</span>
                </button>
              </li>
            </ol>
            <p class="teclas">Teclas: flechas o espacio para avanzar, G índice, P ensayo, Z ampliar código, 1 y 2 cambian de pestaña, F pantalla completa.</p>
          </section>
        </div>
      </div>`,
    setup() {
      const laminas = DATOS.laminas;
      const total = laminas.length;
      const indice = ref(0);
      const vista = ref('');
      const viajando = ref(false);
      const escala = ref(1);

      const actual = computed(() => laminas[indice.value]);
      const progreso = computed(() => (total > 1 ? indice.value / (total - 1) : 0));
      const conCabecera = computed(() => !['portada', 'cierre', 'caida'].includes(actual.value.tipo));
      const aviso = computed(() => (actual.value.tipo === 'codigo' ? '' : textoFaltante(actual.value)));
      const totalFaltas = computed(() => laminas.reduce((s, l) => s + faltantes(l), 0));

      /* Estrellas fijas: mismo cielo en cada carga */
      let semilla = 7;
      const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
      const estrellas = Array.from({ length: 90 }, () => ({
        x: Math.round(azar() * 1600), y: Math.round(azar() * 640),
        r: azar() > 0.82 ? 4 : azar() > 0.5 ? 3 : 2, t: azar() > 0.72, d: +(azar() * 5).toFixed(2)
      }));

      let reloj = null;
      const ir = (n) => {
        const destino = Math.max(0, Math.min(total - 1, n));
        if (destino === indice.value) return;
        indice.value = destino;
        ui.ampliado = false; ui.pestana = 0;
        viajando.value = true;
        clearTimeout(reloj);
        reloj = setTimeout(() => { viajando.value = false; }, 1500);
        try { history.replaceState(null, '', '#' + (destino + 1)); } catch (e) { /* sin historial en file:// antiguo */ }
      };
      const irA = (id) => { const n = laminas.findIndex((l) => l.id === id); if (n >= 0) ir(n); };
      const siguiente = () => ir(indice.value + 1);
      const anterior = () => ir(indice.value - 1);
      const alternar = (cual) => { vista.value = vista.value === cual ? '' : cual; };

      const pantallaCompleta = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      };

      const tecla = (ev) => {
        if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
        const enBoton = ev.target && ev.target.tagName === 'BUTTON';
        const k = ev.key;
        if (k === 'Escape') { vista.value = ''; ui.ampliado = false; return; }
        if (k === 'g' || k === 'G') { alternar('indice'); return; }
        if (k === 'p' || k === 'P') { alternar('ensayo'); return; }
        if (k === 'f' || k === 'F') { pantallaCompleta(); return; }
        if (vista.value === 'indice') return;
        if (k === 'z' || k === 'Z') { if (actual.value.tipo === 'codigo') ui.ampliado = !ui.ampliado; return; }
        if (k === '1' || k === '2' || k === '3') { ui.pestana = Number(k) - 1; return; }
        if (ui.reproducir && (k === 'ArrowRight' || k === 'PageDown' || ((k === ' ' || k === 'Enter') && !enBoton))) {
          ev.preventDefault(); ui.reproducir(); return;
        }
        if (k === 'ArrowRight' || k === 'PageDown') { ev.preventDefault(); siguiente(); return; }
        if (k === 'ArrowLeft' || k === 'PageUp') { ev.preventDefault(); anterior(); return; }
        if ((k === ' ' || k === 'Enter') && !enBoton) { ev.preventDefault(); siguiente(); return; }
        if (k === 'Home') { ir(0); return; }
        if (k === 'End') { ir(total - 1); }
      };

      const ajustar = () => {
        escala.value = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
      };

      onMounted(() => {
        const n = parseInt(location.hash.slice(1), 10);
        if (n >= 1 && n <= total) indice.value = n - 1;
        ajustar();
        window.addEventListener('resize', ajustar);
        window.addEventListener('keydown', tecla);
      });
      onBeforeUnmount(() => {
        window.removeEventListener('resize', ajustar);
        window.removeEventListener('keydown', tecla);
      });

      watch(actual, (l) => { document.title = l.titulo + ' | Taller de Base de Datos'; }, { immediate: true });

      return {
        laminas, total, indice, actual, progreso, conCabecera, aviso, totalFaltas, estrellas,
        vista, viajando, escala, ir, irA, siguiente, anterior, alternar, falta: textoFaltante
      };
    }
  };

  createApp(Raiz).mount('#app');
})();
