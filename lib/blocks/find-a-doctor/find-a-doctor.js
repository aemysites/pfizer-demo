// eslint-disable-next-line import/extensions
import DoctorSearch from './find-doctor-search-example.mjs';

// eslint-disable-next-line import/extensions
import mockDoctorDataSource from './find-doctor-search.mock.mjs';

/**
 * Initialize doctor search instance
 * @returns {DoctorSearch} Doctor search instance
 */
export function initializeDoctorSearch() {
  return new DoctorSearch(mockDoctorDataSource);
}

/**
 * Get search parameters from URL
 * @returns {Object} Search parameters object
 */
export function getDoctorSearchParams() {
  const searchParams = new URLSearchParams(window.location.search);
  return {
    name: searchParams.get('name'),
    specialty: searchParams.get('specialty'),
    zip: searchParams.get('zip'),
  };
}

/**
 * Search doctors by name
 * @param {DoctorSearch} doctorSearch - Doctor search instance
 * @param {string} name - Doctor name to search
 * @returns {Array} Array of doctors matching the name
 */
export async function searchDoctorsByName(doctorSearch, name) {
  if (!name) return [];
  try {
    return doctorSearch.searchByName(name);
  } catch (error) {
    console.error('Error searching doctors by name:', error);
    return [];
  }
}

/**
 * Search doctors by specialty
 * @param {DoctorSearch} doctorSearch - Doctor search instance
 * @param {string} specialty - Specialty to search
 * @returns {Array} Array of doctors with the specialty
 */
export async function searchDoctorsBySpecialty(doctorSearch, specialty) {
  if (!specialty) return [];
  try {
    return doctorSearch.searchBySpecialty(specialty);
  } catch (error) {
    console.error('Error searching doctors by specialty:', error);
    return [];
  }
}

/**
 * Search doctors by location
 * @param {DoctorSearch} doctorSearch - Doctor search instance
 * @param {string} zip - ZIP code to search
 * @returns {Array} Array of doctors in the location
 */
export async function searchDoctorsByLocation(doctorSearch, zip) {
  if (!zip) return [];
  try {
    return doctorSearch.searchByLocation(zip);
  } catch (error) {
    console.error('Error searching doctors by location:', error);
    return [];
  }
}

/**
 * Format doctor search results for display
 * @param {Array} doctors - Array of doctor results
 * @param {number} limit - Maximum number of results to return
 * @returns {Array} Formatted doctor results
 */
export function formatDoctorResults(doctors = [], limit = 3) {
  return doctors.slice(0, limit).map((doctor) => ({
    name: doctor.name,
    specialty: doctor.specialty,
    location: doctor.location,
    id: doctor.id,
    distance: doctor.distance,
    address: `${doctor.practices[0].name}, ${doctor.practices[0].address}, ${doctor.practices[0].city}, ${doctor.practices[0].state} ${doctor.practices[0].zip}`,
    phone: doctor.practices[0].phone,
    picture: `https://robohash.org/${doctor.id}`,
  }));
}

/**
 * Get all available doctors
 * @param {DoctorSearch} doctorSearch - Doctor search instance
 * @returns {Array} Array of all doctors
 */
export async function getAllDoctors(doctorSearch) {
  try {
    return doctorSearch.search({});
  } catch (error) {
    console.error('Error getting all doctors:', error);
    return [];
  }
}

/**
 * Run multiple doctor searches in parallel
 * @param {DoctorSearch} doctorSearch - Doctor search instance
 * @param {Object} searchParams - Search parameters
 * @returns {Object} Combined search results
 */
export async function runDoctorSearches(doctorSearch, searchParams) {
  try {
    const [nameResults, specialtyResults, locationResults, allDoctors] = await Promise.all([
      searchDoctorsByName(doctorSearch, searchParams.name),
      searchDoctorsBySpecialty(doctorSearch, searchParams.specialty),
      searchDoctorsByLocation(doctorSearch, searchParams.zip),
      getAllDoctors(doctorSearch),
    ]);

    return {
      doctorsByName: formatDoctorResults(nameResults),
      specialtyDoctors: formatDoctorResults(specialtyResults),
      nearbyDoctors: formatDoctorResults(locationResults),
      allDoctors: formatDoctorResults(allDoctors, 30), // Show up to 10 doctors in full list
    };
  } catch (error) {
    console.error('Error running doctor searches:', error);
    return {
      doctorsByName: [],
      specialtyDoctors: [],
      nearbyDoctors: [],
      allDoctors: [],
    };
  }
}
