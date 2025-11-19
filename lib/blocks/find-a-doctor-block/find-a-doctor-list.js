
import { decorateIcons, mustache, addOverlayListeners, truncateText } from '../../scripts/lib-franklin.js';

const ADDRESS_MAX_LENGTH = 120;
const NAME_MAX_LENGTH = 32;
const SUPPORTING_TEXT_MAX_LENGTH = 56;
const PHONE_MAX_LENGTH = 35;

const template = `
<div class="find-a-doctor-list">
  <div class="find-a-doctor-list-scroll-container">
  {{ #doctors }}
    <div class="find-a-doctor-card core-cards-card core-cards-content">
      <div class="find-a-doctor-card-content">
        <div class="find-a-doctor-card-left">
            <h3 title="{{ doctor.name.fullName }}" class="find-a-doctor-card-name">{{ truncatedDoctor.name.fullName }}</h3>
            <div title="{{ doctor.name.title }}" class="find-a-doctor-card-title">{{ truncatedDoctor.name.title }}</div>
            <div title="{{ doctor.phone }}" data-overlay-block-path="/global/popups/external-link-popup"  class="find-a-doctor-card-phone list-only">{{ truncatedDoctor.phone }}</div>
            <a href="tel:{{ doctor.phone }}" data-external-link-popup data-overlay-block-path="/global/popups/external-link-popup" title="{{ doctor.phone }}" class="find-a-doctor-card-phone-link grid-only">{{ truncatedDoctor.phone }}</a>
            <div title="{{ doctor.address }}"  data-overlay-block-path="/global/popups/external-link-popup" class="find-a-doctor-card-address list-only">{{ truncatedDoctor.address }}</div>
            <a title="{{ doctor.address }}" data-external-link-popup data-overlay-block-path="/global/popups/external-link-popup" class="find-a-doctor-card-address grid-only">{{ truncatedDoctor.address }}</a>
        </div>
        <div class="find-a-doctor-card-right">
          {{ #doctor.picture }}
          <div class="find-a-doctor-card-picture">
              <img src="{{ doctor.picture }}" alt="{{ name.fullName }}">
          </div>
          {{ /doctor.picture }}
            <p class="button-container">
              <a href="{{ ctaHref }}" title="{{ ctaLink }}" class="button secondary button-icon">
                <span class="icon icon-lib-chevron-right"></span>
              </a>
          </p>
        </div>
    </div>
  </div>
  {{ /doctors }}
  {{ #empty }}
    <div class="find-a-doctor-list-empty">
      <p>No results found</p>
    </div>
  {{ /empty }}
  </div>
</div>

`;

export default class FindADoctorList {
  state = null;

  parentElement = null;

  constructor(state, parentElement) {
    this.state = state;
    this.parentElement = parentElement;

    this.state.addEventListener('doctorsChanged', () => {
      this.renderList(this.state.visibleDoctors.map((doctor) => this.constructor.truncateFields(doctor)));
    });

    this.state.addEventListener('selectedPageChanged', () => {
      this.renderList(this.state.visibleDoctors.map((doctor) => this.constructor.truncateFields(doctor)));
    });

    this.state.addEventListener('selectedViewChanged', () => {
      this.selectView(this.state.selectedView);
      this.renderList(this.state.visibleDoctors.map((doctor) => this.constructor.truncateFields(doctor)));
    });
  }

  static truncateFields(doctor) {
    const truncatedDoctor = { ...doctor };
    truncatedDoctor.name.fullName = truncateText(doctor.name.fullName, NAME_MAX_LENGTH);
    truncatedDoctor.name.title = truncateText(doctor.name.title, SUPPORTING_TEXT_MAX_LENGTH);
    truncatedDoctor.phone = truncateText(doctor.phone, PHONE_MAX_LENGTH);
    truncatedDoctor.address = truncateText(doctor.address, ADDRESS_MAX_LENGTH);
    return { truncatedDoctor, doctor };
  }

  selectView(selectedView) {
    const listContainer = this.parentElement;
    if (selectedView === 'grid') {
      listContainer.classList.add('grid-version');
    } else {
      listContainer.classList.remove('grid-version');
    }
  }

  renderList(doctors) {
    this.parentElement.innerHTML = '';
    const html = mustache.render(template, { doctors, empty: doctors.length === 0 });
    const parent = document.createElement('div');
    parent.innerHTML = html;
    const list = parent.firstElementChild;
    decorateIcons(list);
    list.querySelectorAll('.find-a-doctor-card-address').forEach(address => {
      const addressText = address.title;
      address.setAttribute('href', `http://maps.google.com/?q=${addressText}"`);
    });
    addOverlayListeners('[data-external-link-popup]', list);
    this.parentElement.appendChild(list);
    FindADoctorList.handleOpenModal(list);
    FindADoctorList.addCloseHandler();
  }

  static handleOpenModal(list) {
    list.querySelectorAll('.button-icon').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const doctorCard = button.closest('.find-a-doctor-card');
        const doctorName = doctorCard.querySelector('.find-a-doctor-card-name').textContent;
        const doctorTitle = doctorCard.querySelector('.find-a-doctor-card-title').textContent;
        const doctorPhone = doctorCard.querySelector('.find-a-doctor-card-phone').textContent;
        const doctorAddress = doctorCard.querySelector('.find-a-doctor-card-address').textContent;

        FindADoctorList.openModal({
          name: doctorName,
          title: doctorTitle,
          phone: doctorPhone,
          address: doctorAddress,
        });
      });
    });
  }

  static openModal(data) {
    const modal = document.getElementById('doctor-details-modal');
    modal.querySelector('.modal-name').textContent = data.name;
    modal.querySelector('.modal-title').textContent = data.title;
    modal.querySelector('.modal-phone').textContent = data.phone;
    modal.querySelector('.modal-address').innerHTML = data.address.replace(/, /g, '<br>');
    modal.showModal();
  }

  static addCloseHandler() {
    const closeButton = document.querySelector('.close-modal-button');
    closeButton.addEventListener('click', () => {
      document.getElementById('doctor-details-modal').close();
    });
  }
}
