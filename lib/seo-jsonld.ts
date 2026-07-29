import { absoluteUrl } from '@/lib/site-url'

export function websiteJsonLd(): Record<string, unknown> {
  const home = absoluteUrl('/')
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${home}#website`,
        name: 'RGB Minecraft',
        alternateName: ['Zoobastiks RGB', 'Зубастик RGB', 'zrgb'],
        description:
          'RGB and gradient text generator for Minecraft (MiniMessage, legacy &/§ codes, JSON), TAB animations, Unicode symbols, enchantment and effect IDs, server config panel. EN / RU / UA.',
        url: home,
        inLanguage: ['ru', 'en', 'uk'],
        publisher: {
          '@type': 'Person',
          name: 'Zoobastiks',
          url: 'https://zoobastik.me',
        },
      },
      {
        '@type': 'WebApplication',
        '@id': `${home}#app`,
        name: 'RGB Minecraft Tools',
        url: home,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        inLanguage: ['ru', 'en', 'uk'],
        description:
          'Free online Minecraft tools: RGB/gradient text (MiniMessage), TAB YAML animations, symbols and frames, enchantment/effect IDs, server.properties & Paper configs.',
      },
      {
        '@type': 'ItemList',
        '@id': `${home}#tools`,
        name: 'RGB Minecraft tools',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'RGB / gradient text generator',
            url: absoluteUrl('/'),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'TAB animation generator',
            url: absoluteUrl('/tab'),
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Enchantment IDs',
            url: absoluteUrl('/enchant'),
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'Effect IDs',
            url: absoluteUrl('/effects'),
          },
          {
            '@type': 'ListItem',
            position: 5,
            name: 'Minecraft symbols & frames',
            url: absoluteUrl('/symbols'),
          },
          {
            '@type': 'ListItem',
            position: 6,
            name: 'Server settings panel',
            url: absoluteUrl('/server'),
          },
        ],
      },
    ],
  }
}
