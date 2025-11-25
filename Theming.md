# Adobe Franklin Library: Theming & Block Style Documentation

`core-library-version-2`

Our design philosophy hinges on maintaining a single source of truth for theming elements across the UI, made possible through meticulously validated color mappings exported from Figma. This centralized approach not only simplifies global theme updates but also provides a fallback mechanism for individual components, enabling more granular control when needed.

---

- [Global Properties Theming](#global)
- [Global Branding Token List](#global-token)
- [Block-Level Properties Theming](#block-level)
- [Global Properties applied by Block](#block-level-used-global)

---

<a name="global"></a>

## Global Properties Theming

The Adobe Franklin Library employs a sophisticated approach to theming by leveraging custom properties, commonly known as CSS variables. These variables serve as centralized tokens for theming, facilitating global-level styling across all Franklin core blocks. This centralization is not a limitation but a feature designed for efficient, broad-spectrum style application. Each core block's CSS is structured to reference these centralized custom properties for color values. This creates a bi-directional mapping between the styling of individual blocks and the global theme, streamlining the process of updating or altering styles across the entire library. By doing so, it enhances maintainability, ensures consistency, and accelerates the deployment of design changes.

<a name="global-token"></a>

## Global Branding Token List

To apply all the primary brand or market color values, these are the central global custom properties needed for initial coverage. After these are applied, you can append changes for unique block scenarios. Each of the necessary custom properties is listed here, with their initial default Meraki value.

```
  --lib-core--color-primary: #3d46ea,
  --lib-core--color-on-primary: #ffffff,
  --lib-core--color-primary-container: #e0e0ff,
  --lib-core--color-on-primary-container: #00006e,
  --lib-core--color-secondary: #0060a8,
  --lib-core--color-on-secondary: #ffffff,
  --lib-core--color-secondary-container: #d3e4ff,
  --lib-core--color-on-secondary-container: #001c38,
  --lib-core--color-background: #fffbff,
  --lib-core--color-on-background: #1b1b1f,
  --lib-core--color-surface: #fffbff,
  --lib-core--color-surface-variant: #e4e1ec,
  --lib-core--color-on-surface: #1b1b1f,
  --lib-core--color-on-surface-variant: #46464f,
  --lib-core--color-system-surface-surface-1: #f2effc,
  --lib-core--color-system-surface-surface-2: #edeafb,
  --lib-core--color-system-surface-surface-3: #e7e4fb,
  --lib-core--color-system-surface-surface-5: #e1dffa,
  --lib-core--color-outline: #777680,
  --lib-core--color-outline-variant: #c7c5d0,
  --lib-core--color-system-white: #ffffff,
  --lib-core--color-system-black: #000000
```

<a name="block-level"></a>

## Block-Level Properties Theming

Incorporating both global and per-block level tokens, the Adobe Franklin Library offers a dual-layered theming strategy that balances the benefits of centralized control with granular customization. By adhering to these principles, the library sets the stage for a scalable, maintainable, and highly performant theming system that can adapt to both broad and specific styling requirements. On top of globally mapped color properties, each block includes its own set of custom properties, as exemplified by:

```
--core-accordion--border-color: var(--lib-core--accordion--border-color, var(--lib-core--color-secondary));
```

This example demonstrates a fallback mechanism, where the accordion border color first looks for its block-specific variable `--lib-core--accordion--border-color` and falls back to a global variable `--lib-core--color-secondary` if the former is not defined.

The Adobe Franklin Library offers a theming system that strikes an ideal balance between flexibility and robustness. Developers can seamlessly tap into the global theme or choose to override it at the block level. This dual-layered approach not only simplifies the task of maintaining styles across individual UI blocks but also ensures that making adjustments to the global theme won't inadvertently alter block-specific customizations.

The library places a strong emphasis on code readability through the use of consistent naming conventions for both global and per-block variables. This makes it straightforward to identify the intended styling target within the CSS, facilitating easier collaboration and quicker navigation through the codebase. Changes to the theme can be propagated instantly at the global level, significantly reducing the time needed for batch updates. At the same time, the architecture supports rapid, localized changes at the block level, eliminating the need to navigate through global styles for isolated adjustments.

Additionally, the system is optimized for performance, leveraging native CSS custom properties. These are resolved directly by the browser at runtime, which means there's minimal performance overhead. This ensures that all these benefits —flexibility, maintainability, readability, and speed — are delivered without needing any client-side or server-side processing, making the theming system not only powerful but also efficient.

<a name="block-level-used-global"></a>

## Block-Level Properties Theming Usage

Here is the utilization of each of the global tokens by block, as of Jan 10, 2024 (pending future updates).

<hr >

### Accordion

- **Selector:** `.core-accordion`

#### Global Values Usage

- **`.core-accordion`:**

  - **Border Color:** `--core-accordion--border-color`
    - Sets the border color. Default: `var(--lib-core--accordion--border-color, var(--lib-core--color-secondary))`.
  - **Arrow Icon Color:** `--core-accordion--arrow-icon-color`
    - Determines the color of the arrow icon. Default: `var(--lib-core--accordion--arrow-icon-color, var(--lib-core--color-outline))`.

- **`.core-accordion details`:**
  - **Text Color:** `color`
    - Specifies the text color. Default: `var(--lib-core--color-on-background)`.

<hr>

### Alert

- **Selector:** `.core-alert`

#### Global Values Usage

- **`.core-alert`:**
  - **Background Color:** `--core-alert--background-color`
    - Sets the background color. Default: `var(--lib-core--alert--background-color, var(--lib-core--color-primary-container))`.
  - **Text Color:** `--core-alert--color`
    - Determines the text color. Default: `var(--lib-core--alert--color, var(--lib-core--color-on-primary-container))`.

<hr>

### Announcement

- **Selector:** `.core-announcement`

#### Global Values Usage

- **`.core-announcement`:**
  - **Text Color:** `--core-announcement--color`
    - Specifies the text color. Default: `var(--lib-core--announcement--color, var(--lib-core--color-on-surface))`.
  - **Background Color:** `--core-announcement--background`
    - Sets the background color. Default: `var(--lib-core--announcement--background-color, var(--lib-core--color-secondary-container))`.
  - **Icon Color:** `--core-announcement--icon-color`
    - Determines the icon color. Default: `var(--lib-core--announcement--icon-color, var(--lib-core--color-on-secondary-container))`.

<hr>

### Banner

- **Selector:** `.core-banner`

#### Global Values Usage

- **`.core-banner`:**
  - **Background Color:** `background-color`
    - Sets the background color. Default: `var(--lib-core--banner--background-color, var(--lib-core--color-primary-container))`.
  - **Text Color:** `color`
    - Specifies the text color. Default: `var(--lib-core--banner--color, var(--lib-core--color-on-primary-container))`.
- **`.core-banner .close-container a.close-link`:**
  - **Close Link Color:** `color`
    - Determines the color of the close link. Default: `var(--lib-core--banner--close-link-color, var(--lib-core--color-on-primary-container))`.
- **`.core-banner .core-banner-content .button-container a`:**
  - **Button Container Text Color:** `color`
    - Sets the text color in the button container. Default: `var(--lib-core--banner--button-container-color, var(--lib-core--color-primary))`.

<hr>

### Basic

- **Selector:** `.core-basic`

#### Global Values Usage

- **`.core-basic .core-basic-content h2, .core-basic .core-basic-content h3`:**
  - **Text Color:** `color`
    - Specifies the text color for headings. Default: `var(--lib-core--color-on-background)`.
- **`.core-basic .core-basic-content p`:**
  - **Paragraph Text Color:** `color`
    - Determines the text color for paragraphs. Default: `var(--lib-core--color-on-background)`.

<hr>

### Cards

- **Selector:** `.core-cards`

#### Global Values Usage

- **`.core-cards`:**
  - **Background Color:** `--cards-background-color`
    - Sets the background color. Default: `var(--lib-core--cards--body-background-color, var(--lib-core--color-system-surface-surface-1))`.
  - **Icon Variant Background Color:** `--cards-icon-variant-background-color`
    - Specifies the background color for icon variants. Default: `var(--lib-core--cards--icon-variant-background-color, var(--lib-core--color-system-surface-surface-3))`.
  - **Heading Color:** `--cards-heading-color`
    - Determines the color of headings. Default: `var(--lib-core--cards--heading-color, var(--lib-core--color-on-background))`.
  - **Icon Variant Heading Color:** `--cards-icon-variant-heading-color`
    - Sets the color of headings in icon variants. Default: `var(--lib-core--cards--icon-variant-heading-color, var(--lib-core--color-on-surface))`.
  - **Number Variant Heading Color:** `--cards-number-variant-heading-color`
    - Specifies the color of headings in number variants. Default: `var(--lib-core--cards--number-variant-heading-color, var(--lib-core--color-on-primary-container))`.
  - **Text Color:** `--cards-text-color`
    - Determines the text color. Default: `var(--lib-core--cards--text-color, var(--lib-core--color-on-surface))`.
  - **Kicker Color:** `--cards-kicker-color`
    - Sets the color of kickers. Default: `var(--lib-core--cards--kicker-color, var(--lib-core--color-on-surface-variant))`.
- **`.core-cards.image`:**
  - **Image Background Color:** `--cards-background-color`
    - Specifies the background color for images. Default: `var(--lib-core--cards--body-background-color, var(--lib-core--color-surface-variant))`.
- **`.core-cards.image.inverted`:**
  - **Inverted Image Background Color:** `--cards-background-color`
    - Sets the background color for inverted images. Default: `var(--lib-core--cards--body-background-color, var(--lib-core--color-secondary))`.
  - **Inverted Image Heading Color:** `--cards-heading-color`
    - Determines the color of headings in inverted images. Default: `var(--lib-core--cards--accent-color, var(--lib-core--color-on-secondary))`.
  - **Inverted Image Text Color:** `--cards-text-color`
    - Specifies the text color for inverted images. Default: `var(--lib-core--cards--text-color, var(--lib-core--color-on-secondary))`.

<hr>

### Footer

- **Selector:** `.core-footer`

#### Global Values Usage

- **`.core-footer`:**
  - **Background Color:** `background-color`
    - Sets the background color. Default: `var(--lib-core--footer--background-color, var(--lib-core--color-surface-variant))`.
  - **Text Color:** `color`
    - Specifies the text color. Default: `var(--lib-core--footer--color, var(--lib-core--color-on-surface-variant))`.
- **`.core-footer .footer-navigation>ul>li>ul>li`:**
  - **List Item Color:** `color`
    - Determines the color of list items. Default: `var(--lib-core--footer--list-item-color, var(--lib-core--color-on-surface-variant))`.
- **`.core-footer .footer-navigation>ul>li>ul`:**
  - **Sublist Color:** `color`
    - Sets the color of sublists. Default: `var(--lib-core--footer--sublist-color, var(--lib-core--color-on-surface-variant))`.
- **`.core-footer .footer-utility-links`:**
  - **Menu Border Color:** `border-top`
    - Specifies the border color of the menu. Default: `4px solid var(--lib-core--footer--menu-border-color, var(--lib-core--color-primary))`.
- **`.core-footer .footer-copyright`:**
  - **Copyright Color:** `color`
    - Determines the copyright text color. Default: `var(--lib-core--footer--copyright-color, var(--lib-core--color-on-surface-variant))`.
- **`.core-footer .footer-social p, .core-footer .footer-social p strong`:**
  - **Social Text Color:** `color`
    - Sets the color of social media texts. Default: `var(--lib-core--social-color, var(--lib-core--color-on-surface-variant))`.
- **`.core-footer .footer-social a svg`:**
  - **Social Icon Color:** `color`
    - Specifies the color of social media icons. Default: `var(--lib-core--footer--social-color, var(--lib-core--color-primary))`.
- **`.core-footer .footer-social a.button`:**
  - **Social Button Border:** `border`
    - Determines the border color of social media buttons. Default: `1px solid var(--lib-core--social-button-border, var(--lib-core--color-outline))`.
- **`.core-footer .core-footer-content.footer-navigation>ul>li`:**
  - **Navigation Item Color:** `color`
    - Sets the color of navigation items. Default: `var(--lib-core--color-on-surface)`.
- **`.core-footer .footer-call-to-action a.button`:**
  - **Call-to-Action Button Color:** `color`
    - Specifies the text color for call-to-action buttons. Default: `var(--lib-core--color-on-primary)`.
- **`.core-footer .footer-utility-links ul`:**
  - **Utility Links Color:** `color`
    - Determines the color of utility links. Default: `var(--lib-core--color-primary)`.

<hr />

### Header

- **Selector:** `.core-header`

#### Global Values Usage

- **`.core-header`:**
  - **Nav Background Color:** `--lib-core--menu--nav-background-color`
    - Sets the navigation background color. Default: `var(--lib-core--color-background)`.
- **`.core-header .header-logo`:**
  - **Logo Border:** `border-bottom`
    - Specifies the border beneath the logo. Default: `1px solid var(--lib-core--menu--nav-header-logo-border, var(--lib-core--color-outline-variant))`.
- **`.core-header .header-secondary-logo`:**
  - **Secondary Logo Border:** `border-bottom`
    - Sets the border beneath the secondary logo. Default: `1px solid var(--lib-core--menu--nav-secondary-logo-border, var(--lib-core--color-outline-variant))`.
- **`.core-header .core-nav-sections`:**
  - **Nav Sections Font Size:** `color`
    - Determines the font size for nav sections. Default: `var(--lib-core--menu--nav-sections-font-size, var(--lib-core--color-on-surface))`.
- **`.core-header .core-nav-sections .core-nav-drop>strong`:**
  - **Nav Drop Strong Color:** `color`
    - Specifies the color for strong elements in nav drops. Default: `var(--lib-core--color-on-surface)`.
- **`.core-header .core-nav-sections ul li:hover strong`:**
  - **Hover Strong Color:** `color`
    - Sets the color for hovered strong elements. Default: `var(--lib-core--color-on-primary-container)`.
- **`.core-header .core-nav-sections ul li:active strong`:**
  - **Active Strong Color:** `color`
    - Determines the color of active strong elements. Default: `var(--lib-core--color-primary)`.
- **`.core-header .core-nav-sections a[aria-current]`:**
  - **Current Nav Item Color:** `color`
    - Specifies the color for the current nav item. Default: `var(--lib-core--color-primary)`.
- **`.core-header .core-nav-drop[aria-expanded=\"true\"]`:**
  - **Expanded Nav Background Color:** `background-color`
    - Sets the background color for expanded nav drops. Default: `var(--lib-core--menu--nav-expanded-background-color, var(--lib-core--color-surface-variant))`.
- **`.core-header .core-nav-hamburger button svg`:**
  - **Hamburger Icon Fill:** `fill`
    - Determines the fill color of the hamburger icon. Default: `var(--lib-core--color-primary)`.
- **`.core-header .open-menu::before, .core-header .close-menu::before`:**
  - **Menu Font Color:** `color`
    - Specifies the font color for menu buttons. Default: `var(--lib-core--menu--nav-hamburguer-font-color, var(--lib-core--color-primary))`.

<hr>

### Hero

- **Selector:** `.core-hero`

#### Global Values Usage

- **`.core-hero`:**
  - **Background Color:** `--core-hero--background-color`
    - Sets the background color. Default: `var(--lib-core--hero--background-color, var(--lib-core--color-system-surface-surface-1))`.
  - **Text Color:** `--core-hero--color`
    - Specifies the text color. Default: `var(--lib-core--hero--color, var(--lib-core--color-on-surface))`.
- **`.core-hero h1, .core-hero h2, .core-hero h3`:**
  - **Heading Color:** `color`
    - Determines the color of headings. Default: `var(--lib-core--hero--heading-color, var(--lib-core--color-primary))`.
- **`.core-hero .hero-body>div:first-child>p>strong`:**
  - **Kicker Color:** `color`
    - Sets the color of kickers. Default: `var(--lib-core--hero--kicker-color, var(--lib-core--color-on-surface-variant))`.
- **`.core-hero .hero-body h1>strong`:**
  - **Header Strong Color:** `color`
    - Specifies the color of strong elements in headers. Default: `var(--lib-core--hero--header-strong-color, var(--lib-core--color-secondary))`.
- **`.core-hero.graphic .hero-banner .hero-banner-overlay`:**
  - **Graphic Overlay Background:** `background`
    - Determines the background of graphic overlays. Default: `linear-gradient(var(--lib-core--hero-graphic--overlay-color, var(--lib-core--color-on-background)),transparent)`.
- **`.core-hero.graphic .hero-banner .hero-banner-caption`:**
  - **Graphic Caption Color:** `color`
    - Sets the color of captions in graphic banners. Default: `var(--lib-core--hero-graphic--caption-color, var(--lib-core--color-background))`.
- **`.core-hero.graphic .hero-footnote`:**
  - **Graphic Footnote Color:** `color`
    - Specifies the color of footnotes in graphic heroes. Default: `var(--lib-core--hero-graphic--footnote-color, var(--lib-core--color-on-surface-variant))`.

<hr />

### Isi

- **Selector:** `.core-isi`

#### Global Values Usage

- **`.core-isi`:**
  - **Header Color:** `--core-isi--header-color`
    - Sets the header color. Default: `var(--lib-core--persistent-isi--header-color, var(--lib-core--color-on-primary))`.
  - **Header Background:** `--core-isi--header-background`
    - Specifies the header background color. Default: `var(--lib-core--persistent-isi--header-background-color, var(--lib-core--color-primary))`.
  - **Content Background:** `--core-isi--content-background`
    - Determines the content background color. Default: `var(--lib-core--persistent-isi--content-background-color, var(--lib-core--color-system-surface-surface-1))`.
  - **Content Section Background:** `--core-isi--content-section-background`
    - Sets the background color for content sections. Default: `var(--lib-core--persistent-isi--content-section-background-color, var(--lib-core--color-system-white))`.
  - **Content Color:** `--core-isi--content-color`
    - Specifies the color of the content. Default: `var(--lib-core--persistent-isi--content-color, var(--lib-core--color-system-black))`.
- **`.core-isi .core-persistent-isi-container .core-isi-header button.toggle-isi svg`:**
  - **Toggle Button Fill:** `fill`
    - Determines the fill color of the toggle button. Default: `var(--lib-core--color-on-primary-container)`.

<hr>

### Overlay

- **Selector:** `.core-overlay`

#### Global Values Usage

- **`.core-overlay .icon svg`:**
  - **Logo Color:** `color`
    - Sets the logo color. Default: `var(--lib-core--overlay--logo-color, var(--lib-core--color-primary))`.
- **`.core-overlay .core-overlay-content`:**
  - **Content Color:** `color`
    - Specifies the text color of the content. Default: `var(--lib-core--overlay--content-color, var(--lib-core--color-on-surface))`.
  - **Content Background Color:** `background-color`
    - Determines the background color of the content. Default: `var(--lib-core--overlay--content-background-color, var(--lib-core--color-surface))`.
- **`.core-overlay .core-overlay-header h1, .core-overlay .core-overlay-header h2, .core-overlay .core-overlay-header h3`:**
  - **Heading Color:** `color`
    - Sets the color of headings. Default: `var(--lib-core--overlay--heading-color, var(--lib-core--color-on-background))`.
- **`.core-overlay .core-overlay-close::before, .core-overlay .core-overlay-close::after`:**
  - **Close Button Color:** `background-color`
    - Specifies the background color of the close button. Default: `var(--lib-core--overlay--close-button-color, var(--lib-core--color-outline))`.

<hr>

### Page-break

- **Selector:** `.core-page-break`

#### Global Values Usage

- **`.core-page-break`:**
  - **Background Color:** `--core-page-break--background-color`
    - Sets the background color. Default: `var(--lib-core--page-break--body-background-color, var(--lib-core--color-secondary))`.
  - **Heading Color:** `--core-page-break--heading-color`
    - Specifies the color of headings. Default: `var(--lib-core--page-break--heading-content-color, var(--lib-core--color-on-secondary))`.
  - **Content Color:** `--core-page-break--content-color`
    - Determines the color of content. Default: `var(--lib-core--page-break--content-color, var(--lib-core--color-on-secondary))`.
  - **Text Color:** `--core-page-break--text-color`
    - Sets the text color. Default: `var(--lib-core--page-break--text-color, var(--lib-core--color-on-secondary))`.
  - **Overlay Background:** `--core-page-break--overlay-background`
    - Specifies the overlay background color. Default: `var(--lib-core--page-break--overlay-background, var(--lib-core--color-secondary-container))`.
  - **Overlay Title Color:** `--core-page-break--overlay-title-color`
    - Determines the color of overlay titles. Default: `var(--lib-core--page-break--overlay-color, var(--lib-core--color-on-surface))`.
  - **Overlay Subtitle Color:** `--core-page-break--overlay-subtitle-color`
    - Sets the color of overlay subtitles. Default: `var(--lib-core--page-break--overlay-color, var(--lib-core--color-on-surface-variant))`.

<hr />

### Quote

- **Selector:** `.core-quote`

#### Global Values Usage

- **`.core-quote`:**
  - **Text Color:** `--text-color`
    - Sets the general text color. Default: `var(--lib-core--quote--color, var(--lib-core--color-on-secondary-container))`.
  - **Content Text Color:** `--quote-content-text-color`
    - Specifies the color of the quote content. Default: `var(--lib-core--quote--content-text-color, var(--lib-core--color-on-surface))`.
  - **Second Text Color:** `--quote-content-text-color-second-text`
    - Determines the color of secondary text elements. Default: `var(--lib-core--quote--content-text-color, var(--lib-core--color-on-surface-variant))`.
  - **List Color:** `--quote-content-list-color`
    - Sets the color of the list items. Default: `var(--lib-core--quote--list-text-color, var(--lib-core--color-on-secondary-container))`.
  - **Background Color:** `background-color`
    - Specifies the background color. Default: `var(--lib-core--quote--background-color, var(--lib-core--color-secondary-container))`.
- **`.core-quote blockquote span.icon.icon-lib-opening-quotation, .core-quote blockquote span.icon.icon-lib-opening-quotation svg`:**
  - **Icon Fill:** `fill`
    - Determines the fill color of icons. Default: `var(--lib-core--quote--icon-fill, var(--lib-core--color-primary))`.
- **`.core-quote.large .core-quote-img-container p`:**
  - **Image Title Color:** `color`
    - Sets the color of image titles. Default: `var(--lib-core--quote--image-title-color, var(--lib-core--color-on-surface))`.

<hr>

### References

- **Selector:** `.core-references`

#### Global Values Usage

- **`.core-references`:**
  - **Background Color:** `background-color`
    - Sets the background color. Default: `var(--lib-core--references--background-color, var(--lib-core--color-system-surface-surface-5))`.
- **`.core-references h4`:**
  - **Title Color:** `color`
    - Specifies the color of titles. Default: `var(--lib-core--references--title-color, var(--lib-core--color-on-background))`.
- **`.core-references ol`:**
  - **Text Color:** `color`
    - Determines the color of text in ordered lists. Default: `var(--lib-core--references--text-color, var(--lib-core--color-on-surface-variant))`.
- **`.core-references li::before`:**
  - **List Number Color:** `color`
    - Sets the color of list numbers. Default: `var(--lib-core--references--list-number-color, var(--lib-core--color-on-surface))`.

<hr>

### Slideshow

- **Selector:** `.core-slideshow`

#### Global Values Usage

- **`.core-slideshow`:**
  - **Background Color:** `--core-slideshow--background-color`
    - Sets the background color. Default: `var(--lib-core--slideshow--background, var(--lib-core--color-primary))`.
  - **Text Color:** `--core-slideshow--text-color`
    - Specifies the text color. Default: `var(--lib-core--slideshow--text-color, var(--lib-core--color-on-primary))`.
  - **Link Color:** `--core-slideshow--link-color`
    - Determines the color of links. Default: `var(--lib-core--slideshow--link-color, var(--lib-core--color-on-primary))`.
  - **Overlay Background:** `--core-slideshow--overlay-background`
    - Sets the overlay background color. Default: `var(--lib-core--slider--overlay-background, var(--lib-core--color-secondary-container))`.
  - **Overlay Title Color:** `--core-slideshow--overlay-title-color`
    - Specifies the color of overlay titles. Default: `var(--lib-core--slider--overlay-title-color, var(--lib-core--color-on-surface))`.
  - **Overlay Subtitle Color:** `--core-slideshow--overlay-subtitle-color`
    - Determines the color of overlay subtitles. Default: `var(--lib-core--slider--overlay-subtitle-color, var(--lib-core--color-on-surface-variant))`.
- **`.core-slideshow.full ol li .core-slideshow-slide-scrim`:**
  - **Slide Scrim Background Color:** `background-color`
    - Sets the background color for slide scrims. Default: `var(--lib-core--color-system-black)`.

<hr>

### Tabs

- **Selector:** `.core-tabs`

#### Global Values Usage

- **`.core-tabs`:**
  - **Active Background Color:** `--active-background-color`
    - Sets the background color of active tabs. Default: `var(--lib-core--tabs-active-background-color, var(--lib-core--color-system-surface-surface-2))`.
  - **Inactive Background Color:** `--inactive-background-color`
    - Specifies the background color of inactive tabs. Default: `var(--lib-core--tabs-inactive-background-color, var(--lib-core--color-system-surface-surface-5))`.
  - **Button Border Color:** `--button-border-color`
    - Determines the border color of buttons. Default: `var(--lib-core--tabs-border-color, var(--lib-core--color-outline-variant))`.
  - **Button Color:** `--button-color`
    - Sets the color of buttons. Default: `var(--lib-core--tabs-button-color, var(--lib-core--color-on-surface-variant))`.
  - **Selected Button Color:** `--button-selected`
    - Specifies the color of selected buttons. Default: `var(--lib-core--tabs-button-selected, var(--lib-core--color-on-surface))`.
- **`.core-tabs .core-tabs-inside .tabs-panel p`:**
  - **Content Body Color:** `color`
    - Determines the color of content body text. Default: `var(--lib-core--tabs-content-body-color, var(--lib-core--color-on-surface))`.

<hr>

### Video

- **Selector:** `.core-video`

#### Global Values Usage

- **`.core-video`:**
  - **Controls Color:** `--core-video--controls-color`
    - Sets the color of video controls. Default: `var(--lib-core--video--controls-color, var(--lib-core--color-system-black))`.
