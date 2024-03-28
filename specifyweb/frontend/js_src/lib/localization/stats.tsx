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
    'es-es': 'Estadísticas de la Colección',
  },
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
  preparations: {
    'en-us': 'Preparations',
    'en-es': 'Preparaciones',
    'ru-ru': 'Подготовки',
  },
  synonymize: {
    'en-us': 'Synonymize',
    'ru-ru': 'Сделать синонимом',
    'es-es': 'Sinonimizar',
  },
  typeSpecimens: {
    'en-us': 'Type Specimens',
    'es-es': 'Especímenes Tipo',
  },
  curation: {
    'en-us': 'Curation',
    'es-es': 'Curación',
  },
  familiesRepresented: {
    'en-us': 'Families Represented',
    'ru-ru': 'Семей',
    'es-es': 'Familias Representadas',
  },
  generaRepresented: {
    'en-us': 'Genera Represented',
    'ru-ru': 'Родов',
    'es-es': 'Géneros Representados',
  },
  speciesRepresented: {
    'en-us': 'Species Represented',
    'ru-ru': 'Видов',
    'es-es': 'Especies Representadas',
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
  openLoans: {
    'en-us': 'Open Loans',
    'ru-ru': 'Открытые Займы',
    'es-es': 'Préstamos Abiertos',
  },
  overdueLoans: {
    'en-us': 'Overdue Loans',
    'ru-ru': 'Просроченные Займы',
    'es-es': 'Préstamos Atrasados',
  },
  taxonomicTree: {
    'en-us': 'Taxon Tree Nodes',
    'es-es': 'Nodos del Árbol Taxonómico',
  },
  classes: {
    'en-us': 'Classes',
    'ru-ru': 'Классы',
    'es-es': 'Clases',
  },
  orders: {
    'en-us': 'Orders',
    'ru-ru': 'Отряды',
    'es-es': 'Órdenes',
  },
  families: {
    'en-us': 'Families',
    'ru-ru': 'Семьи',
    'es-es': 'Familias',
  },
  genera: {
    'en-us': 'Genera',
    'ru-ru': 'Роды',
    'es-es': 'Géneros',
  },
  species: {
    'en-us': 'Species',
    'ru-ru': 'Разновидносты',
    'es-es': 'Especies',
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
  pageName: {
    'en-us': 'Page Name',
    'ru-ru': 'Название страницы',
    'es-es': 'Nombre de la Página',
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
  collectionObjectsModified: {
    'en-us': 'Collection Objects Modified',
    'ru-ru': 'Объекты коллекции изменены',
    'es-es': 'Objetos de la Colección Modificados',
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
  collectionObjectsInventorized: {
    'en-us': 'Collection Objects Inventorized',
    'es-es': 'Objetos de la Colección Inventariados',
  },
  lastRefreshed: {
    'en-us': 'Last refreshed',
    'es-es': 'Última Actualización',
  },
  source: {
    'en-us': 'Source',
    'ru-ru': 'Источник',
    'es-es': 'Fuente',
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
  customDeleteWarning: {
    'en-us':
      'The category you are about to delete contains custom statistics which are not recoverable if not saved as queries. Check if you want to save a custom statistic as a query before deleting this category.',
    'es-es':
      'La categoría que está a punto de eliminar contiene estadísticas personalizadas que no se pueden recuperar si no se guardan como consultas. Compruebe si desea guardar una estadística personalizada como consulta antes de eliminar esta categoría.',
  },
  statistics: {
    'en-us': 'Statistics',
    'es-es': 'Estadísticas',
  },
  showStatistics: {
    'en-us': 'Show Statistics',
    'es-es': 'Mostrar Estadísticas',
  },
  deleteCategory: {
    'en-us': 'Delete Category',
    'es-es': 'Eliminar Categoría',
  },
  name: {
    'en-us': 'Name',
    'es-es': 'Nombre',
  },
  categoryContainsCustom: {
    'en-us': 'Category Contains Custom Statistics',
    'es-es': 'La Categoría Contiene Estadísticas Personalizadas',
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
  attachments: {
    'en-us': 'Attachments',
    'es-es': 'Adjuntos',
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
});
/* eslint-enable @typescript-eslint/naming-convention */
