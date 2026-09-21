document.querySelectorAll<HTMLFormElement>('[data-content-form]').forEach(form => {
  form.addEventListener('submit', () => {
    const status = form.querySelector('[data-save-status]');
    if (status) status.textContent = 'Guardando…';
  });
});
// Los PDF grandes no atraviesan la función de Vercel: únicamente la autorización y confirmación.
document.querySelectorAll<HTMLFormElement>('[data-support-upload]').forEach(form => {
  const status = form.querySelector<HTMLElement>('[data-support-status]')!;
  const progress = form.querySelector<HTMLProgressElement>('[data-support-progress]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    button.disabled = true;
    try {
      const values = new FormData(form);
      const file = values.get('support_file');
      if (!(file instanceof File) || !file.size || file.size > 15 * 1024 * 1024 || await file.slice(0, 5).text() !== '%PDF-') throw new Error('Selecciona un PDF válido de hasta 15 MB.');
      values.delete('support_file');
      values.set('intent', 'prepare'); values.set('size_bytes', String(file.size)); values.set('original_filename', file.name);
      const api = async (data: FormData) => {
        const response = await fetch('/admin/support-upload', { method: 'POST', body: data });
        if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Sesión expirada. Recarga la página.');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? 'No se pudo completar la operación.');
        return result;
      };
      status.textContent = 'Autorizando subida…';
      const prepared = await api(values);
      status.textContent = 'Subiendo PDF a Storage…'; progress.hidden = false;
      await new Promise<void>((resolve, reject) => {
        const upload = new XMLHttpRequest(); upload.open('PUT', prepared.signedUrl); upload.timeout = 180000;
        upload.setRequestHeader('Content-Type', 'application/pdf');
        upload.upload.onprogress = event => { if (event.lengthComputable) progress.value = event.loaded / event.total * 100; };
        upload.onerror = upload.ontimeout = () => reject(new Error('No se pudo subir. Recarga para ver y retirar el intento incompleto.'));
        upload.onload = () => upload.status >= 200 && upload.status < 300 ? resolve() : reject(new Error('Storage rechazó el archivo. Recarga para revisar el intento.'));
        upload.send(file);
      });
      status.textContent = 'Validando PDF…'; values.set('intent', 'finish'); values.set('support_id', prepared.id);
      await api(values);
      window.location.assign(`${window.location.pathname}?saved=1`);
    } catch (error) { status.textContent = error instanceof Error ? error.message : 'Error al subir el PDF.'; button.disabled = false; }
  });
});
document.querySelectorAll<HTMLFormElement>('[data-upload-form]').forEach(form => {
  const file = form.querySelector<HTMLInputElement>('input[type=file]')!;
  const preview = form.querySelector<HTMLImageElement>('[data-upload-preview]')!;
  const status = form.querySelector<HTMLElement>('[data-upload-status]')!;
  const progress = form.querySelector<HTMLProgressElement>('[data-upload-progress]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  let previewUrl = '';
  file.addEventListener('change', () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const image = file.files?.[0];
    preview.hidden = true;
    file.setCustomValidity(image && image.size > 4 * 1024 * 1024 ? 'Máximo 4 MB por imagen.' : '');
    if (image && file.validity.valid) { previewUrl = URL.createObjectURL(image); preview.src = previewUrl; preview.hidden = false; }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    button.disabled = true; progress.hidden = false; status.textContent = 'Subiendo…';
    const request = new XMLHttpRequest();
    request.open('POST', window.location.pathname);
    request.timeout = 120000;
    request.upload.onprogress = event => { if (event.lengthComputable) progress.value = Math.round(event.loaded / event.total * 100); };
    request.upload.onload = () => { status.textContent = 'Procesando imagen y guardando…'; };
    const fail = (message: string) => { status.textContent = message; button.disabled = false; };
    request.onerror = () => fail('Error de conexión. Revisa la galería antes de reintentar.');
    request.ontimeout = () => fail('Se agotó el tiempo. Recarga y revisa la galería antes de reintentar.');
    request.onload = () => {
      if (request.status >= 200 && request.status < 300 && new URL(request.responseURL).searchParams.has('saved')) window.location.assign(request.responseURL);
      else {
        const html = new DOMParser().parseFromString(request.responseText, 'text/html');
        fail(html.querySelector('[role=alert]')?.textContent ?? 'No se pudo subir. Comprueba tu sesión y recarga la página.');
      }
    };
    request.send(new FormData(form));
  });
});
