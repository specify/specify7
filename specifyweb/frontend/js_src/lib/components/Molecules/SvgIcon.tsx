import React from 'react';

import { useId } from '../../hooks/useId';
import { f } from '../../utils/functools';
import type { IR, RR } from '../../utils/types';
import { schema } from '../DataModel/schema';
import type { Tables } from '../DataModel/types';
import { stringToColor } from './TableIcon';

export function SvgIcon({
  name,
  className,
}: {
  readonly name: keyof Tables;
  readonly className: string;
}) {
  const shortName = nameMapper()[name] ?? getShortName(name);
  const autoName = name.startsWith(shortName[0]) ? name : shortName;
  const [from, to] = colorMapper[name] ?? [
    stringToColor(autoName),
    stringToColor(autoName),
  ];
  const id = useId('icon');
  const fontSize = React.useMemo(() => getFontSize(shortName), [shortName]);
  const isAttachmentTable = isAttachment(name);
  return (
    <svg
      className={className}
      viewBox={isAttachmentTable ? '0 0 1043.24 1040' : '0 0 1000 1000'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <radialGradient
          cx="512.8199"
          cy="2.0972"
          gradientUnits="userSpaceOnUse"
          id={id('gradient')}
          r="1190.8768"
        >
          <stop offset="0" style={{ stopColor: from }} />
          <stop offset="1" style={{ stopColor: to }} />
        </radialGradient>
        <path
          d={
            isAttachmentTable
              ? `M500.3,39.96c53.8,.73,117.16,2.63,170.94,4.04l327,374c.33,92.34,1.32,191.85,.08,284.18-.67,49.82-4.83,99.49-17.04,148.09-15.18,60.4-46.12,109.77-100.39,142.61-31.51,19.07-66.24,29.1-102.22,35.25-60.25,10.29-121.13,11.78-182.02,11.85-85.9,.1-171.82-.17-257.71-1.45-49.14-.73-98.1-4.83-146.14-16.55-94.61-23.09-152.42-82.36-174.74-176.82-8.79-37.19-12.95-75.02-14.53-113.09C-1.44,612.32-.54,492.52,2.42,372.75c1.26-50.91,5.46-101.66,19.4-151.06C46.42,134.5,103.61,81.32,190.83,59.39c48.6-12.22,98.26-15.81,148.08-17.09,53.78-1.38,107.59-1.61,161.39-2.35Z`
              : `M500,0c53.8,0.7,107.6,0.9,161.4,2.4c51.6,1.4,103,5.1,153.2,18.4c57.7,15.3,104.7,45.7,136.6,97.1c19.9,32.1,30.1,67.7,36.5,104.5c9.3,53.9,11.4,108.3,11.6,162.8c0.3,92.3,0,184.7-1.3,277c-0.7,49.8-4.8,99.5-17,148.1c-15.2,60.4-46.1,109.8-100.4,142.6c-31.5,19.1-66.2,29.1-102.2,35.2c-60.2,10.3-121.1,11.8-182,11.9c-85.9,0.1-171.8-0.2-257.7-1.5c-49.1-0.7-98.1-4.8-146.1-16.6C97.9,958.9,40.1,899.6,17.8,805.2C9,768,4.8,730.1,3.2,692.1c-5-119.8-4.1-239.6-1.1-359.3c1.3-50.9,5.5-101.7,19.4-151.1c24.6-87.2,81.8-140.4,169-162.3C239.1,7.2,288.8,3.6,338.6,2.3C392.4,0.9,446.2,0.7,500,0z`
          }
          fill={`url(#${id('gradient')})`}
        />
      </g>
      <g>
        <text
          dominantBaseline="middle"
          fill="#FFFFFF"
          fontFamily="Francois One"
          fontSize={`${fontSize}px`}
          textAnchor="middle"
          x="50%"
          y="56%"
        >
          {shortName}
        </text>
      </g>
      {isAttachmentTable && (
        <g>
          <linearGradient
            gradientTransform="translate(-24.77 -25.37) rotate(1.56) scale(1.04 1.13) skewX(3.26)"
            gradientUnits="userSpaceOnUse"
            id={id('tearFill')}
            x1="856.54"
            x2="735.82"
            y1="144.98"
            y2="354.08"
          >
            <stop offset="0" stopColor="#e6e6e6" />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
          <filter filterUnits="userSpaceOnUse" id={id('tearShadow')}>
            <feOffset dx="-36" dy="37" />
            <feGaussianBlur result="g" stdDeviation="27" />
            <feFlood floodColor="#000" floodOpacity=".2" />
            <feComposite in2="g" operator="in" />
            <feComposite in="SourceGraphic" />
          </filter>
          <path
            d="M998.23,418c-429.48,44.97-359.43-185.61-333.32-351.77,1.11-6.65,5.91-20.71,6.33-22.23,.94,.86-.38-.14,.18,.44,37.6,39.33,326.98,368.99,326.81,373.56Z"
            fill={`url(#${id('tearFill')})`}
            filter={`url(#${id('tearShadow')})`}
          />
        </g>
      )}
    </svg>
  );
}

function getShortName(rawName: keyof Tables): string {
  const name =
    rawName.endsWith('Attachment') && rawName !== 'Attachment'
      ? rawName.slice(0, -'Attachment'.length)
      : rawName.startsWith('Sp')
      ? rawName.slice(2)
      : rawName;
  const capitalLetters = name.replaceAll(/[^A-Z]/gu, '');
  return capitalLetters.length > 1
    ? capitalLetters.slice(0, 3)
    : name.slice(0, 3);
}

const baseFontSize = 850;
const capitalLetter = 95;
const lowerLetter = 80;

function getFontSize(name: string): number {
  const capitalLetters = name.replaceAll(/[^A-Z]/gu, '').length;
  const lowerLetters = name.replaceAll(/[^a-z]/gu, '').length;
  return (
    baseFontSize - capitalLetters * capitalLetter - lowerLetters * lowerLetter
  );
}

const startsWith = (
  prefix: string,
  resolved: string
): Partial<RR<keyof Tables, string>> =>
  Object.fromEntries(
    Object.keys(schema.models)
      .filter((tableName) => tableName.startsWith(prefix))
      .map((tableName) => [tableName, resolved])
  );

const endsWith = (
  prefix: string,
  resolved: string
): Partial<RR<keyof Tables, string>> =>
  Object.fromEntries(
    Object.keys(schema.models)
      .filter((tableName) => tableName.endsWith(prefix))
      .map((tableName) => [tableName, resolved])
  );

const nameMapper = f.store<Partial<RR<keyof Tables, string>>>(() => ({
  ...startsWith('Accession', 'Acc'),
  ...endsWith('Agent', 'Agt'),
  ...endsWith('Citation', 'Cit'),
  ...endsWith('Authorization', 'Per'),
  ...endsWith('Preparation', 'Pre'),
  ...startsWith('Attachment', 'Att'),
  Address: 'Adr',
  AddressOfRecord: 'Adr',
  AgentAttachment: 'Agt',
  AgentIdentifier: 'Agt',
  AgentVariant: 'Agt',
  BorrowAttachment: 'Bor',
  ConservEvent: 'CvE',
  ConservEventAttachment: 'CvE',
  DNAPrimer: 'DnaP',
  DNASequencingRun: 'DnaR',
  DNASequencingRunAttachment: 'DnaR',
  ExsiccataItem: 'ExI',
  Gift: 'Gft',
  GiftAttachment: 'Gft',
  GroupPerson: 'Agt',
  InstitutionNetwork: 'Ins',
  LoanReturnPreparation: 'LRP',
  PcrPerson: 'PcP',
  PreparationAttr: 'PrA',
  PreparationAttribute: 'PrA',
  Project: 'Prj',
  Shipment: 'Shp',
  SpAppResource: 'App',
  SpAppResourceData: 'App',
  SpAppResourceDir: 'App',
  SpAuditLogField: 'AlF',
  SpExportSchema: 'Exp',
  SpExportSchemaItem: 'Exp',
  SpExportSchemaItemMapping: 'Exp',
  SpExportSchemaMapping: 'Exp',
  SpQuery: 'SQL',
  SpQueryField: 'SQL',
  SpViewSetObj: 'Form',
  SpecifyUser: 'Usr',
}));

const colors: IR<readonly [from: string, to: string]> = {
  red: ['#C1272D', '75272D'],
  blue: ['#0071BC', '#2E3192'],
  lightBlue: ['#00C4F5', '#006BB7'],
  purple: ['#662D91', '#1B1464'],
  green: ['#39B54A', '#009245'],
  brown: ['#A67C52', '#754C24'],
};

const colorMapper: RR<keyof Tables, readonly [from: string, to: string]> = {
  Accession: colors.yellowOrange,
  Address: colors.blue,
  Agent: colors.yellowOrange,
  AgentGeography: colors.red,
  AgentSpecialty: colors.blue,
  Appraisal: colors.purple,
  Attachment: colors.green,
  Attribute: colors.green,
  AttributeDefinition: colors.green,
  Author: colors.yellowOrange,
  Borrow: colors.blue,
  BorrowMaterial: colors.brown,
  BorrowReturnMaterial: colors.red,
  Chronostratigraphy: colors.brown,
  Citation: colors.red,
  CollectingEvent: colors.blue,
  CollectingEventAttribute: colors.blue,
  CollectingEventAuthorization: colors.red,
  CollectingTrip: colors.blue,
  CollectingTripAttribute: colors.yellowOrange,
  CollectingTripAuthorization: colors.purple,
  Collection: colors.brown,
  CollectionObject: colors.brown,
  CollectionObjectAttribute: colors.brown,
  CollectionObjectProperty: colors.brown,
  CollectionRelType: colors.purple,
  CollectionRelationship: colors.green,
  Collector: colors.blue,
  CommonName: colors.red,
  CommonNameTaxonCitation: colors.green,
  ConservDescription: colors.purple,
  ConservationEvent: colors.green,
  Conservator: colors.brown,
  Container: colors.green,
  DNAPrimer: colors.red,
  DNASequence: colors.purple,
  DNASequenceRun: colors.purple,
  DNASequenceRunAttachment: colors.purple,
  DNASequencingRun: colors.purple,
  DataType: colors.blue,
  Deaccession: colors.purple,
  Determination: colors.brown,
  DeterminationStatus: colors.blue,
  Discipline: colors.yellowOrange,
  Disposal: colors.purple,
  Division: colors.brown,
  ExchangeIn: colors.red,
  ExchangeOut: colors.blue,
  Exsiccata: colors.brown,
  ExsiccataItem: colors.yellowOrange,
  Extractor: colors.blue,
  FieldNotebook: colors.blue,
  FieldNotebookPage: colors.green,
  FieldNotebookPageSet: colors.yellowOrange,
  FundingAgent: colors.blue,
  GeoCoordDetail: colors.blue,
  Geography: colors.purple,
  GeologicTimePeriod: colors.green,
  Gift: colors.yellowOrange,
  Group: colors.green,
  InformationRequest: colors.brown,
  Institution: colors.red,
  InstitutionNetwork: colors.red,
  Journal: colors.brown,
  LatLonPolygon: colors.green,
  Loan: colors.blue,
  LoanReturnPrep: colors.purple,
  Locality: colors.green,
  LocalityDetail: colors.brown,
  LocalityNameAlias: colors.purple,
  MaterialSample: colors.blue,
  OtherIdentifier: colors.purple,
  PCRPerson: colors.blue,
  PaleoContext: colors.yellowOrange,
  Permit: colors.green,
  PrepType: colors.green,
  Preparation: colors.purple,
  PreparationAttribute: colors.purple,
  PreparationProperty: colors.blue,
  Project: colors.red,
  ReferenceWork: colors.purple,
  RepositoryAgreement: colors.purple,
  Shipment: colors.brown,
  SpAuditLog: colors.lightBlue,
  SpAuditLogField: colors.lightBlue,
  SpSymbiotaInstance: colors.green,
  Storage: colors.blue,
  Stratigraphy: colors.red,
  Taxon: colors.red,
  TaxonAttribute: colors.purple,
  TreatmentEvent: colors.red,
  VoucherRelationship: colors.red,
};

export const exportsForTests = { nameMapper, colorMapper };

const isAttachment = (tableName: keyof Tables): boolean =>
  tableName.endsWith('Attachment') && !tableName.startsWith('Attachment');
