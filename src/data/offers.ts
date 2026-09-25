export type Offer = {
  serviceSlug: string;
  label: string;
  title: string;
  description: string;
  includes: string[];
  fit: string;
  image: string;
};

// These are enquiry routes, not fixed-price packages. Scope is agreed after discovery.
export const offers: Offer[] = [
  {serviceSlug:'branding',label:'01 / FIND YOUR POINT OF VIEW',title:'Brand project',description:'A clear identity built around what makes your business yours.',includes:['Positioning and creative direction','Visual identity system','Guidelines and agreed launch assets'],fit:'A new brand, a rebrand, or a focused refresh.',image:'/images/ashbi/cocofro-main.webp'},
  {serviceSlug:'web-design',label:'02 / MAKE IT WORK ONLINE',title:'Website project',description:'A digital home that tells your story and helps visitors take the next step.',includes:['Page structure and content priorities','Responsive design and development','Launch checks and handoff'],fit:'A new site or a more useful version of the one you have.',image:'/images/ashbi/clypse-main.webp'},
  {serviceSlug:'packaging-design-services',label:'03 / MAKE IT TANGIBLE',title:'Packaging project',description:'A product presentation that feels connected from the shelf to the screen.',includes:['Pack concept and visual direction','Artwork for agreed formats','Range system and production handoff'],fit:'A launch, a range extension, or a packaging refresh.',image:'/images/ashbi/commerce/della-campaign.webp'},
  {serviceSlug:'design-and-dev-subscription',label:'04 / KEEP MOVING',title:'Ongoing partner',description:'Creative and development support from people who know your brand.',includes:['Agreed creative priorities','Campaign and content assets','Scoped website updates'],fit:'Teams with recurring design and website needs.',image:'/images/ashbi/commerce/bpm-product.webp'},
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
  projectNote: string;
  faqs: {q:string;a:string}[];
};

export const campaigns: Campaign[] = [
  {slug:'brand-launch',serviceSlug:'branding',eyebrow:'FOR FOUNDERS & GROWING BRANDS',title:'A brand people can',highlight:'recognise.',intro:'Launching something new or ready to move beyond a patchwork identity? We bring strategy and design together so every first impression feels like yours.',question:'What needs to come together?',answer:'A useful brand system starts with your audience and point of view, then gives your team visual tools to show up consistently.',steps:[{title:'Find the direction',copy:'Discuss your goals, audience, current material, and what the identity must do.'},{title:'Build the system',copy:'Develop a connected visual direction and refine it through agreed review stages.'},{title:'Put it to use',copy:'Prepare the agreed files, guidance, and first applications for your team.'}],projectSlug:'cocofro',projectNote:'CocoFro brings a bold identity together with a family of colourful product packs.',faqs:[{q:'Do we need to start from scratch?',a:'No. We review what is already working before recommending a new identity or a focused refresh.'},{q:'Can packaging or a website follow?',a:'Yes. We can scope those applications alongside the identity or as a next phase.'}]},
  {slug:'website-redesign',serviceSlug:'web-design',eyebrow:'FOR BUSINESSES READY FOR A BETTER SITE',title:'A website built to',highlight:'move you forward.',intro:'Your website should make the offer clear, show your work well, and give visitors an easy next step. We design and build around those real tasks.',question:'Where should the work begin?',answer:'We look at the pages you have, the audience you want to reach, and the actions visitors need to take before deciding what to retain or change.',steps:[{title:'Map the journey',copy:'Agree the site’s structure, content priorities, and key calls to action.'},{title:'Design and build',copy:'Create responsive pages and implement the agreed experience.'},{title:'Check and hand over',copy:'Review the important journeys and give your team practical guidance for updates.'}],projectSlug:'clypse-beauty',projectNote:'Clypse Beauty shows Ashbi’s approach to an editorial website with strong visual rhythm.',faqs:[{q:'Can you work with our existing brand?',a:'Yes. We can work within an existing system and identify where the digital presentation needs more clarity.'},{q:'Which platform will you use?',a:'We recommend a platform after discussing content, selling requirements, and how your team will maintain the site.'}]},
  {slug:'packaging-design',serviceSlug:'packaging-design-services',eyebrow:'FOR CPG & DTC PRODUCT BRANDS',title:'Packaging with',highlight:'personality and purpose.',intro:'Bring your product into focus with a visual system that works across formats, variants, and the moments people encounter it.',question:'What does a strong range need?',answer:'Clear product information, a recognisable family resemblance, and enough distinction to help people find the right variant.',steps:[{title:'Understand the product',copy:'Review the audience, range, format, supplier information, and existing brand.'},{title:'Develop the pack',copy:'Build the visual direction and artwork around agreed dielines and product content.'},{title:'Prepare the range',copy:'Extend approved design across variants and coordinate a useful production handoff.'}],projectSlug:'blend',projectNote:'Blend carries an expressive coffee identity across pouches, cups, and a wider set of applications.',faqs:[{q:'Can you use our current identity?',a:'Yes. We can build packaging from an established brand or include an identity phase if it needs one.'},{q:'Who confirms product claims and label requirements?',a:'Your team supplies and approves product information and required labelling. Specialist regulatory advice is outside the design scope.'}]},
  {slug:'creative-partner',serviceSlug:'design-and-dev-subscription',eyebrow:'FOR TEAMS WITH WORK THAT KEEPS MOVING',title:'Creative support that',highlight:'knows your brand.',intro:'When campaigns, content, and website changes keep coming, work directly with a studio that can carry your visual direction through the details.',question:'What can we work on together?',answer:'We agree priorities and capacity around your recurring needs, from campaign graphics to website updates and new brand applications.',steps:[{title:'Review the rhythm',copy:'Talk through upcoming work, the people involved, and expected volume.'},{title:'Agree the scope',copy:'Set priorities, review points, deliverables, and a working cadence.'},{title:'Keep building',copy:'Create and refine each agreed piece while maintaining a consistent brand.'}],projectSlug:'waagbag',projectNote:'WaagBag shows one identity carried across packaging, digital, and supporting graphics.',faqs:[{q:'Is this a fixed subscription?',a:'We discuss the work and capacity you need, then propose an arrangement and scope for review.'},{q:'Can a new website be included?',a:'A larger build is scoped separately so its milestones and responsibilities are clear.'}]},
];
