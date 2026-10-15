'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Star, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type ReviewInfo = {
  locale: string;
  customerName: string | null;
  jobNumber: string | null;
  vehicleInfo: string | null;
};

const STRINGS: Record<string, Record<string, string | string[]>> = {
  nl: {
    title: 'Beoordeel uw ervaring',
    subtitle: 'Wij horen graag hoe u de service bij Colourking heeft ervaren.',
    vehicle: 'Voertuig',
    job: 'Opdracht',
    ratingLabel: 'Hoe tevreden bent u?',
    commentLabel: 'Heeft u nog opmerkingen? (optioneel)',
    commentPlaceholder: 'Vertel ons over uw ervaring...',
    submit: 'Beoordeling versturen',
    submitting: 'Versturen...',
    thankYou: 'Bedankt voor uw beoordeling!',
    thankYouSub: 'Uw feedback helpt ons om onze service te verbeteren.',
    alreadySubmitted: 'U heeft al een beoordeling gegeven.',
    notFound: 'Deze beoordelingslink is ongeldig of verlopen.',
    error: 'Er ging iets mis. Probeer het opnieuw.',
    stars: ['Slecht', 'Matig', 'Voldoende', 'Goed', 'Uitstekend'],
  },
  en: {
    title: 'Rate your experience',
    subtitle: 'We would love to hear about your experience at Colourking.',
    vehicle: 'Vehicle',
    job: 'Job',
    ratingLabel: 'How satisfied are you?',
    commentLabel: 'Any comments? (optional)',
    commentPlaceholder: 'Tell us about your experience...',
    submit: 'Submit Review',
    submitting: 'Submitting...',
    thankYou: 'Thank you for your review!',
    thankYouSub: 'Your feedback helps us improve our service.',
    alreadySubmitted: 'You have already submitted a review.',
    notFound: 'This review link is invalid or expired.',
    error: 'Something went wrong. Please try again.',
    stars: ['Poor', 'Fair', 'Okay', 'Good', 'Excellent'],
  },
  tr: {
    title: 'Deneyiminizi değerlendirin',
    subtitle: 'Colourking hizmetimiz hakkındaki deneyiminizi duymak isteriz.',
    vehicle: 'Araç',
    job: 'İş',
    ratingLabel: 'Ne kadar memnunsunuz?',
    commentLabel: 'Yorumlarınız var mı? (isteğe bağlı)',
    commentPlaceholder: 'Deneyiminizi anlatın...',
    submit: 'Değerlendirme Gönder',
    submitting: 'Gönderiliyor...',
    thankYou: 'Değerlendirmeniz için teşekkürler!',
    thankYouSub: 'Geri bildiriminiz hizmetimizi geliştirmemize yardımcı olur.',
    alreadySubmitted: 'Zaten bir değerlendirme gönderdiniz.',
    notFound: 'Bu değerlendirme bağlantısı geçersiz veya süresi dolmuş.',
    error: 'Bir şeyler ters gitti. Lütfen tekrar deneyin.',
    stars: ['Kötü', 'Zayıf', 'Orta', 'İyi', 'Mükemmel'],
  },
};

function t(locale: string, key: string): string {
  const v = STRINGS[locale]?.[key] ?? STRINGS.nl[key] ?? key;
  return typeof v === 'string' ? v : key;
}

function starLabels(locale: string): string[] {
  const v = STRINGS[locale]?.stars ?? STRINGS.nl.stars;
  return Array.isArray(v) ? v : [];
}

export default function PublicReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<ReviewInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitted' | 'already' | 'notfound' | 'error'>('loading');
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const locale = info?.locale ?? 'nl';

  useEffect(() => {
    fetch(`/api/public/review/${token}`)
      .then(r => {
        if (r.status === 410) { setStatus('already'); return null; }
        if (r.status === 404) { setStatus('notfound'); return null; }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(data => {
        if (data) { setInfo(data); setStatus('ready'); }
      })
      .catch(() => setStatus('notfound'));
  }, [token]);

  const handleSubmit = async () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/review/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      if (res.status === 410) { setStatus('already'); return; }
      if (!res.ok) throw new Error();
      setStatus('submitted');
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600">{t(locale, 'notFound')}</p>
        </div>
      </div>
    );
  }

  if (status === 'already') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">{t(locale, 'alreadySubmitted')}</p>
        </div>
      </div>
    );
  }

  if (status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t(locale, 'thankYou')}</h2>
          <p className="text-gray-500">{t(locale, 'thankYouSub')}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600">{t(locale, 'error')}</p>
        </div>
      </div>
    );
  }

  const labels = starLabels(locale);

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 px-4 pb-8">
      <div className="bg-white rounded-xl shadow-sm w-full max-w-lg">
        {/* Header */}
        <div className="bg-[#E8364E] rounded-t-xl px-6 py-5 text-white">
          <h1 className="text-xl font-bold">{t(locale, 'title')}</h1>
          <p className="text-sm text-white/80 mt-1">{t(locale, 'subtitle')}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Job/vehicle info */}
          {(info?.vehicleInfo || info?.jobNumber) && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
              {info.vehicleInfo && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t(locale, 'vehicle')}</span>
                  <span className="font-medium text-gray-900">{info.vehicleInfo}</span>
                </div>
              )}
              {info.jobNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t(locale, 'job')}</span>
                  <span className="font-medium text-gray-900">{info.jobNumber}</span>
                </div>
              )}
            </div>
          )}

          {/* Star rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t(locale, 'ratingLabel')}
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      n <= (hovered || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                </button>
              ))}
              {(hovered || rating) > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  {labels[(hovered || rating) - 1]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t(locale, 'commentLabel')}
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E8364E] focus:border-transparent resize-none"
              rows={4}
              maxLength={2000}
              placeholder={t(locale, 'commentPlaceholder')}
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!rating || submitting}
            className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#E8364E' }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t(locale, 'submitting')}
              </span>
            ) : (
              t(locale, 'submit')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
