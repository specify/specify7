import { SerializedResource } from "../DataModel/helperTypes";
import { TaxonTreeDef, TaxonTreeDefItem } from "../DataModel/types";
import { DeepPartial, RA } from "../../utils/types";
import { treeText } from "../../localization/tree";

const life: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Life",
  title: "Life",
  isEnforced: true,
  isInFullName: false,
  rankId: 0,
}

const kingdom: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Kingdom",
  title: "Kingdom",
  isEnforced: true,
  isInFullName: false,
  rankId: 10,
}

const subkingdom: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Subkingdom",
  title: "Subkingdom",
  isEnforced: false,
  isInFullName: false,
  rankId: 20,
}

const division: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Division",
  title: "Division",
  isEnforced: true,
  isInFullName: false,
  rankId: 30,
}

const subdivision: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Subdivision",
  title: "Subdivision",
  isEnforced: false,
  isInFullName: false,
  rankId: 40,
}

const phylum: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Phylum",
  title: "Phylum",
  isEnforced: true,
  isInFullName: false,
  rankId: 30,
}

const subphylum: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Subphylum",
  title: "Subphylum",
  isEnforced: false,
  isInFullName: false,
  rankId: 40,
}

const superclass: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Superclass",
  title: "Superclass",
  isEnforced: false,
  isInFullName: false,
  rankId: 50,
}

const taxonClass: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Class",
  title: "Class",
  isEnforced: true,
  isInFullName: false,
  rankId: 60,
}

const subclass: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Subclass",
  title: "Subclass",
  isEnforced: false,
  isInFullName: false,
  rankId: 70,
}

const infraclass: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Infraclass",
  title: "Infraclass",
  isEnforced: false,
  isInFullName: false,
  rankId: 80,
}

const superorder: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Superorder",
  title: "Superorder",
  isEnforced: false,
  isInFullName: false,
  rankId: 90,
}

const order: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Order",
  title: "Order",
  isEnforced: true,
  isInFullName: false,
  rankId: 100,
}

const suborder: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Suborder",
  title: "Suborder",
  isEnforced: false,
  isInFullName: false,
  rankId: 110,
}

const infraorder: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Infraorder",
  title: "Infraorder",
  isEnforced: false,
  isInFullName: false,
  rankId: 120,
}

const family: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Family",
  title: "Family",
  isEnforced: true,
  isInFullName: false,
  rankId: 140,
}

const subfamily: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Subfamily",
  title: "Subfamily",
  isEnforced: false,
  isInFullName: false,
  rankId: 150,
}

const tribe: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Tribe",
  title: "Tribe",
  isEnforced: false,
  isInFullName: false,
  rankId: 160,
}

const subtribe: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Subtribe",
  title: "Subtribe",
  isEnforced: false,
  isInFullName: false,
  rankId: 170,
}

const genus: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Genus",
  title: "Genus",
  isEnforced: true,
  isInFullName: true,
  rankId: 180,
}

const subgenus: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Subgenus",
  title: "Subgenus",
  isEnforced: false,
  isInFullName: false,
  rankId: 190,
}

const species: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Species",
  title: "Species",
  isEnforced: true,
  isInFullName: true,
  rankId: 220,
}

const subspecies: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Subspecies",
  title: "Subspecies",
  isEnforced: false,
  isInFullName: true,
  rankId: 230,
}

const variety: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Variety",
  title: "Variety",
  isEnforced: false,
  isInFullName: true,
  rankId: 240,
}

const subvariety: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Subvariety",
  title: "Subvariety",
  isEnforced: false,
  isInFullName: true,
  rankId: 250,
}

const forma: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Forma",
  title: "Forma",
  isEnforced: false,
  isInFullName: true,
  rankId: 260,
}

const subforma: Partial<SerializedResource<TaxonTreeDefItem>> = {
  _tableName: "TaxonTreeDefItem",
  name: "Subforma",
  title: "Subforma",
  isEnforced: false,
  isInFullName: true,
  rankId: 270,
}

export const botanyTreeDef: DeepPartial<SerializedResource<TaxonTreeDef>> = {
  _tableName: "TaxonTreeDef",
  name: treeText.botany(),
  remarks: treeText.defaultRemarks(),
  fullNameDirection: 1,
  treeDefItems: [
    life,
    kingdom,
    subkingdom,
    division,
    subdivision,
    taxonClass,
    subclass,
    superorder,
    order,
    suborder,
    family,
    genus,
    species,
    subspecies,
    variety,
    subvariety,
    forma,
    subforma,
  ],
}


export const entomologyTreeDef: DeepPartial<SerializedResource<TaxonTreeDef>> = {
  _tableName: "TaxonTreeDef",
  name: treeText.entomology(),
  remarks: treeText.defaultRemarks(),
  fullNameDirection: 1,
  treeDefItems: [
    life,
    kingdom,
    phylum,
    subphylum,
    taxonClass,
    subclass,
    infraclass,
    superorder,
    order,
    suborder,
    infraorder,
    family,
    subfamily,
    tribe,
    subtribe,
    genus,
    species,
    subspecies,
  ],
}

export const herpetologyTreeDef: DeepPartial<SerializedResource<TaxonTreeDef>> = {
  _tableName: "TaxonTreeDef",
  name: treeText.herpetology(),
  remarks: treeText.defaultRemarks(),
  fullNameDirection: 1,
  treeDefItems: [
    life,
    kingdom,
    phylum,
    subphylum,
    taxonClass,
    subclass,
    superorder,
    order,
    family,
    genus,
    species,
    subspecies,
  ],
}

export const ichthyologyTreeDef: DeepPartial<SerializedResource<TaxonTreeDef>> = {
  _tableName: "TaxonTreeDef",
  name: treeText.ichthyology(),
  remarks: treeText.defaultRemarks(),
  fullNameDirection: 1,
  treeDefItems: [
    life,
    kingdom,
    phylum,
    subphylum,
    superclass,
    taxonClass,
    subclass,
    infraclass,
    superorder,
    order,
    family,
    genus,
    species,
    subspecies,
  ],
}

export const invertpaleoTreeDef: DeepPartial<SerializedResource<TaxonTreeDef>> = {
  _tableName: "TaxonTreeDef",
  name: treeText.invertpaleo(),
  remarks: treeText.defaultRemarks(),
  fullNameDirection: 1,
  treeDefItems: [
    life,
    kingdom,
    phylum,
    taxonClass,
    subclass,
    superorder,
    order,
    family,
    genus,
    species,
  ],
}

export const invertzooTreeDef: DeepPartial<SerializedResource<TaxonTreeDef>> = {
  _tableName: "TaxonTreeDef",
  name: treeText.invertzoo(),
  remarks: treeText.defaultRemarks(),
  fullNameDirection: 1,
  treeDefItems: [
    life,
    kingdom,
    phylum,
    taxonClass,
    subclass,
    superorder,
    order,
    suborder,
    family,
    subfamily,
    tribe,
    subtribe,
    genus,
    subgenus,
    species,
    subspecies,
  ],
}

export const mammalogyTreeDef: DeepPartial<SerializedResource<TaxonTreeDef>> = {
  _tableName: "TaxonTreeDef",
  name: treeText.mammalogy(),
  remarks: treeText.defaultRemarks(),
  fullNameDirection: 1,
  treeDefItems: [
    life,
    kingdom,
    phylum,
    taxonClass,
    order,
    family,
    genus,
    species,
    subspecies,
  ],
}

export const ornithologyTreeDef: DeepPartial<SerializedResource<TaxonTreeDef>> = {
  _tableName: "TaxonTreeDef",
  name: treeText.ornithology(),
  remarks: treeText.defaultRemarks(),
  fullNameDirection: 1,
  treeDefItems: [
    life,
    kingdom,
    phylum,
    subphylum,
    taxonClass,
    superorder,
    order,
    family,
    subfamily,
    genus,
    species,
    subspecies,
  ],
}

export const paleobotTreeDef: DeepPartial<SerializedResource<TaxonTreeDef>> = {
  _tableName: "TaxonTreeDef",
  name: treeText.paleobot(),
  remarks: treeText.defaultRemarks(),
  fullNameDirection: 1,
  treeDefItems: [
    life,
    kingdom,
    phylum,
    taxonClass,
    subclass,
    superorder,
    order,
    family,
    genus,
    species,
  ],
}

export const vascplantTreeDef: DeepPartial<SerializedResource<TaxonTreeDef>> = {
  _tableName: "TaxonTreeDef",
  name: treeText.vascplant(),
  remarks: treeText.defaultRemarks(),
  fullNameDirection: 1,
  treeDefItems: [
    life,
    kingdom,
    subkingdom,
    division,
    subdivision,
    taxonClass,
    subclass,
    superorder,
    order,
    suborder,
    family,
    genus,
    species,
    subspecies,
    variety,
    subvariety,
    forma,
    subforma,
  ],
}

export const vertpaleoTreeDef: DeepPartial<SerializedResource<TaxonTreeDef>> = {
  _tableName: "TaxonTreeDef",
  name: treeText.vertpaleo(),
  remarks: treeText.defaultRemarks(),
  fullNameDirection: 1,
  treeDefItems: [
    life,
    kingdom,
    phylum,
    taxonClass,
    order,
    family,
    genus,
    species,
  ],
}

export const defaultTreeDefs: RA<DeepPartial<SerializedResource<TaxonTreeDef>>> = [
  botanyTreeDef,
  entomologyTreeDef,
  herpetologyTreeDef,
  ichthyologyTreeDef,
  invertpaleoTreeDef,
  invertzooTreeDef,
  mammalogyTreeDef,
  ornithologyTreeDef,
  paleobotTreeDef,
  vascplantTreeDef,
  vertpaleoTreeDef,
]