/**
 * Localization strings used in the Statistics Page
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

/* eslint-disable @typescript-eslint/naming-convention */
export const statsText = createDictionary({
  holdings: {
    'en-us': 'Holdings',
    'ru-ru': 'Холдинги',
    'es-es': 'Mantenimientos',
  },
  collectionObjects: {
    'en-us': 'Collection Objects',
    'ru-ru': 'Объекты коллекции',
    'es-es': 'Objetos de la Colección',
  },
  typeSpecimens: {
    'en-us': 'Type Specimens',
    'es-es': 'Especímenes Tipo',
  },
  curation: {
    'en-us': 'Curation',
    'es-es': 'Curación',
  },
  loans: {
    'en-us': 'Loans',
    'ru-ru': 'Заемы',
    'es-es': 'Préstamos',
  },
  itemsOnLoans: {
    'en-us': 'Items on Loan',
    'ru-ru': 'Предметы в Займы',
    'es-es': 'Artículos en Préstamo',
  },
  openLoansStat: {
    'en-us': 'Open Loans',
    'ru-ru': 'Открытые Займы',
    'es-es': 'Préstamos Abiertos',
  },
  overdueLoans: {
    'en-us': 'Overdue Loans',
    'ru-ru': 'Просроченные Займы',
    'es-es': 'Préstamos Atrasados',
  },
  localityGeography: {
    'en-us': 'Locality / Geography',
    'ru-ru': 'Местность / География',
    'es-es': 'Localidad / Geografía',
  },
  localities: {
    'en-us': 'Localities',
    'ru-ru': 'Местности',
    'es-es': 'Localidades',
  },
  geographyEntries: {
    'en-us': 'Geography Entries',
    'ru-ru': 'География Записи',
    'es-es': 'Entradas de Geografía',
  },
  countries: {
    'en-us': 'Countries',
    'ru-ru': 'Страны',
    'es-es': 'Países',
  },
  georeferencedLocalities: {
    'en-us': 'Georeferenced Localities',
    'ru-ru': 'Места с географической привязкой',
    'es-es': 'Localidades Georreferenciadas',
  },
  digitization: {
    'en-us': 'Digitization',
    'es-es': 'Digitalización',
  },
  digitizedLastSevenDays: {
    'en-us': 'Digitized Last 7 Days',
    'es-es': 'Digitalizado Últimos 7 Días',
  },
  digitizedLastMonth: {
    'en-us': 'Digitized Last Month',
    'es-es': 'Digitalizado Último Mes',
  },
  digitizedLastYear: {
    'en-us': 'Digitized Last Year',
    'es-es': 'Digitalizado Último Año',
  },
  chooseStatistics: {
    'en-us': 'Choose Statistics',
    'ru-ru': 'Выберите статистику',
    'es-es': 'Seleccionar Estadísticas',
  },
  selectFromQueries: {
    'en-us': 'Select From Queries',
    'es-es': 'Seleccionar de Consultas',
  },
  selectFromAvailableDefault: {
    'en-us': 'Select From Available Default Statistics',
    'es-es': 'Seleccionar de Estadísticas Predeterminadas Disponibles',
  },
  collection: {
    'en-us': 'Collection',
    'ru-ru': 'Коллекция',
    'es-es': 'Colección',
  },
  personal: {
    'en-us': 'Personal',
    'ru-ru': 'Личный',
    'es-es': 'Personal',
  },
  private: {
    'en-us': 'Private',
    'es-es': 'Privado',
  },
  collectionObjectsCataloged: {
    'en-us': 'Collection Objects Cataloged',
    'ru-ru': 'Объекты коллекции каталогизированы',
    'es-es': 'Objetos de la Colección Catalogados',
  },
  collectionObjectsDetermined: {
    'en-us': 'Collection Objects Determined',
    'ru-ru': 'Объекты коллекции определены',
    'es-es': 'Objetos de la Colección Determinados',
  },
  lastRefreshed: {
    'en-us': 'Last refreshed',
    'es-es': 'Última Actualización',
  },
  categoryName: {
    'en-us': 'Category Name',
    'ru-ru': 'Название категории',
    'es-es': 'Nombre de la Categoría',
  },
  itemName: {
    'en-us': 'Item Name',
    'ru-ru': 'Название предмета',
    'es-es': 'Nombre del Item',
  },
  itemValue: {
    'en-us': 'Item Value',
    'ru-ru': 'Стоимость товара',
    'es-es': 'Valor del Ítem',
  },
  downloadAsTSV: {
    'en-us': 'Download as TSV',
    'ru-ru': 'Скачать как TSV',
    'es-es': 'Descargar como TSV',
  },
  shared: {
    'en-us': 'Shared',
    'ru-ru': 'Общий',
    'es-es': 'Compartido',
  },
  statistics: {
    'en-us': 'Statistics',
    'es-es': 'Estadísticas',
  },
  deleteCategory: {
    'en-us': 'Delete Category',
    'es-es': 'Eliminar Categoría',
  },
  editPage: {
    'en-us': 'Edit Page',
    'es-es': 'Editar Página',
  },
  addPage: {
    'en-us': 'Add Page',
    'es-es': 'Agregar Página',
  },
  addACategory: {
    'en-us': 'Add a Category',
    'es-es': 'Agregar una Categoría',
  },
  refresh: {
    'en-us': 'Refresh',
    'es-es': 'Actualizar',
  },
  collectionObjectsWithImages: {
    'en-us': 'Collection Objects with images',
    'es-es': 'Objetos de la Colección con imágenes',
  },
  collectionObjectsWithAttachments: {
    'en-us': 'Collection Objects with attachments',
    'es-es': 'Objetos de la Colección con adjuntos',
  },
  error: {
    'en-us': 'Error',
    'es-es': 'Error',
  },
  taxonRepresented: {
    'en-us': 'Taxa Represented',
    'es-es': 'Taxones Representados',
  },
  geographiesRepresented: {
    'en-us': 'Geographies Represented',
    'es-es': 'Geografías Representadas',
  },
  percentGeoReferenced: {
    'en-us': 'Percent Georeferenced',
    'es-es': 'Porcentaje Georreferenciado',
  },
  percentImaged: {
    'en-us': 'Percent Imaged',
    'es-es': 'Porcentaje Capturado',
  },
  deleteWarning: {
    'en-us': 'Are you sure you want to delete the category?',
  },
  categoryToDelete: {
    'en-us': 'This will permanently delete the following category',
  },
  layoutPreference: {
    'en-us': 'Defines the layout of the statistics page',
  },
  showPreparationsTotal: {
    'en-us': 'Show Preparations Totals',
  },
  showPreparationsTotalDescription: {
    'en-us':
      'If enabled, the default Preparations statistics panel will include a total count for each preparation of a particular preparation type alongside the overall total. This is useful for lot-based collections.',
  },
  autoRefreshRate: {
    'en-us': 'Auto-Refresh Rate (Hours)',
  },
  autoRefreshRateDescription: {
    'en-us':
      'The time interval, in hours, at which the statistics page will automatically refresh its data. Default is 24.',
  },
});
/* eslint-enable @typescript-eslint/naming-convention */
