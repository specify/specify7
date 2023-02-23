/**
 * Localization strings used in the Statistics Page
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

/* eslint-disable @typescript-eslint/naming-convention */
export const statsText = createDictionary({
  collectionStatistics: {
    'en-us': 'Collection Statistics',
    'ru-ru': 'Статистика коллекции',
  },
  holdings: {
    'en-us': 'Holdings',
    'ru-ru': 'Холдинги',
  },
  collectionObjects: {
    'en-us': 'Collection Objects',
    'ru-ru': 'Объекты коллекции',
  },
  preparations: {
    'en-us': 'Preparations',
  },
  synonymize: {
    'en-us': 'Synonymize',
    'ru-ru': 'Сделать синонимом',
  },
  typeSpecimens: {
    'en-us': 'Type Specimens',
  },
  familiesRepresented: {
    'en-us': 'Families Represented',
    'ru-ru': 'Семей',
  },
  generaRepresented: {
    'en-us': 'Genera Represented',
    'ru-ru': 'Родов',
  },
  speciesRepresented: {
    'en-us': 'Species Represented',
    'ru-ru': 'Видов',
  },
  loans: {
    'en-us': 'Loans',
    'ru-ru': 'Заемы',
  },
  itemsOnLoans: {
    'en-us': 'Items on Loan',
    'ru-ru': 'Предметы в Займы',
  },
  openLoans: {
    'en-us': 'Open Loans',
    'ru-ru': 'Открытые Займы',
  },
  overdueLoans: {
    'en-us': 'Overdue Loans',
    'ru-ru': 'Просроченные Займы',
  },
  taxonomicTree: {
    'en-us': 'Taxonomic Tree',
    'ru-ru': 'Таксономическое дерево',
  },
  classes: {
    'en-us': 'Classes',
    'ru-ru': 'Классы',
  },
  orders: {
    'en-us': 'Orders',
    'ru-ru': 'Отряды',
  },
  families: {
    'en-us': 'Families',
    'ru-ru': 'Семьи',
  },
  genera: {
    'en-us': 'Genera',
    'ru-ru': 'Роды',
  },
  species: {
    'en-us': 'Species',
    'ru-ru': 'Разновидносты',
  },
  localityGeography: {
    'en-us': 'Locality / Geography',
    'ru-ru': 'Местность / География',
  },
  localities: {
    'en-us': 'Localities',
    'ru-ru': 'Местности',
  },
  geographyEntries: {
    'en-us': 'Geography Entries',
    'ru-ru': 'География Записи',
  },
  countries: {
    'en-us': 'Countries',
    'ru-ru': 'Страны',
  },
  georeferencedLocalities: {
    'en-us': 'Georeferenced Localities',
    'ru-ru': 'Места с географической привязкой',
  },
  computerization: {
    'en-us': 'Computerization',
    'ru-ru': 'Компьютеризация',
  },
  computerizedLastSevenDays: {
    'en-us': 'Computerized Last 7 Days',
    'ru-ru': 'Компьютеризировано за последние 7 дней',
  },
  computerizedLastMonth: {
    'en-us': 'Computerized Last Month',
    'ru-ru': 'Компьютеризировано за последний месяц',
  },
  computerizedLastYear: {
    'en-us': 'Computerized Last Year',
    'ru-ru': 'Компьютеризация в прошлом году',
  },
  chooseStatistics: {
    'en-us': 'Choose Statistics',
    'ru-ru': 'Выберите статистику',
  },
  selectFromQueries: {
    'en-us': 'Select From Queries',
    'ru-ru': 'Выбрать из запросов',
  },
  selectFromDefault: {
    'en-us': `${'Select ' + 'From ' + ' Default'}`,
    'ru-ru': 'Выбрать по умолчанию',
  },
  pageName: {
    'en-us': 'Page Name',
    'ru-ru': 'Название страницы',
  },
  collection: {
    'en-us': 'Collection',
    'ru-ru': 'Коллекция',
  },
  personal: {
    'en-us': 'Personal',
    'ru-ru': 'Личный',
  },
  collectionObjectsModified: {
    'en-us': 'Collection Objects Modified',
    'ru-ru': 'Объекты коллекции изменены',
  },
  collectionObjectsCataloged: {
    'en-us': 'Collection Objects Cataloged',
    'ru-ru': 'Объекты коллекции каталогизированы',
  },
  collectionObjectsDetermined: {
    'en-us': 'Collection Objects Determined',
    'ru-ru': 'Объекты коллекции определены',
  },
  collectionObjectsInventorized: {
    'en-us': 'Collection Objects Inventorized',
  },
  lastUpdated: {
    'en-us': 'Last Updated',
    'ru-ru': 'Последнее обновление',
  },
  source: {
    'en-us': 'Source',
    'ru-ru': 'Источник',
  },
  categoryName: {
    'en-us': 'Category Name',
    'ru-ru': 'Название категории',
  },
  itemName: {
    'en-us': 'Item Name',
    'ru-ru': 'Название предмета',
  },
  itemValue: {
    'en-us': 'Item Value',
    'ru-ru': 'Стоимость товара',
  },
  downloadAsTSV: {
    'en-us': 'Download as TSV',
    'ru-ru': 'Скачать как TSV',
  },
  shared: {
    'en-us': 'Shared',
    'ru-ru': 'Общий',
  },
  customDeleteWarning: {
    'en-us':
      'The category you are about to delete contains custom statistics which are not recoverable if not saved as queries. Check if you want to save a custom statistic as a query before deleting this category.',
  },
  statistics: {
    'en-us': 'Statistics',
  },
  showStatistics: {
    'en-us': 'Show Statistics',
  },
  deleteCategory: {
    'en-us': 'Delete Category',
  },
  name: {
    'en-us': 'Name',
  },
  categoryContainsCustom: {
    'en-us': 'Category Contains Custom Statistics',
  },
  editPage: {
    'en-us': 'Edit Page',
  },
  addACategory: {
    'en-us': 'Add A Category',
  },
});
/* eslint-enable @typescript-eslint/naming-convention */
