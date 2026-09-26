/** Explicit editorial relationships: never infer a client deliverable from an image. */
export const articleLinks:Record<string,{service:string;project:string;label:string;campaign?:string}>={
  'prepare-for-a-shopify-redesign':{service:'web-design',project:'chef-tanya',campaign:'shopify-design',label:'Plan your Shopify project'},
  'what-a-creative-partnership-can-handle':{service:'design-and-dev-subscription',project:'waagbag',campaign:'creative-partner',label:'Explore ongoing creative support'},
  'packaging-design-project-checklist':{service:'packaging-design-services',project:'cocofro',campaign:'packaging-design',label:'Put the packaging brief to work'},
  'brand-refresh-or-rebrand':{service:'branding',project:'marin-food',campaign:'brand-launch',label:'Find the right scope for your brand'},
  '10-principles-of-good-web-design':{service:'web-design',project:'bpm',label:'See these ideas in a product-led website'},
  'mastering-illustration-styles-in-graphic-design-a-comprehensive-guide':{service:'branding',project:'marin-food',label:'Explore a visual system in practice'},
};
export const buyerArticleSlugs=Object.keys(articleLinks);
