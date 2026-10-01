import test from 'node:test';
import assert from 'node:assert/strict';
import { selectProductMedia, getProductGallery, parseMediaMetadata } from '../src/lib/productMedia.ts';

test('principal, muestra y secundaria se seleccionan por uso, orden e ID estable', () => {
  const images = [
    { id: 'b', kind: 'main', sort_order: 2 },
    { id: 'a', kind: 'main', sort_order: 2 },
    { id: 'swatch', kind: 'swatch', sort_order: -10 },
    { id: 'gallery', kind: 'gallery', sort_order: -4 },
    { id: 'secondary-later', kind: 'secondary', sort_order: 3 },
    { id: 'secondary', kind: 'secondary', sort_order: 1 }
  ];
  const selected = selectProductMedia(images);
  assert.equal(selected.main.id, 'a');
  assert.equal(selected.swatch.id, 'swatch');
  assert.equal(selected.secondary.id, 'secondary');
  assert.deepEqual(selected.gallery.map(image => image.id), ['secondary', 'gallery', 'b', 'secondary-later']);
  assert.equal(images[0].id, 'b', 'no cambia el arreglo recibido');
  images[1].sort_order = 4;
  assert.equal(selectProductMedia(images).main.id, 'b', 'cambiar el orden cambia la principal efectiva');
});

test('sin muestra se usa la principal; sin principal se elige la primera foto antes que una muestra', () => {
  const photo = { id: 'photo', kind: 'gallery', sort_order: 10 };
  assert.equal(selectProductMedia([photo]).swatch, photo);
  assert.equal(selectProductMedia([{ id: 'swatch', kind: 'swatch', sort_order: 0 }, photo]).main, photo);
  assert.equal(selectProductMedia([]).main, undefined);
});

const product = {
  name: 'Roble', image: 'main.webp', galleryImages: [{ url: 'secondary.webp', alt: 'Secundaria' }, { url: 'extra.webp', alt: 'Detalle' }],
  technicalSupportFileId: 'technical',
  supportFiles: [{ id: 'guide', title: 'Guía', url: 'guide.pdf' }, { id: 'technical', title: 'Documento sin palabra ficha', url: 'technical.pdf' }]
};
test('la ficha seleccionada ocupa la segunda miniatura y no desplaza la secundaria ni otras fotos', () => {
  const gallery = getProductGallery(product);
  assert.deepEqual(gallery.items.map(item => item.url), ['secondary.webp', 'technical.pdf', 'extra.webp']);
  assert.equal(gallery.items[1].document, true);
  assert.deepEqual(gallery.otherFiles.map(file => file.id), ['guide']);
});
test('la elección del PDF es explícita, respeta visibilidad y ofrece regreso a la principal sin otras fotos', () => {
  assert.deepEqual(getProductGallery({ ...product, technicalSupportFileId: undefined }).items.map(item => item.url), ['secondary.webp', 'extra.webp']);
  assert.equal(getProductGallery(product, false).items.some(item => item.document), false);
  assert.deepEqual(getProductGallery(product, false).otherFiles, []);
  assert.deepEqual(getProductGallery({ ...product, galleryImages: [] }).items.map(item => item.url), ['main.webp', 'technical.pdf']);
});
test('metadatos de imagen rechazan usos desconocidos y órdenes no enteros o fuera de rango', () => {
  const form = new FormData();
  form.set('kind', 'swatch'); form.set('sort_order', '-2'); form.set('alt_text', ' Roble ');
  assert.deepEqual(parseMediaMetadata(form, ['main', 'swatch']), { kind: 'swatch', sort_order: -2, alt_text: 'Roble' });
  for (const value of ['NaN', '1.5', '2147483648']) {
    form.set('sort_order', value);
    assert.throws(() => parseMediaMetadata(form, ['main', 'swatch']), /orden/);
  }
  form.set('sort_order', '0'); form.set('kind', 'unknown');
  assert.throws(() => parseMediaMetadata(form, ['main', 'swatch']), /Tipo/);
});
