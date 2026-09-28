const panel = document.querySelector<HTMLElement>('[data-video-settings]');

if (panel) {
  const input = panel.querySelector<HTMLInputElement>('#home_hero_video_file')!;
  const button = panel.querySelector<HTMLButtonElement>('[data-video-upload]')!;
  const status = panel.querySelector<HTMLElement>('[data-video-status]')!;
  const progress = panel.querySelector<HTMLProgressElement>('[data-video-progress]')!;
  const currentVideo = panel.querySelector<HTMLAnchorElement>('[data-current-video]')!;
  let busy = false;
  let pending: { path: string; size: number } | null = null;

  const api = async (intent: string, fields: Record<string, string>) => {
    const data = new FormData();
    data.set('csrf_token', panel.querySelector<HTMLInputElement>('[name="csrf_token"]')!.value);
    data.set('intent', intent);
    Object.entries(fields).forEach(([key, value]) => data.set(key, value));
    const response = await fetch(window.location.pathname, { method: 'POST', body: data });
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Sesión expirada. Recarga la página.');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? 'No se pudo completar la operación.');
    return result;
  };

  input.addEventListener('change', () => {
    pending = null;
    button.disabled = !input.files?.length;
    button.textContent = 'Subir y actualizar video';
    status.textContent = input.files?.[0] ? `Listo para subir: ${input.files[0].name}` : 'Selecciona un archivo para subirlo.';
    progress.hidden = true;
  });

  button.addEventListener('click', async () => {
    if (busy) return;
    const file = input.files?.[0];
    if (!file) return;
    busy = true;
    button.disabled = true;
    input.disabled = true;
    try {
      if (!file.name.toLowerCase().endsWith('.mp4') || file.size <= 0 || file.size > 50 * 1024 * 1024 || (file.type && file.type !== 'video/mp4')) throw new Error('Selecciona un archivo MP4 de hasta 50 MB.');
      if (!pending) {
        status.textContent = 'Preparando subida…';
        const prepared = await api('prepare-video', { filename: file.name, size_bytes: String(file.size) });
        status.textContent = 'Subiendo video a Supabase…';
        progress.hidden = false;
        progress.value = 0;
        await new Promise<void>((resolve, reject) => {
          const upload = new XMLHttpRequest();
          upload.open('PUT', prepared.signedUrl);
          upload.timeout = 300000;
          upload.setRequestHeader('Content-Type', 'video/mp4');
          upload.upload.onprogress = event => {
            if (event.lengthComputable) {
              progress.value = event.loaded / event.total * 100;
              status.textContent = `Subiendo video a Supabase: ${Math.round(progress.value)} %`;
            }
          };
          upload.onerror = () => reject(new Error('No se pudo conectar con Storage. Intenta de nuevo.'));
          upload.ontimeout = () => reject(new Error('Se agotó el tiempo de subida. Intenta de nuevo.'));
          upload.onload = () => upload.status >= 200 && upload.status < 300 ? resolve() : reject(new Error('Storage rechazó el video. Verifica el límite de tamaño del bucket.'));
          upload.send(file);
        });
        pending = { path: prepared.path, size: file.size };
      }
      status.textContent = 'Confirmando archivo en Supabase y guardando el nuevo video del inicio…';
      const saved = await api('finish-video', { path: pending.path, size_bytes: String(pending.size) });
      currentVideo.href = saved.publicUrl;
      pending = null;
      input.value = '';
      progress.value = 100;
      status.textContent = 'Video subido y guardado correctamente. El hero del homepage ya usa el nuevo video; abre o recarga el inicio para verlo. Puedes seleccionar otro archivo para cambiarlo.';
      button.textContent = 'Subir y actualizar video';
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'No se pudo subir el video.';
      button.textContent = pending ? 'Reintentar confirmación y guardado' : 'Reintentar subida';
    } finally {
      busy = false;
      input.disabled = false;
      button.disabled = !input.files?.length;
    }
  });
}
