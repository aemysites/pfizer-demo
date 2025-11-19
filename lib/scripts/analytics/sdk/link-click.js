import { EnhancedAnalytics } from './enhanced-analytics.js';

export default function analyticsLinkClick(link, href) {
  const pageName = EnhancedAnalytics.getPageName();
  const blockName = EnhancedAnalytics.getBlockName(link);
  const sectionName = EnhancedAnalytics.getSectionName(link);
  const linkType = EnhancedAnalytics.getLinkType(link);
  const linkText = link.title !== '' ? link.title : link.textContent.trim();

  const dataLayer = {
    event: 'linkClick',
    pfLinkName: {
      linkName: `${pageName}|${sectionName}|${blockName}|${linkText}`,
      linkType,
      linkUrl: href,
    },
  };
  let pfCallToAction = null;
  if (link.classList.contains('patient-story') === true) {
    pfCallToAction = {
      callToAction: `patientStory:${linkText}`,
      callToActionName: `patientStory:${pageName}`,
      callToActionType: 'patientStory:initiated',
      customLinkName: `patientStory:${href}`,
    };
  } else if (link.closest('#isi')) {
    pfCallToAction = {
      callToAction: `safetyInfo:${linkText}`,
      callToActionName: 'safetyInfo:isi',
      callToActionType: 'safetyInfo:link',
      customLinkName: `safetyInfo:${href}`,
    };
  }

  if (pfCallToAction !== null) dataLayer.pfCallToAction = pfCallToAction;

  EnhancedAnalytics.triggerEvent(dataLayer);
}
