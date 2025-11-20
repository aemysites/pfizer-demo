async function loadCardGridContainerAndChildBlocks(cardGridContainer, config, { loadBlocks, loadBlock }) {
  const { loadBlockPromise } = await loadBlock(cardGridContainer, null, config);
  await loadBlockPromise;
  loadBlocks(cardGridContainer);
}

export default function createCardGridContainer(items, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock, separateDisclaimer }) {
  const cardBlocks = items
    ?.filter((item) => item.classList.contains('core-card-wrapper'))
    .map((item) => item.outerHTML);

  const textWrapper = items?.find((item) => item.classList.contains('core-text-wrapper'));

  const [textblock, disclaimer] = textWrapper ? separateDisclaimer(textWrapper) : ['', ''];

  const cardGridContainer = buildBlock('core-card-grid-container', '');
  variant?.split(',').forEach((className) => cardGridContainer.classList.add(className.trim()));

  decorateBlock(cardGridContainer);

  const config = {
    textblock,
    cardBlocks,
    disclaimer
  };

  loadCardGridContainerAndChildBlocks(cardGridContainer, config, { loadBlocks, loadBlock });

  return cardGridContainer;
}
