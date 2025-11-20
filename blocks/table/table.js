import { FranklinBlock } from '../../scripts/lib-franklin.js';

/**
 * Creates an HTML table element from a div-based table structure
 * @param {HTMLElement} htmlMarkup - The div element containing the table structure
 * @returns {HTMLTableElement} The generated HTML table element
 */
const createHtmlTableFromDivs = (htmlMarkup) => {
  let title;
  let disclaimer;
  const table = document.createElement('table');

  const rows = Array.from(htmlMarkup.children);

  if (rows.length === 0) return table;

  const titleRow = rows.findIndex((row) => row.firstElementChild.textContent.toLowerCase().trim() === 'title');

  if (titleRow !== -1) {
    title = rows[titleRow].lastElementChild;
    rows.splice(titleRow, 1);
  }

  const disclaimerRow = rows.findIndex((row) => row.firstElementChild.textContent.toLowerCase().trim() === 'disclaimer');

  if (disclaimerRow !== -1) {
    disclaimer = rows[disclaimerRow].lastElementChild;
    rows.splice(disclaimerRow, 1);
  }

  // Check if first row should be headers (all cells must be bold)
  const firstRow = rows[0];
  const firstRowCells = Array.from(firstRow.children);
  const allFirstRowBold = firstRowCells.every((cell) => {
    const strongElement = cell.querySelector('strong');
    return strongElement && cell.textContent.trim() === strongElement.textContent.trim();
  });

  // Create table header if first row is all bold
  if (allFirstRowBold) {
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    firstRowCells.forEach((cell, index) => {
      const th = document.createElement('th');
      // Remove p tag but keep inner content including strong
      const content = cell.innerHTML.replace(/<p>(.*?)<\/p>/g, '$1');
      th.innerHTML = content;
      th.setAttribute('scope', 'col');
      th.setAttribute('id', `col-${index + 1}`);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    rows.shift(); // Remove the header row from remaining rows
  }

  // Create table body
  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    Array.from(row.children).forEach((cell, colIndex) => {
      const td = document.createElement('td');
      // Remove p tag but keep inner content
      const content = cell.innerHTML.replace(/<p>(.*?)<\/p>/g, '$1');
      td.innerHTML = content;
      if (allFirstRowBold) {
        td.setAttribute('headers', `col-${colIndex + 1}`);
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // Add column and row count classes
  const columnCount = firstRowCells.length;
  const rowCount = rows.length + (allFirstRowBold ? 1 : 0);
  table.classList.add(`td-count-${columnCount}`, `tr-count-${rowCount}`);

  return { generatedTable: table, disclaimer, title };
};

export default class Table extends FranklinBlock {
  beforeBlockRender() {
    const { generatedTable, disclaimer, title } = createHtmlTableFromDivs(this.block);
    if (title) {
      const caption = document.createElement('caption');
      caption.classList.add('table-title');
      caption.innerHTML = title.innerHTML;
      generatedTable.prepend(caption);
    }
    this.inputData.tableMarkup = generatedTable?.outerHTML;
    this.inputData.title = title?.innerHTML;
    this.inputData.disclaimer = disclaimer?.innerHTML;
  }

  /**
   * Enhances the table after rendering with accessibility features and responsive wrapper
   * Adds ARIA attributes and roles for better screen reader support
   */
  afterBlockRender() {
    const table = this.block.querySelector('table');

    if (table) {
      // Add responsive wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);

      // Add accessibility attributes
      table.setAttribute('role', 'grid');
      table.setAttribute('cellpadding', '0');
      table.setAttribute('cellspacing', '0');
      table.setAttribute('border', '0');
      table.setAttribute('summary', 'Data table'); // Generic summary for screen readers

      const headers = table.querySelectorAll('th');
      headers.forEach((header) => {
        header.setAttribute('role', 'columnheader');
        header.setAttribute('aria-sort', 'none'); // Indicates column is sortable but not currently sorted
      });

      // Add aria-rowcount if browser supports it
      if ('ariaRowCount' in table) {
        table.setAttribute('aria-rowcount', table.rows.length);
      }
    }

    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');
    this.block.classList.add('block-padding-desktop-top-24');
    this.block.classList.add('block-padding-mobile-x-0');
    this.block.classList.add('block-padding-mobile-top-16');
  }
}
