async function loadSplitterAndChildBlocks(splitter, config, { loadBlocks, loadBlock }) {
  const { loadBlockPromise } = await loadBlock(splitter, null, config);
  await loadBlockPromise;
  loadBlocks(splitter);
}

export default function createGatewaySplitter(items, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock }) {
  const cards = items?.filter((item) => item.classList.contains('core-card-wrapper')).map((item) => item.outerHTML);
  const text = items?.find((item) => item.classList.contains('core-text-wrapper'))?.outerHTML;
  const splitter = buildBlock('core-gateway-splitter', '');
  variant?.split(',').forEach((className) => splitter.classList.add(className.trim()));
  decorateBlock(splitter);
  loadSplitterAndChildBlocks(splitter, { text, cards }, { loadBlocks, loadBlock });
  return splitter;
}
