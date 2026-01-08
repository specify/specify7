/**
 * Localization strings for the welcome screen
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const welcomeText = createDictionary({
  pageTitle: {
    'en-us': 'Welcome',
    'ru-ru': 'Добро пожаловать',
    'es-es': 'Bienvenida',
    'fr-fr': 'Accueillir',
    'uk-ua': 'Ласкаво просимо',
    'de-ch': 'Willkommen',
    'pt-br': 'Bem-vindo',
  },
  aboutSpecify: {
    'en-us': 'About Specify 7',
    'ru-ru': 'О Specify 7',
    'es-es': 'Sobre Specify',
    'fr-fr': 'À propos de Spécifier 7',
    'uk-ua': 'Про Specify 7',
    'de-ch': 'Über Specify 7',
    'pt-br': 'Sobre o Specify 7',
  },
  downloadInformation: {
    'en-us': 'Download Information',
    'ru-ru': 'Скачать информацию',
    'es-es': 'Descargar información',
    'de-ch': 'Download Information',
    'fr-fr': 'À propos de Spécifier 7',
    'uk-ua': 'Про Specify 7',
    'pt-br': 'Informações para download',
  },
  taxonTiles: {
    'en-us': 'Taxon Tiles',
    'ru-ru': 'Плитки таксонов',
    'es-es': 'Título Táxones',
    'fr-fr': 'Tuiles Taxons',
    'uk-ua': 'Taxon Tiles',
    'de-ch': 'Taxon-Kacheln',
    'pt-br': 'Telhas de táxons',
  },
  taxonTilesDescription: {
    'en-us':
      'Showing Taxa with {count:number|formatted} or more {collectionObjectTable:string} records',
    'ru-ru':
      'Показаны таксоны с {count:number|formatted} или более {collectionObjectTable:string} записями',
    'es-es':
      'Mostrando taxones con {count:number|formatted} o más {collectionObjectTable:string} registros',
    'fr-fr':
      'Affichage des taxons avec des enregistrements {count:number|formatted} ou plus {collectionObjectTable:string}',
    'uk-ua':
      'Показано таксони з {count:number|formatted} або більше {collectionObjectTable:string} записів',
    'de-ch':
      'Zeigt Taxa mit {count:number|formatted} oder mehr {collectionObjectTable:string} Datensätzen',
    'pt-br':
      'Exibindo táxons com {count:number|formatted} ou mais {collectionObjectTable:string} registros',
  },
  fullAddress: {
    'en-us':
      'Specify Collections Consortium <br />\n\nBiodiversity Institute <br />\n\nUniversity of Kansas <br />\n\n1345 Jayhawk Blvd. <br />\n\nLawrence, KS 66045 USA',
    'ru-ru':
      'Specify Collections Consortium <br />\n\nBiodiversity Institute <br />\n\nUniversity of Kansas <br />\n\n1345 Jayhawk Blvd. <br />\n\nLawrence, KS 66045 USA',
    'es-es':
      'Specify Collections Consortium <br />\n\nBiodiversity Institute <br />\n\nUniversity of Kansas <br />\n\n1345 Jayhawk Blvd. <br />\n\nLawrence, KS 66045 USA',
    'fr-fr':
      'Préciser le consortium de collections <br />\n\nInstitut de la Biodiversité <br />\n\nUniversité du Kansas <br />\n\n1345, boulevard Jayhawk. <br />\n\nLawrence, KS 66045 États-Unis',
    'uk-ua':
      'Укажіть консорціум колекцій <br />\n\nІнститут біорізноманіття <br />\n\nУніверситет Канзасу <br />\n\n1345 Jayhawk Blvd. <br />\n\nЛоуренс, KS 66045 США',
    'de-ch':
      'Specify Collections Consortium <br />\n\nBiodiversity Institute <br />\n\nUniversity of Kansas <br />\n\n1345 Jayhawk Blvd. <br />\n\nLawrence, KS 66045 USA',
    'pt-br':
      'Consórcio de Coleções Especificadas <br />\n\nInstituto de Biodiversidade <br />\n\nUniversidade do Kansas <br />\n\n1345 Jayhawk Blvd. <br />\n\nLawrence, KS 66045 EUA',
  },
  disclosure: {
    'en-us':
      "Specify is developed by the Specify Collections Consortium (SCC), a collaborative initiative governed by its members and supported by institutional partners. Software support and development are made possible by consortium members, including the UniMus:Natur Consortium of Norway, the Commonwealth Scientific and Industrial Research Organisation (CSIRO), the Consejo Superior de Investigaciones Científicas (CSIC), the Denmark Consortium of Museums, the Muséum d’Histoire Naturelle Geneva, the University of Florida, the University of Kansas, and the University of Michigan, along with numerous other member collections and institutions within the Consortium. The SCC operates under the University of Kansas Center for Research’s non-profit 501(c)(3) U.S. tax status and received support from U.S. National Science Foundation grants from 1996 to 2018.",
  },
  licence: {
    'en-us':
      'Specify 7, Copyright 2026, University of Kansas Center for Research. Specify comes with ABSOLUTELY NO WARRANTY. This is free, open-source software licensed under GNU General Public License v3.',
  },
  systemInformation: {
    'en-us': 'System Information',
    'ru-ru': 'Системная информация',
    'es-es': 'Información del Sistema',
    'fr-fr': 'Informations système',
    'uk-ua': 'Інформація про систему',
    'de-ch': 'Systeminformationen',
    'pt-br': 'Informações do sistema',
  },
  specifyVersion: {
    'en-us': 'Specify 7 Version:',
    'ru-ru': 'Specify 7 Версия:',
    'es-es': 'Especifique la versión 7:',
    'fr-fr': 'Spécifiez la version 7 :',
    'uk-ua': 'Вкажіть 7 версію:',
    'de-ch': 'Specify 7 Version:',
    'pt-br': 'Especifique 7 versões:',
  },
  gitSha: {
    'en-us': 'Git SHA:',
    'ru-ru': 'Git SHA:',
    'es-es': 'Git SHA:',
    'fr-fr': 'Git SHA :',
    'uk-ua': 'Git SHA:',
    'de-ch': 'Git SHA:',
    'pt-br': 'Git SHA:',
  },
  buildDate: {
    'en-us': 'Build Date:',
    'ru-ru': 'Дата сборки:',
    'es-es': 'La fecha de construcción:',
    'fr-fr': 'Date de construction :',
    'uk-ua': 'Дата збірки:',
    'de-ch': 'Datum des Builds:',
    'pt-br': 'Data de construção:',
  },
  specifySixVersion: {
    'en-us': 'Specify 6 Version:',
    'ru-ru': 'Specify 6 Версия:',
    'es-es': 'Versión de Specify 6:',
    'fr-fr': 'Spécifiez la version 6 :',
    'uk-ua': 'Вкажіть 6 версію:',
    'de-ch': 'Specify 6 Version:',
    'pt-br': 'Especifique 6 versões:',
  },
  databaseVersion: {
    'en-us': 'Database Version:',
    'ru-ru': 'Версия базы данных:',
    'es-es': 'Versión de la Base de Datos:',
    'fr-fr': 'Version de la base de données :',
    'uk-ua': 'Версія бази даних:',
    'de-ch': 'Datenbankversion:',
    'pt-br': 'Versão do banco de dados:',
  },
  schemaVersion: {
    'en-us': 'Database Schema',
    'ru-ru': 'Версия схемы базы данных',
    'es-es': 'Versión del Esquema de base de datos',
    'fr-fr': 'Version du schéma de base de données',
    'uk-ua': 'Версія схеми БД',
    'de-ch': 'Datenbankschema-Version',
    'pt-br': 'Versão do esquema do banco de dados',
  },
  databaseName: {
    'en-us': 'Database Name:',
    'ru-ru': 'Имя базы данных:',
    'es-es': 'Nombre de la Base de Datos:',
    'fr-fr': 'Nom de la base de données :',
    'uk-ua': "Ім'я бази даних:",
    'de-ch': 'Datenbank-Name:',
    'pt-br': 'Nome do banco de dados:',
  },
  isaNumber: {
    comment: 'I believe ISA stands for Institution Service Agreement',
    'en-us': 'ISA Number:',
    'ru-ru': 'Номер ISA:',
    'es-es': 'Número ISA:',
    'fr-fr': 'Numéro ISA :',
    'uk-ua': 'Номер ISA:',
    'de-ch': 'ISA-Nummer:',
    'pt-br': 'Número ISA:',
  },
  browser: {
    'en-us': 'Browser:',
    'ru-ru': 'Браузер:',
    'es-es': 'Navegador:',
    'fr-fr': 'Navigateur:',
    'uk-ua': 'Браузер:',
    'de-ch': 'Browser:',
    'pt-br': 'Navegador:',
  },
  databaseCreationDate: {
    'en-us': 'DB Creation Date:',
    'ru-ru': 'Дата создания базы данных:',
    'es-es': 'Fecha de creación de la base de datos:',
    'fr-fr': 'Date de création de la base de données :',
    'uk-ua': 'Дата створення БД:',
    'de-ch': 'Datenbank Erstelldatum:',
    'pt-br': 'Data de criação do BD:',
  },
} as const);
