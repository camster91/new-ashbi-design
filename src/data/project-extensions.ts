/** Additional examples already published by Ashbi on its verified Dribbble profile. */
export type ProjectExtension = { label: string; format: string; url: string; image?: string };

export const projectExtensions: Record<string, ProjectExtension[]> = {
  cocofro: [
    { label: 'Website design', format: 'Digital', url: 'https://dribbble.com/shots/25154219-Coco-Fro-Website-Development', image: '/images/ashbi/applications/cocofro-web.webp' },
    { label: 'Email newsletter', format: 'Campaign', url: 'https://dribbble.com/shots/25154232-Coco-Fro-Email-Newsletter', image: '/images/ashbi/applications/cocofro-newsletter.webp' },
    { label: 'Sticker pack', format: 'Brand application', url: 'https://dribbble.com/shots/25153737-Coco-Fro-Sticker-Pack', image: '/images/ashbi/applications/cocofro-stickers.webp' },
  ],
  hopscotch: [
    { label: 'Web design', format: 'Digital', url: 'https://dribbble.com/shots/25153792-Hopscotch-Web-Design', image: '/images/ashbi/applications/hopscotch-web.webp' },
    { label: 'Sell sheets', format: 'Sales material', url: 'https://dribbble.com/shots/25153762-Hop-Scotch-Sell-Sheets', image: '/images/ashbi/applications/hopscotch-sell-sheets.webp' },
  ],
  'marin-food': [
    { label: 'Packaging', format: 'Product', url: 'https://dribbble.com/shots/25153875-Marin-Packaging', image: '/images/ashbi/applications/marin-packaging.webp' },
    { label: 'Web design', format: 'Digital', url: 'https://dribbble.com/shots/25153662-Marin-Food-Web-Design', image: '/images/ashbi/applications/marin-web-design.webp' },
    { label: 'Banner', format: 'Campaign', url: 'https://dribbble.com/shots/25154244-Marin-Banner', image: '/images/ashbi/applications/marin-banner.webp' },
  ],
  'shongoni-skin': [
    { label: 'Packaging dielines', format: 'Product', url: 'https://dribbble.com/shots/25154237-Shongani-Skin-Dielines', image: '/images/ashbi/applications/shongani-dielines.webp' },
    { label: 'Social story', format: 'Social', url: 'https://dribbble.com/shots/25153752-Shongani-Skin-Social-Media-Story', image: '/images/ashbi/applications/shongani-social.webp' },
  ],
};
