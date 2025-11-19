async function loadTestimonialAndChildBlocks(testimonial, config, { loadBlocks, loadBlock }) {
  const { loadBlockPromise } = await loadBlock(testimonial, null, config);
  await loadBlockPromise;
  loadBlocks(testimonial);
}

export default function createTestimonial(config, variant, { loadBlocks, decorateBlock, loadBlock, buildBlock }) {
  const quotes = config?.filter((item) => item.classList.contains('core-quote-wrapper'));
  const text = config?.find((item) => item.classList.contains('core-text-wrapper'))?.outerHTML;
  const testimonial = buildBlock('core-testimonial', '');
  const classList = variant?.split(',').map((className) => className.trim().toLowerCase());
  if (classList) {
    classList.forEach((c) => {
      testimonial.classList.add(c);
      quotes.forEach((quote) => quote.firstElementChild?.classList.add(c));
    });
  }
  quotes.forEach((quote) => quote.firstElementChild?.classList.add('in-testimonial-quote'));
  decorateBlock(testimonial);
  loadTestimonialAndChildBlocks(testimonial, { text, quotes }, { loadBlocks, loadBlock });
  return testimonial;
}
