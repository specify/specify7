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
    'es-es': 'Bienvenidos',
    'fr-fr': 'Accueillir',
    'uk-ua': 'Ласкаво просимо',
  },
  aboutSpecify: {
    'en-us': 'About Specify 7',
    'ru-ru': 'О Specify 7',
    'es-es': 'Acerca de Especificar 7',
    'fr-fr': 'À propos de Spécifier 7',
    'uk-ua': 'Про Specify 7',
  },
  downloadInformation: {
    'en-us': 'Download Information',
    'ru-ru': 'Скачать информацию',
    'es-es': 'Descargar información',
    'fr-fr': "Télécharger l'information",
    'uk-ua': 'Завантажити інформацію',
  },
  taxonTiles: {
    'en-us': 'Taxon Tiles',
    'ru-ru': 'Плитки таксонов',
    'es-es': 'Azulejos de taxón',
    'fr-fr': 'Tuiles Taxon',
    'uk-ua': 'Taxon Tiles',
  },
  taxonTilesDescription: {
    'en-us': `
      Showing Taxa with {count:number|formatted} or more
      {collectionObjectTable:string} records
    `,
    'ru-ru': `
      Показаны таксоны с {count:number|formatted} или более
      {collectionObjectTable:string} записями
    `,
    'es-es': `
      Mostrando taxones con {count:number|formatted} o más
      {collectionObjectTable:string} registros
    `,
    'fr-fr': `
      Affichage des taxons avec {count:number|formatted} ou plusieurs
      enregistrements {collectionObjectTable:string}
    `,
    'uk-ua': `
      Показано таксони з {count:number|formatted} або більше
      {collectionObjectTable:string} записів
    `,
  },
  fullAddress: {
    'en-us': `
      Specify Collections Consortium <br />

      Biodiversity Institute <br />

      University of Kansas <br />

      1345 Jayhawk Blvd. <br />

      Lawrence, KS 66045 USA
    `,
    'ru-ru': `
      Specify Collections Consortium <br />

      Biodiversity Institute <br />

      University of Kansas <br />

      1345 Jayhawk Blvd. <br />

      Lawrence, KS 66045 USA
    `,
    'es-es': `
      Especificar consorcio de recolección <br />

      Instituto de Biodiversidad <br />

      Universidad de Kansas <br />

      1345, Bulevar Jayhawk <br />

      Lawrence, KS 66045 Estados Unidos
    `,
    'fr-fr': `
      Spécifiez le consortium de collections <br />

      Institut de la biodiversité <br />

      Université du Kansas <br />

      1345, boul. Jayhawk <br />

      Lawrence, KS 66045 États-Unis
    `,
    'uk-ua': `
      Укажіть консорціум колекцій <br />

      Інститут біорізноманіття <br />

      Університет Канзасу <br />

      1345 Jayhawk Blvd. <br />

      Лоуренс, KS 66045 США
    `,
  },
  disclosure: {
    'en-us': `
      Specify software is a product of the Specify Collections Consortium that
      is governed and funded by its member institutions. Consortium Founding
      Members include: Commonwealth Scientific and Industrial Research
      Organisation (CSIRO), Denmark Consortium of Museums, University of
      Florida, University of Kansas, and University of Michigan. The Consortium
      operates under the non-profit, 501(c)3, U.S. tax status of the University
      of Kansas Center for Research. Specify was supported from 1996 to 2018 by
      grants from the U.S. National Science Foundation.
    `,
    'ru-ru': `
      Specify software является продуктом консорциума Specify Collections.
      который управляется и финансируется организациями-членами.
      Члены-учредители консорциума включают: Commonwealth Scientific and
      Industrial Research Organisation (CSIRO), University of Michigan,
      University of Florida, Denmark Consortium of Museums и University of
      Kansas. Консорциум действует под некоммерческой организацией, 501(c)3,
      налоговым статусом США университета University of Kansas. Specify
      поддерживался с 1996 по 2018 год грантами фонда U.S. National Science
      Foundation.
    `,
    'es-es': `
      El software Specific es un producto de Specific Collections Consortium,
      que está dirigido y financiado por sus instituciones miembros. Los
      miembros fundadores del consorcio incluyen: la Organización de
      Investigación Científica e Industrial de la Commonwealth (CSIRO), el
      Consorcio de Museos de Dinamarca, la Universidad de Florida, la
      Universidad de Kansas y la Universidad de Michigan. El Consorcio opera
      bajo el estado fiscal estadounidense 501(c)3, sin fines de lucro, del
      Centro de Investigación de la Universidad de Kansas. Specific fue apoyado
      desde 1996 hasta 2018 por subvenciones de la Fundación Nacional de
      Ciencias de EE. UU.
    `,
    'fr-fr': `
      Le logiciel Spécifier est un produit du Consortium Spécifier les
      collections qui est régi et financé par ses institutions membres. Les
      membres fondateurs du consortium comprennent : l'Organisation de recherche
      scientifique et industrielle du Commonwealth (CSIRO), le Consortium des
      musées du Danemark, l'Université de Floride, l'Université du Kansas et
      l'Université du Michigan. Le Consortium opère sous le statut fiscal
      américain 501(c)3 à but non lucratif du Centre de recherche de
      l'Université du Kansas. Spécifier a été soutenu de 1996 à 2018 par des
      subventions de la U.S. National Science Foundation.
    `,
    'uk-ua': `
      Програмне забезпечення Specify є продуктом консорціуму Specify Collections
      Consortium, яким керують і фінансують установи-члени. Члени-засновники
      Консорціуму включають: Науково-промислову дослідницьку організацію
      Співдружності (CSIRO), Консорціум музеїв Данії, Університет Флориди,
      Університет Канзасу та Мічиганський університет. Консорціум діє відповідно
      до некомерційного, 501(c)3, податкового статусу США Центру досліджень
      Канзаського університету. З 1996 по 2018 рік Specify підтримувався
      грантами Національного наукового фонду США.
    `,
  },
  licence: {
    'en-us': `
      Specify 7, Copyright 2023, University of Kansas Center for Research.
      Specify comes with ABSOLUTELY NO WARRANTY. This is free, open-source
      software licensed under GNU General Public License v2.
    `,
    'ru-ru': `
      Specify 7, Авторские права 2023, University of Kansas для исследования.
      Specify поставляется с СОВЕРШЕННО ОТСУТСТВИЕМ ГАРАНТИИ. Это бесплатное
      программное обеспечение с открытым исходным кодом под лицензией GNU
      General Public License v2.
    `,
    'es-es': `
      Especificar 7, Copyright 2023, Centro de Investigación de la Universidad
      de Kansas. Especificar viene con ABSOLUTAMENTE NINGUNA GARANTÍA. Este es
      un software gratuito de código abierto con licencia GNU General Public
      License v2.
    `,
    'fr-fr': `
      Spécifiez 7, Copyright 2023, Centre de recherche de l'Université du
      Kansas. Spécifier est livré avec ABSOLUMENT AUCUNE GARANTIE. Il s'agit
      d'un logiciel open source gratuit sous licence GNU General Public License
      v2.
    `,
    'uk-ua': `
      Укажіть 7, Copyright 2023, Дослідницький центр Канзаського університету.
      Specify поставляється без АБСОЛЮТНОЇ ГАРАНТІЇ. Це безкоштовне програмне
      забезпечення з відкритим кодом, ліцензоване згідно з GNU General Public
      License v2.
    `,
  },
  systemInformation: {
    'en-us': 'System Information',
    'ru-ru': 'Системная информация',
    'es-es': 'Información del sistema',
    'fr-fr': 'Informations système',
    'uk-ua': 'Інформація про систему',
  },
  specifyVersion: {
    'en-us': 'Specify 7 Version:',
    'ru-ru': 'Specify 7 Версия:',
    'es-es': 'Especifique la versión 7:',
    'fr-fr': 'Spécifiez 7 versions :',
    'uk-ua': 'Вкажіть 7 версію:',
  },
  gitSha: {
    'en-us': 'Git SHA:',
    'ru-ru': 'Git SHA:',
    'es-es': 'Git SHA:',
    'fr-fr': 'Git SHA :',
    'uk-ua': 'Git SHA:',
  },
  buildDate: {
    'en-us': 'Build Date:',
    'ru-ru': 'Дата сборки:',
    'es-es': 'La fecha de construcción:',
    'fr-fr': 'Date de construction:',
    'uk-ua': 'Дата збірки:',
  },
  specifySixVersion: {
    'en-us': 'Specify 6 Version:',
    'ru-ru': 'Specify 6 Версия:',
    'es-es': 'Especifique 6 Versión:',
    'fr-fr': 'Spécifiez 6 versions :',
    'uk-ua': 'Вкажіть 6 версію:',
  },
  databaseVersion: {
    'en-us': 'Database Version:',
    'ru-ru': 'Версия базы данных:',
    'es-es': 'Versión de la base de datos:',
    'fr-fr': 'Version de la base de données :',
    'uk-ua': 'Версія бази даних:',
  },
  schemaVersion: {
    'en-us': 'DB Schema Version',
    'ru-ru': 'Версия схемы базы данных',
    'es-es': 'Versión del esquema de base de datos',
    'fr-fr': 'Version du schéma de base de données',
    'uk-ua': 'Версія схеми БД',
  },
  databaseName: {
    'en-us': 'Database Name:',
    'ru-ru': 'Имя базы данных:',
    'es-es': 'Nombre de la base de datos:',
    'fr-fr': 'Nom de la base de données:',
    'uk-ua': "Ім'я бази даних:",
  },
  isaNumber: {
    comment: 'I believe ISA stands for Institution Service Agreement',
    'en-us': 'ISA Number:',
    'ru-ru': 'Номер ISA:',
    'es-es': 'Número ISA:',
    'fr-fr': 'Numéro ISA :',
    'uk-ua': 'Номер ISA:',
  },
  browser: {
    'en-us': 'Browser:',
    'ru-ru': 'Браузер:',
    'es-es': 'Navegador:',
    'fr-fr': 'Navigateur:',
    'uk-ua': 'Браузер:',
  },
  databaseCreationDate: {
    'en-us': 'DB Creation Date:',
    'ru-ru': 'Дата создания базы данных:',
    'es-es': 'Fecha de creación de la base de datos:',
    'fr-fr': 'Date de création de la BD :',
    'uk-ua': 'Дата створення БД:',
  },
} as const);
