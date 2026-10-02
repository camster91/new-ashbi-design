import {editorialContent} from '../lib/editorial';
export type Offer = {
  serviceSlug: string;
  label: string;
  title: string;
  description: string;
  includes: string[];
  fit: string;
  image: string;
  imageCredit: string;
  featured?: boolean;
};

// These are enquiry routes, not fixed-price packages. Scope is agreed after discovery.
export const offers: Offer[] = [
  {serviceSlug:'branding',label:'01 / FIND YOUR POINT OF VIEW',title:'Brand project',description:'A recognisable identity your team can use across packaging, websites and everyday communications.',includes:['Positioning and creative direction','Visual identity system','Guidelines and agreed launch assets'],fit:'A new brand, a rebrand, or a focused refresh.',image:'/images/ashbi/cocofro-main.webp',imageCredit:'CocoFro / brand identity'},
  {serviceSlug:'web-design',label:'02 / MAKE IT WORK ONLINE',title:'Website project',description:'A website that explains your offer and helps customers find their next step.',includes:['Page structure and content priorities','Responsive design and development','Launch checks and handoff'],fit:'A new site or a more useful version of the one you have.',image:'/images/ashbi/clypse-main.webp',imageCredit:'Clypse Beauty / website design'},
  {serviceSlug:'packaging-design-services',label:'03 / MAKE IT TANGIBLE',title:'Packaging project',description:'Packaging that makes your product clear and your range recognisable.',includes:['Pack concept and visual direction','Artwork for agreed formats','Range system and production handoff'],fit:'A launch, a range extension, or a packaging refresh.',image:'/images/ashbi/gallery/marin-food-05-1800.webp',imageCredit:'Marin Food / packaging'},
  {serviceSlug:'design-and-dev-subscription',label:'04 / KEEP MOVING',title:'Ongoing partner',description:'Campaign graphics, sales materials and website updates from a team that knows your brand.',includes:['Agreed creative priorities','Campaign and content assets','Scoped website updates'],fit:'Teams with recurring design and website needs.',featured:true,image:'/images/ashbi/commerce/della-current-hero.webp',imageCredit:'Della / brand & creative support'},
];

export type Campaign = {
  slug: string;
  serviceSlug: string;
  eyebrow: string;
  title: string;
  highlight: string;
  intro: string;
  question: string;
  answer: string;
  steps: {title:string;copy:string}[];
  projectSlug: string;
  proofLabel: string;
  detailProjectSlug?: string;
  projectNote?: string;
  deliverables?: {title:string;copy:string}[];
  imagePosition?: string;
  faqs: {q:string;a:string}[];
};

const campaignsSeeds:Omit<Campaign,'title'|'highlight'|'intro'|'question'|'answer'|'projectNote'>[] = [
  {"slug": "shopify-design", "serviceSlug": "web-design", "eyebrow": "SHOPIFY DESIGN FOR PRODUCT BRANDS",      "steps": [{"title": "Map the store", "copy": "Review products, content, existing theme and the shopping journeys that matter."}, {"title": "Design the key pages", "copy": "Develop home, collection and product layouts around your brand and real product information."}, {"title": "Build and check", "copy": "Implement the agreed scope, check mobile shopping and hand over guidance for your team."}], "deliverables": [{"title": "Store structure", "copy": "Navigation, collection organisation and content priorities for your catalogue."}, {"title": "Product-focused pages", "copy": "Responsive home, collection and product page design with clear product information and buying actions."}, {"title": "Scoped Shopify build", "copy": "Theme implementation, agreed app connections and launch checks. Migration and custom functionality are scoped explicitly."}], "imagePosition": "center top", "projectSlug": "chef-tanya", "proofLabel": "Shopify website design",  "faqs": [{"q": "Can you improve our existing Shopify store?", "a": "Yes. We review your theme, content and app requirements before recommending focused changes or a broader redesign."}, {"q": "Do you handle migrations and integrations?", "a": "We assess catalogue, URL, order and integration requirements first, then include the agreed work in the proposal."}, {"q": "Will this guarantee more sales?", "a": "No. We can improve the clarity and usability of the shopping experience. Sales also depend on traffic, product, pricing and operations."}]},
  {slug:'brand-launch',serviceSlug:'branding',eyebrow:'FOR FOUNDERS & GROWING BRANDS',steps:[{title:'Find the direction',copy:'Discuss your goals, audience, current material, and what the identity must do.'},{title:'Build the system',copy:'Develop a connected visual direction and refine it through agreed review stages.'},{title:'Put it to use',copy:'Prepare the agreed files, guidance, and first applications for your team.'}],projectSlug:'cocofro',proofLabel:'Brand identity',faqs:[{q:'Do we need to start from scratch?',a:'No. We review what is already working before recommending a new identity or a focused refresh.'},{q:'Can packaging or a website follow?',a:'Yes. We can scope those applications alongside the identity or as a next phase.'}]},
  {slug:'website-redesign',serviceSlug:'web-design',eyebrow:'FOR BUSINESSES READY FOR A BETTER SITE',steps:[{title:'Map the journey',copy:'Agree the site’s structure, content priorities, and key calls to action.'},{title:'Design and build',copy:'Create responsive pages and implement the agreed experience.'},{title:'Check and hand over',copy:'Review the important journeys and give your team practical guidance for updates.'}],projectSlug:'clypse-beauty',proofLabel:'Web design',faqs:[{q:'Can you work with our existing brand?',a:'Yes. We can work within an existing system and identify where the digital presentation needs more clarity.'},{q:'Which platform will you use?',a:'We recommend a platform after discussing content, selling requirements, and how your team will maintain the site.'}]},
  {slug:'packaging-design',serviceSlug:'packaging-design-services',eyebrow:'FOR CPG & DTC PRODUCT BRANDS',steps:[{title:'Understand the product',copy:'Review the audience, range, format, supplier information, and existing brand.'},{title:'Develop the pack',copy:'Build the visual direction and artwork around agreed dielines and product content.'},{title:'Prepare the range',copy:'Extend approved design across variants and coordinate a useful production handoff.'}],projectSlug:'cocofro',proofLabel:'Packaging design',detailProjectSlug:'marin-food',faqs:[{q:'Can you use our current identity?',a:'Yes. We can build packaging from an established brand or include an identity phase if it needs one.'},{q:'Who confirms product claims and label requirements?',a:'Your team supplies and approves product information and required labelling. Specialist regulatory advice is outside the design scope.'}]},
  {slug:'creative-partner',serviceSlug:'design-and-dev-subscription',eyebrow:'FOR TEAMS WITH WORK THAT KEEPS MOVING',steps:[{title:'Review the rhythm',copy:'Talk through upcoming work, the people involved, and expected volume.'},{title:'Agree the scope',copy:'Set priorities, review points, deliverables, and a working cadence.'},{title:'Keep building',copy:'Create and refine each agreed piece while maintaining a consistent brand.'}],projectSlug:'waagbag',proofLabel:'Brand applications',faqs:[{q:'Is this a fixed subscription?',a:'Choose from 20, 40 or 80 hours of monthly creative capacity. The 20-hour option is for existing Ashbi identity clients. We confirm availability, scope and the final arrangement in your proposal.'},{q:'Can a new website be included?',a:'A larger build is scoped separately so its milestones and responsibilities are clear.'}]},
];
export const campaigns:Campaign[]=campaignsSeeds.map(campaign=>({...campaign,...editorialContent(`campaign:${campaign.slug}`,'campaign')}));
