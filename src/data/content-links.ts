/** Explicit editorial relationships: never infer a client deliverable from an image. */
export const articleLinks:Record<string,{service:string;project:string;label:string;campaign?:string}>={
  'prepare-for-a-shopify-redesign':{service:'web-design',project:'chef-tanya',campaign:'shopify-design',label:'Plan your Shopify project'},
  'what-a-creative-partnership-can-handle':{service:'design-and-dev-subscription',project:'production-work',campaign:'creative-partner',label:'Explore ongoing creative support'},
  'packaging-design-project-checklist':{service:'packaging-design-services',project:'cocofro',campaign:'packaging-design',label:'Put the packaging brief to work'},
  'brand-refresh-or-rebrand':{service:'branding',project:'marin-food',campaign:'brand-launch',label:'Find the right scope for your brand'},
  '10-principles-of-good-web-design':{service:'web-design',project:'bpm',label:'See these ideas in a product-led website'},
  'mastering-illustration-styles-in-graphic-design-a-comprehensive-guide':{service:'branding',project:'marin-food',label:'Explore a visual system in practice'},
};
export const buyerArticleSlugs=Object.keys(articleLinks);

/** Editorial case-study paths. Keep rejected archive projects out of current-work recommendations. */
export const relatedProjectSlugs:Record<string,readonly [string,string]>={
  della:['marin-food','cocofro'],
  bpm:['chef-tanya','ancient-bliss'],
  'marin-food':['cocofro','hopscotch'],
  cocofro:['marin-food','hopscotch'],
  'chef-tanya':['ancient-bliss','bpm'],
  'ancient-bliss':['chef-tanya','bpm'],
  'mom-water':['bpm','chef-tanya'],
  'clypse-beauty':['bpm','ancient-bliss'],
  'shongoni-skin':['marin-food','tres'],
  hopscotch:['marin-food','cocofro'],
  waagbag:['shongoni-skin','marin-food'],
  tres:['shongoni-skin','cocofro'],
  gemzy:['hopscotch','marin-food'],
  'better-sour':['bpm','chef-tanya'],
  // Historical URLs remain accessible, while their next steps lead into active work.
  blend:['cocofro','marin-food'],
  'natural-matcha':['marin-food','cocofro'],
  'tyson-media':['bpm','clypse-beauty'],
  durabuild:['bpm','chef-tanya'],
  'the-octavia-fund':['cocofro','marin-food'],
  splashtown:['marin-food','waagbag'],
  'production-work':['della','marin-food'],
};
