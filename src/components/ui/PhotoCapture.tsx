'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, RotateCcw, Loader2 } from 'lucide-react';

type PhotoCaptureProps = {
  inspectionId: string;
  findingId?: string | null;
  kind?: 'shot' | 'schade' | 'pre_existent' | 'document';
  shotKey?: string | null;
  onUploaded?: (photo: { id: string; reference: string; url: string; sha256: string }) => void;
  onClose?: () => void;
};

export function PhotoCapture({
  inspectionId,
  findingId,
  kind = 'schade',
  shotKey,
  onUploaded,
  onClose,
}: PhotoCaptureProps) {
  const [mode, setMode] = useState<'choose' | 'camera' | 'preview' | 'uploading'>('choose');
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMode('camera');
    } catch {
      setError('Camera niet beschikbaar. Gebruik bestandskeuze.');
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setCapturedFile(file);
      setPreview(canvas.toDataURL('image/jpeg', 0.9));
      stopCamera();
      setMode('preview');
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setMode('preview');
    };
    reader.readAsDataURL(file);
  }, []);

  const retake = useCallback(() => {
    setPreview(null);
    setCapturedFile(null);
    setCaption('');
    setMode('choose');
  }, []);

  const upload = useCallback(async () => {
    if (!capturedFile) return;
    setMode('uploading');
    setError('');

    const formData = new FormData();
    formData.append('file', capturedFile);
    formData.append('kind', kind);
    if (findingId) formData.append('finding_id', findingId);
    if (shotKey) formData.append('shot_key', shotKey);
    if (caption) formData.append('caption', caption);

    try {
      const res = await fetch(`/api/inspections/${inspectionId}/photos`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload mislukt');
      }

      const photo = await res.json();
      onUploaded?.(photo);
      retake();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt');
      setMode('preview');
    }
  }, [capturedFile, kind, findingId, shotKey, caption, inspectionId, onUploaded, retake]);

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ck-dark-border bg-ck-dark-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">
          {mode === 'camera' ? 'Camera' : mode === 'preview' ? 'Controleren' : mode === 'uploading' ? 'Uploaden...' : 'Foto toevoegen'}
        </span>
        <button onClick={handleClose} className="rounded-lg p-1 text-ck-muted hover:bg-ck-dark-surface hover:text-white">
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-300">{error}</div>
      )}

      {/* Choose mode */}
      {mode === 'choose' && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={startCamera}
            className="flex flex-col items-center gap-2 rounded-xl border border-ck-dark-border bg-ck-dark-surface px-4 py-6 text-ck-muted-light hover:border-ck-red hover:text-white transition-colors"
          >
            <Camera size={28} />
            <span className="text-sm font-medium">Camera</span>
            <span className="text-[11px] text-ck-muted">Direct vastleggen</span>
          </button>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-ck-dark-border bg-ck-dark-surface px-4 py-6 text-ck-muted-light hover:border-ck-red hover:text-white transition-colors">
            <Upload size={28} />
            <span className="text-sm font-medium">Bestand</span>
            <span className="text-[11px] text-ck-muted">Uit galerij kiezen</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      )}

      {/* Camera viewfinder */}
      {mode === 'camera' && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-black"
            style={{ maxHeight: '400px', objectFit: 'cover' }}
          />
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              onClick={() => { stopCamera(); setMode('choose'); }}
              className="rounded-lg border border-ck-dark-border px-4 py-2 text-sm text-ck-muted-light hover:bg-ck-dark-surface"
            >
              Annuleren
            </button>
            <button
              onClick={capturePhoto}
              className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-ck-red hover:bg-ck-red-hover transition-colors"
            >
              <Camera size={24} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {(mode === 'preview' || mode === 'uploading') && preview && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full rounded-lg"
            style={{ maxHeight: '300px', objectFit: 'contain' }}
          />
          <input
            type="text"
            placeholder="Bijschrift (optioneel)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            disabled={mode === 'uploading'}
            className="mt-3 w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={retake}
              disabled={mode === 'uploading'}
              className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-sm text-ck-muted-light hover:bg-ck-dark-surface disabled:opacity-50"
            >
              <RotateCcw size={14} /> Opnieuw
            </button>
            <button
              onClick={upload}
              disabled={mode === 'uploading'}
              className="flex items-center gap-1.5 rounded-lg bg-ck-red px-4 py-1.5 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
            >
              {mode === 'uploading' ? (
                <><Loader2 size={14} className="animate-spin" /> Uploaden...</>
              ) : (
                <><Check size={14} /> Opslaan</>
              )}
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
