# Avance de implementacion Deco / referencia Saro Tech

Fecha: 2026-09-07

## Objetivo

Registrar los cambios aplicados para igualar progresivamente el sitio de Deco al sistema visual y comportamiento documentado en `SAROTECH_REFERENCE_CONTEXT.md`, sin copiar contenido ni assets de Saro Tech.

## Regla global de documentacion

- Los archivos editables deben incluir comentarios breves para ubicar su estructura.
- En archivos `.astro`, cada seccion principal debe marcarse antes del bloque con el formato `<!-- Seccion: Nombre -->`.
- Esta regla aplica para el home actual y para las futuras paginas de productos, proyectos, ubicaciones y contacto.

## Fase 1: Home / index

Archivos modificados:

- `src/pages/index.astro`
- `src/styles/global.css`

Cambios aplicados:

- Se elimino `Deco Rewards` de la navegacion principal.
- Se agrego `Contacto` a la navegacion principal.
- La navegacion del header dejo de usar anchors internos y ahora apunta a rutas reales: `/`, `/productos`, `/proyectos`, `/ubicaciones`, `/contacto`.
- El CTA superior de calculo/material ahora apunta a `/contacto`.
- Se agrego la seccion `Los mas populares` antes de `Compra por categoria`.
- Las cards de productos populares ahora son links completos hacia futuras rutas `/productos/[slug]`.
- Las categorias ahora apuntan a futuras URLs con query de categoria: `/productos?categoria=<slug>`.
- Las ubicaciones del home ahora usan ciudad/sucursal como heading principal y estado/direccion como metadata.
- Los enlaces del footer fueron actualizados para apuntar a rutas reales.
- Los productos populares del footer se alimentan desde la misma lista usada en el home.
- Se ajusto la paleta base en `global.css` para acercarla a la referencia: negro sobrio, papel calido, verde principal y verde suave.
- Se agregaron comentarios de seccion en `src/pages/index.astro` para facilitar modificaciones directas.

## Pendiente de esta fase

- Crear las paginas reales enlazadas desde el home: `/productos`, `/productos/[slug]`, `/proyectos`, `/ubicaciones`, `/contacto`.
- Mover productos, categorias, proyectos y ubicaciones a `src/data` cuando se inicie la fase de catalogo.
- Sustituir placeholders CSS de productos por assets propios aprobados por Deco.
- Validar textos, telefono, correo y datos reales de Deco.

## Notas

- Algunos links ya apuntan a rutas futuras que todavia no existen. Esto se hizo a proposito para dejar el flujo de navegacion alineado al alcance final antes de construir las paginas siguientes.
- No se usaron assets ni nombres de inventario real de Saro Tech.
