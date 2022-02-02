import $ from 'jquery';

/*
 * Return a table DOM node with <col> defined based on the columnDef attr of a
 * viewdef.
 */
export function processColumnDefinition(columnDefinition: string) {
  return $(`<table>
  <colgroup>
    ${columnDefinition
      .split(',')
      .filter((_, index) => index % 2 === 0)
      .map((definition) => /(\d+)px/.exec(definition)?.[1])
      .map((width) =>
        typeof width === 'string' ? `<col width="${width}px" />` : '<col />'
      )
      .join('')}
  </colgroup>
</table>`);
}
