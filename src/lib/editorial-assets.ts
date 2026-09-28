import catalog from '../data/editorial-assets.json' with {type:'json'};
type EditorialAsset={src:string;alt:string;label:string};
const assets=catalog as Record<string,Record<string,EditorialAsset>>;
export function assetChoices(documentId:string):Record<string,EditorialAsset>{
 if(!documentId.startsWith('project:'))return {};
 const slug=documentId.slice('project:'.length);
 return Object.hasOwn(assets,slug)?assets[slug]:{};
}
export function projectAsset(documentId:string,key:string):EditorialAsset{
 const choices=assetChoices(documentId);
 if(!Object.hasOwn(choices,key))throw new Error('Choose a verified asset from this project');
 return choices[key];
}
