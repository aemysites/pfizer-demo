export function camelCase(str) {
  if (str.toLowerCase() === 'url') {
    return 'Url';
  }
  return str
    .split(' ')
    .map((word, index) =>
      index
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.toLowerCase(),
    )
    .join('');
}

export function mergePageName(input) {
  const parts = input.split('|').map((part) => part.trim());
  const PageName = parts.join('-').replace(/\s+/g, '-');
  return PageName;
}

export function validateAndCorrectDataLayer() {
  let dataLayer = sessionStorage.getItem('datalayer');
  if (dataLayer) {
    dataLayer = JSON.parse(dataLayer);
    if (!Array.isArray(dataLayer)) {
      console.error('Data layer was not an array:', typeof dataLayer);
      dataLayer = [];
      sessionStorage.setItem('datalayer', JSON.stringify(dataLayer));
    }
  }
}
