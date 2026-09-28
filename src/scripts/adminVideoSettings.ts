const form = document.querySelector<HTMLFormElement>('[data-video-settings]');

if (form) {
  const input = form.querySelector<HTMLInputElement>('#home_hero_video_file')!;
  const url = form.querySelector<HTMLInputElement>('#home_hero_video_url')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const status = form.querySelector<HTMLElement>('[data-video-status]')!;
  const progress = form.querySelector<HTMLProgressElement>('[data-video-progress]')!;
  let submitting = false;

  input.addEventListener('change', () => { url.required = !input.files?.length; });

  form.addEventListener('submit', async event => {
    if (submitting) return;
    const file = input.files?.[0];
    if (!file) return;
    event.preventDefault();
    button.disabled = true;
    try {
      if (!file.name.toLowerCase().endsWith('.mp4') || file.size <= 0 || file.size > 50 * 1024 * 1024 || (file.type && file.type !== 'video/mp4')) {
        throw new Error('Selecciona un archivo MP4 de hasta 50 MB.');
      }
      status.textContent = 'Preparando subida…';
      const data = new FormData();
      data.set('csrf_token', form.querySelector<HTMLInputElement>('[name="csrf_token"]')!.value);
      data.set('intent', 'prepare-video');
      data.set('filename', file.name);
      data.set('size_bytes', String(file.size));
      const response = await fetch(window.location.pathname, { method: 'POST', body: data });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Sesión expirada. Recarga la página.');
      const prepared = await response.json();
      if (!response.ok) throw new Error(prepared.error ?? 'No se pudo preparar la subida.');

      status.textContent = 'Subiendo video…';
      progress.hidden = false;
      progress.value = 0;
      await new Promise<void>((resolve, reject) => {
        const upload = new XMLHttpRequest();
        upload.open('PUT', prepared.signedUrl);
        upload.timeout = 300000;
        upload.setRequestHeader('Content-Type', 'video/mp4');
        upload.upload.onprogress = event => { if (event.lengthComputable) progress.value = event.loaded / event.total * 100; };
        upload.onerror = () => reject(new Error('No se pudo conectar con Storage. Intenta de nuevo.'));
        upload.ontimeout = () => reject(new Error('Se agotó el tiempo de subida. Intenta de nuevo.'));
        upload.onload = () => upload.status >= 200 && upload.status < 300 ? resolve() : reject(new Error('Storage rechazó el video. Verifica el límite de tamaño del bucket.'));
        upload.send(file);
      });

      url.value = prepared.publicUrl;
      input.value = '';
      url.required = true;
      status.textContent = 'Video subido. Guardando configuración…';
      submitting = true;
      form.requestSubmit();
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'No se pudo subir el video.';
      button.disabled = false;
      progress.hidden = true;
    }
  });
}
