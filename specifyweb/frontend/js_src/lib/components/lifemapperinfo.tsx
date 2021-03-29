'use strict';

import React                              from 'react';
import createBackboneView                 from './reactbackboneextend';
import schema                             from '../schema';
import '../../css/lifemapperinfo.css';
import * as Leaflet                       from '../leaflet';
import $                                  from 'jquery';
import { Action, generateReducer, State } from '../statemanagement';
import { ModalDialog }                    from './modaldialog';
import ResourceView                       from '../resourceview';

// TODO: remove this
const IS_DEVELOPMENT = true;
const defaultGuid = 'fa7dd78f-8c91-49f5-b01c-f61b3d30caee';
// const defaultGuid = '8eb23b1e-582e-4943-9dd9-e3a36ceeb498';
const defaultOccurrenceName:Readonly<[string,string]> = [
  'Phlox longifolia Nutt.',
  'Phlox longifolia Nutt.',
] as const;


const fetchLocalScientificName = (
  model:any,
  defaultValue?: string,
):Promise<string|undefined> =>
  new Promise(resolve => {
    model.rget('determinations').done((
      {models: determinations}:any
    ) =>
      determinations.length === 0 ?
        resolve(defaultValue) :
        determinations[0].rget(
          'preferredTaxon.fullname'
        ).done((scientificName:string) =>
          resolve(
            scientificName === null ?
              defaultValue :
              scientificName,
          ),
        ),
    );
  });


const formatOccurrenceDataRequest = (occurrenceGuid:string) =>
  `http://notyeti-192.lifemapper.org/api/v1/occ/${
    occurrenceGuid
  }?count_only=0`;

const formatOccurrenceCountRequest = (
  dataAggregatorName:string,
  occurrenceScientificName:string,
) =>
  `http://notyeti-192.lifemapper.org/api/v1/name/${
    dataAggregatorName
  }/${
    encodeURIComponent(occurrenceScientificName)
  }?count_only=1`;

const formatOccurrenceMapRequest = (
  occurrenceScientificName:string
) =>
  `http://notyeti-192.lifemapper.org/api/v1/map/lm/?namestr=${
    encodeURIComponent(occurrenceScientificName)
  }`;

const AGGREGATOR_NAMES:Readonly<string[]> = [
  'gbif',
  'idigbio',
  'morphosource'
] as const;
const BADGE_NAMES:Readonly<string[]> = [
  ...AGGREGATOR_NAMES,
  'lifemapper'
] as const;

type AggregatorName = typeof AGGREGATOR_NAMES[number];
type BadgeName = typeof BADGE_NAMES[number];

const sourceLabels:Readonly<
  Record<
    BadgeName,string
  >
> = {
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

type FullAggregatorInfo = AggregatorInfo & {
  count: number,
  occurrenceCount?: OccurrenceCountRecord[],
}

const extractBadgeInfo:Record<
  AggregatorName,
  (occurrence:Record<string,any>)=>AggregatorInfo
> = {
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

const lifemapperLayerVariations = [
  {
    name: (_:string, layerId:string) => `prj_${layerId}`,
    label: 'Projection',
    transparent: true,
  },
  {
    name: (mapId:string) => `occ_${mapId}`,
    label: 'Occurrence Points',
    transparent: true,
  },
];

type LoadingState = State<'LoadingState'>;

type MainState = State<'MainState'> & {
  aggregatorInfos: Record<AggregatorName,FullAggregatorInfo|undefined>
  badgeStatuses: Record<BadgeName,{
    isOpen: boolean,
  }>,
  localOccurrenceName?: string,
  remoteOccurrenceName?: string,
  lifemapperInfo?: LifemapperInfo,
};

type States =
  LoadingState
  | MainState;

type LoadedAction = Action<'LoadedAction'> & {
  aggregatorInfos: Record<AggregatorName,FullAggregatorInfo|undefined>
}

type ToggleAggregatorVisibilityAction =
  Action<'ToggleAggregatorVisibilityAction'> & {
    badgeName: BadgeName,
  };

type OccurrenceCountRecord = {
  scientificName: string,
  count: string,
  url: string,
}

type OccurrenceCountLoadedAction =
  Action<'OccurrenceCountLoadedAction'> & {
    aggregatorName: AggregatorName,
    occurrenceCount: OccurrenceCountRecord[]
  };

type SetRemoteOccurrenceNameAction =
  Action<'SetRemoteOccurrenceNameAction'> & {
    remoteOccurrenceName: string,
  }

type SetLocalOccurrenceNameAction =
  Action<'SetLocalOccurrenceNameAction'> & {
    localOccurrenceName: string,
  }

interface LifemapperInfo {
  layers: any[],
  markers: any,
  messages: Record<MessageTypes,string[]>,
}

type MapLoadedAction = Action<'MapLoadedAction'> & LifemapperInfo;

type Actions =
  LoadedAction
  | ToggleAggregatorVisibilityAction
  | OccurrenceCountLoadedAction
  | MapLoadedAction
  | SetRemoteOccurrenceNameAction
  | SetLocalOccurrenceNameAction;

function mainState(state:States):MainState {
  if(state.type !== 'MainState')
    throw new Error('Wrong state');
  return state;
}

const reducer = generateReducer<States,Actions>({
  'LoadedAction': ({action})=>({
    type: 'MainState',
    aggregatorInfos: action.aggregatorInfos,
    badgeStatuses: Object.fromEntries(
      BADGE_NAMES.map(badgeName=>[
        badgeName,
        {
          isOpen: false,
        }
      ])
    ),
    localOccurrenceName: undefined,
    remoteOccurrenceName: undefined,
    lifemapperInfo: undefined
  }),
  'ToggleAggregatorVisibilityAction': ({action,state})=>({
    ...mainState(state),
    badgeStatuses: {
      ...mainState(state).badgeStatuses,
      [action.badgeName]: {
        ...mainState(state).badgeStatuses[action.badgeName],
        isOpen: !mainState(state).badgeStatuses[action.badgeName].isOpen
      }
    }
  }),
  'OccurrenceCountLoadedAction': ({action,state})=>({
    ...mainState(state),
    aggregatorInfos: {
      ...mainState(state).aggregatorInfos,
      [action.aggregatorName]: {
        ...(
          mainState(
            state
          ).aggregatorInfos[action.aggregatorName] as FullAggregatorInfo
        ),
        occurrenceCount: action.occurrenceCount
      }
    }
  }),
  'MapLoadedAction': ({action: {type, ...lifemapperInfo}, state})=>({
    ...mainState(state),
    lifemapperInfo
  }),
  'SetRemoteOccurrenceNameAction': (
    {action: {remoteOccurrenceName}, state}
  )=>({
    ...mainState(state),
    remoteOccurrenceName
  }),
  'SetLocalOccurrenceNameAction': (
    {action: {localOccurrenceName}, state}
  )=>({
    ...mainState(state),
    localOccurrenceName
  }),
});

function Badge<IS_ENABLED extends boolean>({
  name,
  onClick: handleClick,
  isEnabled,
  hasError,
}:{
  name: AggregatorName,
  onClick: IS_ENABLED extends true ?
    ()=>void :
    undefined,
  isEnabled: IS_ENABLED
  hasError: boolean,
}){
  return <button
    disabled={!isEnabled}
    onClick={handleClick}
    className={`lifemapper-source-icon ${
      isEnabled ?
        '' :
        'lifemapper-source-icon-not-found'
    } ${
      hasError ?
        'lifemapper-source-icon-issues-detected' :
        ''
    }`}
  >
    <img src={`/static/img/${name}.png`} alt={sourceLabels[name]} />
  </button>;
}

function Aggregator({
  name,
  data,
}:{
  name: AggregatorName,
  data: FullAggregatorInfo,
}) {
  return <>
    {
      data.listOfIssues.length === 0 ?
        <p>
          Record was indexed successfully and no data quality issues
          were reported
        </p> :
        <>
          <h2>The following data quality issues were reported: </h2>
          <ul className="lifemapper-source-issues-list">
            {[
              ...data.listOfIssues,
              ...(
                data.count>1 ?
                  ['HAS_MULTIPLE_RECORDS'] :
                  []
              )
            ].map(issue =>
              <li key={issue}>{
                // @ts-ignore
                issueDefinitions[name]?.[issue] ||
                issueDefinitions['common']?.[issue] ||
                issue
              }</li>
            )}
          </ul>
        </>
    }
    <br/>
    {
      (
        typeof data.occurrenceCount !== "undefined" &&
        data.occurrenceCount.length !== 0
      ) &&
      <>
        Number of occurrences of similar taxa records:
        <ul className="lifemapper-source-issues-list">
          {data.occurrenceCount.map(({scientificName, count, url}, index) =>
            <li key={index}>
                <a
                  target="_blank"
                  href={url}
                  rel="noreferrer nofollow"
                >{scientificName} </a>
                (reported {count} times)
            </li>
          )}
        </ul>
      </>
    }
  </>;
}

function LifemapperMap({
  badgeName,
  lifemapperInfo,
}:{
  badgeName: BadgeName
  lifemapperInfo: LifemapperInfo,
}){

  const mapRef = React.useRef<HTMLDivElement|null>(null);

  if(badgeName !== 'lifemapper')
    return null;

  React.useEffect(()=>{

    if(!mapRef.current)
      return;

    const [
      map,
      layerGroup,
    ] = Leaflet.showCOMap(
      mapRef.current,
      lifemapperInfo.layers,
      (Object.entries(
        lifemapperInfo.messages
      ) as ([MessageTypes, string[]][])).filter(([messages])=>
        messages.length !== 0
      ).map(([name, messages])=> `<span
        class="lifemapper-message-section ${
          lifemapperMessagesMeta[name].className
        }"
      >
        <p>${lifemapperMessagesMeta[name].title}</p>
        ${messages.join('<br>')}
      </span>`).join('')
    );

    Leaflet.addMarkersToMap(
      map,
      layerGroup,
      lifemapperInfo.markers.flat(2),
      'Local Occurrence Points',
    );


    return ()=>{
      //TODO: finish this
    };

  }, [mapRef]);

  return <div
    className="lifemapper-leaflet-map"
    ref={mapRef}
  />;

}


const extractEl = (
  elements: [string|undefined, string|undefined],
  preferredElement: 0|1
):string=>(
  typeof elements[preferredElement] === 'undefined'?
  elements[(preferredElement+1)%elements.length] :
  elements[preferredElement]
) || '';

type MessageTypes = 'errorDetails'|'infoSection';

const lifemapperMessagesMeta:Record<MessageTypes,{
  className: string,
  title: string,
}> = {
  'errorDetails': {
    className: 'error-details',
    title: 'The following errors were reported by Lifemapper:',
  },
  'infoSection': {
    className: 'info-section',
    title: 'Projection Details:',
  }
} as const;

function LifemapperInfo({
  model,
  guid
}:{
  model: any,
  guid: string|undefined
}){

  const [state, dispatch] = React.useReducer(
    reducer,
    {
      type: 'LoadingState'
    } as LoadingState
  );

  React.useEffect(()=>{

    if(typeof guid === 'undefined')
      return;

    $.get(
      formatOccurrenceDataRequest(guid)
    ).done((response:{
      records: {
        provider: string,
        count: number,
        records: []|[Record<string,unknown>]
      }[]
    }) =>
      dispatch({
        type:'LoadedAction',
        aggregatorInfos: Object.fromEntries(
          (response.records || []).map((record) =>({
           ...record,
           provider: record.provider.toLowerCase()
          })).filter((record) =>
            typeof sourceLabels[record.provider] !== 'undefined',
          ).map(({provider, records, count}) => [
            provider,
            typeof records[0] === 'undefined' ?
              undefined :
              {
                ...extractBadgeInfo[provider](records[0]),
                count,
                occurrenceCount: undefined,
              }
          ])
        ),
      })
    );

  },[]);

  React.useEffect(()=> {
    if (state.type !== 'MainState')
      return;

    const occurrenceNames = Object.values(
      state.aggregatorInfos
    ).filter(aggregatorInfo =>
      aggregatorInfo
    ).map(aggregatorInfo =>
      aggregatorInfo!.occurrenceName
    ).filter(occurrenceName =>
      occurrenceName !== ''
    );

    if (occurrenceNames.length === 0)
      return;

    dispatch({
      type: 'SetRemoteOccurrenceNameAction',
      remoteOccurrenceName: IS_DEVELOPMENT ?
        defaultOccurrenceName[1] :
        occurrenceNames[0]
    });

  },[state.type]);

  React.useEffect(()=> {

    if (
      state.type !== 'MainState' ||
      typeof state.remoteOccurrenceName === 'undefined'
    )
      return;

    Object.entries(state.aggregatorInfos).filter(([name, data]) =>
      data &&
      data.occurrenceName !== '' &&
      state.badgeStatuses[name]?.isOpen &&
      typeof state.aggregatorInfos.occurrenceCount === "undefined"
    ).forEach(([name]) => {
      void $.get(formatOccurrenceCountRequest(
        name,
        state.remoteOccurrenceName!
      )).done(response =>
        dispatch({
          type: 'OccurrenceCountLoadedAction',
          aggregatorName: name,
          occurrenceCount: response.records.map(({
            scientificName,
            occurrence_count,
            occurrence_url,
          }: any) => (
            {
              scientificName,
              count: occurrence_count,
              url: occurrence_url
            }
          )),
        })
      )
    });

  }, state.type === 'MainState' ?
    [
      state.remoteOccurrenceName,
      JSON.stringify(state.badgeStatuses)
    ] :
    [
      undefined,
      undefined,
    ]
  );

  React.useEffect(()=>{

    if(
      state.type !== 'MainState' ||
      !state.badgeStatuses['lifemapper']?.isOpen ||
      typeof state.remoteOccurrenceName === "undefined"
    )
      return;


    fetchLocalScientificName(model).then((localScientificName)=>{
      const localOccurrenceName = IS_DEVELOPMENT ?
        defaultOccurrenceName[0] :
        localScientificName;

      const getOccurrenceName = (index:0|1)=>
        extractEl([localOccurrenceName,state.remoteOccurrenceName],index);

      const similarCoMarkersPromise = new Promise(resolve => {

        const similarCollectionObjects =
          new (schema as any).models.CollectionObject.LazyCollection({
            filters: {
              determinations__iscurrent: true,
              determinations__preferredtaxon__fullname:
                getOccurrenceName(0),
            },
          });

        similarCollectionObjects.fetch({
          limit: 100,
        }).done(() =>
          Promise.all(
            similarCollectionObjects.map((collectionObject:any) =>
              new Promise(resolve =>
                collectionObject.rget(
                  'collectingevent.locality',
                ).done((locality:any) =>
                  Leaflet.getMarkersFromLocalityResource(
                    locality,
                    model.get('id') ===
                    collectionObject.get('id') ?
                      'lifemapperCurrentCollectionObjectMarker' :
                      undefined,
                  ).then(resolve),
                ),
              ),
            ),
          ).then(resolve),
        );

      });

      const messages:Record<MessageTypes,string[]>={
        'errorDetails': [],
        'infoSection': [
          `Specify Species Name: ${
            typeof localOccurrenceName === 'undefined' ?
              'Not found' :
              localOccurrenceName
          }`,
          `Remote occurrence name: ${
            typeof state.remoteOccurrenceName === 'undefined' ?
              'Not found' :
              state.remoteOccurrenceName
          }`
        ],
      };

      $.get(
        formatOccurrenceMapRequest(
          getOccurrenceName(1)
        )
      ).done(async (response:{
        errors: string[],
        records: []|[{
          endpoint: string,
          projection_link: string,
          point_name: string,
          modtime: string
        }]
      }) => {

        let layers:any[] = [];

        if (response.errors.length !== 0)
          messages['errorDetails'].push(...response.errors);

        else if(response.records.length === 0)
          messages['errorDetails'].push(
            'Projection map for this species was not found'
          );

        else {

          const {
            endpoint,
            projection_link: projectionLink,
            point_name: mapName,
            modtime: modificationTime,
          } = response.records[0];

          const mapUrl = `${endpoint}/`;
          const mapId = mapName.replace(/\D/g, '');
          const layerId = /\/(\d+)$/.exec(
            projectionLink,
          )![1];
          layers = lifemapperLayerVariations.map(({
              transparent,
              name: layerNameFunction,
              label: layerLabel,
            }) => (
              {
                transparent,
                layerLabel,
                tileLayer: {
                  mapUrl,
                  options: {
                    layers: layerNameFunction(
                      mapId,
                      layerId,
                    ),
                    service: 'wms',
                    version: '1.0',
                    height: '400',
                    format: 'image/png',
                    request: 'getmap',
                    srs: 'epsg:3857',
                    width: '800',
                    transparent: transparent,
                  },
                },
              }
            ),
          );

          messages.errorDetails.push(
            `Model Creation date: ${modificationTime}`
          );

        }

        dispatch({
          type: 'MapLoadedAction',
          markers: await similarCoMarkersPromise,
          layers,
          messages
        });

      });

    });

    return;

  },
    state.type === 'MainState' ?
      [
        state.remoteOccurrenceName,
        state.badgeStatuses['lifemapper']?.isOpen
      ] :
      [
        undefined,
        undefined,
      ]
  );

  return state.type === 'LoadingState' ?
    null :
    <>
      {Object.entries(state.aggregatorInfos).map(([name,data])=>
        <Badge
          name={name }
          key={name}
          isEnabled={typeof data !== 'undefined'}
          hasError={
            typeof data !== 'undefined' &&
            (
              data.listOfIssues.length !== 0 ||
              data.count > 1
            )
          }
          onClick={
            typeof data === 'undefined' ?
              undefined :
              ()=>dispatch({
                type: 'ToggleAggregatorVisibilityAction',
                badgeName: name,
              })
          }
        />
      )}
      <Badge
        name={'lifemapper'}
        isEnabled={true}
        hasError={false}
        onClick={()=>dispatch({
          type: 'ToggleAggregatorVisibilityAction',
          badgeName: 'lifemapper',
        })}
      />
      {Object.entries(state.badgeStatuses).filter(([,{isOpen}])=>
        isOpen
      ).map(([badgeName])=> ({
        badgeName,
        isAggregator:AGGREGATOR_NAMES.indexOf(badgeName) !== -1
      })).map(({badgeName, isAggregator})=>
        <ModalDialog
          key={badgeName}
          properties={{
            title: isAggregator ?
              `Record was indexed by ${sourceLabels[badgeName]}` :
              sourceLabels[badgeName],
            close: ()=>dispatch({
              type: 'ToggleAggregatorVisibilityAction',
              badgeName
            }),
            ...(
              isAggregator ?
                state.aggregatorInfos[badgeName]?.occurrenceViewLink ?
                  {
                    buttons: [
                      {
                        text: `Close`,
                        click: ()=>dispatch({
                          type: 'ToggleAggregatorVisibilityAction',
                          badgeName
                        }),
                      },
                      {
                        text: `View occurrence at ${sourceLabels[badgeName]}`,
                        click: () => window.open(
                          state.aggregatorInfos[badgeName]!.occurrenceViewLink,
                          '_blank'
                        ),
                      }
                    ],
                    width: 400,
                  } :
                  {} :
                {
                  width: 950,
                  height: 500,
                }
            )
          }}
        >{
          isAggregator ?
            <Aggregator
              name={badgeName}
              data={state.aggregatorInfos[badgeName]!}
            /> :
            typeof state.lifemapperInfo === "undefined" ?
              <p>Loading...</p> :
              <LifemapperMap
                badgeName={badgeName}
                lifemapperInfo={state.lifemapperInfo}
              />
        }</ModalDialog>
      )}
    </>;
}

interface Props {
  model: any,
}

interface ComponentProps extends Props {
  guid: string,
}

const View = createBackboneView<Props, Props, ComponentProps>({
  moduleName: 'LifemapperInfo',
  className: 'lifemapper-info',
  initialize(
    self,
    {model},
  ) {
    self.model = model;
  },
  renderPre(self){
    self.el.style.display = '';
  },
  remove(self){
    self.el.style.display = 'none';
  },
  Component: LifemapperInfo,
  getComponentProps: (self) => ({
    model: self.model,
    guid: IS_DEVELOPMENT?
      defaultGuid:
      self.model.get('guid')
  }),
});

export default function register() {
  ResourceView.on('rendered', (resourceView: any) => {
    if (resourceView.model.specifyModel.name === 'CollectionObject')
      // @ts-ignore
      new View({
        model: resourceView.model,
        el: $(
          '<span class="lifemapper-info" style="display:none;"></span>'
        ).appendTo(resourceView.header),
      }).render();
  });
}


const issueDefinitions:Readonly<
  Record<
    'common'|'gbif'|'idigbio',
    Record<string,string>
    >
  > = {
  'common': {
    'HAS_MULTIPLE_RECORDS': 'Occurrence Tentacle server found duplicate instances of this record',
  },
  'gbif': {
    'AMBIGUOUS_COLLECTION': 'The given collection matches with more than 1 GrSciColl collection.',
    'AMBIGUOUS_INSTITUTION': 'The given institution matches with more than 1 GrSciColl institution.',
    'BASIS_OF_RECORD_INVALID': 'The given basis of record is impossible to interpret or significantly different from the recommended vocabulary.',
    'COLLECTION_MATCH_FUZZY': 'The given collection was fuzzily matched to a GrSciColl collection.',
    'COLLECTION_MATCH_NONE': 'The given collection couldn\'t be matched with any GrSciColl collection.',
    'CONTINENT_COUNTRY_MISMATCH': 'The interpreted continent and country do not match.',
    'CONTINENT_DERIVED_FROM_COORDINATES': 'The interpreted continent is based on the coordinates, not the verbatim string information.',
    'CONTINENT_INVALID': 'Uninterpretable continent values found.',
    'COORDINATE_ACCURACY_INVALID': 'Deprecated. ',
    'COORDINATE_INVALID': 'Coordinate value is given in some form but GBIF is unable to interpret it.',
    'COORDINATE_OUT_OF_RANGE': 'Coordinate has a latitude and/or longitude value beyond the maximum (or minimum) decimal value.',
    'COORDINATE_PRECISION_INVALID': 'Indicates an invalid or very unlikely coordinatePrecision',
    'COORDINATE_PRECISION_UNCERTAINTY_MISMATCH': 'Deprecated. ',
    'COORDINATE_REPROJECTED': 'The original coordinate was successfully reprojected from a different geodetic datum to WGS84.',
    'COORDINATE_REPROJECTION_FAILED': 'The given decimal latitude and longitude could not be reprojected to WGS84 based on the provided datum.',
    'COORDINATE_REPROJECTION_SUSPICIOUS': 'Indicates successful coordinate reprojection according to provided datum, but which results in a datum shift larger than 0.1 decimal degrees.',
    'COORDINATE_ROUNDED': 'Original coordinate modified by rounding to 5 decimals.',
    'COORDINATE_UNCERTAINTY_METERS_INVALID': 'Indicates an invalid or very unlikely dwc:uncertaintyInMeters.',
    'COUNTRY_COORDINATE_MISMATCH': 'The interpreted occurrence coordinates fall outside of the indicated country.',
    'COUNTRY_DERIVED_FROM_COORDINATES': 'The interpreted country is based on the coordinates, not the verbatim string information.',
    'COUNTRY_INVALID': 'Uninterpretable country values found.',
    'COUNTRY_MISMATCH': 'Interpreted country for dwc:country and dwc:countryCode contradict each other.',
    'DEPTH_MIN_MAX_SWAPPED': 'Set if supplied minimum depth > maximum depth',
    'DEPTH_NON_NUMERIC': 'Set if depth is a non-numeric value',
    'DEPTH_NOT_METRIC': 'Set if supplied depth is not given in the metric system, for example using feet instead of meters',
    'DEPTH_UNLIKELY': 'Set if depth is larger than 11,000m or negative.',
    'ELEVATION_MIN_MAX_SWAPPED': 'Set if supplied minimum elevation > maximum elevation',
    'ELEVATION_NON_NUMERIC': 'Set if elevation is a non-numeric value',
    'ELEVATION_NOT_METRIC': 'Set if supplied elevation is not given in the metric system, for example using feet instead of meters',
    'ELEVATION_UNLIKELY': 'Set if elevation is above the troposphere (17km) or below 11km (Mariana Trench).',
    'GEODETIC_DATUM_ASSUMED_WGS84': 'Indicating that the interpreted coordinates assume they are based on WGS84 datum as the datum was either not indicated or interpretable.',
    'GEODETIC_DATUM_INVALID': 'The geodetic datum given could not be interpreted.',
    'GEOREFERENCED_DATE_INVALID': 'The date given for dwc:georeferencedDate is invalid and can\'t be interpreted at all.',
    'GEOREFERENCED_DATE_UNLIKELY': 'The date given for dwc:georeferencedDate is in the future or before Linnean times (1700).',
    'IDENTIFIED_DATE_INVALID': 'The date given for dwc:dateIdentified is invalid and can\'t be interpreted at all.',
    'IDENTIFIED_DATE_UNLIKELY': 'The date given for dwc:dateIdentified is in the future or before Linnean times (1700).',
    'INDIVIDUAL_COUNT_CONFLICTS_WITH_OCCURRENCE_STATUS': 'Example: individual count value > 0, but occurrence status is absent.',
    'INDIVIDUAL_COUNT_INVALID': 'The individual count value is not a positive integer',
    'INSTITUTION_COLLECTION_MISMATCH': 'The collection matched doesn\'t belong to the institution matched.',
    'INSTITUTION_MATCH_FUZZY': 'The given institution was fuzzily matched to a GrSciColl institution.',
    'INSTITUTION_MATCH_NONE': 'The given institution couldn\'t be matched with any GrSciColl institution.',
    'INTERPRETATION_ERROR': 'An error occurred during interpretation, leaving the record interpretation incomplete.',
    'MODIFIED_DATE_INVALID': 'A (partial) invalid date is given for dc:modified, such as a nonexistent date, zero month, etc.',
    'MODIFIED_DATE_UNLIKELY': 'The date given for dc:modified is in the future or predates Unix time (1970).',
    'MULTIMEDIA_DATE_INVALID': 'An invalid date is given for dc:created of a multimedia object.',
    'MULTIMEDIA_URI_INVALID': 'An invalid URI is given for a multimedia object.',
    'OCCURRENCE_STATUS_INFERRED_FROM_BASIS_OF_RECORD': 'Occurrence status was inferred from basis of records',
    'OCCURRENCE_STATUS_INFERRED_FROM_INDIVIDUAL_COUNT': 'Occurrence status was inferred from the individual count value',
    'OCCURRENCE_STATUS_UNPARSABLE': 'Occurrence status value can\'t be assigned to OccurrenceStatus',
    'POSSIBLY_ON_LOAN': 'The given owner institution is different than the given institution.',
    'PRESUMED_NEGATED_LATITUDE': 'Latitude appears to be negated, e.g.',
    'PRESUMED_NEGATED_LONGITUDE': 'Longitude appears to be negated, e.g.',
    'PRESUMED_SWAPPED_COORDINATE': 'Latitude and longitude appear to be swapped.',
    'RECORDED_DATE_INVALID': 'A (partial) invalid date is given, such as a non existing date, zero month, etc.',
    'RECORDED_DATE_MISMATCH': 'The recorded date specified as the eventDate string and the individual year, month, day are contradictory.',
    'RECORDED_DATE_UNLIKELY': 'The recorded date is highly unlikely, falling either into the future or representing a very old date before 1600 thus predating modern taxonomy.',
    'REFERENCES_URI_INVALID': 'An invalid URI is given for dc:references.',
    'TAXON_MATCH_FUZZY': 'Matching to the taxonomic backbone can only be done using a fuzzy, non exact match.',
    'TAXON_MATCH_HIGHERRANK': 'Matching to the taxonomic backbone can only be done on a higher rank and not the scientific name.',
    'TAXON_MATCH_NONE': 'Matching to the taxonomic backbone cannot be done because there was no match at all, or several matches with too little information to keep them apart (potentially homonyms).',
    'TYPE_STATUS_INVALID': 'The given type status is impossible to interpret or significantly different from the recommended vocabulary.',
    'ZERO_COORDINATE': 'Coordinate is the exact 0°, 0° coordinate, often indicating a bad null coordinate.',
  },
  'idigbio': {
    'datecollected_bounds': 'Date Collected out of bounds (Not between 1700-01-02 and the date of Indexing). Date Collected is generally composed from dwc:year, dwc:month, dwc:day or as specified in dwc:eventDate.',
    'dwc_acceptednameusageid_added': 'Accepted Name Usage ID (dwc:acceptedNameUsageID) added where none was provided.',
    'dwc_basisofrecord_invalid': 'Darwin Core Basis of Record (dwc:basisOfRecord) missing or not a value from controlled vocabulary.',
    'dwc_basisofrecord_paleo_conflict': 'Darwin Core Basis of Record (dwc:basisOfRecord) is not FossilSpecimen but the record contains paleo context terms',
    'dwc_basisofrecord_removed': 'Darin Core Basis of Record (dwc:basisOfRecord) removed because of invalid value.',
    'dwc_class_added': 'Darwin Core Class (dwc:class) added where none was provided.',
    'dwc_class_replaced': 'Darwin Core Class (dwc:class) replaced with a standardized value from GBIF Backbone Taxonomy.',
    'dwc_continent_added': 'Darwin Core Continent (dwc:continent) added where none was provided.',
    'dwc_continent_replaced': 'Darwin Core Continent (dwc:continent) replaced with a standardized value.',
    'dwc_country_added': 'Darwin Core Country (dwc:country) added where none was provided.',
    'dwc_country_replaced': 'Darwin Core Country (dwc:country) replaced with a standardized value from Getty Thesaurus of Geographic Names.',
    'dwc_datasetid_added': 'Darwin Core Dataset ID (dwc:datasetID) added where none was provided.',
    'dwc_datasetid_replaced': 'Darwin Core Dataset ID (dwc:datasetID) replaced with value from ? TBD',
    'dwc_family_added': 'Darwin Core Family (dwc:family) added where none was provided.',
    'dwc_family_replaced': 'Darwin Core Family (dwc:family) replaced with a standardized value from GBIF Backbone Taxonomy.',
    'dwc_genus_added': 'Darwin Core Genus (dwc:genus) added where none was provided.',
    'dwc_genus_replaced': 'Darwin Core Genus (dwc:genus) replaced with a standardized value from GBIF Backbone Taxonomy.',
    'dwc_infraspecificepithet_added': 'Darwin Core Infraspecific Epithet (dwc:infraspecificEpithet) added where none was provided.',
    'dwc_infraspecificepithet_replaced': 'Darwin Core Infraspecific Epithet (dwc:infraspecificEpithet) replaced with a standardized value from GBIF Backbone Taxonomy.',
    'dwc_kingdom_added': 'Darwin Core Kingdom (dwc:kingdom) added where none was provided.',
    'dwc_kingdom_replaced': 'Darwin Core Kingdom (dwc:kingdom) replaced with a standardized value from GBIF Backbone Taxonomy.',
    'dwc_kingdom_suspect': 'Darwin Core Kingdom (dwc:kingdom) not replaced with a standardized value from GBIF Backbone Taxonomy due to insufficient confidence level.',
    'dwc_multimedia_added': 'TBD',
    'dwc_order_added': 'Darwin Core Order (dwc:order) added where none was provided.',
    'dwc_order_replaced': 'Darwin Core Order (dwc:order) replaced with a standardized value from GBIF Backbone Taxonomy.',
    'dwc_originalnameusageid_added': 'Darwin Core Original Name Usage ID (dwc:originalNameUsageID) added where none was provided.',
    'dwc_parentnameusageid_added': 'Darwin Core Parent Name Usage ID (dwc:parentNameUsageID) added where none was provided.',
    'dwc_phylum_added': 'Darwin Core Phylum (dwc:phylum) added where none was provided.',
    'dwc_phylum_replaced': 'Darwin Core Phylum (dwc:phylum) replaced with a standardized value from GBIF Backbone Taxonomy.',
    'dwc_scientificnameauthorship_added': 'Darwin Core Scientific Name Authorship (dwc:scientificNameAuthorship) added where none was provided.',
    'dwc_specificepithet_added': 'Darwin Core Specific Epithet (dwc:specificEpithet) added where none was provided.',
    'dwc_specificepithet_replaced': 'Darwin Core Specific Epithet (dwc:specificEpithet) replaced with a standardized value from GBIF Backbone Taxonomy.',
    'dwc_stateprovince_replaced': 'Darwin Core State or Province (dwc:stateProvince) replaced with a standardized value.',
    'dwc_taxonid_added': 'Darwin Core Taxon ID (dwc:taxonID) added where none was provided.',
    'dwc_taxonid_replaced': 'Darwin Core Taxon ID (dwc:taxonID) replaced with a standardized value from GBIF Backbone Taxonomy.',
    'dwc_taxonomicstatus_added': 'Darwin Core Taxonomic Status (dwc:taxonomicStatus) added where none was provided.',
    'dwc_taxonomicstatus_replaced': 'Darwin Core Taxonomic Status (dwc:taxonomicStatus) replaced with a standardized value from GBIF Backbone Taxonomy.',
    'dwc_taxonrank_added': 'Darwin Core Taxon Rank (dwc:taxonRank) added where none was provided.',
    'dwc_taxonrank_invalid': 'The supplied Darwin Core Taxon Rank (dwc:taxonRank) is not contained in controlled vocabulary (Taxonomic Rank GBIF Vocabulary).',
    'dwc_taxonrank_removed': 'Darwin Core Taxon Rank (dwc:taxonRank) removed because it is not contained in controlled vocabulary (Taxonomic Rank GBIF Vocabulary).',
    'dwc_taxonrank_replaced': 'Darwin Core Taxon Rank (dwc:taxonRank) replaced with a standardized value from GBIF Backbone Taxonomy.',
    'dwc_taxonremarks_added': 'Darwin Core Taxon Remarks (dwc:taxonRemarks) added none was provided.',
    'dwc_taxonremarks_replaced': 'Darwin Core Taxon Remarks (dwc:taxonRemarks) replaced with a standardized value from GBIF Backbone Taxonomy.',
    'gbif_canonicalname_added': 'GBIF Canonical Name added from GBIF Backbone Taxonomy.',
    'gbif_genericname_added': 'GBIF Generic Name added from GBIF Backbone Taxonomy.',
    'gbif_reference_added': 'GBIF Reference added from GBIF Backbone Taxonomy',
    'gbif_taxon_corrected': 'A match in GBIF Backbone Taxonomy was found. Inverse of taxon_match_failed flag.',
    'gbif_vernacularname_added': 'GBIF Vernacular Name (common name) added.',
    'geopoint_0_coord': 'Geographic Coordinate contains literal \'0\' values.',
    'geopoint_bounds': 'Geographic Coordinate out of bounds (valid range is -90 to 90 lat, -180 to 180 long)',
    'geopoint_datum_error': 'Geographic Coordinate Datum (dwc:geodeticDatum) is Unknown or coordinate cannot be converted to WGS84.',
    'geopoint_datum_missing': 'Geographic Coordinate is missing Geodetic Datum (dwc:geodeticDatum) (Assumed to be WGS84).',
    'geopoint_low_precision': 'Geographic Coordinate contains a Low Precision value.',
    'geopoint_pre_flip': 'Geographic Coordinate latitude and longitude replaced with swapped values. Prior to examining other factors, the magnitude of latitude was determined to be greater than 180, and the longitude was less than 90.',
    'geopoint_similar_coord': 'Geographic Coordinate latitude and longitude are similar (+/- lat == +/- lon) and likely have data entry issue.',
    'idigbio_isocountrycode_added': 'iDigBio ISO 3166-1 alpha-3 Country Code added.',
    'rev_geocode_both_sign': 'Geographic Coordinate Latitude and Longitude negated to place point in correct country.',
    'rev_geocode_corrected': 'Geographic Coordinate placed within stated country by reverse geocoding process.',
    'rev_geocode_eez': 'Geographic Coordinate is outside land boundaries of stated country but does fall inside the country\'s exclusive economic zone water boundary (approx. 200 miles from shore) based on reverse geocoding process.',
    'rev_geocode_eez_corrected': 'The reverse geocoding process was able to find a coordinate operation that placed the point within the stated country\'s exclusive economic zone.',
    'rev_geocode_failure': 'Geographic Coordinate could not be reverse geocoded to a particular country.',
    'rev_geocode_flip': 'Geographic Coordinate Latitude and Longitude replaced with swapped values to place point in stated country by reverse geocoding process.',
    'rev_geocode_flip_both_sign': 'Geographic Coordinate Latitude and Longitude replaced with both swapped and negated values to place point in stated country by reverse geocoding process.',
    'rev_geocode_flip_lat_sign': 'Geographic Coordinate Latitude and Longitude replaced with swapped values, Latitude negated, to place point in stated country by reverse geocoding process.',
    'rev_geocode_flip_lon_sign': 'Geographic Coordinate Latitude and Longitude replaced with swapped values, Longitude negated, to place it in stated country by reverse geocoding process.',
    'rev_geocode_lat_sign': 'Geographic Coordinate Latitude negated to place point in stated country by reverse geocoding process.',
    'rev_geocode_lon_sign': 'Geographic Coordinate had its Longitude negated to place it in stated country.',
    'rev_geocode_mismatch': 'Geographic Coordinate did not reverse geocode to stated country.',
    'scientificname_added': 'Scientific Name (dwc:scientificName) added where none was provided with the value constructed by concatenation of stated genus and species.',
    'taxon_match_failed': 'Unable to match a taxon in GBIF Backbone Taxonomy. Inverse of gbif_taxon_corrected flag.',
  },
} as const;
