import { FranklinBlock, loadScript } from '../../scripts/lib-franklin.js';

export default class Embed extends FranklinBlock {
  variants = [
    {
      name: 'youtube',
      test: this.block.querySelector("a[href*='youtube']") || this.block.querySelector("a[href*='youtu.be']"),
    },
    {
      name: 'micrsoft-stream',
      test: this.block.querySelector("a[href*='assets.digitalpfizer']"),
    },
    {
      name: 'vimeo',
      test: this.block.querySelector("a[href*='vimeo']"),
    },
    {
      name: 'twitter',
      test: this.block.querySelector("a[href*='twitter']"),
    },
    {
      name: 'interactive-js',
      test: this.block.querySelector("a[href*='interactive.digitalpfizer']") && this.block.querySelector("a[href*='embed.js']"),
    },
    {
      name: 'interactive-html',
      test: this.block.querySelector("a[href*='interactive.digitalpfizer']") && this.block.querySelector("a[href*='.html']"),
    },
    {
      name: 'webfiles-digitalpfizer-js',
      test: this.block.querySelector("a[href*='webfiles.digitalpfizer']") && this.block.querySelector("a[href*='embed.js']"),
    },
    {
      name: 'webfiles-digitalpfizer-html',
      test: this.block.querySelector("a[href*='webfiles.digitalpfizer']") && this.block.querySelector("a[href*='.html']"),
    },
    {
      name: 'default',
      test: true,
    },
  ];

  static youtubeEmbedUrl = (url, autoplay) => {
    const usp = new URLSearchParams(url.search);
    const suffix = autoplay ? '&muted=1&autoplay=1' : '';
    let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
    if (url.origin.includes('youtu.be')) {
      [, vid] = url.pathname.split('/');
    }
    return `https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : url.pathname}`;
  };

  static vimeoEmbedUrl = (url, autoplay) => {
    const [, video] = url.pathname.split('/');
    const suffix = autoplay ? '?muted=1&autoplay=1' : '';
    return `https://player.vimeo.com/video/${video}${suffix}`;
  };

  beforeBlockRender() {
    const url = new URL(this.inputData.embedUrl);

    const EMBEDS_CONFIG = [
      {
        embed: Embed.youtubeEmbedUrl,
        type: 'youtube',
      },
      {
        embed: Embed.vimeoEmbedUrl,
        type: 'vimeo',
      },
      {
        type: 'twitter',
      },
    ];

    const config = EMBEDS_CONFIG.find((e) => e.type === this.variant);

    let autoplay;

    if (this.block.classList.contains('autoplay')) {
      autoplay = true;
    }

    const embedUrl = config && config.embed ? config.embed(url, autoplay ?? !!this.inputData.poster) : url.href;
    const { hostname } = url;

    this.inputData = {
      poster: this.inputData.poster,
      autoplay,
      [this.variant]: { embedUrl, hostname },
    };
  }

  loadEmbedScript(url) {
    const script = document.createElement('script');
    script.src = url;
    script.setAttribute('type', 'text/javascript');
    this.block.append(script);
  }

  afterBlockRender() {
    const iframeContainer = this.block.firstElementChild;

    if (!this.inputData.poster) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          if (iframeContainer) {
            iframeContainer.style.display = 'block';
          }
        }
      });
      observer.observe(this.block);
    } else {
      const placeholder = this.block.querySelector('.embed-placeholder');
      placeholder?.addEventListener('click', () => {
        placeholder.style.display = 'none';
        iframeContainer.style.display = 'block';
      });
    }
    if (this.inputData.twitter) {
      loadScript('https://platform.twitter.com/widgets.js');
    }

    if (this.inputData['interactive-js']) {
      this.loadEmbedScript(this.inputData['interactive-js'].embedUrl);
    }

    if (this.inputData['webfiles-digitalpfizer-js']) {
      this.loadEmbedScript(this.inputData['webfiles-digitalpfizer-js'].embedUrl);
    }

    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-desktop-0');
    this.block.classList.add('block-padding-mobile-0');
  }
}
