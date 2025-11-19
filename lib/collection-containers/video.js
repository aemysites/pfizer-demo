async function loadVideoContainerAndChildBlocks(videoContainer, config, { loadBlocks, loadBlock }) {
  const { loadBlockPromise } = await loadBlock(videoContainer, null, config);
  await loadBlockPromise;
  loadBlocks(videoContainer);
}

export default function createVideoContainer(items, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock }) {
  let videoBlocks = items?.filter((item) => item.classList.contains('core-video-wrapper'));
  videoBlocks.forEach((block) => block.firstElementChild?.classList.add('embedded-content'));
  videoBlocks = videoBlocks.map((item) => item.outerHTML);

  const fullWidthContent = items?.find((item) => item.classList.contains('core-text-wrapper'));

  let headline = '';

  if(fullWidthContent) {
    const rows = fullWidthContent.firstElementChild?.children;
    const headlineRow = [...rows].find((row) => row.firstElementChild.textContent.toLowerCase().trim() === 'headline');

    headline = `<div class="core-text-wrapper">
        <div class="core-text block" data-block-name="core-text" data-block-status="initialized">
        ${headlineRow.outerHTML}
        </div>
    </div>`;
  }

  const videoContainer = buildBlock('core-video-container', '');
  variant?.split(',').forEach((className) => videoContainer.classList.add(className.trim()));

  decorateBlock(videoContainer);

  const config = {
    videoBlocks,
    headline
  };

  loadVideoContainerAndChildBlocks(videoContainer, config, { loadBlocks, loadBlock });

  return videoContainer;
}
