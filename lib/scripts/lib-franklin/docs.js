const copyToClipboard = (element, prependString = '', appendString = '') => {
  const text = element.querySelector('p');

  // Copy the text inside the text field
  navigator.clipboard.writeText(`:${prependString}${text.innerHTML.split(' - copied')?.[0]}${appendString}:`);
  if (!text.innerHTML.includes('copied')) {
    text.innerHTML = `${text.innerHTML} - copied`;
  }
  element.classList.add('copied');
  setTimeout(() => {
    text.innerHTML = text.innerHTML.split(' - copied')?.[0];
    element.classList.remove('copied');
  }, 3000);
}

export default copyToClipboard;

