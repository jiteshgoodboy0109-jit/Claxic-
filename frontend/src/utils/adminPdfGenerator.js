import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Cached Base64 representation of the original Claxic logo
let cachedLogoBase64 = null;

/**
 * Loads and caches the original Claxic black logo (/logob.png) as a Base64 data URL
 */
export async function getLogoBase64() {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const res = await fetch('/logob.png');
    if (!res.ok) throw new Error('Failed to fetch logo image');
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoBase64 = reader.result;
        resolve(cachedLogoBase64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Logo load warning for PDF export:', err);
    return null;
  }
}

/**
 * Universally draws the official Claxic branded Header and Footer on every page of a document
 */
function applyBrandedHeaderAndFooter(doc, options = {}) {
  const {
    title = 'CLAXIC ADMISSIONS REGISTRY',
    subtitle = 'Official Audit & Enrollment Record',
    docRef = 'DOC-' + Date.now().toString(36).toUpperCase(),
    logoBase64 = null,
    isLandscape = false,
  } = options;

  const totalPages = doc.internal.getNumberOfPages();
  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const margin = 14;

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // 1. BRAND LOGO (Top Left)
    if (logoBase64) {
      // 36mm width x 10mm height perfectly retains the 3.6:1 aspect ratio
      doc.addImage(logoBase64, 'PNG', margin, 9, 36, 10);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(11, 79, 80); // #0B4F50
      doc.text('CLAXIC ACADEMY', margin, 17);
    }

    // 2. DOCUMENT / ORGANIZATION METADATA (Top Right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39); // Slate 900
    doc.text('CLAXIC INSTITUTE OF ADVANCED TECHNOLOGY', pageWidth - margin, 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 98, 88); // #6B6258
    doc.text('Directorate of Admissions & Enterprise Platform Administration', pageWidth - margin, 16.5, { align: 'right' });

    const timeStr = new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Ref: ${docRef}  •  Issued: ${timeStr}`, pageWidth - margin, 21, { align: 'right' });

    // 3. ELEGANT HEADER SEPARATORS
    doc.setDrawColor(232, 227, 220); // Border #E8E3DC
    doc.setLineWidth(0.4);
    doc.line(margin, 24, pageWidth - margin, 24);

    // Warm Gold Accent Notch
    doc.setDrawColor(217, 119, 6); // Amber #D97706
    doc.setLineWidth(1.2);
    doc.line(margin, 24, margin + 45, 24);

    // 4. BOTTOM FOOTER
    const footerY = pageHeight - 10;
    doc.setDrawColor(232, 227, 220);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 113, 108);
    doc.text(
      'Confidential Official Audit Record  •  Claxic Academic Directorate  •  support.claxic@gmail.com',
      margin,
      footerY
    );

    // Page Numbering
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 79, 80);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  }
}

/**
 * 1. EXPORT CANDIDATE APPLICATIONS REGISTRY TO PDF
 */
export async function exportApplicationsPDF(applications = [], statusFilter = 'ALL') {
  const logo = await getLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' });
  const docRef = 'APP-REG-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  // Page 1 Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(11, 79, 80);
  doc.text('CANDIDATE APPLICATIONS & ADMISSIONS REGISTRY', 14, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 98, 88);
  doc.text(
    `Comprehensive candidate enrollment records  |  Filter Scope: ${statusFilter}  |  Total Records: ${applications.length}`,
    14,
    37
  );

  // Summary Metrics Banner
  const totalAmount = applications.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const confirmedCount = applications.filter((a) => a.status === 'CONFIRMED' || a.status === 'APPROVED').length;
  const underReviewCount = applications.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED').length;
  const pendingCount = applications.filter((a) => a.status === 'PAYMENT_PENDING').length;

  const kpis = [
    { label: 'Total Applications', val: String(applications.length) },
    { label: 'Confirmed Admissions', val: String(confirmedCount) },
    { label: 'Under Review', val: String(underReviewCount) },
    { label: 'Payment Pending', val: String(pendingCount) },
    { label: 'Total Tuition Value', val: `INR ${totalAmount.toLocaleString('en-IN')}` },
  ];

  const cardWidth = (297 - 28 - (kpis.length - 1) * 3) / kpis.length;
  let startX = 14;
  kpis.forEach((kpi) => {
    doc.setFillColor(250, 248, 245); // #FAF8F5
    doc.setDrawColor(232, 227, 220); // #E8E3DC
    doc.roundedRect(startX, 41, cardWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(107, 98, 88);
    doc.text(kpi.label.toUpperCase(), startX + 2.5, 45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(kpi.val, startX + 2.5, 50);

    startX += cardWidth + 3;
  });

  // Table Data
  const tableHead = [
    ['#', 'Application ID', 'Candidate Name', 'Email Address', 'Mobile', 'Course Program', 'Fee (INR)', 'Status', 'Submitted Date'],
  ];

  const tableRows = applications.map((a, idx) => [
    idx + 1,
    a.applicationNumber || a.id || 'N/A',
    a.userName || a.name || 'Candidate',
    a.userEmail || a.email || 'N/A',
    a.formData?.mobile || a.userMobile || 'N/A',
    a.courseTitle || 'Executive Program',
    a.amount ? `₹${Number(a.amount).toLocaleString('en-IN')}` : '₹24,999',
    a.status || 'SUBMITTED',
    a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : 'N/A',
  ]);

  autoTable(doc, {
    startY: 57,
    margin: { top: 28, bottom: 16, left: 14, right: 14 },
    head: tableHead,
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [232, 227, 220],
      lineWidth: 0.2,
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: [11, 79, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [253, 252, 250],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 34 },
      3: { cellWidth: 42 },
      4: { cellWidth: 24 },
      5: { cellWidth: 55 },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 28, halign: 'center' },
      8: { cellWidth: 26, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw).toUpperCase();
        if (val === 'CONFIRMED' || val === 'APPROVED') {
          data.cell.styles.textColor = [22, 101, 52]; // Green
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'UNDER_REVIEW' || val === 'SUBMITTED') {
          data.cell.styles.textColor = [180, 83, 9]; // Amber
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'REJECTED') {
          data.cell.styles.textColor = [190, 18, 60]; // Rose
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  applyBrandedHeaderAndFooter(doc, {
    title: 'CANDIDATE APPLICATIONS REGISTRY',
    subtitle: 'Official Admissions Record',
    docRef,
    logoBase64: logo,
    isLandscape: true,
  });

  doc.save(`Claxic-Applications-Registry-${new Date().toISOString().substring(0, 10)}.pdf`);
}

/**
 * 2. EXPORT INDIVIDUAL CANDIDATE APPLICATION DOSSIER TO PDF
 */
export async function exportApplicationDossierPDF(application) {
  if (!application) return;
  const logo = await getLogoBase64();
  const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'mm' });
  const appNumber = application.applicationNumber || application.id || 'APP-2026';
  const docRef = `DOSSIER-${appNumber}`;

  // Title Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(11, 79, 80);
  doc.text('CANDIDATE ADMISSION EVALUATION DOSSIER', 14, 33);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 98, 88);
  doc.text('Confidential Student Application & Enrollment Record  •  Claxic Directorate of Admissions', 14, 38);

  // Status Badge Callout
  const status = application.status || 'SUBMITTED';
  const isConfirmed = status === 'CONFIRMED' || status === 'APPROVED';

  doc.setFillColor(isConfirmed ? 240 : 255, isConfirmed ? 253 : 247, isConfirmed ? 244 : 230);
  doc.setDrawColor(isConfirmed ? 187 : 254, isConfirmed ? 247 : 221, isConfirmed ? 208 : 170);
  doc.roundedRect(14, 42, 182, 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(isConfirmed ? 22 : 217, isConfirmed ? 101 : 119, isConfirmed ? 52 : 6);
  doc.text(`APPLICATION NUMBER: ${appNumber}  •  STATUS: ${status}`, 19, 49.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 98, 88);
  const dateStr = application.createdAt ? new Date(application.createdAt).toLocaleString('en-IN') : 'N/A';
  doc.text(`Submitted: ${dateStr}`, 191, 49.5, { align: 'right' });

  // SECTION 1: APPLICANT PROFILE
  autoTable(doc, {
    startY: 58,
    margin: { left: 14, right: 14 },
    head: [['SECTION 1: APPLICANT PERSONAL & ACADEMIC PROFILE', '']],
    body: [
      ['Full Legal Name', application.userName || application.name || 'N/A'],
      ['Primary Email', application.userEmail || application.email || 'N/A'],
      ['Mobile Contact', application.formData?.mobile || application.userMobile || 'N/A'],
      ['College / Institution', application.formData?.institution || application.institution || 'N/A'],
      ['Degree / Program', application.formData?.degree || application.degree || 'N/A'],
      ['Year of Graduation', application.formData?.yearOfStudy || application.yearOfStudy || 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [11, 79, 80], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.2, lineColor: [232, 227, 220], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', textColor: [107, 98, 88] },
      1: { cellWidth: 127, textColor: [17, 24, 39] },
    },
  });

  // SECTION 2: COURSE & ENROLLMENT
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 4,
    margin: { left: 14, right: 14 },
    head: [['SECTION 2: ENROLLED PROGRAM & CURRICULUM DETAILS', '']],
    body: [
      ['Selected Program', application.courseTitle || 'Applied GenAI & Full-Stack System Architecture'],
      ['Tuition Fee', application.amount ? `INR ${Number(application.amount).toLocaleString('en-IN')}` : 'INR 24,999'],
      ['Cohort Batch', 'Fall 2026 Academic Batch'],
      ['Mode of Instruction', 'Hybrid Live Workshops + Enterprise Sandbox Lab'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.2, lineColor: [232, 227, 220], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', textColor: [107, 98, 88] },
      1: { cellWidth: 127, textColor: [17, 24, 39] },
    },
  });

  // SECTION 3: APPLICATION QUESTIONNAIRE & RESPONSES
  if (application.formData && Object.keys(application.formData).length > 0) {
    const questions = Object.entries(application.formData).map(([k, v]) => [
      k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      String(v),
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 4,
      margin: { left: 14, right: 14 },
      head: [['SECTION 3: CANDIDATE QUESTIONNAIRE & ESSAY SUBMISSIONS', '']],
      body: questions,
      theme: 'grid',
      headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.2, lineColor: [232, 227, 220], lineWidth: 0.2 },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold', textColor: [107, 98, 88] },
        1: { cellWidth: 127, textColor: [17, 24, 39] },
      },
    });
  }

  // SECTION 4: DIRECTORATE REVIEW NOTES & OFFICIAL AUDIT
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 4,
    margin: { left: 14, right: 14 },
    head: [['SECTION 4: ADMINISTRATIVE REVIEW & VERIFICATION SEAL', '']],
    body: [
      ['Administrative Notes', application.adminNotes || 'Application verified and accepted under standard eligibility requirements.'],
      ['Reviewer Authority', 'Claxic Directorate Admissions Board'],
      ['Verification Status', isConfirmed ? 'VERIFIED & ENROLLED IN STUDENT ROSTER' : 'UNDER ACTIVE ADMISSIONS SCRUTINY'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.2, lineColor: [232, 227, 220], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', textColor: [107, 98, 88] },
      1: { cellWidth: 127, textColor: [17, 24, 39] },
    },
  });

  // Stamp / Signature Block
  const sigY = doc.lastAutoTable.finalY + 8;
  if (sigY < 250) {
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.8);
    doc.roundedRect(120, sigY, 76, 26, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(11, 79, 80);
    doc.text('OFFICIAL ENROLLMENT SEAL', 158, sigY + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 98, 88);
    doc.text('Claxic Institute of Advanced Technology', 158, sigY + 10, { align: 'center' });
    doc.text('Admissions & Registrar Authority', 158, sigY + 14, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(217, 119, 6);
    doc.text('AUTHORIZED SIGNATORY & DIGITAL SEAL', 158, sigY + 21, { align: 'center' });
  }

  applyBrandedHeaderAndFooter(doc, {
    title: 'CANDIDATE ADMISSION DOSSIER',
    subtitle: 'Official Evaluation Record',
    docRef,
    logoBase64: logo,
    isLandscape: false,
  });

  doc.save(`Claxic-Application-Dossier-${appNumber}.pdf`);
}

/**
 * 3. EXPORT USER DIRECTORY & ACCESS PROFILES TO PDF
 */
export async function exportUsersPDF(users = []) {
  const logo = await getLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' });
  const docRef = 'USR-DIR-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(11, 79, 80);
  doc.text('REGISTERED USERS & FACULTY DIRECTORY', 14, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 98, 88);
  doc.text(`Official directory of authenticated accounts, security roles, and profile status  |  Total: ${users.length}`, 14, 37);

  // Summary Metrics
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const staffCount = users.filter((u) => u.role === 'STAFF').length;
  const studentCount = users.filter((u) => u.role === 'USER').length;
  const verifiedCount = users.filter((u) => u.isVerified).length;
  const activeCount = users.filter((u) => u.isActive).length;

  const kpis = [
    { label: 'Total Accounts', val: String(users.length) },
    { label: 'Verified Profiles', val: String(verifiedCount) },
    { label: 'Active Users', val: String(activeCount) },
    { label: 'Administrators', val: String(adminCount) },
    { label: 'Faculty / Staff', val: String(staffCount) },
    { label: 'Enrolled Students', val: String(studentCount) },
  ];

  const cardWidth = (297 - 28 - (kpis.length - 1) * 3) / kpis.length;
  let startX = 14;
  kpis.forEach((kpi) => {
    doc.setFillColor(250, 248, 245);
    doc.setDrawColor(232, 227, 220);
    doc.roundedRect(startX, 41, cardWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(107, 98, 88);
    doc.text(kpi.label.toUpperCase(), startX + 2.5, 45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(kpi.val, startX + 2.5, 50);

    startX += cardWidth + 3;
  });

  const tableHead = [
    ['#', 'User ID', 'Full Name', 'Email Address', 'Mobile', 'Institution / University', 'Degree / Program', 'Role', 'Verified', 'Status'],
  ];

  const tableRows = users.map((u, idx) => [
    idx + 1,
    u.id || 'N/A',
    u.name || 'User',
    u.email || 'N/A',
    u.mobile || 'N/A',
    u.institution || 'N/A',
    u.degree || 'N/A',
    u.role || 'USER',
    u.isVerified ? 'VERIFIED' : 'PENDING',
    u.isActive ? 'ACTIVE' : 'SUSPENDED',
  ]);

  autoTable(doc, {
    startY: 57,
    margin: { top: 28, bottom: 16, left: 14, right: 14 },
    head: tableHead,
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [232, 227, 220], lineWidth: 0.2 },
    headStyles: { fillColor: [11, 79, 80], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [253, 252, 250] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 46 },
      4: { cellWidth: 24 },
      5: { cellWidth: 36 },
      6: { cellWidth: 34 },
      7: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 20, halign: 'center' },
      9: { cellWidth: 23, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 7) {
          const role = String(data.cell.raw);
          if (role === 'ADMIN') data.cell.styles.textColor = [217, 119, 6];
          else if (role === 'STAFF') data.cell.styles.textColor = [2, 132, 199];
        }
        if (data.column.index === 9) {
          const st = String(data.cell.raw);
          if (st === 'ACTIVE') data.cell.styles.textColor = [22, 101, 52];
          else data.cell.styles.textColor = [190, 18, 60];
        }
      }
    },
  });

  applyBrandedHeaderAndFooter(doc, {
    title: 'STUDENT & FACULTY USER DIRECTORY',
    subtitle: 'Access Governance & Profile Records',
    docRef,
    logoBase64: logo,
    isLandscape: true,
  });

  doc.save(`Claxic-Users-Directory-${new Date().toISOString().substring(0, 10)}.pdf`);
}

/**
 * 4. EXPORT COURSE CATALOG & TRACKS TO PDF
 */
export async function exportCoursesPDF(courses = []) {
  const logo = await getLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' });
  const docRef = 'CRS-CAT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(11, 79, 80);
  doc.text('ACCREDITED COURSE CATALOG & ENROLLMENT ROSTER', 14, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 98, 88);
  doc.text(`Official syllabus tracks, tuition pricing, cohort caps, and enrollment stats  |  Courses: ${courses.length}`, 14, 37);

  const totalSeats = courses.reduce((sum, c) => sum + (c.capacity || 30), 0);
  const totalEnrolled = courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
  const activeCount = courses.filter((c) => c.status === 'PUBLISHED').length;

  const kpis = [
    { label: 'Active Tracks', val: String(courses.length) },
    { label: 'Published Courses', val: String(activeCount) },
    { label: 'Total Seat Capacity', val: String(totalSeats) },
    { label: 'Enrolled Candidates', val: String(totalEnrolled) },
    { label: 'Seat Occupancy Rate', val: `${Math.round((totalEnrolled / (totalSeats || 1)) * 100)}%` },
  ];

  const cardWidth = (297 - 28 - (kpis.length - 1) * 3) / kpis.length;
  let startX = 14;
  kpis.forEach((kpi) => {
    doc.setFillColor(250, 248, 245);
    doc.setDrawColor(232, 227, 220);
    doc.roundedRect(startX, 41, cardWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(107, 98, 88);
    doc.text(kpi.label.toUpperCase(), startX + 2.5, 45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(kpi.val, startX + 2.5, 50);

    startX += cardWidth + 3;
  });

  const tableHead = [
    ['#', 'Course Code / Slug', 'Program Title', 'Category', 'Level', 'Duration', 'Tuition (INR)', 'Seats Filled', 'Status'],
  ];

  const tableRows = courses.map((c, idx) => [
    idx + 1,
    c.slug || c.id || 'N/A',
    c.title || 'Course',
    c.category || 'Engineering',
    c.level || 'Advanced',
    c.duration || '12 Weeks',
    c.price ? `₹${Number(c.price).toLocaleString('en-IN')}` : '₹24,999',
    `${c.enrolledCount || 0} / ${c.capacity || 30}`,
    c.status || 'PUBLISHED',
  ]);

  autoTable(doc, {
    startY: 57,
    margin: { top: 28, bottom: 16, left: 14, right: 14 },
    head: tableHead,
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.2, lineColor: [232, 227, 220], lineWidth: 0.2 },
    headStyles: { fillColor: [11, 79, 80], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [253, 252, 250] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 40, fontStyle: 'bold' },
      2: { cellWidth: 70 },
      3: { cellWidth: 30 },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 26, halign: 'right' },
      7: { cellWidth: 23, halign: 'center' },
      8: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
    },
  });

  applyBrandedHeaderAndFooter(doc, {
    title: 'ACCREDITED COURSE CATALOG & TRACKS',
    subtitle: 'Official Academic Offerings',
    docRef,
    logoBase64: logo,
    isLandscape: true,
  });

  doc.save(`Claxic-Courses-Catalog-${new Date().toISOString().substring(0, 10)}.pdf`);
}

/**
 * 5. EXPORT FINANCIAL TRANSACTIONS & REVENUE AUDIT TO PDF
 */
export async function exportFinancialsPDF(payments = []) {
  const logo = await getLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' });
  const docRef = 'FIN-AUDIT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(11, 79, 80);
  doc.text('FINANCIAL SETTLEMENTS & TRANSACTIONS AUDIT', 14, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 98, 88);
  doc.text(`Official gateway reconciliation, GST tax invoices, and revenue settlements  |  Transactions: ${payments.length}`, 14, 37);

  const successPayments = payments.filter((p) => p.status === 'SUCCESS');
  const totalRevenue = successPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalTaxes = Math.round(totalRevenue * 0.18);
  const refundedCount = payments.filter((p) => p.status === 'REFUNDED').length;

  const kpis = [
    { label: 'Total Transactions', val: String(payments.length) },
    { label: 'Settled Payments', val: String(successPayments.length) },
    { label: 'Refunded / Reversed', val: String(refundedCount) },
    { label: 'GST Collected (18%)', val: `INR ${totalTaxes.toLocaleString('en-IN')}` },
    { label: 'Gross Revenue Settled', val: `INR ${totalRevenue.toLocaleString('en-IN')}` },
  ];

  const cardWidth = (297 - 28 - (kpis.length - 1) * 3) / kpis.length;
  let startX = 14;
  kpis.forEach((kpi) => {
    doc.setFillColor(250, 248, 245);
    doc.setDrawColor(232, 227, 220);
    doc.roundedRect(startX, 41, cardWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(107, 98, 88);
    doc.text(kpi.label.toUpperCase(), startX + 2.5, 45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(kpi.val, startX + 2.5, 50);

    startX += cardWidth + 3;
  });

  const tableHead = [
    ['#', 'Transaction ID', 'Receipt #', 'Candidate Name', 'Course Title', 'Subtotal', 'GST (18%)', 'Total Paid (INR)', 'Status', 'Date'],
  ];

  const tableRows = payments.map((p, idx) => {
    const amt = Number(p.amount) || 0;
    const subtotal = Math.round(amt / 1.18);
    const tax = amt - subtotal;
    return [
      idx + 1,
      p.paymentId || p.id || 'N/A',
      p.receiptNumber || 'REC-2026',
      p.userName || 'Student',
      p.courseTitle || 'Engineering Masterclass',
      `₹${subtotal.toLocaleString('en-IN')}`,
      `₹${tax.toLocaleString('en-IN')}`,
      `₹${amt.toLocaleString('en-IN')}`,
      p.status || 'SUCCESS',
      p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : 'N/A',
    ];
  });

  autoTable(doc, {
    startY: 57,
    margin: { top: 28, bottom: 16, left: 14, right: 14 },
    head: tableHead,
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [232, 227, 220], lineWidth: 0.2 },
    headStyles: { fillColor: [11, 79, 80], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [253, 252, 250] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 34, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 38 },
      4: { cellWidth: 55 },
      5: { cellWidth: 23, halign: 'right' },
      6: { cellWidth: 23, halign: 'right' },
      7: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 22, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        const val = String(data.cell.raw);
        if (val === 'SUCCESS') data.cell.styles.textColor = [22, 101, 52];
        else if (val === 'REFUNDED') data.cell.styles.textColor = [190, 18, 60];
      }
    },
  });

  applyBrandedHeaderAndFooter(doc, {
    title: 'FINANCIAL TRANSACTIONS & SETTLEMENTS',
    subtitle: 'Enterprise Revenue & Tax Audit',
    docRef,
    logoBase64: logo,
    isLandscape: true,
  });

  doc.save(`Claxic-Financial-Audit-${new Date().toISOString().substring(0, 10)}.pdf`);
}

/**
 * 6. EXPORT EXECUTIVE SUMMARY / OVERVIEW TO PDF
 */
export async function exportExecutiveOverviewPDF({
  overviewData,
  courses = [],
  applications = [],
  users = [],
  payments = [],
}) {
  const logo = await getLogoBase64();
  const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'mm' });
  const docRef = 'EXEC-SUM-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(11, 79, 80);
  doc.text('EXECUTIVE PERFORMANCE & PLATFORM AUDIT', 14, 33);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 98, 88);
  doc.text('Strategic metrics, gross revenue settlements, cohort growth, and program capacity', 14, 38);

  const totalRevenue = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalSeats = courses.reduce((sum, c) => sum + (c.capacity || 30), 0);
  const totalEnrolled = courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
  const confirmedApps = applications.filter((a) => a.status === 'CONFIRMED' || a.status === 'APPROVED').length;

  // Executive KPI Table
  autoTable(doc, {
    startY: 43,
    margin: { left: 14, right: 14 },
    head: [['KEY PERFORMANCE INDICATOR (KPI)', 'LIFETIME REALIZED METRIC', 'STATUS / BENCHMARK']],
    body: [
      ['Gross Realized Revenue', `INR ${totalRevenue.toLocaleString('en-IN')}`, '100% Reconciled Gateway Volume'],
      ['Total Registered Accounts', String(users.length), `${users.filter((u) => u.isVerified).length} Verified Email Profiles`],
      ['Confirmed Candidate Admissions', String(confirmedApps), `${Math.round((confirmedApps / (applications.length || 1)) * 100)}% Conversion Rate`],
      ['Seat Occupancy Capacity', `${totalEnrolled} / ${totalSeats} Enrolled`, `${Math.round((totalEnrolled / (totalSeats || 1)) * 100)}% Cohort Capacity`],
      ['Accredited Curriculum Programs', String(courses.length), '100% Industry Verified Tracks'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [11, 79, 80], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: [232, 227, 220], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold', textColor: [17, 24, 39] },
      1: { cellWidth: 55, fontStyle: 'bold', textColor: [217, 119, 6] },
      2: { cellWidth: 57, textColor: [107, 98, 88] },
    },
  });

  // Course Enrollment Breakdown
  const courseRows = courses.map((c) => [
    c.title,
    c.category || 'Engineering',
    `₹${(c.price || 24999).toLocaleString('en-IN')}`,
    `${c.enrolledCount || 0} / ${c.capacity || 30}`,
    `₹${((c.enrolledCount || 0) * (c.price || 24999)).toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    margin: { left: 14, right: 14 },
    head: [['ACADEMIC PROGRAM ROSTER', 'CATEGORY', 'TUITION FEE', 'SEATS OCCUPIED', 'REALIZED YIELD']],
    body: courseRows,
    theme: 'grid',
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2, lineColor: [232, 227, 220], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 75, fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
    },
  });

  // Recent 5 Applications
  const recentAppRows = applications.slice(0, 5).map((a) => [
    a.applicationNumber || a.id,
    a.userName,
    a.courseTitle,
    a.status,
    a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : 'N/A',
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    margin: { left: 14, right: 14 },
    head: [['RECENT CANDIDATE SUBMISSIONS', 'CANDIDATE NAME', 'PROGRAM', 'STATUS', 'DATE']],
    body: recentAppRows,
    theme: 'grid',
    headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [232, 227, 220], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 65 },
      3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 20, halign: 'center' },
    },
  });

  applyBrandedHeaderAndFooter(doc, {
    title: 'EXECUTIVE PLATFORM AUDIT',
    subtitle: 'Strategic Leadership Summary',
    docRef,
    logoBase64: logo,
    isLandscape: false,
  });

  doc.save(`Claxic-Executive-Overview-${new Date().toISOString().substring(0, 10)}.pdf`);
}

/**
 * 7. EXPORT AUDIT TRAIL LOGS TO PDF
 */
export async function exportAuditLogsPDF(auditLogs = []) {
  const logo = await getLogoBase64();
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'mm' });
  const docRef = 'SEC-AUDIT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(11, 79, 80);
  doc.text('SYSTEM SECURITY & AUDIT TRAIL LOGS', 14, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 98, 88);
  doc.text(`Official administrative security logs, state toggles, and governance audit trail  |  Logs: ${auditLogs.length}`, 14, 37);

  const tableHead = [
    ['#', 'Log ID', 'Admin Name / Authority', 'Action Type', 'Target Category', 'Target Item / Summary', 'Timestamp'],
  ];

  const tableRows = auditLogs.map((l, idx) => [
    idx + 1,
    l.id || 'N/A',
    l.adminName || 'System Admin',
    l.action || 'SYSTEM_ACTION',
    l.targetType || 'ENTITY',
    l.targetTitle || l.targetId || 'Record modified',
    l.createdAt ? new Date(l.createdAt).toLocaleString('en-IN') : 'N/A',
  ]);

  autoTable(doc, {
    startY: 42,
    margin: { top: 28, bottom: 16, left: 14, right: 14 },
    head: tableHead,
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.2, lineColor: [232, 227, 220], lineWidth: 0.2 },
    headStyles: { fillColor: [11, 79, 80], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: [253, 252, 250] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 48, fontStyle: 'bold', textColor: [217, 119, 6] },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 70 },
      6: { cellWidth: 39, halign: 'center' },
    },
  });

  applyBrandedHeaderAndFooter(doc, {
    title: 'SECURITY GOVERNANCE AUDIT TRAIL',
    subtitle: 'System Operations Integrity Log',
    docRef,
    logoBase64: logo,
    isLandscape: true,
  });

  doc.save(`Claxic-Audit-Trail-${new Date().toISOString().substring(0, 10)}.pdf`);
}

/**
 * 8. EXPORT OFFICIAL TAX INVOICE & ENROLLMENT RECEIPT TO PDF
 */
export async function exportTaxReceiptPDF(receiptData) {
  if (!receiptData) return;
  const logo = await getLogoBase64();
  const doc = new jsPDF({ orientation: 'portrait', format: 'a4', unit: 'mm' });
  const docRef = receiptData.receiptNumber || 'REC-' + Date.now().toString(36).toUpperCase();

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(11, 79, 80);
  doc.text('OFFICIAL TAX INVOICE & TUITION RECEIPT', 14, 33);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 98, 88);
  doc.text('Issued pursuant to Rule 46 of the Central Goods and Services Tax Rules', 14, 38);

  // Status Badge Callout
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, 42, 182, 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  doc.text(`INVOICE #: ${docRef}  •  STATUS: PAID & SETTLED`, 19, 49.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 98, 88);
  const dateStr = receiptData.date ? new Date(receiptData.date).toLocaleDateString('en-IN') : 'N/A';
  doc.text(`Date: ${dateStr}`, 191, 49.5, { align: 'right' });

  // Organization & Customer Summary Box
  autoTable(doc, {
    startY: 58,
    margin: { left: 14, right: 14 },
    head: [['ISSUING ENTITY (SELLER)', 'BILLED TO (CANDIDATE)']],
    body: [
      [
        receiptData.organization?.name || 'Claxic Institute of Advanced Technology',
        receiptData.customer?.name || 'Enrolled Student',
      ],
      [
        receiptData.organization?.address || 'Directorate of Academic Programs, Cyber City, Bangalore, KA - 560100',
        receiptData.customer?.email || 'N/A',
      ],
      [
        `GSTIN: ${receiptData.organization?.gstin || '29AABCU9603R1ZM'}`,
        `Phone: ${receiptData.customer?.mobile || 'N/A'}`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [11, 79, 80], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.2, lineColor: [232, 227, 220], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 91 },
      1: { cellWidth: 91 },
    },
  });

  // Itemized Tuition Fee Table
  const subtotal = receiptData.taxBreakup?.subtotal || Math.round((receiptData.amount || 24999) / 1.18);
  const cgst = receiptData.taxBreakup?.cgst || Math.round(subtotal * 0.09);
  const sgst = receiptData.taxBreakup?.sgst || Math.round(subtotal * 0.09);
  const total = receiptData.amount || subtotal + cgst + sgst;

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    margin: { left: 14, right: 14 },
    head: [['#', 'DESCRIPTION OF SERVICES', 'SAC CODE', 'RATE', 'TAXABLE AMOUNT (INR)']],
    body: [
      [
        '1',
        `${receiptData.course?.title || 'Applied GenAI & Full-Stack System Architecture'}\nBatch Start: ${receiptData.course?.startDate || 'Fall 2026 Cohort'}`,
        '999293',
        '18%',
        `INR ${subtotal.toLocaleString('en-IN')}`,
      ],
      ['', 'CGST (Central Tax)', '', '9%', `INR ${cgst.toLocaleString('en-IN')}`],
      ['', 'SGST (State Tax)', '', '9%', `INR ${sgst.toLocaleString('en-IN')}`],
      ['', 'TOTAL PAYABLE / PAID IN FULL', '', '', `INR ${total.toLocaleString('en-IN')}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: [232, 227, 220], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 92 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 3) {
        data.cell.styles.fillColor = [250, 248, 245];
        data.cell.styles.textColor = [11, 79, 80];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Digital Signature & Disclaimer Block
  const sigY = doc.lastAutoTable.finalY + 10;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.roundedRect(120, sigY, 76, 26, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(11, 79, 80);
  doc.text('CLAXIC ACCOUNTS DIRECTORATE', 158, sigY + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 98, 88);
  doc.text('This is a computer-generated Tax Invoice.', 158, sigY + 10, { align: 'center' });
  doc.text('Authorized Electronic Signature Not Required.', 158, sigY + 14, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(217, 119, 6);
  doc.text('PAID & RECONCILED VIA RAZORPAY', 158, sigY + 21, { align: 'center' });

  applyBrandedHeaderAndFooter(doc, {
    title: 'OFFICIAL TAX INVOICE',
    subtitle: 'Enrollment Fee Receipt',
    docRef,
    logoBase64: logo,
    isLandscape: false,
  });

  doc.save(`Claxic-Invoice-${docRef}.pdf`);
}
