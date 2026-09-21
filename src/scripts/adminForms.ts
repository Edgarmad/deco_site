document.querySelectorAll<HTMLFormElement>('[data-content-form]').forEach(form => {
  form.addEventListener('submit', () => {
    const status = form.querySelector('[data-save-status]');
    if (status) status.textContent = 'Guardando…';
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
