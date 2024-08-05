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
  },
  aboutSpecify: {
    'en-us': 'About Specify 7',
    'ru-ru': 'О Specify 7',
    'es-es': 'Sobre Specify',
    'fr-fr': 'À propos de Spécifier 7',
    'uk-ua': 'Про Specify 7',
    'de-ch': 'Über Specify 7',
  },
  downloadInformation: {
    'en-us': 'Download Information',
    'ru-ru': 'Скачать информацию',
    'es-es': 'Descargar información',
    'de-ch': 'Download Information',
    'fr-fr': 'À propos de Spécifier 7',
    'uk-ua': 'Про Specify 7',
  },
  taxonTiles: {
    'en-us': 'Taxon Tiles',
    'ru-ru': 'Плитки таксонов',
    'es-es': 'Título Táxones',
    'fr-fr': 'Tuiles Taxons',
    'uk-ua': 'Taxon Tiles',
    'de-ch': 'Taxon-Kacheln',
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
      Affichage des taxons avec des enregistrements {count:number|formatted} ou
      plus {collectionObjectTable:string}
    `,
    'uk-ua': `
      Показано таксони з {count:number|formatted} або більше
      {collectionObjectTable:string} записів
    `,
    'de-ch': `
      Zeigt Taxa mit {count:number|formatted} oder mehr
      {collectionObjectTable:string} Datensätzen
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
      Specify Collections Consortium <br />

      Biodiversity Institute <br />

      University of Kansas <br />

      1345 Jayhawk Blvd. <br />

      Lawrence, KS 66045 USA
    `,
    'fr-fr': `
      Préciser le consortium de collections <br />

      Institut de la Biodiversité <br />

      Université du Kansas <br />

      1345, boulevard Jayhawk. <br />

      Lawrence, KS 66045 États-Unis
    `,
    'uk-ua': `
      Укажіть консорціум колекцій <br />

      Інститут біорізноманіття <br />

      Університет Канзасу <br />

      1345 Jayhawk Blvd. <br />

      Лоуренс, KS 66045 США
    `,
    'de-ch': `
      Specify Collections Consortium <br />

      Biodiversity Institute <br />

      University of Kansas <br />

      1345 Jayhawk Blvd. <br />

      Lawrence, KS 66045 USA
    `,
  },
  disclosure: {
    'en-us': `
      Specify software is a product of the Specify Collections Consortium that
      is governed and funded by its member institutions. Consortium Founding
      Members include: Commonwealth Scientific and Industrial Research
      Organisation (CSIRO), Consejo Superior de Investigaciones Científicas,
      Denmark Consortium of Museums, Muséum d'Histoire Naturelle Geneva,
      University of Florida, University of Kansas, and University of Michigan.
      The Consortium operates under the non-profit, 501(c)3, U.S. tax status of
      the University of Kansas Center for Research. Specify was supported from
      1996 to 2018 by grants from the U.S. National Science Foundation.
    `,
    'ru-ru': `
      Specify software является продуктом консорциума Specify Collections.
      который управляется и финансируется организациями-членами.
      Члены-учредители консорциума включают: Commonwealth Scientific and
      Industrial Research Organisation (CSIRO), Consejo Superior de
      Investigaciones Científicas, Denmark Consortium of Museums, Muséum
      d'Histoire Naturelle Geneva, University of Florida, University of Kansas,
      и University of Michigan. Консорциум действует под некоммерческой
      организацией, 501(c)3, налоговым статусом США университета University of
      Kansas. Specify поддерживался с 1996 по 2018 год грантами фонда U.S.
      National Science Foundation.
    `,
    'es-es': `
      Specify Software es un producto de Specify Collections Consortium,
      financiado por sus instituciones miembro. Los Miembros Fundadores del
      Consorcio incluyen: Commonwealth Scientific and Industrial Research
      Organisation (CSIRO), Consejo Superior de Investigaciones Científicas
      (CSIC), Denmark Consortium of Museums, Muséum d'Histoire Naturelle
      Geneva, University of Florida, University of Kansas y University of
      Michigan. El Consorcio opera bajo las condiciones fiscales de 501(c)3 de
      EE.UU. como organización sin ánimo de lucro, University of Kansas Center
      for Research. Specify ha sido financiado entre 1996 y 2018 por múltiples
      ayudas de U.S. National Science Foundation.
    `,
    'fr-fr': `
      Le logiciel Specify est un produit du Specify Collections Consortium qui
      est régi et financé par ses institutions membres. Les membres fondateurs
      du consortium comprennent : l'Organisation de recherche scientifique et
      industrielle du Commonwealth (CSIRO), le Consejo Superior de
      Investigaciones Científicas, le Consortium danois des musées, le Muséum
      d'Histoire Naturelle de Genève, l'Université de Floride, l'Université du
      Kansas et l'Université du Michigan. Le Consortium opère sous le statut
      fiscal américain à but non lucratif 501(c)3 du Centre de recherche de
      l'Université du Kansas. Specify a été soutenu de 1996 à 2018 par des
      subventions de la National Science Foundation des États-Unis.
    `,
    'uk-ua': `
      Програмне забезпечення Specify є продуктом консорціуму Specify Collections
      Consortium, яким керують і фінансують установи-члени. Члени-засновники
      консорціуму включають: Науково-промислову дослідницьку організацію
      Співдружності (CSIRO), Consejo Superior de Investigaciones Sientíficas,
      Датський консорціум музеїв, Muséum d'Histoire Naturelle Geneva,
      Університет Флориди, Університет Канзасу та Університет Мічигану.
      Консорціум працює відповідно до некомерційного, 501(c)3, податкового
      статусу США дослідницького центру Канзаського університету. З 1996 по
      2018 рік Specify підтримувався грантами Національного наукового фонду
      США.
    `,
    'de-ch': `
      Die Specify-Software ist ein Produkt des Specify Collections Consortiums,
      das von seinen Mitgliedsinstitutionen verwaltet und finanziert wird. Zu
      den Gründungsmitgliedern des Konsortiums gehören: Commonwealth Scientific
      and Industrial Research Organisation (CSIRO), Consejo Superior de
      Investigaciones Científicas, Denmark Consortium of Museums, Muséum
      d'Histoire Naturelle Geneva, University of Florida, University of Kansas,
      University of Michigan. Das Konsortium arbeitet unter dem
      gemeinnützigen, 501(c)3, U.S. Steuerstatus des University of Kansas Center
      for Research. Specify wurde von 1996 bis 2018 durch Zuschüsse der U.S.
      National Science Foundation unterstützt.
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
      Specify 7 Copyright © 2023 University of Kansas Center for Research.
      Specify viene SIN NINGUNA GARANTÍA EN ABSOLUTO. Este es un programa
      libre, bajo licencia GNU General Public License 2 (GPL2).
    `,
    'fr-fr': `
      Spécifiez 7, Copyright 2023, Centre de recherche de l'Université du
      Kansas. Specify est livré avec ABSOLUMENT AUCUNE GARANTIE. Il s'agit d'un
      logiciel gratuit et open source sous licence GNU General Public License
      v2.
    `,
    'uk-ua': `
      Укажіть 7, авторське право 2023, Дослідницький центр Канзаського
      університету. Specify поставляється без АБСОЛЮТНОЇ ГАРАНТІЇ. Це
      безкоштовне програмне забезпечення з відкритим кодом, ліцензоване згідно з
      GNU General Public License v2.
    `,
    'de-ch': `
      Specify 7, Copyright 2023, University of Kansas Center for Research.
      Specify kommt mit ABSOLUT KEINER GARANTIE. Dies ist freie, quelloffene
      Software, lizenziert unter GNU General Public License v2.
    `,
  },
  systemInformation: {
    'en-us': 'System Information',
    'ru-ru': 'Системная информация',
    'es-es': 'Información del Sistema',
    'fr-fr': 'Informations système',
    'uk-ua': 'Інформація про систему',
    'de-ch': 'Systeminformationen',
  },
  specifyVersion: {
    'en-us': 'Specify 7 Version:',
    'ru-ru': 'Specify 7 Версия:',
    'es-es': 'Especifique la versión 7:',
    'fr-fr': 'Spécifiez la version 7 :',
    'uk-ua': 'Вкажіть 7 версію:',
    'de-ch': 'Specify 7 Version:',
  },
  gitSha: {
    'en-us': 'Git SHA:',
    'ru-ru': 'Git SHA:',
    'es-es': 'Git SHA:',
    'fr-fr': 'Git SHA :',
    'uk-ua': 'Git SHA:',
    'de-ch': 'Git SHA:',
  },
  buildDate: {
    'en-us': 'Build Date:',
    'ru-ru': 'Дата сборки:',
    'es-es': 'La fecha de construcción:',
    'fr-fr': 'Date de construction:',
    'uk-ua': 'Дата збірки:',
    'de-ch': 'Datum des Builds:',
  },
  specifySixVersion: {
    'en-us': 'Specify 6 Version:',
    'ru-ru': 'Specify 6 Версия:',
    'es-es': 'Versión de Specify 6:',
    'fr-fr': 'Spécifiez la version 6 :',
    'uk-ua': 'Вкажіть 6 версію:',
    'de-ch': 'Specify 6 Version:',
  },
  databaseVersion: {
    'en-us': 'Database Version:',
    'ru-ru': 'Версия базы данных:',
    'es-es': 'Versión de la Base de Datos:',
    'fr-fr': 'Version de la base de données :',
    'uk-ua': 'Версія бази даних:',
    'de-ch': 'Datenbankversion:',
  },
  schemaVersion: {
    'en-us': 'DB Schema Version',
    'ru-ru': 'Версия схемы базы данных',
    'es-es': 'Versión del Esquema de base de datos',
    'fr-fr': 'Version du schéma de base de données',
    'uk-ua': 'Версія схеми БД',
    'de-ch': 'Datenbankschema-Version',
  },
  databaseName: {
    'en-us': 'Database Name:',
    'ru-ru': 'Имя базы данных:',
    'es-es': 'Nombre de la Base de Datos:',
    'fr-fr': 'Nom de la base de données:',
    'uk-ua': "Ім'я бази даних:",
    'de-ch': 'Datenbank-Name:',
  },
  isaNumber: {
    comment: 'I believe ISA stands for Institution Service Agreement',
    'en-us': 'ISA Number:',
    'ru-ru': 'Номер ISA:',
    'es-es': 'Número ISA:',
    'fr-fr': 'Numéro ISA :',
    'uk-ua': 'Номер ISA:',
    'de-ch': 'ISA-Nummer:',
  },
  browser: {
    'en-us': 'Browser:',
    'ru-ru': 'Браузер:',
    'es-es': 'Navegador:',
    'fr-fr': 'Navigateur:',
    'uk-ua': 'Браузер:',
    'de-ch': 'Browser:',
  },
  databaseCreationDate: {
    'en-us': 'DB Creation Date:',
    'ru-ru': 'Дата создания базы данных:',
    'es-es': 'Fecha de creación de la base de datos:',
    'fr-fr': 'Date de création de la base de données :',
    'uk-ua': 'Дата створення БД:',
    'de-ch': 'Datenbank Erstelldatum:',
  },
} as const);
