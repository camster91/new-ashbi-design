/** Additional examples already published by Ashbi on its verified Dribbble profile. */
export type ProjectExtension = { label: string; format: string; url: string };

export const projectExtensions: Record<string, ProjectExtension[]> = {
  cocofro: [
    { label: 'Website design', format: 'Digital', url: 'https://dribbble.com/shots/25154219-Coco-Fro-Website-Development' },
    { label: 'Email newsletter', format: 'Campaign', url: 'https://dribbble.com/shots/25154232-Coco-Fro-Email-Newsletter' },
    { label: 'Sticker pack', format: 'Brand application', url: 'https://dribbble.com/shots/25153737-Coco-Fro-Sticker-Pack' },
  ],
  hopscotch: [
    { label: 'Web design', format: 'Digital', url: 'https://dribbble.com/shots/25153792-Hopscotch-Web-Design' },
    { label: 'Sell sheets', format: 'Sales material', url: 'https://dribbble.com/shots/25153762-Hop-Scotch-Sell-Sheets' },
  ],
  'marin-food': [
    { label: 'Packaging', format: 'Product', url: 'https://dribbble.com/shots/25153875-Marin-Packaging' },
    { label: 'Web design', format: 'Digital', url: 'https://dribbble.com/shots/25153662-Marin-Food-Web-Design' },
    { label: 'Banner', format: 'Campaign', url: 'https://dribbble.com/shots/25154244-Marin-Banner' },
  ],
  'shongoni-skin': [
    { label: 'Packaging dielines', format: 'Product', url: 'https://dribbble.com/shots/25154237-Shongani-Skin-Dielines' },
    { label: 'Social story', format: 'Social', url: 'https://dribbble.com/shots/25153752-Shongani-Skin-Social-Media-Story' },
  ],
};
