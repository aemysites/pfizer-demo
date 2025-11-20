import { Env } from '../../env.js';
import {
  FranklinBlock,
  toClassName,
  decorateIcons,
  loadCSS,
  getAvailableChildrenRow,
  decorateSections,
  decorateDefaultContent,
  decorateBlocks,
  loadBlocks,
} from '../../scripts/lib-franklin.js';

import Select from '../../scripts/lib-franklin/select.js';

const FORMS_API_ENDPOINT_PROD = 'https://ms-forms-service-production.digitalpfizer.com/api/v2/forms';
const FORMS_API_ENDPOINT_UAT = 'https://ms-forms-service-uat.digitalpfizer.com/api/v2/forms';

const CONFIG_WORKFLOW_ENDPOINT_PROD = 'https://webforms.pfizer/api/get-config';
const CONFIG_WORKFLOW_ENDPOINT_UAT = 'https://autumn-smoke-staging.digitalpfizer.com/api/get-config';

let useWorkflow = false;

/**
 * Debug UI for internal dev team, only shows on coreTeamDebug
 */

// localStorage debug variables for devs
// const coreFormsDebug = localStorage.getItem('core_block_debug') === 'true';
// function debugFormUi(block) {
//   block.removeAttribute('data-form-debug');
//   if (!coreFormsDebug) return;

//   block.setAttribute('data-form-debug', 'true');

//   const getForm = block.querySelector('form');
//   const newDiv = document.createElement('div');
//   newDiv.classList.add('debug-ui');
//   newDiv.innerHTML = `
//     <div class="title">Localhost Debug UI </div>
//     <div class="form-response"> <!-- to be populated --></div>
//   `;
//   block.insertBefore(newDiv, getForm);
// }

/**
 * Makes an API request to the forms service
 * @param {string} token - The authentication token
 * @param {string} method - The HTTP method to use
 * @param {object} payload - The request payload
 * @param {boolean} availableUatDomain - Whether to use UAT domain
 * @returns {Promise} The API response
 */
const formsConfigApiRequest = async (token, method = 'GET', payload = null, availableUatDomain = false, environment = '') => {
  const headers = new Headers();
  const endpoint = availableUatDomain ? CONFIG_WORKFLOW_ENDPOINT_UAT : CONFIG_WORKFLOW_ENDPOINT_PROD;
  const path = `${endpoint}/${token}`;
  headers.append('x-client-environment', environment);
  const response = await fetch(path, {
    method,
    headers,
    body: payload,
  });
  return response;
};

const formsApiRequest = async (token, method = 'GET', payload = null, availableUatDomain = false) => {
  const headers = new Headers();
  headers.append('x-config-token', token);
  const path = availableUatDomain ? FORMS_API_ENDPOINT_UAT : FORMS_API_ENDPOINT_PROD;
  const response = await fetch(path, {
    method,
    headers,
    body: payload,
  });
  return response;
};

async function getConfigData(token, environment, availableUatDomain) {
  if (!useWorkflow) {
    return {
      configToken: token,
      configData: null,
    };
  }

  const resp = await formsConfigApiRequest(token, 'GET', null, availableUatDomain, environment);

  if (resp.status !== 200) {
    const errorData = await resp.json();
    if (errorData?.message) {
      throw new Error(`${errorData?.message}`);
    }
    throw new Error(`Error loading webform: ${token}`);
  }

  const json = await resp.json();

  return {
    configToken: json.configToken,
    configData: json?.config?.fields,
  };
}

async function getFormData(token, availableUatDomain) {
  const resp = await formsApiRequest(token, 'GET', null, availableUatDomain);

  if (resp.status !== 200) {
    const errorData = await resp.json();
    if (errorData?.message) {
      throw new Error(`${errorData?.message}`);
    }
    throw new Error(`Error loading webform: ${token}`);
  }

  const json = await resp.json();

  return {
    formData: json?.data?.fields,
    csrfToken: json?.data?.csrfToken,
  };
}

const getFormsEnv = () => (Env.isLive() || Env.isProd() ? 'production' : 'non-production');

/**
 * Fetches form configuration from the builder service
 * @param {string} token - The form token
 * @param {string} successPage - Success page URL
 * @param {boolean} successRedirect - Whether to redirect on success
 * @param {boolean} availableUatDomain - Whether to use UAT domain
 * @returns {Promise<object>} The form definition
 */
const fetchBuilderForm = async (token, successPage, successRedirect, availableUatDomain) => {
  try {
    const environment = getFormsEnv();
    const { configData, configToken } = await getConfigData(token, environment, availableUatDomain);
    const { formData, csrfToken } = await getFormData(configToken, availableUatDomain);

    const fieldData = configData || formData;
    const path = availableUatDomain ? FORMS_API_ENDPOINT_UAT : FORMS_API_ENDPOINT_PROD;

    const formDef = {
      submitTo: path,
      configToken,
      csrfToken,
      formEnv: environment,
    };

    let hasSubmitButton = false;
    formDef.data = fieldData
      .filter((fd) => fd.type !== 'html' || (fd.type === 'html' && fd.html))
      .map((fd) => {
        if (fd.type === 'submit') {
          hasSubmitButton = true;
          return {
            ...fd,
            type: 'submit',
            placeholder: '',
            format: '',
            mandatory: '',
            options: '',
            rules: '',
            successPage,
            successRedirect,
          };
        }

        let mandatory = '';
        if (fd.validators) mandatory = fd.validators.find((v) => v.type === 'required') ? 'x' : '';

        const obj = {
          ...fd,
          mandatory,
          placeholder: fd.placeholder || '',
        };

        if (fd.type === 'html') {
          obj.html = fd.html;
        }

        if (fd.type === 'button') {
          if (!fd?.attributes) {
            console.error('missing attributes for button', fd);
            return obj;
          }

          const purpose = fd?.attributes.find((attr) => Object.keys(attr)[0] === 'purpose' && Object.values(attr)[0] === 'primary');

          if (purpose && !hasSubmitButton) {
            hasSubmitButton = true;
            obj.type = 'submit';
            obj.successPage = successPage;
            obj.successRedirect = successRedirect;
          }
        }

        return obj;
      });

    return formDef;
  } catch (error) {
    console.error('Error fetching form', error);
    return {
      error: error.message,
    };
  }
};

/**
 * Extract all form data for submission
 * @param {Object} form The form
 * @returns {Object} Object of all form data in id (key) value pairs
 */
const constructPayload = (form) => {
  // TODO: confirm payload still has appropriate information
  const payload = {};
  [...form.querySelectorAll('[name]')].forEach((fe) => {
    const { name, value } = fe;
    if (fe.type.startsWith('select')) {
      // don't add disabled select values to payload
      if (!fe.options[fe.selectedIndex].disabled) {
        payload[name] = value;
      }
    } else if (fe.type === 'checkbox') {
      // add all checked checkbox values to the payload
      if (fe.checked) {
        if (payload[name]) payload[name] = [...payload[name], value];
        else payload[name] = value;
      }
    } else if (fe.type === 'radio') {
      if (fe.checked) {
        payload[name] = value;
      }
    } else if (fe.type === 'date') {
      if (value) {
        const valueWithSlash = value.replace(/-/g, '/');
        const date = new Date(valueWithSlash);
        payload[name] = `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
      }
    } else if (fe.type === 'hidden') {
      if (value) payload[name] = value;
    } else if (name) {
      payload[name] = value;
    }
  });
  return payload;
};

const validateRequiredFields = (form) => {
  const requiredFields = form.querySelectorAll('[required]');
  const requiredFieldsErrorArray = [];

  requiredFields.forEach((field) => {
    if (!field.value) {
      requiredFieldsErrorArray.push({
        [field.name]: 'This field is required.',
      });
    }
  });
  return requiredFieldsErrorArray;
};

/**
 * Submits the form data to the API
 * @param {HTMLFormElement} form - The form element to submit
 * @returns {Promise<object>} The submission result
 */
const submitForm = async (form) => {
  try {
    const payload = constructPayload(form);
    const { csrfToken, configToken } = form.dataset;
    payload.csrfToken = csrfToken;

    const hasEmptyRequiredFields = validateRequiredFields(form);
    if (hasEmptyRequiredFields.length > 0) {
      return {
        success: false,
        status: 400,
        payload: {
          errors: [{ detailObj: hasEmptyRequiredFields }],
        },
      };
    }

    const resp = await fetch(form.dataset.action, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'x-config-token': configToken,
      },
      body: JSON.stringify(csrfToken ? payload : { data: payload }),
    });

    return {
      success: resp.status < 400,
      status: resp.status,
      payload: await resp.json(),
    };
  } catch (error) {
    console.error('Error submitting form', error);
    return null;
  }
};

/**
 * Toggle enabled/disabled state of primary and secondary buttons
 * @param {Element} form The form
 * @param {Boolean} forceEnabled Force enabled state
 * @returns void
 */
const toggleEnabledButtons = (form, forceEnabled = false) => {
  form.querySelectorAll('button.primary, button.secondary').forEach((buttonElement) => {
    const isDisabled = buttonElement.hasAttribute('disabled');
    if (!isDisabled && !forceEnabled) {
      buttonElement.setAttribute('disabled', true);
    } else {
      buttonElement.removeAttribute('disabled');
    }
  });
};

/**
 * Checks if a section is valid based on field errors
 * @param {Element} section - The section element to check
 * @param {Array} errors - Array of error objects
 * @returns {boolean} Whether the section is valid
 */
const checkSectionValidity = (section, errors) => {
  const errorFieldIds = errors.map((errorObject) => Object.keys(errorObject)[0]);
  const sectionFieldIds = section.getAttribute('data-multistep-field-ids').split(',');

  return !sectionFieldIds.some((sectionFieldId) => errorFieldIds.includes(sectionFieldId.trim()));
};

/**
 * Checks the validity of the input field (calling the API if the validation result is not passed)
 * @param {object} input
 * @param {object} submission
 * @returns
 */
async function checkValidity(input, submission = null) {
  let result = submission;
  if (!submission) {
    const form = input.closest('form');
    if (!form) {
      return '';
    }
    toggleEnabledButtons(form, false);
    result = await submitForm(form);
    toggleEnabledButtons(form, true);
  }
  const name = input.getAttribute('name');
  // can the payload contain multiple errors?
  const errors = result?.payload.errors?.[0]?.detailObj;
  if (errors) {
    const currentError = errors?.find((errorObject) => Object.keys(errorObject)[0] === name)?.[name] ?? '';
    return {
      currentError,
    };
  }

  return null;
}

/**
 * Create an error element for the input field
 * @param {string} error
 * @param {object} fieldWrapper
 * @returns
 */
function handleValidationError(error, fieldWrapper) {
  if (!fieldWrapper) return;
  fieldWrapper.classList.remove('is-invalid');
  fieldWrapper.querySelector('.error-message')?.remove();
  if (error === '' || !error) return;
  const errorElement = document.createElement('small');
  errorElement.classList.add('error-message');
  errorElement.textContent = error;
  if (fieldWrapper.classList.contains('core-form-textarea-wrapper')) {
    fieldWrapper.querySelector('.counter-wrapper').append(errorElement);
  } else {
    fieldWrapper.append(errorElement);
  }
  fieldWrapper.classList.add('is-invalid');
}

/**
 * Checks the state of the input field and applies the correct classes
 * validates the input field if the validate is set to true
 * @param {object} input
 * @param {boolean} validate
 * @param {string} locationFired
 */
const checkState = async (input, validate = true) => {
  const wrapperElement = input.closest('.core-form-field-wrapper');
  wrapperElement?.classList.toggle('has-value', !!input.value);
  wrapperElement?.classList.toggle('is-disabled', input.disabled);
  if (input.type === 'checkbox' || input.type === 'radio') {
    wrapperElement?.classList.add('is-dirty');
  }
  if (validate) {
    const validity = await checkValidity(input);
    handleValidationError(validity?.currentError, input.closest('.core-form-field-wrapper'));
  }
};

/**
 * Validates the inputs of a form or form section
 * @param {Element} root - the form or the form section
 * @returns
 */
async function validateInputs(root, submission) {
  try {
    let result = submission;
    if (!submission) {
      toggleEnabledButtons(root.closest('form'), false);
      result = await submitForm(root.closest('form'));
      toggleEnabledButtons(root.closest('form'), true);
    }
    if (result) {
      root.querySelectorAll('input, select, textarea').forEach(async (input, index) => {
        checkState(input, false);
        input.parentElement?.classList.add('is-dirty');
        const wrapper = input.closest('.core-form-field-wrapper');
        const validity = await checkValidity(input, result);
        if (validity) {
          handleValidationError(validity.currentError, wrapper);
          // input.closest('.core-form-section').classList.toggle('is-invalid', !validity.isSectionValid);

          // add focus to first input with error
          if (index === 0) {
            input.focus();
          }
        }

        wrapper?.classList.add('is-dirty');
        wrapper?.classList.add('is-validated');
      });
      // section validity
      if (root.classList.contains('core-form-section')) {
        const isValid = !result.payload.errors?.[0] || checkSectionValidity(root, result.payload.errors[0].detailObj);
        root.classList.toggle('is-valid', isValid);
        return isValid;
      }
      // form validity
      return submission.success;
    }
  } catch (error) {
    console.error('Error submitting form', error);
  }
  return null;
}

const lastStepValidatorId = 'last_step_validator_field';

const validateLastSection = async (form) => {
  const validatorField = form.querySelector(`#${lastStepValidatorId}`);
  if (validatorField) {
    validatorField.value = 'true';
  }
};

/**
 *  Submit form listener for primary buttons
 *
 * @param {*} button
 * @param {*} fd
 */
const submitFormListener = async (button, fd) => {
  button.addEventListener('click', async (event) => {
    event.preventDefault();

    const form = event.currentTarget.closest('form') ?? document.getElementById(event.currentTarget.getAttribute('form'));

    if (!form) {
      console.error('missing form element');
      return;
    }

    if (button.type === 'submit') {
      validateLastSection(form);
    }

    const container = form.closest('.core-form');
    toggleEnabledButtons(form, false);
    const submission = await submitForm(form);

    if (submission?.success) {
      const successPageUrl = `${fd.successPage || '/forms/thank-you'}`;
      form.parentElement?.classList.remove('form-errors');

      if (fd?.successRedirect === true) {
        setTimeout(() => {
          window.location.href = `${successPageUrl}`;
        }, 1000);
      } else {
        container.classList.add('form-success');
        container.innerHTML = '';

        const resp = await fetch(`${successPageUrl}.plain.html`);
        const html = await resp.text();
        const responseContent = document.createElement('div');
        responseContent.innerHTML = html;
        decorateSections(responseContent);
        decorateDefaultContent(responseContent);
        decorateBlocks(responseContent);
        loadBlocks(responseContent);
        const formSection = container.closest('.section');
        formSection.insertAdjacentElement('afterend', responseContent);
      }
    } else {
      validateInputs(form, submission);
      toggleEnabledButtons(form, true);
    }

    toggleEnabledButtons(form, true);
  });
};

/**
 * Build form button
 * @param {Object} fd The field definition
 * @returns {Element} BUTTON element with Label text content
 */
const createButton = (fd) => {
  const button = document.createElement('button');
  const span = document.createElement('span');
  span.textContent = fd.label;
  button.append(span);
  button.classList.add('button');
  button.type = fd.type || '';
  button.id = fd.id || '';
  button.name = fd.name || '';

  // add correct attributes
  fd?.attributes?.forEach((fdAttributes) => {
    // add classes
    fdAttributes?.class
      ?.trim()
      .split(' ')
      .forEach((classItem) => {
        button.classList.add(classItem);
      });

    button.classList.add('primary');
  });

  if (fd.type === 'submit') {
    submitFormListener(button, fd);
  }

  if (fd.icon) {
    button.className = 'has-icon';
    const icon = document.createElement('span');
    icon.className = `icon icon-${fd.icon}`;
    button.append(icon);
  }

  return button;
};

/**
 * Build form heading
 * @param {Object} fd The field definition
 * @returns {Element} H3 element with Label text content
 */
const createHeading = (fd) => {
  const heading = document.createElement('h3');
  heading.textContent = fd.label;
  return heading;
};

/**
 * Build form copy
 * @param {Object} fd The field definition
 * @returns {Element} P element with Label text content
 */
const createCopy = (fd) => {
  const copy = document.createElement('span');
  const firstCharacter = fd.label.charAt(0);
  if (firstCharacter === '*') {
    const requiredCharacter = document.createElement('span');
    requiredCharacter.textContent = '*';
    requiredCharacter.classList.add('required');
    // remove char at 0
    fd.label = fd.label.slice(1);
    copy.append(requiredCharacter);
  }
  copy.textContent = fd.label;
  return copy;
};

/**
 * Build form field label
 * @param {Object} fd The field definition
 * @returns {Element} LABEL element linked to Field with Label text content
 */
const createLabel = (fd) => {
  const label = document.createElement('label');
  label.setAttribute('for', fd.name || fd.field);
  label.textContent = fd.label;
  if (fd.mandatory === 'x') label.classList.add('required');
  if (fd.reversed) label.classList.add('reversed');
  return label;
};

/**
 * Toggles the 'child-input-focused' class on the closest '.field-wrapper' element
 * based on the event type and specified HTML tag and type.
 *
 * @param {Event} event - The event object.
 * @param {string} htmlTag - The HTML tag to validate.
 * @param {string} htmlType - The HTML input type to validate.
 * @param {string} [toggle='on'] - The toggle action, either 'on' to add the class or 'off' to remove it.
 */
const toggleFieldWrapperFocused = (event, htmlTag, htmlType, toggle = 'on') => {
  const getHtmlTag = htmlTag.toUpperCase();
  const getHtmlType = htmlType.toLowerCase();

  // validate tag and type
  if (event.target.tagName !== getHtmlTag || event.target.type !== getHtmlType) return;

  const element = event.target;
  const wrapperElement = element.closest('.field-wrapper');
  if (!wrapperElement) return;

  if (toggle === 'on') {
    wrapperElement?.classList.add('child-input-focused');
  } else {
    wrapperElement?.classList.remove('child-input-focused');
  }
};

/**
 * Handles the focus event on an input field and toggles the 'child-input-focused' class on.
 *
 * @param {Event} event - The focus event object.
 * @param {string} htmlTag - The HTML tag to validate.
 * @param {string} htmlType - The HTML input type to validate.
 */
const checkOnFocused = (event, htmlTag, htmlType) => {
  if (!(event instanceof FocusEvent)) return;
  toggleFieldWrapperFocused(event, htmlTag, htmlType);
};

/**
 * Handles the blur event on an input field and toggles the 'child-input-focused' class off.
 *
 * @param {Event} event - The blur event object.
 * @param {string} htmlTag - The HTML tag to validate.
 * @param {string} htmlType - The HTML input type to validate.
 */
const checkOnBlurLeave = (event, htmlTag, htmlType) => {
  if (!(event instanceof FocusEvent)) return;
  toggleFieldWrapperFocused(event, htmlTag, htmlType, 'off');
};

/**
 * Adds event listeners for focus and blur events on an input field and handles them accordingly.
 *
 * @param {HTMLElement} inputField - The input field element.
 * @param {string} type - The type of the input field.
 */
const constFieldTypeAccessiblity = (inputField, type) => {
  const handleFocusBlur = (event) => {
    if (!(event instanceof FocusEvent)) return;

    const eventType = event.type;
    const inputType = event.target.type;

    if (eventType === 'focus') {
      checkOnFocused(event, 'input', inputType);
    } else if (eventType === 'blur') {
      checkOnBlurLeave(event, 'input', inputType);
    }
  };

  if (['text', 'email', 'number', 'password', 'date', 'time'].includes(type)) {
    inputField.addEventListener('focus', handleFocusBlur);
    inputField.addEventListener('blur', handleFocusBlur);
  }
};

/**
 * Build form field input
 * @param {Object} fd The field definition
 * @returns {Element} INPUT element with Type, Placeholder, and optional Value
 */
const setRequiredAttributes = (element, ariaRequired, isRequired) => {
  element.required = isRequired;
  element.setAttribute('aria-required', String(Boolean(ariaRequired)));
};

/**
 * Checks if a field is mandatory based on its definition
 * @param {Object} fd The field definition
 * @returns {boolean} Whether the field is mandatory
 */
const isMandatory = (fd) => fd.mandatory === 'x';

/**
 * Sets aria-labelledby attribute for specific input types
 * @param {HTMLElement} element The input element
 * @param {Object} fd The field definition
 */
const setAriaLabelledBy = (element, fd) => {
  if (['email', 'number'].includes(fd.type)) {
    element.setAttribute('aria-labelledby', `${fd.name}-label`);
  }
};

/**
 * Create input field
 *
 * @param {*} fd
 * @returns
 */
const createInput = (fd) => {
  const input = document.createElement('input');
  input.type = fd.type;
  input.id = fd.name || fd.field;
  input.setAttribute('name', fd.name);
  if (fd.placeholder) input.setAttribute('placeholder', fd.placeholder);

  setAriaLabelledBy(input, fd);
  if (fd.value) input.value = fd.value;

  // Set both aria-required and required attributes
  setRequiredAttributes(input, isMandatory(fd), isMandatory(fd));

  // Set aria-labelledby for email address and phone number fields
  if (['email', 'number'].includes(fd.type)) {
    input.setAttribute('aria-labelledby', `${fd.name}-label`);
  }

  if (fd.attributes) {
    fd.attributes.forEach((attribute) => {
      if (typeof attribute === 'string') {
        input.setAttribute(attribute, attribute);
      } else {
        const [key, value] = Object.entries(attribute)[0];
        input.setAttribute(key, value);
      }
    });
  }

  input.addEventListener('blur', async () => {
    await checkState(input, false);
    input.parentElement?.classList.add('is-dirty');
    input.closest('.core-form-field-wrapper')?.classList.add('is-dirty');
  });

  input.addEventListener('input', () => {
    const wrapper = input.closest('.core-form-field-wrapper');
    wrapper?.classList.remove('is-validated');
    wrapper?.classList.remove('is-invalid');
  });

  checkState(input, true);

  // this associates the proper input types with the correct accessibility
  constFieldTypeAccessiblity(input, fd.type);

  return input;
};

/**
 * formats options for string or array
 * @param {Array|String} options
 * @returns {Array} options array of options to append [ {value:'foo', label:'bar'} ]
 */
const formatOptionsArray = (options) => {
  if (typeof options === 'string') {
    const optArray = [];
    options.split(',').forEach((o) => {
      optArray.push({
        label: o.trim(),
        value: o.trim(),
      });
    });
    return optArray;
  }
  return options;
};

/**
 * Build form field checkbox and radio options
 * @param {Object} fd
 * @param {Array} options array of options to append [ {value:'foo', label:'bar'} ]
 * @returns void
 */
const wrapSelections = (fd, options = []) => {
  const selections = [];
  options.forEach((option, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = `${fd.type}-wrapper`;
    // wrapper.setAttribute('tabindex', '0'); // Make the wrapper focusable

    const inputId = `${toClassName(fd.name)}-${index}`;
    const selection = createInput({
      type: fd.type,
      field: inputId,
      value: option.value,
    });
    selection.setAttribute('name', fd.name);
    selection.setAttribute('id', inputId);

    const label = createLabel({
      field: inputId,
      label: option.label,
    });
    label.setAttribute('for', inputId);

    wrapper.append(selection, label);
    selections.push(wrapper);
  });

  return selections;
};

/**
 * Toggles focus state for select combobox elements
 * @param {Event} event The focus/blur event
 * @param {HTMLElement} htmlTarget The target element
 * @param {string} toggle Whether to toggle on or off
 */
const toggleSelectComboBoxFocused = (event, htmlTarget, toggle = 'on') => {
  if (!(event instanceof FocusEvent)) return;

  if (
    !htmlTarget?.hasAttribute('role') ||
    !htmlTarget?.hasAttribute('class') ||
    htmlTarget.getAttribute('class') !== 'combo-input' ||
    htmlTarget.getAttribute('role') !== 'combobox'
  )
    return;

  const wrapperElement = htmlTarget.closest('.field-wrapper');
  wrapperElement?.classList.add('field-wrapper-focused--select');

  if (toggle === 'on') {
    wrapperElement?.classList.add('combo-input-focused');
  } else {
    wrapperElement?.classList.remove('combo-input-focused');
  }
};

/**
 * Build form field select
 * @param {Object} fd The field definition
 * @returns {Element} SELECT element with OPTIONs
 */
const createSelect = (fd) => {
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'text';
  hiddenInput.id = fd.name;
  hiddenInput.name = fd.name;
  hiddenInput.setAttribute('name', fd.name);
  hiddenInput.style.display = 'none';
  hiddenInput.classList.add(`hidden`);

  const selectComponent = new Select(
    null,
    (index) => {
      // set input value to selected option
      hiddenInput.value = fd.options[index].value;
      checkState(hiddenInput, false);
    },
    {
      options: fd.options.map((item) => item.value),
      customSelectedOptions: fd.options.map((item) => item.label),
      disabledOptions: fd.options.map((item) => !!item.disabled),
      name: fd.name,
      label: fd.label,
      icon: 'fpo',
      defaultMessage: 'Select an option',
      required: isMandatory(fd),
      reversed: fd.reversed,
    },
    null
  );
  selectComponent.init();

  selectComponent.el.append(hiddenInput);

  // accessibility for focus and blur
  selectComponent?.comboEl.addEventListener('focus', (event) => {
    toggleSelectComboBoxFocused(event, event.target);
  });
  selectComponent?.comboEl.addEventListener('blur', async (event) => {
    toggleSelectComboBoxFocused(event, event.target, 'off');
    await checkState(hiddenInput, false);
    setTimeout(() => {
      const wrapper = hiddenInput.closest('.core-form-field-wrapper');
      wrapper?.classList.add('is-dirty');
      wrapper?.classList.remove('is-validated');
    }, 0);
  });

  return selectComponent.el;
};

/**
 * Build form field checkboxes or radios
 * @param {Object} fd The field definition
 * @returns {Array} array of selection elements
 */
const createSelections = (fd) => wrapSelections(fd, formatOptionsArray(fd.options));

/**
 * Build form field checkboxes or radios
 * @param {Object} fd The field definition
 * @returns {Array} array of selection elements
 */
const createCheckbox = (fd) => {
  fd.type = 'checkbox';
  fd.label ??= fd.name;
  fd.value ??= true;
  const checkbox = createInput(fd);

  // Set initial aria attributes
  checkbox.setAttribute('aria-live', 'polite');
  checkbox.setAttribute('aria-label', 'Unchecked');
  checkbox.setAttribute('aria-checked', 'false');

  // Add event listener to update aria attributes
  checkbox.addEventListener('change', () => {
    const isChecked = checkbox.checked;
    const announcement = isChecked ? 'Checked' : 'Unchecked';
    checkbox.setAttribute('aria-label', announcement);
    checkbox.setAttribute('aria-checked', isChecked);
  });

  setRequiredAttributes(checkbox, true, isMandatory(fd));

  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.classList.add('checkbox-wrapper');

  const label = createLabel(fd);
  checkboxWrapper.append(label);

  checkboxWrapper.prepend(checkbox);

  return checkboxWrapper;
};

/**
 * Build form field checkboxes or radios
 * @param {Object} fd The field definition
 * @returns {Array} array of selection elements
 */
const createCheckboxes = (fd) => {
  fd.type = 'checkbox';
  const checkboxes = wrapSelections(fd, formatOptionsArray(fd.options));

  checkboxes.forEach((checkbox) => {
    const input = checkbox.querySelector('input[type="checkbox"]');

    // Set aria-live attribute for dynamic announcements
    input.setAttribute('aria-live', 'polite');

    // Set default aria-label and aria-checked attributes
    input.setAttribute('aria-label', 'Unchecked');
    input.setAttribute('aria-checked', 'false');

    // Add event listener to announce state changes
    input.addEventListener('change', () => {
      const isChecked = input.checked;
      const announcement = isChecked ? 'Checked' : 'Unchecked';
      input.setAttribute('aria-label', announcement);
      input.setAttribute('aria-checked', isChecked);
    });
  });

  return checkboxes;
};

/**
 * Build form field support text
 * @param {Object} fd The field definition
 * @returns {Element} SMALL element with field support text
 */
const createSupport = (fd) => {
  const support = document.createElement('small');
  support.textContent = fd.support;
  return support;
};

/**
 * Creates a character counter for a textarea
 * @param {HTMLTextAreaElement} textarea The textarea element
 * @returns {HTMLElement} The counter element
 */
const createCounter = (textarea) => {
  const counter = document.createElement('small');
  counter.classList.add('counter');

  const maxLength = 100; // just for testing
  const setCounterText = () => {
    counter.textContent = `${textarea.value.length.toString().padStart(2, '0')}/${maxLength.toString().padStart(3, '0')}`;
  };
  textarea.addEventListener('input', () => {
    setCounterText();
    textarea.closest('.core-form-field-wrapper')?.classList.remove('is-validated');
  });
  setCounterText();

  return counter;
};

/**
 * Build form field textarea
 * @param {Object} fd The field definition
 * @returns {Element} TEXTAREA element with Placeholder and optional Value
 */
const createTextArea = (fd, wrapper) => {
  const textarea = document.createElement('textarea');
  textarea.id = fd.name;
  textarea.setAttribute('name', fd.name);
  if (fd.placeholder) textarea.setAttribute('placeholder', fd.placeholder);
  if (fd.value) textarea.value = fd.value;

  setRequiredAttributes(textarea, true, isMandatory(fd));

  setAriaLabelledBy(textarea, fd);
  if (fd.mandatory === 'x') textarea.required = true;
  textarea.addEventListener('blur', async () => {
    await checkState(textarea, false);
    textarea.closest('.field-wrapper').classList.add('is-dirty');
  });

  textarea.addEventListener('input', () => {
    checkState(textarea, false);
  });

  const textareaContainer = document.createElement('div');
  textareaContainer.classList.add('textarea-container');
  textareaContainer.append(textarea);

  wrapper.append(textareaContainer);
  const counterParent = document.createElement('div');
  counterParent.classList.add('counter-wrapper');
  if (fd.support) counterParent.append(createSupport(fd));
  counterParent.append(createCounter(textarea));

  wrapper.append(counterParent);
};

const applyRules = (form, rules) => {
  const payload = constructPayload(form);
  rules.forEach((field) => {
    const {
      type,
      condition: { key, operator, value },
    } = field.rule;

    if (type === 'visible' && operator === 'eq') {
      const fieldElement = form.querySelector(`.${field.fieldId}`);

      if (payload[key] === value) {
        fieldElement.classList.remove('hidden');
      } else {
        fieldElement.classList.add('hidden');
      }
    }
  });
};

const addFormItemWrapperClass = (element, className) => {
  element.classList.add(`core-form-${className}-wrapper`);
};

const configureNumberInput = (input, options) => {
  if (options.step) input.step = options.step;
  if (options?.validators) {
    const minValidator = options.validators.find((v) => v.type === 'minValue');
    if (minValidator) {
      input.min = minValidator.value;
    }
    const maxValidator = options.validators.find((v) => v.type === 'maxValue');
    if (maxValidator) {
      input.max = maxValidator.value;
    }
  }
};

/**
 * Restructure JSON to be more easily processed
 * @param {Array} jsonData
 * @returns {Array} restructured JSON
 */
const restructureJson = (jsonData) => {
  if (!jsonData) {
    return jsonData;
  }

  const fieldDict = jsonData.reduce(
    (acc, field) => ({
      ...acc,
      [field.name]: field,
    }),
    {}
  );

  // Process each field to find sections and restructure them
  jsonData.forEach((field) => {
    if (field.type === 'section' && field.childFieldRefs) {
      field.children = field.childFieldRefs.map((ref) => fieldDict[ref]);
    }
  });

  // flat array of names which are in sections
  const sectionedFieldNames = jsonData
    .filter((field) => field.type === 'section')
    .map((field) => field.childFieldRefs)
    .flat();

  // if name is in array of sectioned field names, mark as nested to be hidden
  jsonData.forEach((field) => {
    if (sectionedFieldNames.includes(field.name) && field.type !== 'section') {
      field.isNested = 'true';
    }
  });

  return jsonData;
};

/**
 * Apply variant markup to form field
 * @param {Element} fd The field definition
 *
 * TODO: add an array of allowed variants per input type, so we can return out if not allowed
 */
const applyFieldJsonOption = (fd, fieldWrapper) => {
  const variantNamespace = `variant-${fd?.type}-${fd?.variant}`;
  fieldWrapper.classList.add(variantNamespace);

  // add data tags if need for different input fields
  fieldWrapper.querySelectorAll('input, textarea, select').forEach((inputField) => {
    inputField.setAttribute('data-field-variant', fd?.variant);
  });
};

/**
 * Build form field
 * @param {Object} fd The field definition
 * @returns {Element} DIV element with field
 */
const createField = (fd) => {
  fd.type = fd.type || 'text';
  // wrap form field
  const fieldWrapper = document.createElement('div');
  const style = fd.style ? ` form-${fd.style}` : '';
  const fieldId = `core-form-${fd.type}-wrapper${style}`;
  fieldWrapper.className = fieldId;
  fieldWrapper.classList.add('field-wrapper');
  fieldWrapper.classList.add('core-form-field-wrapper');
  if (fd.section) fieldWrapper.dataset.section = fd.section;

  // based on type of field, we set the title to be absolute or relative
  const isRelativeLabels = ['checkboxes', 'radio', 'checkbox', 'select'];
  if (isRelativeLabels.includes(fd.type)) {
    fieldWrapper.classList.add('field-label-position-relative');
  } else {
    fieldWrapper.classList.add('field-label-position-absolute');
  }

  // variant data tag activate generally
  if (fd?.variant) {
    fieldWrapper.setAttribute('data-core-form-variant', 'true');
  }

  const handleCheckboxVariant = (field) => {
    if (!field.variant) {
      field.variant = 'default';
    }
  };

  // build form field
  switch (fd.type) {
    case 'heading':
      fieldWrapper.append(createHeading(fd));
      break;
    case 'copy':
      fieldWrapper.append(createCopy(fd));
      break;
    case 'select':
      fd.reversed = fieldWrapper.closest('.core-form')?.classList.contains('reversed');
      if (fd.label) fieldWrapper.append(createLabel(fd));
      fieldWrapper.append(createSelect(fd));
      addFormItemWrapperClass(fieldWrapper, fd.type);
      if (fd.support) fieldWrapper.append(createSupport(fd));
      if (fd.reversed) fieldWrapper.classList.add('reversed');
      break;
    case 'checkbox':
      handleCheckboxVariant(fd);
      fieldWrapper.append(createCheckbox(fd));

      addFormItemWrapperClass(fieldWrapper, fd.type);
      break;
    case 'checkboxes':
      handleCheckboxVariant(fd);

      if (fd.label) fieldWrapper.append(createLabel(fd));
      // data-core-form-variant
      fieldWrapper.append(...createCheckboxes(fd));
      break;
    case 'radio':
      if (fd.label) fieldWrapper.append(createLabel(fd));
      fieldWrapper.append(...createSelections(fd));
      break;
    case 'textarea':
      if (fd.label) fieldWrapper.append(createLabel(fd));
      createTextArea(fd, fieldWrapper);
      break;
    case 'date':
      if (fd.label) fieldWrapper.append(createLabel(fd));
      fieldWrapper.append(createInput(fd));
      addFormItemWrapperClass(fieldWrapper, fd.type);
      if (fd.support) fieldWrapper.append(createSupport(fd));
      break;
    case 'time':
      if (fd.label) fieldWrapper.append(createLabel(fd));
      fieldWrapper.append(createInput(fd));
      addFormItemWrapperClass(fieldWrapper, fd.type);
      if (fd.support) fieldWrapper.append(createSupport(fd));
      break;
    case 'button':
    case 'submit':
      fieldWrapper.classList.add('form-button-wrapper');
      fieldWrapper.append(createButton(fd));
      break;
    case 'honeypot':
      fd.type = 'hidden';
      fieldWrapper.append(createInput(fd));
      addFormItemWrapperClass(fieldWrapper, 'hidden');
      break;
    case 'hidden':
      fieldWrapper.append(createInput(fd));
      addFormItemWrapperClass(fieldWrapper, 'hidden');
      break;
    case 'html':
      if (fd?.html) {
        fieldWrapper.classList.add('form-html-wrapper');
        fieldWrapper.classList.add('default-content-wrapper');
        fieldWrapper.innerHTML = fd.html;
        // validate if first char is *
        const allParagraphs = fieldWrapper.querySelectorAll('p');
        allParagraphs.forEach((p) => {
          const firstCharacter = p.textContent.charAt(0);
          if (firstCharacter === '*') {
            const requiredCharacter = document.createElement('span');
            requiredCharacter.textContent = '*';
            requiredCharacter.classList.add('required');
            // remove char at 0
            p.textContent = p.textContent.slice(1);
            p.prepend(requiredCharacter);
          }
        });
      }
      break;
    case 'section':
      console.error('Section field type should not be rendered');
      fieldWrapper.innerHTML = '';
      break;
    case 'number':
      if (fd.label) fieldWrapper.append(createLabel(fd));
      fieldWrapper.append(createInput(fd));
      addFormItemWrapperClass(fieldWrapper, 'text');
      if (fd.support) fieldWrapper.append(createSupport(fd));
      configureNumberInput(fieldWrapper.querySelector('input'), fd);
      break;
    default:
      if (fd.label) fieldWrapper.append(createLabel(fd));
      fieldWrapper.append(createInput(fd));
      addFormItemWrapperClass(fieldWrapper, 'text');
      if (fd.support) fieldWrapper.append(createSupport(fd));
  }

  // apply classes markup to allow unique styles based on string
  if (fd?.variant) {
    applyFieldJsonOption(fd, fieldWrapper);
  }
  return fieldWrapper;
};

const multiStepFormInteractions = (fieldSectionWrapper, sectionFieldReference, sectionIndex, formReference, isLast = false) => {
  // section related field wrappers
  const sectionedFields = fieldSectionWrapper;

  // validate each section has a button to navigate
  const sectionsWithButton = Array.from(sectionedFields).find((div) => div.querySelectorAll('button').length === 0);
  if (sectionsWithButton) {
    throw new Error('Div with data-section-multistep-index does not contain any buttons');
  }

  // data tag helpers
  sectionedFields.setAttribute('data-section-multistep-index', sectionIndex);
  sectionedFields.setAttribute('data-multistep-field-ids', sectionFieldReference.children.map((child) => child.name).join(','));

  // markup for section html
  const getSectionLabel = sectionFieldReference?.label ?? `Step ${sectionIndex + 1}`;
  const sectionLabel = document.createElement('div');
  sectionLabel.classList.add('section-multistep-label');
  sectionLabel.textContent = getSectionLabel;
  sectionedFields.prepend(sectionLabel);

  const icon = document.createElement('span');
  icon.classList.add('icon', 'icon-lib-check-circle');
  sectionLabel.append(icon);

  if (isLast) sectionedFields.classList.add('last-section');

  if (sectionIndex === 0) {
    sectionedFields.setAttribute('data-section-is-active', 'true');
  }

  // just submit normally if this is the last section
  if (isLast) return;

  // loop through all the sections and add click event to any of the buttons (except last)
  sectionedFields.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', async () => {
      const allSections = formReference.querySelectorAll('[data-section-multistep-index]');
      const currentSection = button.closest('.core-form-section-multistep');
      const isSectionValid = await validateInputs(currentSection);
      if (!isSectionValid) return;
      const nextSectionIndex = sectionIndex + 1;
      allSections.forEach((section, index) => {
        if (index === nextSectionIndex) {
          section.setAttribute('data-section-is-active', 'true');
          section.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        } else {
          section.setAttribute('data-section-is-active', 'false');
        }
      });
    });
  });
};

const createForm = async (formDefinition, variantOption) => {
  const form = document.createElement('form');
  form.setAttribute('novalidate', true);
  const formContainer = document.createElement('div');
  formContainer.classList.add('core-form-container');
  form.append(formContainer);
  const rules = [];

  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = formDefinition.submitTo;
  form.dataset.csrfToken = formDefinition.csrfToken;
  form.dataset.configToken = formDefinition.configToken;
  form.dataset.formEnv = formDefinition.formEnv;

  /**
   * clone object to avoid mutating original
   *
   * how is this different?...
   * >> under sections we add children with field information
   * >> for the fields that are in sections, we add isNested: true so we can hide them
   */
  const restructuredJson = restructureJson(formDefinition?.data);
  const jsonDataSection = restructuredJson.filter((fd) => fd.type === 'section');

  // removed formDefinition.data for restructuredJson
  restructuredJson.forEach((fd) => {
    if (fd.isNested === 'true') {
      return;
    }

    // switch on field type & hide if nested
    if (fd.type === 'section') {
      const { children } = fd;
      if (!children) return;

      // if section we loop thru and return with field HTML
      const fieldSectionWrapper = document.createElement('div');
      const fieldSectionId = variantOption === 'multi-step-form-ui' ? `core-form-section-multistep core-form-section` : `core-form-section-inline core-form-section`;
      fieldSectionWrapper.className = fieldSectionId;
      fieldSectionWrapper.dataset.sectionName = fd.name;
      fieldSectionWrapper.dataset.section = '';

      children.forEach((childField) => {
        const fieldWrapper = createField(childField);
        fieldSectionWrapper.append(fieldWrapper);
      });

      // setting up multi-step form interactions //////////////////////////
      if (variantOption === 'multi-step-form-ui') {
        const sectionName = fieldSectionWrapper.getAttribute('data-section-name');
        const sectionFieldReference = jsonDataSection.find((fieldElement) => fieldElement.name === sectionName);
        const sectionIndex = jsonDataSection.findIndex((fieldElement) => fieldElement.name === sectionName);
        const isLast = sectionIndex === jsonDataSection.length - 1;
        multiStepFormInteractions(fieldSectionWrapper, sectionFieldReference, sectionIndex, form, isLast);
        form.setAttribute('data-active-section', 0);
      }
      // /////////////////////////////////////////////////////////////

      formContainer.append(fieldSectionWrapper);

      return;
    }

    // normal field render if at top level
    const fieldWrapper = createField(fd);
    formContainer.append(fieldWrapper);
  });

  form.addEventListener('change', () => applyRules(form, rules));

  applyRules(form, rules);

  return form;
};

function setupIcons(block) {
  const icons = ['icon-lib-mat-error-round', 'icon-lib-mat-warning', 'icon-lib-mat-check-circle', 'icon-lib-input-clear'];

  block.querySelectorAll('.core-form-field-wrapper').forEach((wrapper) => {
    // only use for valid core-form inputs
    const containsFormInput = wrapper.querySelector('input, textarea, select, option');
    // check if has class hidden
    const isHidden = containsFormInput?.classList?.contains('hidden');

    if (!isHidden) {
      if (!containsFormInput) return;

      let parent = wrapper;
      if (wrapper.classList.contains('core-form-textarea-wrapper')) {
        parent = wrapper.querySelector('.textarea-container');
      }

      icons.forEach((icon) => {
        const span = document.createElement('span');
        span.className = `icon ${icon}`;
        parent.append(span);
      });
    }
  });

  decorateIcons(block);

  block.querySelectorAll('.icon-lib-input-clear').forEach((icon) => {
    icon.addEventListener('click', (ev) => {
      const input = ev.target.closest('.field-wrapper').querySelector('input, select');
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    });
  });
}

const markupCallback = async (formConfiguration, block, variantOption = false) => {
  const { token, successPage, successRedirect, additionalStyles, formName, stagingActive } = formConfiguration;

  if (!token) {
    console.error('Missing token in form configuration');
    return null;
  }

  block.textContent = '';

  // if staging is active we allow for other domain
  const availableUatDomain = stagingActive === 'TRUE' && !Env.isLive();

  const formDef = await fetchBuilderForm(token, successPage, successRedirect, availableUatDomain);

  if (formDef?.error) {
    block.classList.add('form-error');
    block.innerHTML = `<span class="icon icon-warning"></span><p>${formDef.error}</p>`;
    return null;
  }

  const formEl = await createForm(formDef, variantOption);
  block.append(formEl);

  // We setup icons in different order since we fetch differently
  setupIcons(block);

  // We allow for a appending css file for unique scenarios
  if (formName) block.classList.add(formName);
  if (additionalStyles) {
    await loadCSS(additionalStyles);
  }

  return block;
};

export default class Form extends FranklinBlock {
  constructor(blockName, block) {
    super(blockName, block);
    this.formConfiguration = {};
    this.scrollableText = null;
    this.hasTermsOfService = false;
  }

  variants = [
    {
      name: 'multi-step-form-ui',
      test: this.block.classList.contains('multistep'),
    },
    {
      name: 'default',
      test: true,
    },
  ];

  formatScrollableCheckboxHtml() {
    if (!this.hasTermsOfService) {
      return;
    }

    const originalCheckboxElement = document.querySelector('.variant-checkbox-scrollable');

    const scrollableTextElement = document.createElement('div');

    scrollableTextElement.innerHTML = this.scrollableText;
    scrollableTextElement.classList.add('scrollable-text-container');

    const consentElement = document.createElement('div');
    consentElement.textContent = 'Consent';
    consentElement.classList.add('consent-container');

    if (originalCheckboxElement && originalCheckboxElement.parentNode) {
      originalCheckboxElement.parentNode.insertBefore(scrollableTextElement, originalCheckboxElement);
      originalCheckboxElement.parentNode.insertBefore(consentElement, scrollableTextElement);
    }

    const scrollableCheckboxes = document.querySelectorAll('.variant-checkbox-scrollable input[type="checkbox"]');

    scrollableCheckboxes.forEach((checkbox) => {
      checkbox.disabled = true;
    });

    // Function to check if the div is scrolled to the bottom
    const isScrolledToBottom = (element) => element.scrollHeight - element.scrollTop === element.clientHeight;

    // Add scroll event listener to the div
    scrollableTextElement.addEventListener('scroll', () => {
      if (isScrolledToBottom(scrollableTextElement)) {
        // Enable the checkboxes
        scrollableCheckboxes.forEach((checkbox) => {
          checkbox.disabled = false;
        });
      }
    });
  }

  static formatToggleCheckboxHtml() {
    const checkboxWrappers = document.querySelectorAll('[class*="variant-checkbox-toggle-"] .checkbox-wrapper');

    let checkboxCounter = 0;

    checkboxWrappers.forEach((checkboxWrapper) => {
      // Create the new div element
      const onOrOffTextDiv = document.createElement('div');
      onOrOffTextDiv.className = 'on-or-off-text';
      onOrOffTextDiv.textContent = 'Off';

      // Select the input and label elements
      const inputElement = checkboxWrapper.querySelector('input[type="checkbox"]');
      const labelElement = checkboxWrapper.querySelector('label');

      if (inputElement && labelElement && inputElement.parentNode === checkboxWrapper) {
        if (inputElement.parentNode !== checkboxWrapper) {
          console.error('input element is not a child of checkbox wrapper', inputElement);
          return;
        }

        // Move the label element before the input element
        checkboxWrapper.insertBefore(labelElement, inputElement);

        // Create the new toggle wrapper div
        const toggleWrapper = document.createElement('div');
        toggleWrapper.className = 'toggle-wrapper';

        // Create the new input element
        const newInputElement = document.createElement('input');
        newInputElement.type = 'checkbox';
        newInputElement.id = `toggle-${checkboxCounter}`;
        newInputElement.className = 'toggle-checkbox';

        // Create the new label element
        const newLabelElement = document.createElement('label');
        newLabelElement.setAttribute('for', `toggle-${checkboxCounter}`);
        newLabelElement.className = 'toggle-label';
        newLabelElement.setAttribute('tabindex', '0');

        newLabelElement.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();

            const checkbox = document.querySelector(`#${newLabelElement.getAttribute('for')}`);
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
          }
        });

        // Create the new span element
        const spanElement = document.createElement('span');
        spanElement.className = 'toggle-knob';

        // Append the new input and span elements to the new label element
        newLabelElement.appendChild(spanElement);

        // Append the new input and label elements to the new toggle wrapper div
        toggleWrapper.appendChild(newInputElement);
        toggleWrapper.appendChild(newLabelElement);
        toggleWrapper.appendChild(onOrOffTextDiv);

        // Replace the old input element with the new toggle wrapper div
        inputElement.replaceWith(toggleWrapper);

        checkboxCounter += 1;
      }
    });
  }

  static handleToggleCheckboxFormInput() {
    document.querySelectorAll('.toggle-checkbox').forEach((checkbox) => {
      const label = checkbox.closest('.checkbox-wrapper').querySelector('label');

      const updateLabelStyle = () => {
        if (checkbox.disabled) {
          label.classList.add('disabled-label');
        } else {
          label.classList.remove('disabled-label');
        }
      };

      updateLabelStyle();

      // Change styles on label if the checkbox becomes disabled
      const observer = new MutationObserver(updateLabelStyle);
      observer.observe(checkbox, { attributes: true, attributeFilter: ['disabled'] });

      checkbox.addEventListener('change', (event) => {
        const onOrOffText = event.target.closest('.checkbox-wrapper').querySelector('.on-or-off-text');
        onOrOffText.textContent = event.target.checked ? 'On' : 'Off';
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  setWorkflow(token) {
    if (!token) {
      return;
    }
    if (!token.endsWith('__wd')) {
      useWorkflow = true;
    }
  }

  async beforeBlockDataRead() {
    const scrollableTextElement = this.findSectionContent('terms_of_service');

    if (scrollableTextElement) {
      this.scrollableText = scrollableTextElement.innerHTML;

      if (this.scrollableText) {
        this.hasTermsOfService = true;
      }
    }

    this.formConfiguration.token = getAvailableChildrenRow(this.block, 'token') ? getAvailableChildrenRow(this.block, 'token').textContent.trim() : null;

    this.setWorkflow(this.formConfiguration.token);

    this.formConfiguration.successPage = getAvailableChildrenRow(this.block, 'success_page') ? getAvailableChildrenRow(this.block, 'success_page').textContent.trim() : null;
    this.formConfiguration.successRedirect = getAvailableChildrenRow(this.block, 'success_redirect')
      ? getAvailableChildrenRow(this.block, 'success_redirect').textContent.trim()
      : null;
    this.formConfiguration.additionalStyles = getAvailableChildrenRow(this.block, 'additional_styles')
      ? getAvailableChildrenRow(this.block, 'additional_styles').textContent.trim()
      : null;
    this.formConfiguration.formName = getAvailableChildrenRow(this.block, 'form_name') ? getAvailableChildrenRow(this.block, 'form_name').textContent.trim() : null;
    this.formConfiguration.stagingActive = getAvailableChildrenRow(this.block, 'staging_active') ? getAvailableChildrenRow(this.block, 'staging_active').textContent.trim() : null;
  }

  async afterBlockRender() {
    await markupCallback(this.formConfiguration, this.block, this.variant);

    Form.formatToggleCheckboxHtml();

    this.formatScrollableCheckboxHtml();

    Form.handleToggleCheckboxFormInput();

    // setup debug ui elements for internal dev team
    // debugFormUi(this.block);

    // global standard rules for block padding ///////////////////////
    this.block.classList.add('block-padding-standard');
  }
}
