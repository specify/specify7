import { R } from './components/wbplanview';
import { OccurrenceCountRecord } from './lifemapperinforeducer';

export const fetchLocalScientificName = (
  model: any,
  defaultValue?: string,
): Promise<string | undefined> =>
  new Promise(resolve => {
    model.rget('determinations').done((
      {models: determinations}: any,
      ) =>
        determinations.length === 0 ?
          resolve(defaultValue) :
          determinations[0].rget(
            'preferredTaxon.fullname',
          ).done((scientificName: string) =>
            resolve(
              scientificName === null ?
                defaultValue :
                scientificName,
            ),
          ),
    );
  });


export const formatOccurrenceDataRequest = (
  occurrenceGuid: string
):string =>
  `http://notyeti-192.lifemapper.org/api/v1/occ/${
    occurrenceGuid
  }?count_only=0`;

export const formatOccurrenceCountRequest = (
  dataAggregatorName: string,
  occurrenceScientificName: string,
):string =>
  `http://notyeti-192.lifemapper.org/api/v1/name/${
    dataAggregatorName
  }/${
    encodeURIComponent(occurrenceScientificName)
  }?count_only=1`;

export const formatOccurrenceMapRequest = (
  occurrenceScientificName: string,
):string =>
  `http://notyeti-192.lifemapper.org/api/v1/map/lm/?namestr=${
    encodeURIComponent(occurrenceScientificName)
  }`;

export const AGGREGATOR_NAMES: Readonly<string[]> = [
  'gbif',
  'idigbio',
  'morphosource',
] as const;
export const BADGE_NAMES: Readonly<string[]> = [
  ...AGGREGATOR_NAMES,
  'lifemapper',
] as const;

export type AggregatorName = typeof AGGREGATOR_NAMES[number];
export type BadgeName = typeof BADGE_NAMES[number];

export const sourceLabels: Readonly<Record<BadgeName, string>> = {
  'gbif': 'GBIF',
  'idigbio': 'iDigBio',
  'morphosource': 'MorphoSource',
  'lifemapper': 'Lifemapper Map',
} as const;

type AggregatorInfo = {
  listOfIssues: string[],
  occurrenceName: string,
  occurrenceViewLink: string,
};

export type FullAggregatorInfo = AggregatorInfo & {
  count: number,
  occurrenceCount?: OccurrenceCountRecord[],
}

export const extractBadgeInfo: Record<AggregatorName,
  (occurrence: R<any>) => AggregatorInfo> = {
  'gbif': (occurrence) => (
    {
      listOfIssues: occurrence.issues,
      occurrenceName: occurrence['scientificName'],
      occurrenceViewLink:
        `https://www.gbif.org/occurrence/${occurrence.key}`,
    }
  ),
  'idigbio': (occurrence) => (
    {
      listOfIssues: occurrence['indexTerms'].flags,
      occurrenceName: '',
      occurrenceViewLink:
        `https://www.idigbio.org/portal/records/${occurrence['uuid']}`,
    }
  ),
  'morphosource': (occurrence) => (
    {
      listOfIssues: [],
      occurrenceName: '',
      occurrenceViewLink:
        `https://www.morphosource.org/biological_specimens/0000S${
          occurrence['specimen.specimen_id']
        }`,
    }
  ),
};

export const lifemapperLayerVariations = [
  {
    name: (_: string, layerId: string) => `prj_${layerId}`,
    label: 'Projection',
    transparent: true,
  },
  {
    name: (mapId: string) => `occ_${mapId}`,
    label: 'Occurrence Points',
    transparent: true,
  },
];

export const extractEl = (
  elements: [string | undefined, string | undefined],
  preferredElement: 0 | 1,
): string => (
  typeof elements[preferredElement] === 'undefined' ?
    elements[(
      preferredElement + 1
    ) % elements.length] :
    elements[preferredElement]
) || '';
