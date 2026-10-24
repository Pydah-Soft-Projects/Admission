/**
 * Utility to compare application fields (joinings / admissions) and detect detailed field changes.
 */

const normalizeText = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number') return String(val);
  return String(val).trim();
};

const normalizeAadhaar = (val) => {
  return normalizeText(val).replace(/[\s-]/g, '');
};

const normalizePhone = (val) => {
  return normalizeText(val).replace(/[\s\-+]/g, '').replace(/^91(?=\d{10}$)/, '');
};

export const normalizeDob = (val) => {
  const raw = normalizeText(val);
  if (!raw) return '';
  const ymd = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymd) {
    const [, year, month, day] = ymd;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }
  const dmy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }
  return raw;
};

const safeJsonParse = (val) => {
  if (!val) return {};
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
};

/**
 * Parses field changes from summary strings such as:
 * "Student details updated: Quota (CQ -> MQ), Student Name (empty -> John)"
 * or "Quota (CQ → MQ)"
 */
export const parseFieldChangesFromText = (text) => {
  if (!text || typeof text !== 'string') return [];
  const changes = [];
  const regex = /([^,:(]+?)\s*\(([^)]*?)\s*(?:->|→)\s*([^)]*?)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const field = match[1].trim();
    if (field.toLowerCase() === 'status') continue;
    let oldVal = match[2].trim();
    let newVal = match[3].trim();
    if (field.toLowerCase() === 'date of birth') {
      const normOld = normalizeDob(oldVal);
      const normNew = normalizeDob(newVal);
      if (normOld && normNew && normOld === normNew) {
        continue;
      }
      oldVal = normOld || oldVal;
      newVal = normNew || newVal;
    }
    changes.push({
      field,
      old: oldVal === 'empty' || oldVal === '—' || !oldVal ? '' : oldVal,
      new: newVal === 'empty' || newVal === '—' || !newVal ? '' : newVal,
    });
  }
  return changes;
};

/**
 * List of fields to compare between previous database row and incoming update payload.
 */
const FIELD_DEFINITIONS = [
  // Student
  {
    label: 'Student Name',
    prev: (r) => r.student_name ?? r.studentName,
    next: (p) => p.studentInfo?.name ?? p.student_name ?? p.name,
  },
  {
    label: 'Student Mobile',
    prev: (r) => r.student_phone ?? r.studentPhone,
    next: (p) => p.studentInfo?.phone ?? p.student_phone ?? p.phone,
    normalize: normalizePhone,
  },
  {
    label: 'Gender',
    prev: (r) => r.student_gender ?? r.gender,
    next: (p) => p.studentInfo?.gender ?? p.student_gender ?? p.gender,
  },
  {
    label: 'Date of Birth',
    prev: (r) => r.student_date_of_birth ?? r.dateOfBirth,
    next: (p) => p.studentInfo?.dateOfBirth ?? p.student_date_of_birth,
    normalize: normalizeDob,
    display: normalizeDob,
  },
  {
    label: 'Student Aadhaar',
    prev: (r) => r.student_aadhaar_number ?? r.studentAadhaarNumber,
    next: (p) => p.studentInfo?.aadhaarNumber ?? p.student_aadhaar_number,
    normalize: normalizeAadhaar,
  },
  {
    label: 'Student Notes',
    prev: (r) => r.student_notes,
    next: (p) => p.studentInfo?.notes ?? p.student_notes,
  },
  {
    label: 'Scholar Applicable',
    prev: (r) => {
      if (r.is_scholar_applicable !== undefined && r.is_scholar_applicable !== null) {
        return r.is_scholar_applicable === 1 || r.is_scholar_applicable === true ? 'Yes' : 'No';
      }
      const ld = safeJsonParse(r.lead_data);
      if (ld?.isScholarApplicable !== undefined) {
        return ld.isScholarApplicable ? 'Yes' : 'No';
      }
      return '';
    },
    next: (p) => {
      const val = p.studentInfo?.isScholarApplicable ?? p.isScholarApplicable ?? p.is_scholar_applicable;
      if (val !== undefined && val !== null && val !== '') {
        return val === true || val === 'true' || val === 1 ? 'Yes' : 'No';
      }
      return '';
    },
  },

  // Parents
  {
    label: 'Father Name',
    prev: (r) => r.father_name ?? r.fatherName,
    next: (p) => p.parents?.father?.name ?? p.father_name ?? p.fatherName,
  },
  {
    label: 'Father Mobile',
    prev: (r) => r.father_phone ?? r.fatherPhone,
    next: (p) => p.parents?.father?.phone ?? p.father_phone ?? p.fatherPhone,
    normalize: normalizePhone,
  },
  {
    label: 'Father Aadhaar',
    prev: (r) => r.father_aadhaar_number,
    next: (p) => p.parents?.father?.aadhaarNumber ?? p.father_aadhaar_number,
    normalize: normalizeAadhaar,
  },
  {
    label: 'Father Occupation',
    prev: (r) => r.father_occupation,
    next: (p) => p.parents?.father?.occupation ?? p.father_occupation,
  },
  {
    label: 'Mother Name',
    prev: (r) => r.mother_name ?? r.motherName,
    next: (p) => p.parents?.mother?.name ?? p.mother_name ?? p.motherName,
  },
  {
    label: 'Mother Mobile',
    prev: (r) => r.mother_phone ?? r.motherPhone,
    next: (p) => p.parents?.mother?.phone ?? p.mother_phone ?? p.motherPhone,
    normalize: normalizePhone,
  },
  {
    label: 'Mother Aadhaar',
    prev: (r) => r.mother_aadhaar_number,
    next: (p) => p.parents?.mother?.aadhaarNumber ?? p.mother_aadhaar_number,
    normalize: normalizeAadhaar,
  },
  {
    label: 'Mother Occupation',
    prev: (r) => r.mother_occupation,
    next: (p) => p.parents?.mother?.occupation ?? p.mother_occupation,
  },
  {
    label: 'Preferred Mobile',
    prev: (r) => r.preferred_mobile_number,
    next: (p) => p.preferredMobileNumber ?? p.preferred_mobile_number ?? p.studentInfo?.preferredMobileNumber,
    normalize: normalizePhone,
  },

  // Academic / Course
  {
    label: 'Course',
    prev: (r) => r.course ?? r.course_interested,
    next: (p) => p.courseInfo?.course ?? p.course ?? p.courseInterested,
  },
  {
    label: 'Branch',
    prev: (r) => r.branch,
    next: (p) => p.courseInfo?.branch ?? p.branch,
  },
  {
    label: 'Quota',
    prev: (r) => r.quota,
    next: (p) => p.courseInfo?.quota ?? p.quota,
  },

  // Reservation
  {
    label: 'Reservation Category',
    prev: (r) => r.reservation_general,
    next: (p) => p.reservation?.general ?? p.reservation_general,
  },
  {
    label: 'EWS Status',
    prev: (r) => (r.reservation_is_ews != null ? (r.reservation_is_ews ? 'Yes' : 'No') : ''),
    next: (p) =>
      p.reservation?.isEws !== undefined
        ? p.reservation.isEws
          ? 'Yes'
          : 'No'
        : p.reservation_is_ews !== undefined
          ? p.reservation_is_ews
            ? 'Yes'
            : 'No'
          : undefined,
  },

  // Address
  {
    label: 'Door / Street',
    prev: (r) => r.address_door_street,
    next: (p) => p.address?.doorStreet ?? p.address?.communication?.doorOrStreet ?? p.address_door_street,
  },
  {
    label: 'Landmark',
    prev: (r) => r.address_landmark,
    next: (p) => p.address?.landmark ?? p.address?.communication?.landmark ?? p.address_landmark,
  },
  {
    label: 'Village / City',
    prev: (r) => r.address_village_city ?? r.village,
    next: (p) => p.address?.villageCity ?? p.address?.communication?.villageOrCity ?? p.address_village_city ?? p.village,
  },
  {
    label: 'Mandal',
    prev: (r) => r.address_mandal ?? r.mandal,
    next: (p) => p.address?.mandal ?? p.address?.communication?.mandal ?? p.address_mandal ?? p.mandal,
  },
  {
    label: 'District',
    prev: (r) => r.address_district ?? r.district,
    next: (p) => p.address?.district ?? p.address?.communication?.district ?? p.address_district ?? p.district,
  },
  {
    label: 'Pin Code',
    prev: (r) => r.address_pin_code,
    next: (p) => p.address?.pinCode ?? p.address?.communication?.pinCode ?? p.address_pin_code,
  },
  {
    label: 'State',
    prev: (r) => r.address_state,
    next: (p) => p.address?.state ?? p.address?.communication?.state ?? p.address_state,
  },

  // Documents
  {
    label: 'Doc: SSC',
    prev: (r) => r.document_ssc,
    next: (p) => p.documents?.ssc ?? p.document_ssc,
  },
  {
    label: 'Doc: Intermediate',
    prev: (r) => r.document_inter,
    next: (p) => p.documents?.inter ?? p.document_inter,
  },
  {
    label: 'Doc: Transfer Certificate',
    prev: (r) => r.document_transfer_certificate,
    next: (p) => p.documents?.transferCertificate ?? p.document_transfer_certificate,
  },
  {
    label: 'Doc: Study Certificate',
    prev: (r) => r.document_study_certificate,
    next: (p) => p.documents?.studyCertificate ?? p.document_study_certificate,
  },
  {
    label: 'Doc: Aadhaar Card',
    prev: (r) => r.document_aadhaar_card,
    next: (p) => p.documents?.aadhaarCard ?? p.document_aadhaar_card,
  },
  {
    label: 'Doc: Photos',
    prev: (r) => r.document_photos,
    next: (p) => p.documents?.photos ?? p.document_photos,
  },
  {
    label: 'Doc: Caste Certificate',
    prev: (r) => r.document_caste_certificate,
    next: (p) => p.documents?.casteCertificate ?? p.document_caste_certificate,
  },
  {
    label: 'Doc: Income / EWS Certificate',
    prev: (r) => r.document_income_certificate,
    next: (p) => p.documents?.incomeCertificate ?? p.document_income_certificate,
  },
  {
    label: 'Doc: CET Rank Card',
    prev: (r) => r.document_cet_rank_card,
    next: (p) => p.documents?.cetRankCard ?? p.document_cet_rank_card,
  },
  {
    label: 'Doc: CET Hall Ticket',
    prev: (r) => r.document_cet_hall_ticket,
    next: (p) => p.documents?.cetHallTicket ?? p.document_cet_hall_ticket,
  },
  {
    label: 'Doc: Allotment Letter',
    prev: (r) => r.document_allotment_letter,
    next: (p) => p.documents?.allotmentLetter ?? p.document_allotment_letter,
  },
  {
    label: 'Doc: Joining Report',
    prev: (r) => r.document_joining_report,
    next: (p) => p.documents?.joiningReport ?? p.document_joining_report,
  },
  {
    label: 'Doc: Bank Passbook',
    prev: (r) => r.document_bank_passbook,
    next: (p) => p.documents?.bankPassbook ?? p.document_bank_passbook,
  },
  {
    label: 'Doc: Ration Card',
    prev: (r) => r.document_ration_card,
    next: (p) => p.documents?.rationCard ?? p.document_ration_card,
  },

  // Reference & Phase
  {
    label: 'Reference',
    prev: (r) => {
      const ld = safeJsonParse(r.lead_data);
      return ld.reference1 || '';
    },
    next: (p) => p.reference1 ?? safeJsonParse(p.leadData).reference1,
  },
  {
    label: 'Admission Phase',
    prev: (r) => {
      const ld = safeJsonParse(r.lead_data);
      return ld.admissionPhase ? `Phase ${ld.admissionPhase}` : '';
    },
    next: (p) => {
      const ph = p.admissionPhase ?? p.phase ?? safeJsonParse(p.leadData).admissionPhase;
      return ph ? `Phase ${ph}` : ph === '' ? '' : undefined;
    },
  },
];

/**
 * Computes the list of differences between a previous row and incoming payload.
 * Returns Array<{ field: string, old: string, new: string }>
 */
export const computeApplicationFieldChanges = (previousRow, nextPayload) => {
  if (!previousRow || !nextPayload) return [];
  const changes = [];

  for (const def of FIELD_DEFINITIONS) {
    const rawNext = def.next(nextPayload);
    if (rawNext === undefined) continue;

    const rawPrev = def.prev(previousRow);
    const norm = def.normalize || normalizeText;

    const normPrev = norm(rawPrev);
    const normNext = norm(rawNext);

    if (normPrev !== normNext) {
      const displayFn = def.display || normalizeText;
      changes.push({
        field: def.label,
        old: displayFn(rawPrev) || '—',
        new: displayFn(rawNext) || '—',
      });
    }
  }

  // Also check Step 2 certificate checklist differences if present in registrationFormData
  const prevLeadData = safeJsonParse(previousRow.lead_data);
  const prevCertChecklist =
    prevLeadData?._joiningRegistrationExtras?.certificate_checklist || {};
  const nextCertChecklist =
    nextPayload.registrationFormData?.certificate_checklist ||
    nextPayload._joiningRegistrationExtras?.certificate_checklist;

  if (nextCertChecklist && typeof nextCertChecklist === 'object') {
    const allCertKeys = new Set([
      ...Object.keys(prevCertChecklist),
      ...Object.keys(nextCertChecklist),
    ]);
    for (const key of allCertKeys) {
      const prevVal = prevCertChecklist[key];
      const nextVal = nextCertChecklist[key];

      const prevStatus =
        typeof prevVal === 'object' && prevVal?.status
          ? prevVal.status
          : String(prevVal || 'pending');
      const nextStatus =
        typeof nextVal === 'object' && nextVal?.status
          ? nextVal.status
          : String(nextVal || 'pending');

      const prevOpt = typeof prevVal === 'object' ? prevVal?.option || '' : '';
      const nextOpt = typeof nextVal === 'object' ? nextVal?.option || '' : '';

      const prevDisplay = `${prevStatus}${prevOpt ? ` (${prevOpt})` : ''}`;
      const nextDisplay = `${nextStatus}${nextOpt ? ` (${nextOpt})` : ''}`;

      if (prevDisplay !== nextDisplay) {
        changes.push({
          field: `Certificate: ${key}`,
          old: prevDisplay,
          new: nextDisplay,
        });
      }
    }
  }

  return changes;
};

/**
 * Format a human-readable summary string of changes.
 */
export const formatFieldChangesSummary = (changes) => {
  if (!Array.isArray(changes) || changes.length === 0) return '';
  return changes
    .map((c) => `${c.field} (${c.old || 'empty'} → ${c.new || 'empty'})`)
    .join(', ');
};
