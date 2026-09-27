/**
 * Emirates ID Card Scanner & Verification
 * Handles front & back upload, preview generation, and smart OCR extraction.
 */

export interface ScannedEidData {
  name: string;
  emiratesIdNumber: string;
  companyName: string;
  dob: string;
  frontImageBase64: string;
  backImageBase64: string;
  cardExpiry?: string;
  nationality?: string;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Simulates high-accuracy neural UAE Emirates ID OCR extraction
 */
export async function simulateExtractEidData(
  frontFile: File | null,
  backFile: File | null,
  fallbackPresetIndex?: number
): Promise<Partial<ScannedEidData>> {
  // Add a slight realistic scanning delay (600ms)
  await new Promise((resolve) => setTimeout(resolve, 600));

  let frontBase64 = '';
  let backBase64 = '';

  if (frontFile) {
    frontBase64 = await fileToBase64(frontFile);
  }
  if (backFile) {
    backBase64 = await fileToBase64(backFile);
  }

  // Realistic UAE card data generation based on filenames or preset seeds
  const presets = [
    {
      name: 'Mohamed Saeed Al Mansoori',
      emiratesIdNumber: '784-1989-1384912-7',
      companyName: 'Al Barsha Star Retailers LLC',
      dob: '1989-08-24',
      cardExpiry: '2029-08-23',
      nationality: 'United Arab Emirates',
    },
    {
      name: 'Rashid Khalid Al Falasi',
      emiratesIdNumber: '784-1991-2490184-1',
      companyName: 'Gulf Horizon General Trading',
      dob: '1991-04-12',
      cardExpiry: '2028-04-11',
      nationality: 'United Arab Emirates',
    },
    {
      name: 'Tariq Abdullah Bin Zayed',
      emiratesIdNumber: '784-1985-7839201-5',
      companyName: 'Emirates Oasis Commercial Broker',
      dob: '1985-11-05',
      cardExpiry: '2027-11-04',
      nationality: 'United Arab Emirates',
    },
    {
      name: 'Sultan Salem Al Ketbi',
      emiratesIdNumber: '784-1994-5510293-8',
      companyName: 'Dubai Marina Smart Services LLC',
      dob: '1994-01-19',
      cardExpiry: '2030-01-18',
      nationality: 'United Arab Emirates',
    },
  ];

  const selected =
    fallbackPresetIndex !== undefined && presets[fallbackPresetIndex]
      ? presets[fallbackPresetIndex]
      : presets[Math.floor(Math.random() * presets.length)];

  return {
    ...selected,
    frontImageBase64: frontBase64,
    backImageBase64: backBase64,
  };
}

/**
 * Creates SVG visual placeholder of UAE Emirates ID for preview if no camera image is available
 */
export function generateEidCardPreviewSvg(type: 'front' | 'back', name?: string, eidNumber?: string): string {
  const isFront = type === 'front';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 315" width="100%" height="100%">
    <defs>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0c4a42" />
        <stop offset="60%" stop-color="#073832" />
        <stop offset="100%" stop-color="#052723" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
    </defs>
    <rect width="500" height="315" rx="18" fill="url(#cardGrad)" stroke="#10b981" stroke-width="2"/>
    <circle cx="440" cy="50" r="28" fill="#10b981" opacity="0.15" />
    <path d="M 0 100 Q 150 70 300 120 T 500 80 L 500 315 L 0 315 Z" fill="#ffffff" opacity="0.04" />

    <text x="30" y="38" fill="#10b981" font-size="11" font-weight="700" letter-spacing="1.5">UNITED ARAB EMIRATES</text>
    <text x="30" y="52" fill="#ffffff" font-size="15" font-weight="800">EMIRATES IDENTITY CARD</text>
    <text x="470" y="38" fill="#ffffff" font-size="9" text-anchor="end" opacity="0.8">FEDERAL AUTHORITY FOR IDENTITY</text>

    ${isFront ? `
      <!-- Chip -->
      <rect x="35" y="85" width="55" height="42" rx="6" fill="url(#goldGrad)" />
      <line x1="35" y1="106" x2="90" y2="106" stroke="#92400e" stroke-width="1.5" />
      <line x1="62" y1="85" x2="62" y2="127" stroke="#92400e" stroke-width="1.5" />

      <!-- Photo Frame -->
      <rect x="35" y="145" width="95" height="120" rx="8" fill="#04201c" stroke="#10b981" stroke-width="1.5" />
      <circle cx="82" cy="188" r="26" fill="#10b981" opacity="0.4" />
      <ellipse cx="82" cy="245" rx="36" ry="25" fill="#10b981" opacity="0.3" />

      <!-- Fields -->
      <text x="150" y="105" fill="#94a3b8" font-size="9" font-weight="600">ID NUMBER / رقم الهوية</text>
      <text x="150" y="125" fill="#ffffff" font-size="15" font-weight="800" letter-spacing="1">${eidNumber || '784-1988-1428591-3'}</text>

      <text x="150" y="160" fill="#94a3b8" font-size="9" font-weight="600">FULL NAME / الاسم</text>
      <text x="150" y="180" fill="#ffffff" font-size="14" font-weight="700">${name || 'Mohamed Saeed Al Mansoori'}</text>

      <text x="150" y="215" fill="#94a3b8" font-size="9" font-weight="600">NATIONALITY / الجنسية</text>
      <text x="150" y="233" fill="#ffffff" font-size="12" font-weight="600">United Arab Emirates / إماراتي</text>

      <rect x="380" y="225" width="85" height="40" rx="4" fill="#10b981" opacity="0.15" stroke="#10b981" stroke-width="1" />
      <text x="422" y="250" fill="#34d399" font-size="10" font-weight="700" text-anchor="middle">VERIFIED</text>
    ` : `
      <!-- Back View -->
      <rect x="0" y="60" width="500" height="42" fill="#021411" />
      <text x="30" y="130" fill="#94a3b8" font-size="9" font-weight="600">CARD NUMBER / رقم البطاقة</text>
      <text x="30" y="150" fill="#ffffff" font-size="13" font-weight="700">0019284729104</text>

      <text x="250" y="130" fill="#94a3b8" font-size="9" font-weight="600">EXPIRY DATE / تاريخ الانتهاء</text>
      <text x="250" y="150" fill="#ffffff" font-size="13" font-weight="700">2029-08-23</text>

      <!-- MRZ Zone -->
      <rect x="20" y="185" width="460" height="95" rx="6" fill="#021512" stroke="#134e44" stroke-width="1"/>
      <text x="35" y="215" fill="#34d399" font-family="monospace" font-size="12" letter-spacing="3">IDARE784198814285913<<<<<<<<<<<</text>
      <text x="35" y="240" fill="#34d399" font-family="monospace" font-size="12" letter-spacing="3">8808246M2908234ARE<<<<<<<<<<<9</text>
      <text x="35" y="265" fill="#34d399" font-family="monospace" font-size="12" letter-spacing="3">ALMANSOORI<<MOHAMED<SAEED<<<<<</text>
    `}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
