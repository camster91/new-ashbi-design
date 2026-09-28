import {editorialContent} from '../lib/editorial';
import {buyerInsights} from './buyer-insights';
const insightsSeeds = [
  {
    "slug": "10-principles-of-good-web-design",
    "updatedAt": "September 26, 2026",
    "category": "Web design",
    "date": "Dec 2025",
  },
  {
    "slug": "mastering-illustration-styles-in-graphic-design-a-comprehensive-guide",
    "updatedAt": "September 26, 2026",
    "category": "Branding",
    "date": "Dec 2025",
  },
  {
    "slug": "brand-designer-what-is-it-and-how-to-become-one",
    "category": "Branding",
    "date": "Dec 2025",
  },
{
  "slug": "beautiful-responsive-websites-made-easy-with-strikingly",
  "updatedAt": "September 27, 2026",
  "category": "Studio notes",
  "date": "December 2025",
},
{
  "slug": "ashbi-creative-studio-has-been-featured-on-safetydetectives",
  "category": "Studio notes",
  "date": "December 2025",
},
{
  "slug": "closing-graphic-design-sales-calls-tips-strategies",
  "category": "Studio notes",
  "date": "December 2025",
},
{
  "slug": "envato-elements-must-have-graphic-designers",
  "updatedAt": "September 27, 2026",
  "category": "Studio notes",
  "date": "December 2025",
},
{
  "slug": "starting-a-graphic-design-business",
  "category": "Studio notes",
  "date": "December 2025",
}
] as const;
export const insights = [...buyerInsights,...insightsSeeds.map(post=>({...post,...editorialContent(`article:${post.slug}`,'article')}))];
