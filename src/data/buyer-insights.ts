import {editorialContent} from '../lib/editorial';
// Original buyer guides. Dates apply to these new articles only.
const buyerInsightsSeeds = [
  {
    slug:'prepare-for-a-shopify-redesign',category:'Web design',date:'September 2026',
  },
  {
    slug:'what-a-creative-partnership-can-handle',category:'Creative support',date:'September 2026',
  },
  {
    slug:'packaging-design-project-checklist',category:'Packaging',date:'September 2026',
  },
  {
    slug:'brand-refresh-or-rebrand',category:'Branding',date:'September 2026',
  }
];
export const buyerInsights = buyerInsightsSeeds.map(post=>({...post,...editorialContent(`article:${post.slug}`,'article')}));
