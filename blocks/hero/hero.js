import { FranklinBlock, generateGifComponent, generateSharepointServedVideo, Select, decorateButtons } from '../../scripts/lib-franklin.js';

export default class Hero extends FranklinBlock {
  variants = [
    { name: 'homepage', test: !this.block.classList.contains('interior') },
    { name: 'interior', test: this.block.classList.contains('interior') || this.block.classList.contains('inside') },
  ];

  beforeBlockDataRead() {
    const sections = {
      image: { className: 'image-before-render--image', schemaKey: 'picture' },
      placeholder_icon: { className: 'image-before-render--placeholder_icon', schemaKey: 'placeholderIcon' },
      placeholder_title: { className: 'image-before-render-placeholder-title', schemaKey: 'placeholderTitle' },
      placeholder_body: { className: 'image-before-render-placeholder-body', schemaKey: 'placeholderBody' },
      placeholder_disclaimer: { className: 'image-before-render--placeholder_disclaimer', schemaKey: 'placeholderDisclaimer' },
      placeholder_slot: { className: 'image-before-render--placeholder_slot', schemaKey: 'placeholderSlot' },
      locator_title: { className: 'image-before-render--locator_title', schemaKey: 'locatorTitle' },
      locator_input_placeholder: { className: 'image-before-render--locator_input_placeholder', schemaKey: 'locatorInputPlaceholder' },
      locator_input_error_message: { className: 'image-before-render--locator_input_error_message', schemaKey: 'locatorInputErrorMessage' },
      locator_submit_text: { className: 'image-before-render--locator_submit_text', schemaKey: 'locatorSubmitText' },
      locator_submit_url: { className: 'image-before-render--locator_submit_url', schemaKey: 'locatorSubmitUrl' },
      gif_static_image: { className: 'image-before-render--gif_static_image', schemaKey: 'gifStaticImage' },
      local_video: { className: 'image-before-render--local_video', schemaKey: 'localVideo' },
      poster: { className: 'image-before-render--poster', schemaKey: 'poster' },
      video_aspect_ratio: { className: 'image-before-render--video_aspect_ratio', schemaKey: 'videoAspectRatio' },
    };

    // Handle special case for gif section
    const gif = this.findSectionContent('gif');
    if (gif) {
      gif.querySelector('picture')?.classList.add('image-before-render--gif');
    } else {
      delete this.schema?.schema?.gif;
    }

    // Process all other sections
    Object.entries(sections).forEach(([sectionName, config]) => {
      const section = this.findSectionContent(sectionName);
      if (section) {
        section.className = config.className;
      } else {
        delete this.schema?.schema?.[config.schemaKey];
      }
    });

    // padding override for Hero has no padding
    // this.blockPaddingOverride = 'none';
  }

  /**
   * Helper function to manage layout classes for different hero variants
   * Handles homepage and interior layouts, placeholder sections, and special cases like no-key-art and full-width layouts
   */
  layoutClassHelpers() {
    const availableVariantsHomepage = ['right-image', 'no-key-art', 'full-width', 'full-width-key-art'];
    const availableVariantsInterior = [...availableVariantsHomepage, 'bottom-container', 'full-width-key-art'];

    // Handle placeholder section
    const placeholderFields = ['placeholderIcon', 'placeholderTitle', 'placeholderBody', 'placeholderDisclaimer', 'placeholderSlot'];
    const hasPlaceholder = placeholderFields.some((field) => this.inputData?.[field]);
    if (hasPlaceholder) {
      this.block.classList.add('hero-block-contains-placeholder');
    }

    // currently homepage requires placeholder to be present, but we are providing fallback for now
    if (!hasPlaceholder && this.variant === 'homepage') {
      this.block.classList.add('hero-homepage-no-placeholder');
    }

    // Handle no-key-art
    if (this.block?.classList.contains('no-key-art')) {
      this.block.classList.add('hide-image');
      if (this.variant === 'homepage') {
        this.inputData.splitContent = true;
      }
    }

    // Homepage layout handling
    if (this.variant === 'homepage') {
      this.block.classList.add('hero-layout-homepage');

      // Add left-image-as-default if no homepage variants present
      if (!availableVariantsHomepage.some((variant) => this.block.classList.contains(variant))) {
        this.block.classList.add('left-image-as-default');
      }

      // Exit early only if homepage layout is confirmed
      if (this.block.classList.contains('hero-layout-homepage')) {
        return;
      }
    }

    // Interior layout handling
    this.block.classList.add('hero-layout-interior');

    if (!availableVariantsInterior.some((variant) => this.block.classList.contains(variant))) {
      if (this.variant === 'interior') {
        this.block.classList.add('left-interior-as-default');
      }
    }

    // Handle interior-specific layouts
    if (this.block.classList.contains('hero-layout-interior')) {
      const fullWidthClasses = ['full-width', 'bottom-container', 'full-width-key-art'];
      const hasFullWidthClass = fullWidthClasses.some((className) => this.block.classList.contains(className));

      if (hasFullWidthClass) {
        this.block.classList.add('full-interior-width');
        this.block.classList.remove('full-width');
      }

      if (this.block.classList.contains('bottom-container')) {
        this.inputData.splitContent = true;
        // 1 column if missing atoms
        const { content, disclaimer } = this.inputData.contentAtoms;
        const hasContent = content && content?.children?.length > 0;
        const hasDisclaimer = disclaimer && disclaimer?.children?.length > 0;

        if (!hasContent && !hasDisclaimer) {
          this.block.classList.add('split-content-single-column');
        }
      }
    }
  }

  beforeBlockRender() {
    // layout classes for different layouts
    this.layoutClassHelpers();

    const newAtoms = { ...this.inputData.contentAtoms };

    const showPlaceholder =
      this.inputData?.placeholderIcon ||
      this.inputData?.placeholderTitle ||
      this.inputData?.placeholderBody ||
      this.inputData?.placeholderDisclaimer ||
      this.inputData?.placeholderSlot;

    const showLocator = this.inputData?.locatorTitle || this.inputData?.locatorInputPlaceholder || this.inputData?.locatorInputErrorMessage || this.inputData?.locatorSubmitUrl;

    // Gif
    const gifElement = document.createElement('div');
    const gifStringElement = this.inputData?.gif;
    gifElement.innerHTML = gifStringElement;
    const gifUrl = gifElement.querySelector('img')?.src || null;

    // Static gif
    const gifStaticElement = document.createElement('div');
    const gifStaticImageStringElement = this.inputData?.gifStaticImage;
    gifStaticElement.innerHTML = gifStaticImageStringElement;
    const gifStaticUrl = gifStaticElement.querySelector('img')?.src || null;

    this.inputData = {
      [this.variant]: { ...this.inputData, ...newAtoms, gif: gifUrl, gifStaticImage: gifStaticUrl, show_placeholder: showPlaceholder, show_locator: showLocator },
    };
  }

  fixButtonStyle() {
    decorateButtons(this.block);
    const shouldInvert = this.block.classList.contains('inverted');

    const buttons = this.block.querySelectorAll('a.button:not(.core-hero-body-locator-submit a.button)');

    if (buttons.length) {
      [...buttons].forEach((button) => {
        const parent = button.parentElement;

        if (!parent.classList.contains('button-container-multi')) {
          parent.classList.add('button-container-multi');
          parent.classList.add('button-container');
        }
        if (!shouldInvert) {
          button.classList.add('inverted');
        } else {
          button.classList.remove('inverted');
        }
      });
    }
  }

  afterBlockRender() {
    this.fixButtonStyle();

    // gif on homepage
    if (this.inputData?.homepage?.gif && this.inputData?.homepage?.gifStaticImage) {
      generateGifComponent(this.inputData?.homepage.gif, this.inputData?.homepage?.gifStaticImage, this.block.querySelector('.core-hero-new-banner-img'), true);
      this.block.querySelector('span.image-wrapper').style.display = 'none';
    }

    // gif on interior
    if (this.inputData?.interior?.gif && this.inputData?.interior?.gifStaticImage) {
      generateGifComponent(this.inputData?.interior.gif, this.inputData?.interior?.gifStaticImage, this.block.querySelector('.core-hero-new-banner-img'), true);
      this.block.querySelector('span.image-wrapper').style.display = 'none';
    }

    // video on homepage
    if (this.inputData?.homepage?.localVideo) {
      generateSharepointServedVideo(
        this.inputData?.homepage?.localVideo,
        this.block.querySelector('.core-hero-new-banner-img'),
        true,
        this.block.classList.contains('autoplay'),
        false,
        this.inputData.homepage?.poster,
        this.inputData.homepage?.videoAspectRatio
      );
      this.block.querySelector('span.image-wrapper').style.display = 'none';
    }

    // video on interior
    if (this.inputData?.interior?.localVideo) {
      generateSharepointServedVideo(this.inputData?.interior?.localVideo, this.block.querySelector('.core-hero-new-banner-img'), true);
      this.block.querySelector('span.image-wrapper').style.display = 'none';
    }

    // function to validate if value is a number
    const isNumber = (value) => !Number.isNaN(Number(value));

    const initLocatorDropdown = () => {
      const comboboxElement = this.block.querySelector('.core-hero-body-locator-dropdown');

      const showInputErrorMessage = (validatedNumber) => {
        if (!validatedNumber) {
          this.block.querySelector('.core-hero-body-locator-error-message').classList.remove('hidden');
        } else {
          this.block.querySelector('.core-hero-body-locator-error-message').classList.add('hidden');
        }
      };
      const selectComponent = new Select(
        null,
        (index) => {
          console.log('index', index);
        },
        {
          options: ['1', '2', '3'],
          customSelectedOptions: ['one', 'two', 'three'],
          presentedOptionAsInput: true,
          presentedOptionInputOnChangeCallback: (input) => {
            if (!selectComponent.open && isNumber(input) && String(input).length > 2) {
              selectComponent.updateMenuState(true, false);
            } else if (selectComponent.open && String(input).length < 3) {
              selectComponent.updateMenuState(false, false);
            }

            if (input === '') {
              this.block.querySelector('.core-hero-body-locator-form-wrapper').classList.remove('has-value');
            } else {
              this.block.querySelector('.core-hero-body-locator-form-wrapper').classList.add('has-value');
            }
            selectComponent.validInput = isNumber(input);
            showInputErrorMessage(isNumber(input));
          },
          // validate if it is a number
          presentedOptionInputErrorValidation: (value) => {
            const validatedNumber = isNumber(value);
            showInputErrorMessage(validatedNumber);
            return !isNumber(value);
          },
          presentedOptionInputPlaceholder: this.inputData?.interior?.locatorInputPlaceholder,
          customComboClickCallback: () => {},
          customComboBlurCallback: (e) => {
            selectComponent.onComboBlur(e);
          },
          customOptionFocusout: (e) => {
            selectComponent.onComboBlur(e);
          },
          customComboKeyDownCallback: (e) => {
            const validFullZipNumber = !isNumber(selectComponent.presentedOptionInputValue);
            selectComponent.onComboKeyDown(e, validFullZipNumber);
            if (!isNumber(e.key) || !validFullZipNumber) {
              selectComponent.updateMenuState(false, false);
            }
          },
        },
        comboboxElement
      );
      selectComponent.init();
    };
    if (this.inputData?.interior?.show_locator) {
      initLocatorDropdown();
    }

    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-desktop-0');
    this.block.classList.add('block-padding-mobile-0');

    this.block.classList.add('block-padding-no-gutters-negative-margin');

    // homepage
    if (this.variant === 'homepage' && this.block.classList.contains('hero-block-contains-placeholder')) {
      this.block.classList.add('block-padding-standard-desktop-standard-bottom');
      this.block.classList.add('block-padding-mobile-bottom-48');
    }

    // interior
    if (this.variant === 'interior') {
      const isBottomContainer = this.block?.classList.contains('bottom-container');
      if (isBottomContainer) {
        this.block.classList.add('block-padding-standard-desktop-standard-bottom');
        this.block.classList.add('block-padding-mobile-bottom-48');
      }
    }

    // locator scenario
    if (this.block?.classList.contains('core-hero-locator')) {
      this.block.classList.add('block-padding-desktop-bottom-40');
      this.block.classList.add('block-padding-mobile-bottom-24');
    }
  }
}
