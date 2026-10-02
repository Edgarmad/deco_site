# Cambios solicitados en WhatsApp — 2 de octubre de 2026

Periodo de origen: 18 de septiembre a 2 de octubre. Se conservaron las decisiones posteriores que sustituyeron solicitudes iniciales.

## Implementación

- Interior incluye Vigas WPC y Accesorios; Exterior conserva Viga coextruida y Accesorios.
- El filtro Accesorios reúne accesorios, ángulos, quilla y grapa, accesibles desde ambos catálogos. No duplica productos ni cambia sus relaciones o reglas de calculadora.
- Encabezados Productos de interior/exterior con verde DECO, blanco y letra mayor; tipos presentados como botones rectangulares.
- Flechas de colores con fondo verde oscuro, texto blanco, borde y sombra.
- Tarjeta de Felipe más compacta, limitada al ancho/alto disponible, con cierre y reapertura conservados.
- Rendimiento comercial por presentación en lugar del SKU visible en fichas y tarjetas. SKU sigue conservado en datos y búsqueda.
- Teléfonos de asesores abren WhatsApp individual. Ubicaciones también muestra dirección, horario y enlace de mapa.
- Pie con frase centrada en tipografía serif, enlaces a Proyectos y Privacidad.
- Configuración permite elegir un acabado publicado como portada por tipo del carrusel del inicio. Usa secundaria o principal y conserva selección automática cuando no se especifica. El carrusel incluye todos los tipos disponibles.
- Página /privacidad y edición del texto en Configuración, renderizado como texto escapado. Sin aviso aprobado indica información en preparación.
- Migración 20261002120000: claves opcionales home_product_covers y privacy_notice; puesto de Emilio presentado como «Gerente: Emilio Góngora», conforme al chat. No sobrescribe valores existentes.
- Prueba integrada actualizada para Astro 7 (--ignore-lock) y para verificar pertenencia de portadas, CSRF y acceso público a privacidad.

## Datos comprobados en Supabase

- 160 acabados; Lambrín Irregular tiene seis colores.
- Catálogos de Mérida y Playa corresponden a los dos enlaces proporcionados.
- Seis asesores publicados, incluyendo Emilio y Mariela de Playa.
- Video propio guardado bajo settings/home-hero.
- 130 acabados siguen con precio temporal de $1.00.
- 69 acabados no tienen una imagen main final distinta del placeholder, según registros de media. No equivale a una inspección visual exhaustiva de fotos.
- 16 acabados sin dimensiones; son accesorios y requieren comprobar si aplica un valor o N/A.

## Información pendiente del cliente

No se inventaron precios, dimensiones ni equivalencias de fotos entre acabados. Faltan datos comerciales/fotos para esos registros y el texto aprobado del aviso con datos corporativos. Los horarios actuales están publicados; no se recibió una corrección concreta comprobable en el texto exportado. La referencia de «portadas» del 28/09 estaba omitida; se preparó edición del carrusel de inicio como interpretación de trabajo.

## Verificación

Comprobaciones completadas: `npm test` (20 pruebas), `npx astro check` (cero errores/advertencias, 13 hints), `npm run build` y prueba integrada `node --env-file=.env scripts/test-admin-integration.mjs` (login, permisos, formularios, validación de portadas/CSRF, publicación, calculadora, PDF, imágenes y logout). La migración se aplicó al proyecto Supabase vinculado después de revisar el dry-run.

La revisión visual local incluyó catálogo, ficha, flechas, selección del PDF, cierre de Felipe y enlaces de asesores en móvil (390 × 844) y escritorio (1366 × 768). La vista previa PDF depende del visor del navegador; se conserva un enlace directo para abrir el documento completo. La confirmación del despliegue se informa en el cierre de la tarea.
