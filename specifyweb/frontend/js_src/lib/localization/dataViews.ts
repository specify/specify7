/**
 * Localization strings for the Data Views component
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const dataViewsText = createDictionary({
  dataViewsTitle: {
    comment: 'The name of the component',
    'en-us': 'Data Views',
    'de-ch': 'Datenansichten',
    'es-es': 'Vistas de datos',
    'fr-fr': 'Vues de données',
    'hr-hr': 'Prikazi podataka',
    nb: 'Datavisninger',
    'pt-br': 'Visualizações de dados',
    'ru-ru': 'Представления данных',
    'uk-ua': 'Перегляди даних',
  },
  tableRecords: {
    comment: 'Used as a dialog header within the Data Views component',
    'en-us': '{tableLabel:string} Records',
    'de-ch': '{tableLabel:string} Aufzeichnungen',
    'es-es': '{tableLabel:string} Registros',
    'fr-fr': '{tableLabel:string} Disques',
    'hr-hr': '{tableLabel:string} Zapisi',
    nb: '{tableLabel:string} Records',
    'pt-br': '{tableLabel:string} Registros',
    'ru-ru': '{tableLabel:string} Записи',
    'uk-ua': '{tableLabel:string} Записи',
  },
  configureDataViews: {
    'en-us': 'Configure {dataViews:string} tables',
    'de-ch': 'Konfigurieren Sie {dataViews:string}-Tabellen',
    'es-es': 'Configurar tablas {dataViews:string}',
    'fr-fr': 'Configurer les tables {dataViews:string}',
    'hr-hr': 'Konfiguriraj tablice {dataViews:string}',
    nb: 'Konfigurer {dataViews:string}-tabeller',
    'pt-br': 'Configurar tabelas {dataViews:string}',
    'ru-ru': 'Настройка таблиц {dataViews:string}',
    'uk-ua': 'Налаштувати таблиці {dataViews:string}',
  },
  dataViewQueries: {
    comment: 'The name of the Data View query app resource type',
    'en-us': 'Data View Queries',
    'de-ch': 'Datenansichtsabfragen',
    'es-es': 'Consultas de vista de datos',
    'fr-fr': 'Requêtes de visualisation de données',
    'hr-hr': 'Upiti za prikaz podataka',
    nb: 'Datavisningsspørringer',
    'pt-br': 'Consultas de visualização de dados',
    'ru-ru': 'Запросы для просмотра данных',
    'uk-ua': 'Запити до перегляду даних',
  },
  splitViewByDefault: {
    'en-us': 'Enable {splitView:string} by default',
    'de-ch': '{splitView:string} standardmäßig aktivieren',
    'es-es': 'Habilitar {splitView:string} por defecto',
    'fr-fr': 'Activer {splitView:string} par défaut',
    'hr-hr': 'Omogući {splitView:string} prema zadanim postavkama',
    nb: 'Aktiver {splitView:string} som standard',
    'pt-br': 'Ativar {splitView:string} por padrão',
    'ru-ru': 'Включить {splitView:string} по умолчанию',
    'uk-ua': 'Увімкнути {splitView:string} за замовчуванням',
  },
  configureQuery: {
    'en-us': 'Configure query',
    'de-ch': 'Abfrage konfigurieren',
    'es-es': 'Configurar consulta',
    'fr-fr': 'Configurer la requête',
    'hr-hr': 'Konfiguriraj upit',
    nb: 'Konfigurer spørring',
    'pt-br': 'Configurar consulta',
    'ru-ru': 'Настроить запрос',
    'uk-ua': 'Налаштувати запит',
  },
  splitViewDescription: {
    'en-us':
      '{splitView:string} displays query results alongside a record preview, allowing you to review records without leaving the results list.',
    'de-ch':
      '{splitView:string} zeigt Abfrageergebnisse zusammen mit einer Datensatzvorschau an, sodass Sie Datensätze überprüfen können, ohne die Ergebnisliste zu verlassen.',
    'es-es':
      '{splitView:string} muestra los resultados de la consulta junto con una vista previa del registro, lo que le permite revisar los registros sin salir de la lista de resultados.',
    'fr-fr':
      "{splitView:string} affiche les résultats de la requête ainsi qu'un aperçu de l'enregistrement, vous permettant de consulter les enregistrements sans quitter la liste des résultats.",
    'hr-hr':
      '{splitView:string} prikazuje rezultate upita uz pregled zapisa, što vam omogućuje pregled zapisa bez napuštanja popisa rezultata.',
    nb: '{splitView:string} viser spørreresultater sammen med en forhåndsvisning av poster, slik at du kan se gjennom poster uten å forlate resultatlisten.',
    'pt-br':
      '{splitView:string} exibe os resultados da consulta juntamente com uma pré-visualização do registro, permitindo que você revise os registros sem sair da lista de resultados.',
    'ru-ru':
      '{splitView:string} отображает результаты запроса вместе с предварительным просмотром записей, позволяя просматривать записи, не покидая список результатов.',
    'uk-ua':
      '{splitView:string} відображає результати запиту разом із попереднім переглядом запису, що дозволяє переглядати записи, не залишаючи список результатів.',
  },
  splitViewOrientation: {
    'en-us': 'Default {splitView:string} orientation',
    'de-ch': 'Standardausrichtung {splitView:string}',
    'es-es': 'Orientación predeterminada {splitView:string}',
    'fr-fr': 'Orientation par défaut {splitView:string}',
    'hr-hr': 'Zadana orijentacija {splitView:string}',
    nb: 'Standard {splitView:string}-retning',
    'pt-br': 'Orientação padrão {splitView:string}',
    'ru-ru': 'Ориентация по умолчанию {splitView:string}',
    'uk-ua': 'Орієнтація за замовчуванням {splitView:string}',
  },
} as const);
