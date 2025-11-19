/* global describe, beforeEach, it */
import { expect } from '@esm-bundle/chai';
// eslint-disable-next-line import/extensions
import DoctorSearch from './find-doctor-search-example.mjs';
// eslint-disable-next-line import/extensions
import mockDoctorData from './find-doctor-search.mock.mjs';
// eslint-disable-next-line import/extensions
const schemaExample = await fetch(new URL('./find-doctor-search-schema.json', import.meta.url)).then((res) => res.json());

describe('DoctorSearch', () => {
  let doctorSearch;

  beforeEach(() => {
    doctorSearch = new DoctorSearch(mockDoctorData);
  });

  it('should initialize with data', () => {
    expect(doctorSearch.data).to.equal(mockDoctorData);
  });

  describe('Search by name', () => {
    it('should search by first name', () => {
      const results = doctorSearch.searchByName('John');
      expect(results).to.have.lengthOf(1);
      expect(results[0].name.firstName).to.equal('John');
    });

    it('should search by last name', () => {
      const results = doctorSearch.searchByName('Smith');
      expect(results).to.have.lengthOf(1);
      expect(results[0].name.lastName).to.equal('Smith');
    });

    it('should search case-insensitively', () => {
      const results = doctorSearch.searchByName('smith');
      expect(results).to.have.lengthOf(1);
      expect(results[0].name.lastName).to.equal('Smith');
    });
  });

  describe('Search by specialty', () => {
    it('should search by primary specialty', () => {
      const results = doctorSearch.searchBySpecialty('Cardiology');
      expect(results).to.have.lengthOf(2);
      expect(results[0].name.firstName).to.equal('Jane');
    });

    it('should search by sub-specialty', () => {
      const results = doctorSearch.searchBySpecialty('Interventional Cardiology');
      expect(results).to.have.lengthOf(1);
      expect(results[0].name.firstName).to.equal('Igor');
    });

    it('should return empty array for non-existent specialty', () => {
      const results = doctorSearch.searchBySpecialty('XoXoXOoxo');
      expect(results).to.have.lengthOf(0);
    });
  });

  describe('Search by location', () => {
    it('should search by zipcode', () => {
      const results = doctorSearch.searchByLocation('10001');
      expect(results).to.have.lengthOf(3);
      expect(results[0].name.firstName).to.equal('Jane');
      expect(results[1].name.firstName).to.equal('John');
    });

    it('should return empty array for non-existent zipcode', () => {
      const results = doctorSearch.searchByLocation('12345');
      expect(results).to.have.lengthOf(0);
    });
  });

  describe('Combined search', () => {
    it('should perform combined search with all criteria', () => {
      const results = doctorSearch.search({
        name: 'Igor',
        specialty: 'Cardiology',
        location: '10001',
      });
      expect(results).to.have.lengthOf(1);
      expect(results[0].name.firstName).to.equal('Igor');
    });

    it('should handle partial criteria', () => {
      const results = doctorSearch.search({
        specialty: 'Family Medicine',
        location: '10001',
      });
      expect(results).to.have.lengthOf(1);
      expect(results[0].name.firstName).to.equal('John');
    });

    it('should handle empty criteria', () => {
      const results = doctorSearch.search({});
      expect(results).to.have.lengthOf(6);
    });

    it('should verify doctor details', () => {
      const results = doctorSearch.search({ name: 'Korotkov' });
      expect(results).to.have.lengthOf(1);
      const doctor = results[0];

      expect(doctor.name.prefix).to.equal('Dr.');
      expect(doctor.name.suffix).to.equal('MD');
      expect(doctor.name.title).to.equal('Cardiologist');
      expect(doctor.avgRating).to.equal(4.8);
      expect(doctor.practices[0].name).to.equal('Heart Care Center');
      expect(doctor.practices[0].address).to.equal('456 Medical Plaza');
      expect(doctor.specialties[0].name).to.equal('Cardiology');
      expect(doctor.specialties[0].subSpecialty).to.equal('Interventional Cardiology');
      expect(doctor.education[0].institution).to.equal('Yale School of Medicine');
      expect(doctor.virtualVisits[0].platform).to.equal('Teladoc');
    });

    it('should validate mock data against the schema', () => {
      const validSchema = schemaExample;
      // eslint-disable-next-line no-underscore-dangle
      const mockExample = mockDoctorData.hits.hits[0]._source;

      const keyArray = [
        'first_name',
        'last_name',
        'prefix',
        'suffix',
        'title',
        'accepts_new_patients',
        'avg_rating',
        'bio',
        'brief_bio',
        'specialty',
        'practice',
        'award',
        'certification',
        'education',
        'virtual_visit',
      ];

      // Confirm schema has required keys
      keyArray.forEach((key) => {
        expect(validSchema).to.have.property(key);
      });

      // Confirm mock data has required keys
      Object.keys(mockExample).forEach((key) => {
        expect(validSchema).to.have.property(key);
      });

      // Validate nested object schemas
      expect(validSchema.specialty.type).to.equal('nested');
      expect(validSchema.practice.type).to.equal('nested');
      expect(validSchema.award.type).to.equal('nested');
      expect(validSchema.certification.type).to.equal('nested');
      expect(validSchema.education.type).to.equal('nested');
      expect(validSchema.virtual_visit.type).to.equal('nested');
    });
  });
});
