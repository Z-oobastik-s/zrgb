import { absoluteUrl } from '@/lib/site-url'

export type SeoPageId =
  | 'home'
  | 'tab'
  | 'enchant'
  | 'effects'
  | 'symbols'
  | 'server'

const PAGES: Record<
  SeoPageId,
  { h1: string; p: string; links?: { href: string; label: string }[] }
> = {
  home: {
    h1: 'Генератор RGB и градиентного текста Minecraft — Zoobastiks',
    p: 'Бесплатный онлайн-генератор цветного текста для Minecraft Java: MiniMessage градиенты, коды & и §, JSON и BBCode. Подходит для чата, ников, lore предметов, MOTD, LuckPerms, PlaceholderAPI, DeluxeMenus и конфигов плагинов. Также на сайте: анимации TAB, символы и рамки, ID зачарований и эффектов, панель server.properties / Paper. EN / RU / UA.',
    links: [
      { href: '/tab', label: 'TAB анимации' },
      { href: '/symbols', label: 'Символы и рамки' },
      { href: '/enchant', label: 'Зачарования' },
      { href: '/effects', label: 'Эффекты' },
      { href: '/server', label: 'Настройки сервера' },
    ],
  },
  tab: {
    h1: 'Генератор анимаций для плагина TAB Minecraft',
    p: 'Создавайте YAML-блоки texts + change-interval для плагина TAB: волна, glow, typewriter, радуга, глитч, бегущая строка и готовые шаблоны. Копируйте кадры для header, footer и scoreboard. MiniMessage цвета <#RRGGBB> и {#RRGGBB}.',
  },
  enchant: {
    h1: 'Список ID зачарований Minecraft Java Edition',
    p: 'Полная таблица registry ID зачарований Minecraft с максимальным уровнем. Клик — копирование ID для команд /enchant и конфигов. Java Edition.',
  },
  effects: {
    h1: 'Список ID эффектов Minecraft (status effects)',
    p: 'ID статус-эффектов Minecraft для команд effect give и плагинов. Полезные и вредные эффекты, быстрое копирование.',
  },
  symbols: {
    h1: 'Символы и рамки Unicode для Minecraft',
    p: 'Тысячи символов для ников, MOTD, TAB и конфигов: стрелки, звёзды, сердца, декоративные рамки. Популярные запоминают ваши копирования. Клик — копировать.',
  },
  server: {
    h1: 'Панель настроек Minecraft-сервера',
    p: 'Редактор server.properties, bukkit.yml, spigot.yml и Paper-конфигов с пояснениями параметров. Удобно для админов Paper / Spigot / Bukkit.',
  },
}

/** Crawlable SSR text for search engines (visually hidden, stays in HTML). */
export function SeoCrawlBlock({ page }: { page: SeoPageId }) {
  const data = PAGES[page]
  return (
    <section className="sr-only" aria-hidden="false">
      <h1>{data.h1}</h1>
      <p>{data.p}</p>
      {data.links ? (
        <nav>
          <ul>
            {data.links.map((l) => (
              <li key={l.href}>
                <a href={absoluteUrl(l.href)}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </section>
  )
}

export function ogImages() {
  return [
    {
      url: absoluteUrl('/og.png'),
      width: 1200,
      height: 630,
      alt: 'RGB Minecraft — gradient text, TAB, symbols',
    },
  ]
}
