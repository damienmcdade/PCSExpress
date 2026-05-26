/*
 * Purpose: PCS document checklist, document checklist progress tracking with no file attachment surface.
 * Third-party dependencies: React, Capacitor bridge when running native.
 */

import { useState, useCallback, useEffect } from 'react';
import { secureLocalStore, readLegacyJson } from '../security/SecurityExtensions';
import TabBar from './TabBar';

// ─── Document categories ─────────────────────────────────────────────────────

const DOC_CATEGORIES = [
  { id: 'family',   label: 'Family & Admin',   icon: '👪', color: '#7B1FA2' },
  { id: 'housing',  label: 'Housing',          icon: '🏠', color: '#6A1B9A' },
  { id: 'hhg',      label: 'Household Goods',  icon: '📦', color: '#2E7D32' },
  { id: 'medical',  label: 'Medical',          icon: '🏥', color: '#C62828' },
  { id: 'oconus',   label: 'OCONUS',           icon: '🌍', color: '#00838F' },
  { id: 'travel',   label: 'Travel & Finance', icon: '✈️', color: '#F9A825' },
  { id: 'orders',   label: 'Unit',             icon: '📋', color: '#1565C0' },
];

// ─── Universal document list (all branches) ──────────────────────────────────

const BASE_DOCS = {
  orders: [
    { id: 'pcs_orders',          name: 'PCS Orders',                      form: 'Official Orders',         required: true,  desc: 'Official Permanent Change of Station orders from your branch headquarters' },
    { id: 'orders_amendment',    name: 'Orders Amendment',                form: 'Amendment',               required: false, desc: 'Any amendments or modifications to original PCS orders — keep all copies' },
    { id: 'reporting_endorsement', name: 'Reporting Endorsement',         form: 'Endorsement',             required: false, desc: 'Confirmation of in-processing signed at your gaining installation' },
  ],
  travel: [
    { id: 'travel_voucher',      name: 'Travel Voucher',                  form: 'DD Form 1351-2',          required: true,  desc: 'Claim for PCS travel reimbursement — submit to finance within 5 days of arrival', formUrl: 'https://www.esd.whs.mil/Portals/54/Documents/DD/forms/dd/dd1351-2.pdf' },
    { id: 'dla_advance',         name: 'Advance Pay / DLA Request',       form: 'DD Form 2560',            required: false, desc: 'Dislocation Allowance and advance pay request — submit to finance before departure' },
    { id: 'lodging_receipts',    name: 'Lodging Receipts',                form: 'Receipts',                required: true,  desc: 'Hotel receipts for every night of PCS travel — keep all originals for voucher' },
    { id: 'mileage_log',         name: 'Mileage / Per Diem Log',          form: 'Log / Receipts',          required: true,  desc: 'POV mileage documentation, fuel receipts, or rental car receipts during PCS travel' },
    { id: 'dla_receipt',         name: 'DLA / Meal Receipts',             form: 'Receipts',                required: false, desc: 'Meal and incidental receipts during authorized PCS travel days' },
  ],
  hhg: [
    { id: 'hhg_application',     name: 'HHG Shipment Application',        form: 'DD Form 1299',            required: true,  desc: 'Schedule household goods shipment via Defense Personal Property System (DPS)', formUrl: 'https://dps.move.mil/cust/standard/user/home.xhtml' },
    { id: 'hhg_counseling',      name: 'HHG Transportation Counseling',   form: 'DD Form 1797',            required: true,  desc: 'Transportation counseling checklist — must be signed before TSP pickup date' },
    { id: 'weight_ticket_empty', name: 'Empty Weight Ticket',             form: 'Weight Ticket',           required: true,  desc: 'Empty weight of moving vehicle before loading — required for full HHG reimbursement' },
    { id: 'weight_ticket_full',  name: 'Full (Loaded) Weight Ticket',     form: 'Weight Ticket',           required: true,  desc: 'Loaded weight of moving vehicle with all household goods' },
    { id: 'hhg_inventory',       name: 'HHG Inventory & Condition Report', form: 'DD Form 1840 / 1840R',  required: true,  desc: 'Note all pre-existing damage at PICKUP and again at DELIVERY — critical for claims' },
    { id: 'pov_shipment',        name: 'POV Shipment Authorization',      form: 'DD Form 788',             required: false, desc: 'Authorization to ship privately owned vehicle — required for OCONUS, check for CONUS' },
    { id: 'storage_auth',        name: 'Non-Temporary Storage Auth (NTS)', form: 'NTS Authorization',      required: false, desc: 'Long-term storage authorization if household goods cannot move to gaining installation' },
    { id: 'pro_gear',            name: 'Pro-Gear Authorization List',     form: 'Pro-Gear List',           required: false, desc: 'Professional gear (books, instruments, tools of trade) exempt from weight allowance' },
    { id: 'hhg_claim',           name: 'HHG Damage Claim (if needed)',    form: 'DD Form 1840R',           required: false, desc: 'File within 70 days of delivery for any damaged or missing household goods items' },
  ],
  housing: [
    { id: 'bah_auth',            name: 'BAH Authorization',               form: 'Branch-Specific',         required: true,  desc: 'Basic Allowance for Housing — ensure rate is set for gaining installation zip code', formUrl: 'https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/' },
    { id: 'oha_miha_auth',       name: 'OHA / MIHA Authorization',        form: 'Branch-Specific',         required: true,  desc: 'Overseas Housing Allowance, Move-In Housing Allowance, and Utility/Recurring Maintenance Allowance — start/stop/change paperwork submitted through the gaining housing office. Replaces BAH overseas.', formUrl: 'https://www.defensetravel.dod.mil/site/oha.cfm' },
    { id: 'housing_application', name: 'On-Post Housing Application',     form: 'Installation Form',       required: false, desc: 'Application for government-owned or privatized quarters at gaining installation' },
    { id: 'lease_termination',   name: 'Lease Termination Notice (SCRA)', form: 'SCRA Letter',             required: false, desc: 'PCS lease break letter — protected under Servicemembers Civil Relief Act (30-day notice)', formUrl: '' },
    { id: 'new_lease',           name: 'New Rental / Lease Agreement',    form: 'Lease Agreement',         required: false, desc: 'Signed lease or rental agreement at or near gaining installation' },
    { id: 'utility_transfers',   name: 'Utility Transfer Documents',      form: 'Utility Forms',           required: false, desc: 'Electricity, gas, water, and internet transfer or cancellation confirmations' },
  ],
  medical: [
    { id: 'medical_records',     name: 'Medical Records Transfer',        form: 'SF 600',                  required: true,  desc: 'Request complete medical records transfer to gaining MTF or civilian provider before departure' },
    { id: 'dental_records',      name: 'Dental Records Transfer',         form: 'SF 603',                  required: true,  desc: 'Request dental records transfer to gaining dental clinic — do not leave without them' },
    { id: 'shot_records_mbr',    name: 'Immunization Records (Member)',   form: 'Immunization Record',     required: true,  desc: 'Current shot records — mandatory for OCONUS, strongly recommended for all PCS' },
    { id: 'shot_records_fam',    name: 'Immunization Records (Family)',   form: 'Immunization Record',     required: false, desc: 'Current immunization records for all traveling family members — keep originals' },
    { id: 'tricare_enrollment',  name: 'TRICARE Enrollment Update',       form: 'TRICARE Form',            required: true,  desc: 'Update TRICARE enrollment to gaining installation region at gaining MTF', formUrl: 'https://www.tricare.mil' },
    { id: 'efmp_docs',           name: 'EFMP Documentation',              form: 'Branch EFMP Form',        required: false, desc: 'Exceptional Family Member Program screening/enrollment — required if dependents have special needs' },
    { id: 'mental_health',       name: 'Mental Health Continuity Records', form: 'Medical Records',        required: false, desc: 'Continuity of care documentation for any ongoing behavioral health treatment' },
    { id: 'pharmacy_transfer',   name: 'Pharmacy / Prescription Records', form: 'Pharmacy Records',        required: false, desc: 'Request 90-day supply and transfer ongoing prescriptions to gaining installation pharmacy' },
  ],
  family: [
    { id: 'deers_update',        name: 'DEERS Enrollment Update',         form: 'DD Form 1172-2',          required: true,  desc: 'Update dependent information and address in DEERS at gaining installation ID card office' },
    { id: 'id_cards',            name: 'ID Cards (CAC + Dependents)',     form: 'DD Form 1172',            required: true,  desc: 'Check all expiration dates — update CAC and dependent IDs before or at gaining installation' },
    { id: 'dd93_emergency_data', name: 'Record of Emergency Data',        form: 'DD Form 93',              required: true,  desc: 'Update emergency contacts and next-of-kin information at gaining installation S1 / personnel office', formUrl: 'https://www.esd.whs.mil/Portals/54/Documents/DD/forms/dd/dd0093.pdf' },
    { id: 'sgli_beneficiary',    name: 'SGLI Beneficiary Election',       form: 'SGLV 8286',               required: true,  desc: 'Servicemembers Group Life Insurance beneficiary designations — verify before PCS, update at gaining S1', formUrl: 'https://www.benefits.va.gov/INSURANCE/forms/SGLV_8286_ed_2020-08.pdf' },
    { id: 'family_care_plan',    name: 'Family Care Plan',                form: 'Branch-Specific',         required: false, desc: 'Required for single parents and dual-military couples with dependents — coordinate alternate caregivers' },
    { id: 'birth_certificates',  name: 'Birth Certificates',              form: 'Certified Copies',        required: true,  desc: 'Certified copies for member and all dependents — required for DEERS, passports, and enrollment' },
    { id: 'marriage_cert',       name: 'Marriage Certificate',            form: 'Certified Copy',          required: false, desc: 'Certified marriage certificate for BAH with dependents and family benefits' },
    { id: 'school_records',      name: 'School Records & Transcripts',    form: 'Academic Records',        required: false, desc: 'Official transcripts, IEP, 504 plans — request sealed copies from current school counselor' },
    { id: 'power_of_attorney',   name: 'Power of Attorney',               form: 'DD Form 2822',            required: false, desc: 'Grants spouse or designee legal authority during move — free from JAG / Legal Assistance office' },
    { id: 'wills_legal',         name: 'Updated Will & Legal Documents',  form: 'Legal Documents',         required: false, desc: 'Update wills and beneficiaries before OCONUS or long-distance PCS — free from JAG' },
    { id: 'pet_vet_records',     name: 'Pet Vaccination / Vet Records',   form: 'Vet Certificate',         required: false, desc: 'Rabies vaccination and current health certificate from USDA-APHIS-accredited vet (required OCONUS)' },
    { id: 'vehicle_docs',        name: 'Vehicle Registration & Title',    form: 'DMV Documents',           required: false, desc: 'Current registration and title for all vehicles — update address in new state after arrival' },
  ],
  oconus: [
    { id: 'official_passport_mbr', name: 'Official Passport (Member)',    form: 'DS-11 / DS-82',           required: true,  desc: 'Official (black cover) government passport — apply through installation passport office at least 3 months before PCS' },
    { id: 'tourist_passport_mbr',  name: 'Tourist Passport (Member)',     form: 'DS-11 / DS-82',           required: false, desc: 'Personal blue-cover passport for off-duty travel in host country — highly recommended' },
    { id: 'dependent_passports',   name: 'Dependent Passports (All)',     form: 'DS-11 / DS-82',           required: true,  desc: 'Official and tourist passports for all authorized traveling dependents' },
    { id: 'no_fee_passport_auth',  name: 'No-Fee Passport Authorization', form: 'DD Form 1056',            required: true,  desc: 'Authorizes free no-fee government passport applications for sponsor and family — endorsement from gaining command before passport office visit' },
    { id: 'sofa',                  name: 'SOFA Agreement Documentation',  form: 'SOFA',                    required: true,  desc: 'Status of Forces Agreement — defines your legal status and rights in the host country' },
    { id: 'visa',                  name: 'Visa / Entry Documentation',    form: 'Host Nation Visa',        required: false, desc: 'Entry permit required by host nation — check with gaining installation S2/Security office' },
    { id: 'pet_import',            name: 'Pet Import Documentation',      form: 'USDA APHIS 7001',         required: false, desc: 'Health certificate, microchip proof, and host-nation pet import requirements — research 6+ months early' },
    { id: 'intl_driving',          name: 'International Driving Permit',  form: 'AAA IDP',                 required: false, desc: 'Required in most host nations — apply through AAA at least 30 days before departure' },
    { id: 'country_clearance',     name: 'Country Clearance',             form: 'Country Clearance',       required: true,  desc: 'Host-nation country clearance approval — coordinate with gaining unit S2/Security 60+ days early' },
    { id: 'command_sponsorship',   name: 'Command Sponsorship Orders',    form: 'Command Sponsorship',     required: false, desc: 'Required for dependents to receive government travel and OCONUS benefits — initiated by gaining command' },
  ],
};

// ─── Branch-specific additional documents ────────────────────────────────────

const BRANCH_EXTRA = {
  Army: {
    orders: [
      { id: 'da31_leave',       name: 'Leave Form (DA 31)',                form: 'DA Form 31',              required: true,  desc: 'Request and Authority for Leave covering all authorized PCS travel days — signed by commander' },
      { id: 'iperms_review',    name: 'iPERMS Records Verification',       form: 'iPERMS',                  required: true,  desc: 'Confirm all official records (evals, awards, training) are filed before departure', formUrl: 'https://iperms.hrc.army.mil' },
      { id: 'srb_review',       name: 'Soldier Record Brief (SRB / IPPS-A)', form: 'IPPS-A SRB',           required: true,  desc: 'Verify SRB is current via IPPS-A before departure — dependents, awards, evals, RNLTD, gaining UIC', formUrl: 'https://ipps-a.army.mil' },
      { id: 'ncoer_oer',        name: 'NCOER / OER Completion',            form: 'DA 2166-9 / 67-10',      required: true,  desc: 'Ensure all evaluations are completed, signed, and filed in iPERMS before PCS departure' },
      { id: 'da4187',           name: 'DA 4187 Personnel Actions',         form: 'DA Form 4187',            required: false, desc: 'Personnel action requests (address change, BAH updates, SGLI, PTDY) submitted through S1' },
    ],
    family: [
      { id: 'da137_clearance',  name: 'Installation Clearance Record',     form: 'DA Form 137-1/2',        required: true,  desc: 'Clear finance, housing, library, medical, and unit arms room at losing installation' },
      { id: 'da5960_bah',       name: 'BAH Authorization (DA 5960)',       form: 'DA Form 5960',            required: true,  desc: 'Start/Stop/Change BAH — submit to S1 before or upon arrival at gaining installation' },
      { id: 'da7695_efmp',      name: 'EFMP Screening (DA 7695)',          form: 'DA Form 7695',            required: false, desc: 'Army EFMP enrollment/screening through ACS or Medical — required if any dependent has special needs' },
      { id: 'da5305_fcp',       name: 'Family Care Plan (DA 5305)',        form: 'DA Form 5305',            required: false, desc: 'Required for single parents and dual-military soldiers with dependents — coordinate alternate caregivers via S1' },
    ],
  },
  Navy: {
    orders: [
      { id: 'navpers_detach',   name: 'Report of Detachment',              form: 'NAVPERS 1300/16',        required: true,  desc: 'Official report of detachment from losing command — processed via MyNavy HR portal', formUrl: 'https://www.mynavyhr.navy.mil' },
      { id: 'bupers_verify',    name: 'BUPERS Orders Verification',        form: 'MyNavy HR',               required: true,  desc: 'Confirm PCS orders and endorsements are accurate in MyNavy HR before proceeding' },
      { id: 'navpers_1070_605', name: 'Admin Remarks (Page 13) — Losing',  form: 'NAVPERS 1070/605',        required: true,  desc: 'Page 13 entry at current command documenting PCS transfer, address change, or dependency status' },
      { id: 'opnav_overseas',   name: 'Overseas Screening (OPNAV 1300/16)', form: 'OPNAV 1300/16',          required: false, desc: 'Required for OCONUS PCS — sponsor and family medical/dental/admin screening before report date' },
    ],
    family: [
      { id: 'navy_checkout',    name: 'Command Check-Out Sheet',           form: 'Command Form',            required: true,  desc: 'Signed check-out sheet from all required losing command department heads' },
      { id: 'eval_fitrep',      name: 'EVAL / FITREP Review',              form: 'EVAL / FITREP',           required: true,  desc: 'Ensure all evaluations are finalized and accessible in BUPERS before detachment date' },
      { id: 'navpers_1070_602', name: 'Dependency Application (Page 2)',   form: 'NAVPERS 1070/602',        required: true,  desc: 'Update Page 2 at gaining Personnel Support Detachment with current dependent information' },
      { id: 'ffsc_brief',       name: 'Fleet & Family Relocation Brief',   form: 'FFSC Brief',              required: false, desc: 'Attend PCS relocation brief at Fleet & Family Support Center for transition resources' },
    ],
  },
  'Marine Corps': {
    orders: [
      { id: 'cmc_orders',       name: 'CMC Orders (MCTFS)',                form: 'CMC Orders',              required: true,  desc: 'Official Marine Corps PCS orders — verify accuracy via Marine Corps Total Force System' },
      { id: 'navmc_118',        name: 'Service Record Book Page Entry',    form: 'NAVMC 118(3)',            required: true,  desc: 'Page 11/12 administrative remarks entry at IPAC documenting transfer, dependents, or admin updates' },
      { id: 'mol_outprocess',   name: 'MOL Out-Processing Checklist',      form: 'MOL Checklist',           required: true,  desc: 'Complete Marine Online out-processing checklist before detachment — all sections verified' },
    ],
    family: [
      { id: 'mco_checkout',     name: 'Command Check-Out Checklist',       form: 'MCO 4600.39',             required: true,  desc: 'Complete check-out per MCO 4600.39 — all required signatures from unit staff before departure' },
      { id: 'msr_review',       name: 'Service Record Review (MSR/ESR)',   form: 'MSR / ESR',               required: true,  desc: 'Verify Master Service Record and Electronic Service Record are complete and current' },
      { id: 'mccs_brief',       name: 'MCCS Relocation Brief',             form: 'MCCS Brief',              required: false, desc: 'PCS relocation counseling brief through Marine Corps Community Services' },
      { id: 'usmc_fcp',         name: 'Family Care Plan',                  form: 'MCO 1740.13 FCP',         required: false, desc: 'Required for single parents and dual-military Marines with dependents — coordinated through IPAC' },
    ],
  },
  'Air Force': {
    orders: [
      { id: 'af_mypers',        name: 'AF PCS Orders via myPers',          form: 'AF Orders',               required: true,  desc: 'Official AF PCS orders from AFPC — verify in myPers portal and print all endorsements', formUrl: 'https://mypers.af.mil' },
      { id: 'af988_leave',      name: 'Leave Request (AF Form 988)',       form: 'AF Form 988',             required: true,  desc: 'Request and Authority for Leave covering PCS travel days — signed by commander' },
      { id: 'af4380_pcs_plan',  name: 'PCS Travel Planning',               form: 'AF Form 4380',            required: true,  desc: 'AF Form 4380 PCS Travel Planning — completed at Airman & Family Readiness Center before departure' },
    ],
    family: [
      { id: 'af907',            name: 'Relocation Preparation Checklist',  form: 'AF Form 907',             required: true,  desc: 'Complete AF Form 907 with Airman & Family Readiness Center counselor before departure' },
      { id: 'af_outprocess',    name: 'Base / Unit Out-Processing',        form: 'AF Out-Processing Sheet', required: true,  desc: 'Complete all base out-processing appointments: MPF, finance, housing, medical' },
      { id: 'vmpf_review',      name: 'vMPF Records Review',               form: 'AFPC vMPF',               required: true,  desc: 'Verify all records are current in Air Force Personnel Center virtual MPF before departure' },
      { id: 'af1466_efmp',      name: 'EFMP Identification (AF 1466)',     form: 'AF Form 1466',            required: false, desc: 'Request to identify exceptional family members for AF EFMP enrollment — required if dependents have special needs' },
    ],
  },
  'Space Force': {
    orders: [
      { id: 'sf_mypers',        name: 'Space Force PCS Orders via myPers', form: 'SF Orders',               required: true,  desc: 'Official Space Force PCS orders via myPers (shared AF/SF system)', formUrl: 'https://mypers.af.mil' },
      { id: 'sf_af988_leave',   name: 'Leave Request (AF Form 988)',       form: 'AF Form 988',             required: true,  desc: 'Space Force uses the AF leave form — request and authority for PCS travel leave, signed by commander' },
    ],
    family: [
      { id: 'sf_outprocess',    name: 'Delta / Unit Out-Processing',       form: 'SF Out-Processing',       required: true,  desc: 'Complete all out-processing at losing Delta/unit and Space Force installation' },
      { id: 'gdp_review',       name: 'Guardian Development Plan',         form: 'GDP',                     required: false, desc: 'Review and update Guardian Development Plan before PCS for career continuity' },
      { id: 'sf_af1466_efmp',   name: 'EFMP Identification (AF 1466)',     form: 'AF Form 1466',            required: false, desc: 'Space Force uses the AF EFMP form — required if any dependent has special needs' },
    ],
  },
  'Coast Guard': {
    orders: [
      { id: 'cg3103',           name: 'CG Transfer Orders (CG-3103)',      form: 'CG-3103',                 required: true,  desc: 'Official Coast Guard PCS transfer orders — access and verify via Direct Access portal' },
      { id: 'cg_direct_access', name: 'Direct Access Records Verification', form: 'CG Direct Access',       required: true,  desc: 'Verify all personnel records are current and accurate in CGBI / Direct Access' },
      { id: 'cg3307_remarks',   name: 'Administrative Remarks (CG-3307)',  form: 'CG-3307',                 required: true,  desc: 'Page 7 administrative remarks entry at SPO documenting transfer, dependents, leave, or admin updates' },
    ],
    family: [
      { id: 'cg_unit_checkout', name: 'Unit Check-Out Sheet',              form: 'CG Form',                 required: true,  desc: 'Signed check-out from losing unit Command Master Chief and department heads' },
      { id: 'cg_work_life',     name: 'CG Work-Life Relocation Brief',     form: 'Work-Life Brief',         required: false, desc: 'Relocation counseling through Coast Guard Work-Life program prior to PCS' },
      { id: 'cg_fcp',           name: 'Family Care Plan',                  form: 'CG Family Care Plan',     required: false, desc: 'Required for single-parent and dual-military Coast Guardsmen with dependents' },
    ],
  },
};

// ─── Merge base + branch-specific docs ──────────────────────────────────────

// Per-document applicability predicates. If a document id appears here,
// it is hidden when the corresponding profile attribute is false. This
// keeps the Documents tabs tight to the user's actual situation rather
// than showing the universal-superset of every form across every move
// type. Keys not listed here always show.
const DOC_APPLICABILITY = {
  // Children / dependents
  school_records:        (p) => p.hasChildren,
  shot_records_fam:      (p) => p.hasDependents || p.hasChildren,
  dependent_passports:   (p) => p.hasDependents || p.hasChildren,
  efmp_docs:             (p) => p.hasDependents || p.hasChildren,
  da7695_efmp:           (p) => p.hasDependents || p.hasChildren,
  af1466_efmp:           (p) => p.hasDependents || p.hasChildren,
  sf_af1466_efmp:        (p) => p.hasDependents || p.hasChildren,
  family_care_plan:      (p) => p.hasDependents || p.hasChildren,
  da5305_fcp:            (p) => p.hasDependents || p.hasChildren,
  usmc_fcp:              (p) => p.hasDependents || p.hasChildren,
  cg_fcp:                (p) => p.hasDependents || p.hasChildren,
  marriage_cert:         (p) => p.hasDependents,
  // BAH (CONUS) vs OHA/MIHA/LQA (OCONUS). DA 5960 starts/stops the BAH
  // entitlement for service members with dependents; it does not apply
  // overseas where OHA/MIHA replace BAH.
  da5960_bah:            (p) => p.hasDependents && !p.isOverseas,
  bah_auth:              (p) => !p.isOverseas,
  navpers_1070_602:      (p) => p.hasDependents,
  // Command sponsorship (CS) is required for ALL OCONUS PCS, accompanied
  // or unaccompanied, per JTR §050203 and DoDI 1315.18 — the sponsor
  // package gates country clearance, no-fee passport, and dependent
  // travel approval. Gating to "hasDependents" alone hid this from
  // single unaccompanied OCONUS service members who still need it.
  command_sponsorship:   (p) => p.isOverseas || p.hasDependents || p.hasChildren,
  // POV shipment authorization (DD 788) and International Driving
  // Permit are overseas-only. Civilian POV ship gated symmetrically.
  pov_shipment:          (p) =>  p.isOverseas,
  intl_driving:          (p) =>  p.isOverseas,
  civ_pov_ship:          (p) =>  p.isOverseas,
  // OHA/MIHA authorization is the OCONUS analog of BAH paperwork.
  oha_miha_auth:         (p) =>  p.isOverseas,
  // Pets
  pet_vet_records:       (p) => p.hasPets,
  pet_import:            (p) => p.hasPets,
  // Move-type (PPM-only items)
  weight_ticket_empty:   (p) => p.moveType === 'PPM',
  weight_ticket_full:    (p) => p.moveType === 'PPM',
  pro_gear:              (p) => p.moveType === 'PPM',
  // HHG-only items
  hhg_counseling:        (p) => p.moveType === 'HHG',
  storage_auth:          (p) => p.moveType === 'HHG',
  // House Hunting Trip authorization (FTR §302-5) is a CONUS-only DoD
  // civilian benefit. Hide on OCONUS so the OCONUS housing-recon doc
  // takes its place. The OCONUS recon entry is gated symmetrically.
  civ_house_hunt:        (p) => !p.isOverseas,
  civ_oconus_house_recon:(p) =>  p.isOverseas,
};

function applies(docId, profileAttrs) {
  const pred = DOC_APPLICABILITY[docId];
  if (!pred) return true;
  try { return !!pred(profileAttrs); } catch { return true; }
}

// DoD Civilian PCS documents. Replaces military forms (DD 31, DA 5960,
// orders endorsements) with the Federal Travel Regulation (FTR)
// civilian equivalents and DCPAS / OPM forms. Public form numbers and
// regulatory citations only — no internal HR routing data.
const CIVILIAN_DOCS = {
  orders: [
    { id: 'civ_travel_auth',     name: 'Travel Authorization (PCS)',        form: 'DD Form 1614 / agency-specific', required: true,  desc: 'Official civilian PCS travel order issued by your servicing HR Service Center. Required for all relocation reimbursement.' },
    { id: 'civ_service_agree',   name: 'Continuing Service Agreement',      form: 'Service Agreement',              required: true,  desc: 'Signed before relocation benefits release. CONUS = 12 months, OCONUS = 24 months minimum service commitment.' },
    { id: 'civ_sf50',            name: 'Notification of Personnel Action',  form: 'SF-50',                          required: true,  desc: 'Records the personnel action (transfer-in, promotion, etc.) for your federal record. Issued by gaining HR.' },
  ],
  travel: [
    { id: 'civ_travel_voucher',  name: 'Civilian Travel Voucher',           form: 'DD Form 1351-2',                 required: true,  desc: 'Civilian PCS reimbursement claim. Submit within 5 working days of arrival per FTR §302-2.18.', formUrl: 'https://www.esd.whs.mil/Portals/54/Documents/DD/forms/dd/dd1351-2.pdf' },
    { id: 'civ_tqse_request',    name: 'Temporary Quarters Subsistence Expense (TQSE) Request', form: 'TQSE Request', required: false, desc: 'Up to 60 days CONUS / 90 days OCONUS lodging and meals per FTR §302-6. Submit before incurring expenses.' },
    { id: 'civ_house_hunt',      name: 'House Hunting Trip Authorization',  form: 'HHT Authorization',              required: false, desc: 'Round-trip travel for self and spouse to search for housing at the new locality (CONUS only, FTR §302-5).' },
    { id: 'civ_oconus_house_recon', name: 'OCONUS Housing Reconnaissance Plan', form: 'Gaining Housing Office / AHRN coordination', required: false, desc: 'Civilians do not receive an HHT authorization OCONUS. Document your contact with the gaining installation Housing Office (HOMES.mil) and any pre-screened off-base options pulled from AHRN.com or MilitaryByOwner.' },
    { id: 'civ_lodging_rcpts',   name: 'Lodging Receipts',                  form: 'Receipts',                       required: true,  desc: 'Hotel receipts for every night of PCS travel — required for voucher reimbursement.' },
    { id: 'civ_mileage_log',     name: 'Mileage / Per Diem Log',            form: 'Log / Receipts',                 required: true,  desc: 'POV mileage documentation per FTR §302-4 mileage rates, fuel and rental car receipts during PCS travel.' },
    { id: 'civ_misc_expense',    name: 'Miscellaneous Expense Allowance',   form: 'Miscellaneous Expense Claim',    required: false, desc: 'Flat-rate up to $1,300 OR itemized actuals per FTR §302-16. Covers driver licenses, vehicle re-registration, utility connection fees.' },
    { id: 'civ_real_estate',     name: 'Real Estate Expense Allowance',     form: 'Real Estate Claim',              required: false, desc: 'Reimbursement for selling and buying primary residence at the new locality per FTR §302-11.' },
    { id: 'civ_advance_pay',     name: 'Advance Pay Request',               form: 'Advance Pay Request',            required: false, desc: 'Up to 30 days base salary advance through your servicing payroll office.' },
  ],
  hhg: [
    { id: 'civ_hhg_app',         name: 'HHG Shipment Application',          form: 'DD Form 1299',                   required: true,  desc: 'Schedule household goods shipment via DPS — same system as military PCS, civilian weight allowance is 18,000 lbs.', formUrl: 'https://dps.move.mil/cust/standard/user/home.xhtml' },
    { id: 'civ_hhg_couns',       name: 'HHG Transportation Counseling',     form: 'DD Form 1797',                   required: true,  desc: 'Counseling checklist — must be signed before TSP pickup date.' },
    { id: 'civ_weight_empty',    name: 'Empty Weight Ticket',               form: 'Weight Ticket',                  required: true,  desc: 'Empty weight before loading — required for PPM reimbursement.' },
    { id: 'civ_weight_full',     name: 'Full (Loaded) Weight Ticket',       form: 'Weight Ticket',                  required: true,  desc: 'Loaded weight of all household goods.' },
    { id: 'civ_hhg_inventory',   name: 'HHG Inventory & Condition Report',  form: 'DD Form 1840 / 1840R',           required: true,  desc: 'Note all pre-existing damage at PICKUP and again at DELIVERY. Critical for claims.' },
    { id: 'civ_pov_ship',        name: 'POV Shipment Authorization',        form: 'DD Form 788',                    required: false, desc: 'Required for OCONUS civilian PCS, check eligibility for CONUS.' },
    { id: 'civ_nts_auth',        name: 'Non-Temporary Storage Authorization', form: 'NTS Authorization',            required: false, desc: 'Long-term storage if household goods cannot be moved immediately.' },
    { id: 'civ_hhg_claim',       name: 'HHG Damage Claim (if needed)',      form: 'DD Form 1840R',                  required: false, desc: 'File within 70 days of delivery for damaged or missing items.' },
  ],
  housing: [
    { id: 'civ_locality_pay',    name: 'Locality Pay Confirmation',         form: 'OPM Locality Tables',            required: true,  desc: 'Confirm gaining locality pay rate via OPM tables. Civilians do NOT receive BAH/OHA.', formUrl: 'https://www.opm.gov/policy-data-oversight/pay-leave/salaries-wages/' },
    { id: 'civ_lqa_app',         name: 'LQA Application (OCONUS only)',     form: 'SF-1190',                        required: false, desc: 'Living Quarters Allowance application per DSSR §131. Submit at gaining HR Service Center on arrival.' },
    { id: 'civ_post_allow',      name: 'Post Allowance Application (OCONUS)', form: 'SF-1190',                      required: false, desc: 'Cost-of-living differential for OCONUS civilians per DSSR §220.' },
    { id: 'civ_lease',           name: 'Lease Agreement / Mortgage Docs',   form: 'Civilian housing docs',          required: false, desc: 'Lease or mortgage documents at gaining locality. Real estate expense allowance applies for primary residence.' },
  ],
  medical: [
    { id: 'civ_fehb_card',       name: 'FEHB Health Plan Card',             form: 'FEHB Card',                      required: true,  desc: 'Federal Employees Health Benefits card — civilians use FEHB, not TRICARE. PCS is a Qualifying Life Event for plan changes.' },
    { id: 'civ_fehb_change',     name: 'FEHB Plan Change (Qualifying Life Event)', form: 'SF-2809',                  required: false, desc: 'Submit within 60 days of PCS to change FEHB plans without waiting for Open Season.' },
    { id: 'civ_med_records',     name: 'Medical Records',                   form: 'Health Records',                 required: true,  desc: 'Sealed medical, dental, and vision records for all family members.' },
    { id: 'civ_dependent_rec',   name: 'Dependent Medical Records',         form: 'Health Records',                 required: false, desc: 'Sealed records for each dependent.' },
    { id: 'civ_pet_vet',         name: 'Pet Veterinary Records',            form: 'Health Certificate',             required: false, desc: 'Health certificate required 10 days before travel. OCONUS PCS requires additional country-specific paperwork.' },
  ],
  oconus: [
    { id: 'civ_no_fee_pass',     name: 'No-Fee Official Passport',          form: 'DS-11 + DD Form 1056',           required: true,  desc: 'Official no-fee passport for civilian and dependents. SEPARATE from tourist passport.' },
    { id: 'civ_visa',            name: 'Country-Specific Visa',             form: 'Visa Application',               required: true,  desc: 'Country-specific work visa or status. Coordinate with gaining DoD HR for SOFA / DPRK status.' },
    { id: 'civ_oconus_screen',   name: 'DoD Civilian OCONUS Screening',     form: 'DCPAS Screening',                required: true,  desc: 'Medical, family, and eligibility screening before OCONUS assignment.' },
    { id: 'civ_family_screen',   name: 'Family Member Travel Screening',    form: 'Family Screening',               required: false, desc: 'Travel and medical screening for accompanying dependents.' },
    { id: 'civ_education_allow', name: 'Education Allowance Application',   form: 'SF-1190 / DoDEA',                required: false, desc: 'Per DSSR §270 — applies to OCONUS civilians with school-age dependents.' },
    { id: 'civ_sofa_brief',      name: 'SOFA / Country Brief Acknowledgement', form: 'Country Brief',                required: true,  desc: 'Status of Forces Agreement and country brief acknowledgement before arrival.' },
  ],
  family: [
    { id: 'civ_marriage_cert',   name: 'Marriage Certificate',              form: 'Vital Record',                   required: false, desc: 'Required for dependent travel and FEHB enrollment.' },
    { id: 'civ_birth_certs',     name: 'Birth Certificates',                form: 'Vital Record',                   required: false, desc: 'For each child claimed as a dependent.' },
    { id: 'civ_school_rec',      name: 'School Records (Sealed)',           form: 'School Records',                 required: false, desc: 'Sealed records for transfer to new school district or DoDEA.' },
    { id: 'civ_will_poa',        name: 'Will / Power of Attorney',          form: 'Will / POA',                     required: false, desc: 'Civilian PCS does NOT include free military legal assistance. Update through private legal counsel before move.' },
    { id: 'civ_spouse_employ',   name: 'DoD Spouse Employment Program Doc', form: 'Spouse Employment',              required: false, desc: 'If spouse is also federally employed, coordinate spouse PCS through DCPAS spouse employment program.' },
  ],
}

function getDocsForBranch(branch, isOconus, profileAttrs = {}) {
  // DoD Civilians get the civilian document set instead of branch-
  // specific military forms. The civilian set is the same shape (per
  // DOC_CATEGORIES) so the UI renders identically.
  if (profileAttrs.component === 'DoD Civilian') {
    return DOC_CATEGORIES.reduce((acc, cat) => {
      if (cat.id === 'oconus' && !isOconus) { acc[cat.id] = []; return acc; }
      const docs = CIVILIAN_DOCS[cat.id] || [];
      acc[cat.id] = docs.filter(d => applies(d.id, profileAttrs));
      return acc;
    }, {});
  }
  const extra = BRANCH_EXTRA[branch] || {};
  return DOC_CATEGORIES.reduce((acc, cat) => {
    if (cat.id === 'oconus' && !isOconus) { acc[cat.id] = []; return acc; }
    const combined = [...(BASE_DOCS[cat.id] || []), ...(extra[cat.id] || [])];
    acc[cat.id] = combined.filter(d => applies(d.id, profileAttrs));
    return acc;
  }, {});
}

// ─── Persistent state ────────────────────────────────────────────────────────

const STATE_KEY = 'pcs_doc_states';
const loadStates = () => readLegacyJson(STATE_KEY, {});
const saveStates = (s) => {
  secureLocalStore.set(STATE_KEY, s);
};

// ─── Main Component ──────────────────────────────────────────────────────────

function sanitizeStates(raw) {
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, { obtained: !!value?.obtained }]));
}

function cleanupLegacyFiles() {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith('pcs_file_'))
      .forEach(key => localStorage.removeItem(key));
  } catch {}
}

// PCS Binder — checklist-only export. The app intentionally has NO
// file input or photo-capture surface anywhere (verifiable:
// `grep -r 'type="file"' src/` returns zero). The binder PDF lists
// each document name, form number, required flag, and gathered
// status so the user can hand the printout to the gaining S1 /
// civilian HR / VA along with the physical paperwork they assembled
// themselves. We never accept, store, or render uploaded user files.
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildBinderHtml(profile, allDocs, states, branch, isOconus) {
  const rows = [];
  for (const cat of DOC_CATEGORIES) {
    const docs = allDocs[cat.id] || [];
    if (!docs.length) continue;
    rows.push(`<h2>${escapeHtml(cat.label)}</h2>`);
    rows.push('<table><thead><tr><th style="width:32px">✓</th><th>Document</th><th>Form #</th><th>Required</th></tr></thead><tbody>');
    for (const d of docs) {
      const st = states[d.id] || {};
      rows.push(`
        <tr>
          <td style="text-align:center;font-weight:900;color:${st.obtained ? '#1B5E20' : '#C62828'}">${st.obtained ? '✓' : '–'}</td>
          <td><strong>${escapeHtml(d.name)}</strong><div style="font-size:11px;color:#56697C;margin-top:2px">${escapeHtml(d.desc || '')}</div></td>
          <td style="font-family:monospace;font-size:11px">${escapeHtml(d.form || '')}</td>
          <td style="text-align:center">${d.required ? 'Yes' : 'No'}</td>
        </tr>
      `);
    }
    rows.push('</tbody></table>');
  }
  return `<!doctype html><html><head><meta charset="utf-8" /><title>PCS Binder Checklist — ${escapeHtml(profile?.firstName || '')} ${escapeHtml(profile?.lastName || '')}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0D1821; padding: 24px; }
  h1 { margin: 0 0 6px; font-size: 22px; }
  h2 { margin: 18px 0 6px; font-size: 16px; border-bottom: 1px solid #E0E6EE; padding-bottom: 4px; }
  .meta { color: #56697C; font-size: 12px; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px; }
  th, td { border: 1px solid #E0E6EE; padding: 8px; vertical-align: top; text-align: left; }
  th { background: #F4F7F7; }
  .stamp { margin-top: 28px; padding-top: 12px; border-top: 1px solid #E0E6EE; font-size: 11px; color: #56697C; }
</style></head><body>
  <h1>PCS Binder Checklist</h1>
  <div class="meta">
    Sponsor: ${escapeHtml(profile?.firstName || '')} ${escapeHtml(profile?.lastName || '')}<br />
    Branch: ${escapeHtml(branch)} · ${isOconus ? 'OCONUS' : 'CONUS'} assignment<br />
    Gaining installation: ${escapeHtml(profile?.gainingInstallation || '')}<br />
    Generated: ${escapeHtml(new Date().toISOString())}
  </div>
  ${rows.join('\n')}
  <div class="stamp">Generated by PCS Express. This is a CHECKLIST only — PCS Express does not store, accept, or transmit any of the underlying documents. Hand-deliver this checklist with your physical paperwork to the gaining S1 / civilian HR / VA.</div>
</body></html>`;
}

function exportPrintWindow(html) {
  const w = window.open('', '_blank');
  if (!w) { alert('Pop-up blocked. Allow pop-ups for PCS Express to export the checklist.'); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 300);
}

export default function PCSDocumentsModule({ theme, profile }) {
  const branch    = profile?.branch    || 'Army';
  const isOconus  = profile?.isOverseas || false;
  // Tailor Documents to the actual onboarding selections so users don't
  // wade through items that don't apply to them.
  const profileAttrs = {
    hasDependents: !!profile?.hasDependents,
    hasChildren:   !!profile?.hasChildren,
    hasPets:       !!profile?.hasPets,
    moveType:      profile?.moveType || 'HHG',
    component:     profile?.component || 'Active Duty',
    ordersType:    profile?.ordersType || '',
  };
  // Reserve / National Guard users on non-PCS-tier orders (IDT, drill,
  // SAD, technician) won't qualify for the full active-duty document
  // package. We still render the documents list but surface a banner
  // explaining which entitlements apply to their specific orders.
  const isReserveOrGuard = profileAttrs.component === 'Reserve' || profileAttrs.component === 'National Guard';
  const reserveOrdersNote = isReserveOrGuard && profileAttrs.ordersType
    ? (profileAttrs.ordersType === 'idt' ? 'IDT / drill — no PCS entitlement; finance, transportation, and housing forms below apply only if you switch to Title 10 orders.'
      : profileAttrs.ordersType === 'sad' ? 'State Active Duty — federal forms below do not apply; check your state National Guard HQ for state-specific paperwork.'
      : profileAttrs.ordersType === 'title32_709' ? 'Title 32 §709 technician — federal civilian benefits apply; use the DoD Civilian document set for PCS-style paperwork.'
      : profileAttrs.ordersType === 'reserve_pcs' ? 'Reserve Center transfer — coordinate any limited relocation assistance through your gaining unit; full JTR PCS package below does not apply.'
      : profileAttrs.ordersType === 'title10_at' ? 'Annual Training / ADT — short-term federal active duty; only orders + travel voucher forms typically apply.'
      : null)
    : null;
  const allDocs   = getDocsForBranch(branch, isOconus, profileAttrs);

  const [states, setStates] = useState(() => sanitizeStates(loadStates()));
  const [activecat, setActivecat] = useState('family');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cleanupLegacyFiles();
    secureLocalStore.get(STATE_KEY, null).then(saved => {
      if (saved) setStates(sanitizeStates(saved));
    });
  }, []);

  const categoryProgress = useCallback(() => {
    return DOC_CATEGORIES.reduce((acc, cat) => {
      const docs = allDocs[cat.id] || [];
      const total    = docs.length;
      const obtained = docs.filter(d => states[d.id]?.obtained).length;
      const reqTotal = docs.filter(d => d.required).length;
      const reqDone  = docs.filter(d => d.required && states[d.id]?.obtained).length;
      acc[cat.id] = { total, obtained, reqTotal, reqDone };
      return acc;
    }, {});
  }, [allDocs, states]);

  const progress = categoryProgress();
  const totalDocs = Object.values(allDocs).flat().length;
  const totalObtained = Object.values(allDocs).flat().filter(d => states[d.id]?.obtained).length;
  const missingRequired = Object.values(allDocs).flat().filter(d => d.required && !states[d.id]?.obtained);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  const toggleObtained = (docId) => {
    setStates(prev => {
      const cur = prev[docId] || {};
      // Per the Zero-Upload security baseline, doc state stores only
      // the boolean "obtained" flag. No file attachments, no photos,
      // no uploads anywhere in the module.
      const next = { ...prev, [docId]: { obtained: !cur.obtained } };
      saveStates(next);
      return next;
    });
  };

  const exportBinder = () => exportPrintWindow(buildBinderHtml(profile, allDocs, states, branch, isOconus));

  const currentDocs = allDocs[activecat] || [];
  const cat = DOC_CATEGORIES.find(c => c.id === activecat);
  const pct = totalDocs > 0 ? Math.round((totalObtained / totalDocs) * 100) : 0;
  const inputSt = { background: 'none', border: 'none', cursor: 'pointer', padding: 0 };

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ background: theme.secondary, padding: '16px 16px 14px' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 2 }}>PCS Documents</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>
          {branch}{isReserveOrGuard ? ` · ${profileAttrs.component}` : ''} · {isOconus ? 'OCONUS Assignment' : 'CONUS Assignment'} · {totalObtained}/{totalDocs} marked gathered
        </div>
        {reserveOrdersNote && (
          <div style={{ background: 'rgba(255,179,0,0.18)', border: '1px solid rgba(255,179,0,0.45)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 11, color: '#FFD54F', lineHeight: 1.5 }}>
            <strong>Orders type:</strong> {reserveOrdersNote}
          </div>
        )}
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 6, height: 8, marginBottom: 6 }}>
          <div style={{ height: 8, borderRadius: 6, background: theme.accent, width: `${pct}%`, transition: 'width .4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
          <span>{pct}% complete</span>
          <span style={{ color: missingRequired.length > 0 ? '#FFB4B4' : theme.accent, fontWeight: 700 }}>
            {missingRequired.length > 0 ? `${missingRequired.length} required record${missingRequired.length !== 1 ? 's' : ''} outstanding` : 'All required records marked gathered'}
          </span>
        </div>
      </div>


      {missingRequired.length > 0 && (
        <div style={{ background: '#7F1D1D', borderBottom: '1px solid #991B1B', padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ fontSize: 16, flexShrink: 0 }}>⚠</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#FECACA', marginBottom: 3 }}>Required Records Outstanding</div>
            <div style={{ fontSize: 11, color: '#FCA5A5', lineHeight: 1.5 }}>
              {missingRequired.slice(0, 3).map(d => d.name).join(', ')}
              {missingRequired.length > 3 ? ` +${missingRequired.length - 3} more` : ''}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#1B4332' : '#7F1D1D', color: '#FFF', padding: '10px 18px', borderRadius: 24, fontSize: 12, fontWeight: 700, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
          {toast.ok ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      <div style={{ padding: '12px 16px 0', background: '#F8FAFC' }}>
        <TabBar ariaLabel="Document categories" className="pcs-tabbar--flush">
          {DOC_CATEGORIES.filter(c => c.id !== 'oconus' || isOconus).map(c => {
            const p = progress[c.id];
            const isActive = activecat === c.id;
            const allReqDone = p.reqTotal === 0 || p.reqDone === p.reqTotal;
            return (
              <button key={c.id} id={`doc-tab-${c.id}`} role="tab" aria-selected={isActive} aria-controls={`doc-panel-${c.id}`} data-active={isActive || undefined} onClick={() => setActivecat(c.id)} className={`pcs-tab ${isActive ? 'is-active' : ''}`} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${isActive ? c.color : '#CBD5E1'}`, background: isActive ? c.color : '#FFF', color: isActive ? '#FFF' : '#374151', fontSize: 11, fontWeight: isActive ? 800 : 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{c.icon}</span>
                <span>{c.label}</span>
                <span style={{ background: isActive ? 'rgba(255,255,255,0.25)' : (allReqDone ? '#D1FAE5' : '#FEE2E2'), color: isActive ? '#FFF' : (allReqDone ? '#065F46' : '#991B1B'), fontSize: 10, fontWeight: 900, padding: '1px 6px', borderRadius: 10 }}>
                  {p.obtained}/{p.total}
                </span>
              </button>
            );
          })}
        </TabBar>
      </div>

      <div role="tabpanel" id={`doc-panel-${activecat}`} aria-labelledby={`doc-tab-${activecat}`} style={{ padding: '4px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${cat?.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{cat?.icon}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0D1821' }}>{cat?.label}</div>
            <div style={{ fontSize: 11, color: '#56697C' }}>{progress[activecat]?.obtained}/{progress[activecat]?.total} gathered · {progress[activecat]?.reqTotal} required</div>
          </div>
        </div>

        {activecat === 'oconus' && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#1E40AF' }}>
            OCONUS records apply to your overseas assignment. Start passport applications at least <strong>3 months early</strong>.
          </div>
        )}

        {currentDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 13 }}>No records in this category.</div>
        ) : currentDocs.map((doc) => {
          const st = states[doc.id] || {};
          const obtained = !!st.obtained;
          return (
            <div key={doc.id} className="pcs-doc-card" style={{ background: '#FFF', borderRadius: 14, marginBottom: 10, border: `1.5px solid ${obtained ? `${cat?.color}40` : '#E2E8F0'}`, overflow: 'hidden', boxShadow: obtained ? `0 2px 8px ${cat?.color}18` : '0 1px 2px rgba(13, 24, 33, 0.04)' }}>
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <button onClick={() => toggleObtained(doc.id)} style={{ ...inputSt, flexShrink: 0, marginTop: 2 }} aria-label={obtained ? 'Mark as not gathered' : 'Mark as gathered'}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${obtained ? cat?.color : '#CBD5E1'}`, background: obtained ? cat?.color : '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                    {obtained && <span style={{ color: '#FFF', fontSize: 13, fontWeight: 900 }}>✓</span>}
                  </div>
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: obtained ? '#0D1821' : '#374151' }}>{doc.name}</span>
                    {doc.required && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: obtained ? '#D1FAE5' : '#FEE2E2', color: obtained ? '#065F46' : '#991B1B', padding: '2px 7px', borderRadius: 10, letterSpacing: '.05em' }}>
                        {obtained ? '✓ REQUIRED' : 'REQUIRED'}
                      </span>
                    )}
                    {!doc.required && <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>optional</span>}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cat?.color, marginBottom: 4 }}>{doc.form}</div>
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>{doc.desc}</div>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${obtained ? `${cat?.color}20` : '#F1F5F9'}`, padding: '8px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', background: obtained ? `${cat?.color}06` : '#FAFAFA' }}>
                <button onClick={() => { toggleObtained(doc.id); showToast(obtained ? 'Marked not gathered' : 'Marked gathered'); }} className="card-cta" style={{ '--cta-color': cat?.color, marginLeft: 'auto' }}>
                  {obtained ? 'Mark Not Gathered' : 'Mark Gathered'}
                </button>
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 20, padding: 14, background: '#FFFFFF', border: `1.5px solid ${theme.primary}`, borderRadius: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: theme.primary, marginBottom: 4 }}>EXPORT PCS BINDER CHECKLIST</div>
          <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 10 }}>
            Generate a printable PDF of your checklist (document names, form numbers, gathered status) to hand to the gaining S1 / civilian HR / VA along with the physical paperwork you assembled yourself. PCS Express never stores, transmits, or accepts copies of the actual documents.
          </div>
          <button onClick={exportBinder} className="card-cta card-cta--block" style={{ '--cta-color': theme.primary, background: theme.primary, color: '#FFF', border: 'none', cursor: 'pointer' }}>
            Export PCS Binder Checklist (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
