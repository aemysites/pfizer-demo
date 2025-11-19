/**
 * ElasticSearch Doctor Data Structure
 *
 * The data structure represents a doctor's profile in ElasticSearch with the following main components:
 *
 * 1. Basic Information:
 *    - id: Unique identifier
 *    - prefix: Title prefix (e.g., "Dr.")
 *    - first_name, last_name: Doctor's name
 *    - suffix: Title suffix (e.g., "MD")
 *    - title: Professional title
 *    - accepts_new_patients: Boolean (stored as 1/0)
 *    - avg_rating: Numerical rating
 *    - bio: Full biography
 *    - brief_bio: Short biography
 *
 * 2. Awards (Nested Array):
 *    - award_name: Name of the award
 *    - awarding_institution: Institution giving the award
 *    - received_years: Year received
 *    - id, provider_id, rel_id: Reference IDs
 *
 * 3. Certifications (Nested Array):
 *    - certification_specialty_name: Primary specialty
 *    - certification_sub_specialty_name: Sub-specialty
 *    - certifying_body_name: Certifying institution
 *    - year_achieved: Year certified
 *    - Various IDs for references
 *
 * 4. Education (Nested Array):
 *    - education_type_name: Type of education
 *    - education_name: Institution name
 *    - graduation_year: Year graduated
 *    - area_of_focus: Specialization
 *    - Various IDs and reference fields
 *
 * 5. Practice Information (Nested Array):
 *    - name: Practice name
 *    - address: Street address
 *    - city_name, state_name: Location
 *    - zipcode: ZIP/Postal code
 *    - phone_number: Contact number
 *    - email: Contact email
 *    - website: Practice website
 *    - latitude, longitude: Coordinates
 *    - out_of_network: Insurance network status (Boolean)
 *
 * 6. Specialties (Nested Array):
 *    - specialty_name: Primary specialty
 *    - sub_specialty_name: Sub-specialty
 *    - primary_specialty: Boolean flag (1/0)
 *
 * 7. Virtual Visits (Nested Array):
 *    - enabled: Availability flag (1/0)
 *    - accept_new_patients: New patient flag (1/0)
 *    - name: Platform name
 *
 * 8. Additional Details (Nested Object):
 *    - Various administrative and personal details
 *    - Insurance information
 *    - Licensing and credentials
 *    - Contact preferences
 *
 * The data structure uses nested arrays extensively for one-to-many relationships,
 * and all Boolean values are stored as 1 (true) or 0 (false).
 * IDs are used throughout for referential integrity.
 */

// Constants for common error messages
const ERROR_MESSAGES = {
  INVALID_SOURCE: 'Invalid source data provided',
  MISSING_NAME: 'First name and last name are required',
  INVALID_ES_FORMAT: 'Invalid ElasticSearch data format',
  GENERAL_FORMAT_ERROR: (msg) => `Error formatting doctor data: ${msg}`,
};

// Constants for field names to avoid typos and enable easier refactoring
const FIELDS = {
  FIRST_NAME: 'first_name',
  LAST_NAME: 'last_name',
  SPECIALTY_NAME: 'specialty_name',
  SUB_SPECIALTY_NAME: 'sub_specialty_name',
};

/**
 * Parses and displays doctor search data from ElasticSearch
 * @param {Object} source - Raw doctor data from ElasticSearch source field
 * @returns {Object} Formatted doctor information
 * @throws {Error} If source is invalid or required fields are missing
 */
export function formatDoctorData(source) {
  if (!source || typeof source !== 'object') {
    throw new Error(ERROR_MESSAGES.INVALID_SOURCE);
  }

  // Helper function to safely map array data with error handling
  const safeMap = (arr, mapFn) => {
    try {
      return Array.isArray(arr) ? arr.map(mapFn) : [];
    } catch (error) {
      console.error('Error mapping array:', error);
      return [];
    }
  };

  // Helper function to format name with validation
  const formatName = ({ prefix = '', firstName = '', lastName = '', suffix = '', title = '' } = {}) => {
    if (!firstName || !lastName) {
      throw new Error(ERROR_MESSAGES.MISSING_NAME);
    }

    const nameParts = [prefix, firstName, lastName, suffix].filter(Boolean);
    return {
      prefix,
      firstName,
      lastName,
      suffix,
      title,
      fullName: nameParts.join(' '),
    };
  };

  // Helper function to format address with validation
  const formatAddress = (practice) => {
    if (!practice) return '';
    const parts = [practice.address, practice.city_name, practice.state_name, practice.zipcode].filter(Boolean);
    return parts.join(', ');
  };

  // Helper function to safely convert to boolean with type checking
  const toBoolean = (value) => Boolean(Number(value));

  // Helper function to safely convert to number
  const toNumber = (value) => {
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  try {
    return {
      // Basic info
      id: source.id,
      name: formatName({
        prefix: source.prefix,
        firstName: source[FIELDS.FIRST_NAME],
        lastName: source[FIELDS.LAST_NAME],
        suffix: source.suffix,
        title: source.title,
      }),
      acceptsNewPatients: toBoolean(source.accepts_new_patients),
      avgRating: toNumber(source.avg_rating),
      bio: source.bio || '',
      briefBio: source.brief_bio || '',

      // Awards and certifications with improved error handling
      awards: safeMap(source.award, (award) => ({
        name: award.award_name || '',
        institution: award.awarding_institution || '',
        year: award.received_years || '',
      })),

      certifications: safeMap(source.certification, (cert) => ({
        specialty: cert.certification_specialty_name || '',
        subSpecialty: cert.certification_sub_specialty_name || '',
        certifyingBody: cert.certifying_body_name || '',
        yearAchieved: toNumber(cert.year_achieved),
      })),

      // Education with improved validation
      education: safeMap(source.education, (edu) => ({
        type: edu.education_type_name || '',
        institution: edu.education_name || '',
        graduationYear: toNumber(edu.graduation_year),
        focus: edu.area_of_focus || '',
      })),

      // Practice details with improved location handling
      practices: safeMap(source.practice, (practice) => ({
        name: practice.name || '',
        address: practice.address || '',
        city: practice.city_name || '',
        state: practice.state_name || '',
        zip: practice.zipcode || '',
        phone: practice.phone_number || '',
        email: practice.email || '',
        website: practice.website || '',
        location: {
          lat: toNumber(practice.latitude),
          lng: toNumber(practice.longitude),
        },
        acceptsNewPatients: !toBoolean(practice.out_of_network),
        formattedAddress: formatAddress(practice),
      })),

      // Specialties with improved field access
      specialties: safeMap(source.specialty, (spec) => ({
        name: spec[FIELDS.SPECIALTY_NAME] || '',
        subSpecialty: spec[FIELDS.SUB_SPECIALTY_NAME] || '',
        isPrimary: toBoolean(spec.primary_specialty),
      })),

      // Virtual visits with improved boolean handling
      virtualVisits: safeMap(source.virtual_visit, (visit) => ({
        available: toBoolean(visit.enabled),
        acceptingNew: toBoolean(visit.accept_new_patients),
        platform: visit.name || '',
      })),
    };
  } catch (error) {
    throw new Error(ERROR_MESSAGES.GENERAL_FORMAT_ERROR(error.message));
  }
}

/**
 * Class to handle doctor search functionality using ElasticSearch data
 */
export default class DoctorSearch {
  /**
   * @param {Object} data - ElasticSearch response data
   * @throws {Error} If data is invalid
   */
  constructor(data) {
    if (!data?.hits?.hits || !Array.isArray(data.hits.hits)) {
      throw new Error(ERROR_MESSAGES.INVALID_ES_FORMAT);
    }
    this.data = data;
    this.hits = data.hits.hits;
  }

  /**
   * Extract source data from ElasticSearch hit
   * @param {Object} hit - ElasticSearch hit object
   * @returns {Object} Source data
   */
  static extractSource(hit) {
    if (!hit || typeof hit !== 'object') {
      return {};
    }
    // eslint-disable-next-line no-underscore-dangle
    return hit?.source || hit?._source || {};
  }

  /**
   * Helper method to filter and format results with improved error handling
   * @private
   * @param {Function} filterFn - Filter function to apply
   * @returns {Array} Formatted results
   */
  filterAndFormat(filterFn) {
    try {
      return this.hits
        .filter((hit) => {
          try {
            return filterFn(hit);
          } catch (error) {
            console.error('Error in filter function:', error);
            return false;
          }
        })
        .map((hit) => formatDoctorData(DoctorSearch.extractSource(hit)));
    } catch (error) {
      console.error('Error filtering and formatting results:', error);
      return [];
    }
  }

  /**
   * Search doctors by name with improved string handling
   * @param {string} query - Name to search for
   * @returns {Array} Matching doctors
   */
  searchByName(query) {
    if (!query?.trim()) return [];

    const searchTerm = query.toLowerCase().trim();
    return this.filterAndFormat((hit) => {
      try {
        const source = DoctorSearch.extractSource(hit);
        const fullName = `${source[FIELDS.FIRST_NAME] || ''} ${source[FIELDS.LAST_NAME] || ''}`.toLowerCase();
        return fullName.includes(searchTerm);
      } catch (error) {
        console.error('Error searching by name:', error);
        return false;
      }
    });
  }

  /**
   * Search doctors by specialty with improved matching
   * @param {string} specialty - Specialty to search for
   * @returns {Array} Matching doctors
   */
  searchBySpecialty(specialty) {
    if (!specialty?.trim()) return [];

    const searchTerm = specialty.toLowerCase().trim();

    return this.filterAndFormat((hit) => {
      try {
        const source = DoctorSearch.extractSource(hit);
        return (
          source.specialty?.some((spec) => {
            const specialtyName = (spec[FIELDS.SPECIALTY_NAME] || '').toLowerCase();
            const subSpecialtyName = (spec[FIELDS.SUB_SPECIALTY_NAME] || '').toLowerCase();
            return specialtyName.includes(searchTerm) || subSpecialtyName.includes(searchTerm);
          }) || false
        );
      } catch (error) {
        console.error('Error searching by specialty:', error);
        return false;
      }
    });
  }

  /**
   * Search doctors by location with improved validation
   * @param {string} zipCode - ZIP code to search for
   * @returns {Array} Matching doctors
   */
  searchByLocation(zipCode) {
    if (!zipCode?.trim()) return [];

    const cleanZipCode = zipCode.trim();
    return this.filterAndFormat((hit) => {
      try {
        const source = DoctorSearch.extractSource(hit);
        return source.practice?.some((practice) => practice.zipcode === cleanZipCode) || false;
      } catch (error) {
        console.error('Error searching by location:', error);
        return false;
      }
    });
  }

  /**
   * Search doctors using multiple criteria with improved filtering
   * @param {Object} params - Search parameters
   * @param {string} [params.name] - Doctor name
   * @param {string} [params.specialty] - Doctor specialty
   * @param {string} [params.location] - ZIP code
   * @returns {Array} Matching doctors
   */
  search({ name, specialty, location } = {}) {
    try {
      let results = this.hits;

      if (name?.trim()) {
        const searchName = name.toLowerCase().trim();
        results = results.filter((hit) => {
          const source = DoctorSearch.extractSource(hit);
          const fullName = `${source[FIELDS.FIRST_NAME] || ''} ${source[FIELDS.LAST_NAME] || ''}`.toLowerCase();
          return fullName.includes(searchName);
        });
      }

      if (specialty?.trim()) {
        const searchSpecialty = specialty.toLowerCase().trim();
        results = results.filter((hit) => {
          const source = DoctorSearch.extractSource(hit);
          return (
            source.specialty?.some((spec) => {
              const specialtyName = (spec[FIELDS.SPECIALTY_NAME] || '').toLowerCase();
              const subSpecialtyName = (spec[FIELDS.SUB_SPECIALTY_NAME] || '').toLowerCase();
              return specialtyName.includes(searchSpecialty) || subSpecialtyName.includes(searchSpecialty);
            }) || false
          );
        });
      }

      if (location?.trim()) {
        const cleanLocation = location.trim();
        results = results.filter((hit) => {
          const source = DoctorSearch.extractSource(hit);
          return source.practice?.some((practice) => practice.zipcode === cleanLocation) || false;
        });
      }

      const doctors = results.map((hit) => formatDoctorData(DoctorSearch.extractSource(hit)));
      return [...doctors, doctors[3], ...doctors, doctors[4], ...doctors, ...doctors]; // Dummy data for testing
    } catch (error) {
      console.error('Error performing combined search:', error);
      return [];
    }
  }

  /**
   * Search for a doctor by ID
   * @param {string} id - Doctor ID to search for
   * @returns {Object|null} Doctor object if found, null otherwise
   */
  searchById(id) {
    try {
      const doctor = this.data.hits.hits.find((hit) => hit._source.id.toString() === id.toString());
      return doctor ? doctor._source : null;
    } catch (error) {
      console.error('Error searching doctor by ID:', error);
      return null;
    }
  }
}
