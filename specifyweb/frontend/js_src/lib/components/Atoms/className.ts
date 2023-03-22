/**
 * If dialog contains a button with this className, it will use that icon
 * by default
 */
export const dialogIconTriggers = {
  // Icons are ordered by precedence
  none: '',
  error: 'dialog-icon-error',
  warning: 'dialog-icon-warning',
  success: 'dialog-icon-success',
  info: 'dialog-icon-info',
};

const buttonClassName = 'button';
const grayButton = `${buttonClassName} hover:bg-gray-400 bg-gray-300 text-gray-800 shadow-sm
    dark:bg-neutral-600 dark:text-gray-100 hover:dark:bg-neutral-500`;
const lightGrayButton = `${buttonClassName} hover:bg-gray-400 bg-gray-100 text-gray-800 shadow-sm
    dark:bg-neutral-600 dark:text-gray-100 hover:dark:bg-neutral-500`;
const containerBaseUnstyled = `flex flex-col gap-4 overflow-scroll
  overflow-x-auto [overflow-y:overlay] [scrollbar-gutter:stable]`;
const containerBase = `${containerBaseUnstyled} bg-[color:var(--form-foreground)]
  rounded p-4 shadow-gray-400 shadow-2xl`;
const containerFull = 'flex flex-col gap-4 sm:h-full p-1 sm:p-4';
const formStyles =
  'text-[length:var(--form-font-size)] font-[family-name:var(--form-font-family)]';
const niceButton = `${buttonClassName} rounded cursor-pointer active:brightness-80 px-4 py-2
    disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:!bg-neutral-700 gap-2
    inline-flex items-center capitalize justify-center shadow-sm`;
const borderedGrayButton = `${grayButton} ring-1 ring-gray-400 shadow-sm dark:ring-0
    disabled:ring-gray-400 disabled:dark:ring-neutral-500`;

// REFACTOR: reduce this once everything is using React. Can move things into tailwind.config.js
export const className = {
  /*
   * Most fields in Specify are rendered on top of var(--form-background). For
   * some fields that are rendered on top of var(--background), this class
   * name is added to prevent background from clashing
   */
  hasAltBackground: 'has-alt-background',
  /*
   * Do not show validation errors until tried to submit the form or field lost
   * focus
   * These class names are negated so that if you forgot to add it in some
   * place, the validation errors do not get permanently silenced
   */
  notSubmittedForm: 'not-submitted',
  /*
   * Used to disable default aria-current="page" styles for links and
   * aria-pressed="true" for buttons
   */
  ariaHandled: 'aria-handled',
  notTouchedInput: 'not-touched',
  label: 'flex flex-col',
  labelForCheckbox: 'cursor-pointer inline-flex gap-1 items-center',
  textArea: 'max-w-full min-w-[theme(spacing.20)] min-h-[theme(spacing.8)]',
  button: buttonClassName,
  link: 'link',
  icon: 'icon link',
  grayButton,
  lightGrayButton,
  niceButton,
  smallButton: `${niceButton} !py-1 !px-2`,
  borderedGrayButton,
  defaultSmallButtonVariant: `${borderedGrayButton} hover:bg-brand-200 dark:hover:bg-brand-400`,
  redButton: `${dialogIconTriggers.error} hover:bg-red-800 bg-red-700 text-white`,
  blueButton: `${dialogIconTriggers.info} hover:bg-blue-700 bg-blue-600 text-white`,
  orangeButton: `${dialogIconTriggers.warning} hover:bg-orange-600 bg-orange-500 text-white`,
  greenButton: `${dialogIconTriggers.success} hover:bg-green-800 bg-green-700 text-white`,
  fancyButton: `bg-gray-300 hover:bg-brand-200 dark:bg-neutral-600
    hover:dark:bg-brand:400 text-gray-800 dark:text-white text-center`,
  containerFull,
  containerFullGray: `${containerFull} bg-[color:var(--form-background)]`,
  containerBaseUnstyled,
  containerBase,
  containerCenter: `${containerBase} max-w-[min(100%,var(--form-max-width))]
    mx-auto w-full ${formStyles}`,
  formHeader:
    'border-b-2 border-brand-300 flex items-center pb-2 gap-2 md:gap-4 md:justify-between flex-col md:flex-row',
  formTitle: 'text-lg font-bold flex items-center gap-2',
  formStyles,
  limitedWidth: `max-w-[min(100%,var(--max-field-width))]`,
  headerPrimary: 'font-semibold text-black dark:text-white',
  headerGray: 'text-gray-500 dark:text-neutral-400',
  // These values must be synchronised with main.css
  dataEntryGrid: 'data-entry-grid',
  formFooter:
    'border-brand-300 border-t-2 flex print:hidden pt-2 gap-2 flex-wrap justify-center flex-col md:flex-row',
  dataEntryAdd: '!text-green-700 print:hidden',
  dataEntryView: '!text-orange-400 print:hidden',
  dataEntryEdit: '!text-orange-400 print:hidden',
  dataEntryClone: '!text-amber-700 print:hidden',
  dataEntrySearch: '!text-blue-500 print:hidden',
  dataEntryRemove: '!text-red-700 print:hidden',
  dataEntryVisit: '!text-blue-700 print:hidden',
} as const;
