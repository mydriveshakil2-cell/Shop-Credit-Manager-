import React, { useState, useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  Scan,
  Sparkles,
  FileCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  simulateExtractEidData,
  ScannedEidData,
  generateEidCardPreviewSvg,
} from '../utils/eidScanner';
import { SAMPLE_EID_PRESETS, formatEmiratesId } from '../utils/uaeValidation';

interface EidUploaderProps {
  onScanComplete: (data: Partial<ScannedEidData>, isExistingUser?: boolean) => void;
  isCustomerMode?: boolean;
  onExistingCustomerFound?: (existingCustomerId: string) => void;
  frontImagePreview: string | null;
  backImagePreview: string | null;
  setFrontImagePreview: (val: string) => void;
  setBackImagePreview: (val: string) => void;
}

export const EidUploader: React.FC<EidUploaderProps> = ({
  onScanComplete,
  isCustomerMode = false,
  frontImagePreview,
  backImagePreview,
  setFrontImagePreview,
  setBackImagePreview,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setFrontImagePreview(b64);
      triggerAutoScan(file, null, b64, backImagePreview);
    };
    reader.readAsDataURL(file);
  };

  const handleBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setBackImagePreview(b64);
      triggerAutoScan(null, file, frontImagePreview, b64);
    };
    reader.readAsDataURL(file);
  };

  const triggerAutoScan = async (
    frontFile: File | null,
    backFile: File | null,
    frontB64: string | null,
    backB64: string | null
  ) => {
    setIsScanning(true);
    setScanStatus('Scanning Emirates ID & extracting OCR fields...');
    try {
      const extracted = await simulateExtractEidData(frontFile, backFile);
      setScanStatus('Verification successful! Auto-filling details...');
      setTimeout(() => {
        onScanComplete({
          ...extracted,
          frontImageBase64: frontB64 || extracted.frontImageBase64,
          backImageBase64: backB64 || extracted.backImageBase64,
        });
        setIsScanning(false);
        setScanStatus(null);
      }, 500);
    } catch {
      setIsScanning(false);
      setScanStatus(null);
    }
  };

  // Instant 1-click test with UAE preset Emirates ID card
  const handleUsePreset = (presetIndex: number) => {
    const preset = SAMPLE_EID_PRESETS[presetIndex];
    setIsScanning(true);
    setScanStatus(`Extracting UAE Emirates ID for ${preset.name}...`);

    const frontSvg = generateEidCardPreviewSvg('front', preset.name, preset.emiratesIdNumber);
    const backSvg = generateEidCardPreviewSvg('back', preset.name, preset.emiratesIdNumber);

    setFrontImagePreview(frontSvg);
    setBackImagePreview(backSvg);

    setTimeout(() => {
      onScanComplete({
        name: preset.name,
        emiratesIdNumber: preset.emiratesIdNumber,
        companyName: preset.companyName,
        dob: preset.dob,
        frontImageBase64: frontSvg,
        backImageBase64: backSvg,
      });
      setIsScanning(false);
      setScanStatus(null);
    }, 500);
  };

  const isComplete = Boolean(frontImagePreview && backImagePreview);

  return (
    <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-950/5 border border-emerald-900/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Scan className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
            Emirates ID Auto-Scan (Mandatory)
          </span>
        </div>
        {isComplete ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            Front & Back Required
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        {isCustomerMode
          ? 'Upload front & back of Emirates ID. If already registered, customer records will be automatically pulled and frozen.'
          : 'Upload front & back sides to auto-fill verified UAE resident details.'}
      </p>

      {/* Front & Back Upload Boxes */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Front Box */}
        <div
          onClick={() => frontInputRef.current?.click()}
          className={`relative h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all ${
            frontImagePreview
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/30'
          }`}
        >
          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFrontUpload}
          />
          {frontImagePreview ? (
            <div className="w-full h-full relative rounded-lg overflow-hidden flex items-center justify-center bg-slate-900">
              <img
                src={frontImagePreview}
                alt="Emirates ID Front"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                Front Uploaded
              </span>
            </div>
          ) : (
            <>
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-1">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">Front Side</span>
              <span className="text-[9px] text-slate-400">Photo & EID #</span>
            </>
          )}
        </div>

        {/* Back Box */}
        <div
          onClick={() => backInputRef.current?.click()}
          className={`relative h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all ${
            backImagePreview
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/30'
          }`}
        >
          <input
            ref={backInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBackUpload}
          />
          {backImagePreview ? (
            <div className="w-full h-full relative rounded-lg overflow-hidden flex items-center justify-center bg-slate-900">
              <img
                src={backImagePreview}
                alt="Emirates ID Back"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                Back Uploaded
              </span>
            </div>
          ) : (
            <>
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-1">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">Back Side</span>
              <span className="text-[9px] text-slate-400">Expiry & MRZ</span>
            </>
          )}
        </div>
      </div>

      {/* Progress / Status feedback */}
      {isScanning && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-pulse">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
          <span>{scanStatus}</span>
        </div>
      )}

      {/* Fast Demo Testing Presets */}
      <div className="pt-1 border-t border-emerald-900/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Quick Scan Preset (1-Click Test)
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">UAE Resident Cards</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_EID_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleUsePreset(idx)}
              className="text-[11px] font-medium px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-800 hover:bg-emerald-50/50 shadow-xs transition-colors"
            >
              {p.name.split(' ')[0]} ({p.emiratesIdNumber.slice(0, 8)}...)
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
