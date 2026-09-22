insert into public.site_settings (key, value, is_public)
values ('home_hero_video_url', '/assets/videos/header-hero.mp4', true)
on conflict (key) do nothing;
