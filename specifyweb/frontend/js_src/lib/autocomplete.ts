import $ from 'jquery';
import _ from 'underscore';

import type { IR, RA } from './components/wbplanview';

let dataListCount = 0;
const debounceRate = 300;

export default function autocomplete({
  input,
  source,
  minLength = 1,
  delay = debounceRate,
}: {
  input: HTMLInputElement;
  source: (value: string) => Promise<RA<string> | IR<string>>;
  minLength: number;
  delay: number;
}): () => void {
  const id = `autocomplete-data-list=${dataListCount}`;
  dataListCount += 1;

  const dataList = document.createElement('datalist');
  dataList.id = id;
  input.setAttribute('list', id);
  const container = input.parentElement;
  if (container === null) throw new Error('Input has no parent element');
  container.append(dataList);

  function eventHandler(): void {
    if (input.value.length < minLength) return;

    source(input.value)
      .then((values) => {
        const useKeys = !Array.isArray(values);
        const entries = Object.entries(values);

        // Don't delete previous autocomplete results if no new results returned
        if (dataList.childElementCount !== 0 && entries.length === 0) return;

        $(dataList).empty();
        entries.forEach(([value, label]) => {
          const option = document.createElement('option');
          if (useKeys) {
            option.value = value;
            option.textContent = label;
          } else option.value = label;
          $(dataList).append(option);
        });
      })
      .catch(console.error);
  }

  const throttledHandler = _.debounce(eventHandler, delay);
  input.addEventListener('keydown', throttledHandler);
  return (): void => {
    input.removeEventListener('keydown', throttledHandler);
    dataList.remove();
    input.removeAttribute('list');
  };
}
