import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Check, ChevronRight, AlertCircle, X, Camera } from 'lucide-react';
import { CONDITIONS, CATEGORIES, type Condition, type Category, type ListingType } from '../lib/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { compressImage } from '../lib/compressImage';

type Step = 1 | 2 | 3;

interface FieldErrors {
  title?: string;
  price?: string;
  condition?: string;
  category?: string;
}

export default function SellPage() {
  const [step, setStep] = useState<Step>(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [imageCleanUrl, setImageCleanUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [listingType, setListingType] = useState<ListingType>('secondhand');
  const [condition, setCondition] = useState<Condition | ''>('');
  const [category, setCategory] = useState<Category | ''>('');
  const [size, setSize] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState(false);
  const [hasPayoutAccount, setHasPayoutAccount] = useState<boolean | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [styledPhotos, setStyledPhotos] = useState<(string | null)[]>([null, null, null]);
  const [styledUploading, setStyledUploading] = useState<boolean[]>([false, false, false]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const styledFileRef0 = useRef<HTMLInputElement>(null);
  const styledFileRef1 = useRef<HTMLInputElement>(null);
  const styledFileRef2 = useRef<HTMLInputElement>(null);
  const styledFileRefs = [styledFileRef0, styledFileRef1, styledFileRef2];
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) checkPayoutAccount();
  }, [user]);

  async function checkPayoutAccount() {
    const { data } = await supabase
      .from('profiles')
      .select('momo_number, momo_name')
      .eq('id', user!.id)
      .maybeSingle();
    setHasPayoutAccount(!!(data?.momo_number && data?.momo_name));
  }

  const handleFile = useCallback(async (file: File) => {
    setUploadError('');

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only JPG, PNG, or WebP images are accepted.');
      return;
    }

    setCompressing(true);
    const compressedFile = await compressImage(file);
    setCompressing(false);

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPhoto(e.target?.result as string);
    reader.readAsDataURL(compressedFile);

    setUploading(true);

    if (user) {
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { error: storageError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, compressedFile);

      if (!storageError) {
        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);
        setImageCleanUrl(publicUrl);
      }
    }

    setUploading(false);
    setStep(2);
  }, [user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadError('');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  async function handleStyledPhotoFile(index: number, file: File) {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return;

    setStyledUploading(prev => { const next = [...prev]; next[index] = true; return next; });

    const compressedFile = await compressImage(file);
    const fileName = `${user.id}/styled_${Date.now()}_${index}.jpg`;
    const { error } = await supabase.storage.from('listing-images').upload(fileName, compressedFile);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(fileName);
      setStyledPhotos(prev => { const next = [...prev]; next[index] = publicUrl; return next; });
    }

    setStyledUploading(prev => { const next = [...prev]; next[index] = false; return next; });
  }

  function validateStep2(): boolean {
    const newErrors: FieldErrors = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!price || parseFloat(price) < 1) newErrors.price = 'Minimum price is GHS 1.00';
    if (!condition) newErrors.condition = 'Select a condition';
    if (!category) newErrors.category = 'Select a category';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (validateStep2()) {
      setErrors({});
      setStep(3);
    }
  }

  async function handlePublish() {
    if (!user) return;
    setSubmitting(true);
    setPublishError(false);

    const { data: sp } = await supabase
      .from('seller_profiles')
      .select('seller_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sp) {
      setSubmitting(false);
      setPublishError(true);
      return;
    }

    const { data, error } = await supabase
      .from('listings')
      .insert({
        seller_id: sp.seller_id,
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        condition,
        category,
        size: size.trim(),
        brand: brand.trim(),
        image_clean: imageCleanUrl,
        images: styledPhotos.filter(Boolean) as string[],
        quantity,
        listing_type: listingType,
      })
      .select('id')
      .maybeSingle();

    if (error || !data) {
      setSubmitting(false);
      setPublishError(true);
      return;
    }

    setSubmitting(false);
    setPublishedId(data.id);
  }

  function resetForm() {
    setStep(1);
    setPhoto(null);
    setImageCleanUrl('');
    setTitle('');
    setDescription('');
    setPrice('');
    setListingType('secondhand');
    setCondition('');
    setCategory('');
    setSize('');
    setBrand('');
    setQuantity(1);
    setStyledPhotos([null, null, null]);
    setStyledUploading([false, false, false]);
    setErrors({});
    setPublishedId(null);
    setPublishError(false);
  }

  const stepLabels: Record<Step, string> = { 1: 'Photo', 2: 'Details', 3: 'Confirm' };

  if (publishedId) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="bg-white rounded-[24px] border border-zinc-100 p-8 sm:p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-zinc-950" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-950 mb-2">Listing published!</h2>
          <p className="text-sm text-zinc-500 mb-6">Your item is now live on Thriftly</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(`/listing/${publishedId}`)}
              className="w-full py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
            >
              View listing
            </button>
            <button
              onClick={resetForm}
              className="w-full py-3.5 rounded-full bg-white text-zinc-700 text-sm font-medium border border-zinc-200 hover:border-zinc-300 transition-all duration-200"
            >
              List another item
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <button
        onClick={() => step === 1 ? navigate(-1) : setStep((step - 1) as Step)}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 mb-6"
      >
        <ArrowLeft size={16} />
        {step === 1 ? 'Cancel' : 'Back'}
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {([1, 2, 3] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              s < step ? 'bg-zinc-400 text-white' : s === step ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-400'
            }`}>
              <span>{s}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{stepLabels[s]}</span>
            </div>
            {i < 2 && <ChevronRight size={16} className="text-zinc-300 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step 1 — Upload photo */}
      {step === 1 && (
        <div className="bg-white rounded-[24px] border border-zinc-100 p-6 sm:p-8">
          {hasPayoutAccount === false && (
            <div className="flex items-start gap-3 p-4 rounded-[16px] bg-zinc-50 border border-zinc-200 mb-6">
              <AlertCircle size={16} className="text-zinc-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-950">Payout account required</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Set up your payout account before listing items.{' '}
                  <Link to="/seller/payouts" className="underline text-zinc-700 hover:text-zinc-950">
                    Set up now →
                  </Link>
                </p>
              </div>
            </div>
          )}
          <h2 className="text-lg font-semibold text-zinc-950 mb-1">Upload photo</h2>
          <p className="text-sm text-zinc-400 mb-6">Clothing items only — tops, bottoms, shoes, bags, and accessories. JPG, PNG or WebP · Max 10MB.</p>

          {uploadError && (
            <div className="flex items-start gap-2 p-3 rounded-[12px] bg-zinc-50 border border-zinc-200 mb-4">
              <AlertCircle size={14} className="text-zinc-500 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-600">{uploadError}</p>
            </div>
          )}

          {!photo ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={hasPayoutAccount ? handleDrop : undefined}
              className={`border-2 border-dashed rounded-2xl min-h-[260px] flex flex-col items-center justify-center transition-all duration-200 ${!hasPayoutAccount ? 'border-zinc-200 opacity-50' : 'border-zinc-300'}`}
            >
              <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <Upload size={24} className="text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-700 mb-4">Upload or take a photo</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={!hasPayoutAccount}
                  onClick={() => hasPayoutAccount && fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Upload size={14} />
                  Browse files
                </button>
                <button
                  type="button"
                  disabled={!hasPayoutAccount}
                  onClick={() => hasPayoutAccount && cameraRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-zinc-800 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Camera size={14} />
                  Take photo
                </button>
              </div>
              <p className="text-xs text-zinc-400 mt-3">JPG, PNG or WebP · Max 10MB</p>
              {compressing && <p className="text-xs text-zinc-400 mt-1">Optimising image...</p>}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-white border border-zinc-100 mb-4">
                <img src={imageCleanUrl || photo} alt="Upload" className="w-full h-full object-cover" />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                    <div className="w-6 h-6 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {!uploading && (
                <button
                  onClick={() => { setPhoto(null); setImageCleanUrl(''); }}
                  className="px-5 py-2 rounded-full text-sm font-medium text-zinc-500 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-700 transition-all duration-200"
                >
                  Retake photo
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Fill in details */}
      {step === 2 && (
        <div className="bg-white rounded-[24px] border border-zinc-100 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-zinc-950 mb-1">Item details</h2>
          <p className="text-sm text-zinc-400 mb-6">Fill in the details for your item</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left — image preview + styled photos */}
            <div className="space-y-4">
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white border border-zinc-100">
                <img src={imageCleanUrl || photo || ''} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-700 mb-0.5">Show it being worn <span className="text-zinc-400 font-normal">(optional)</span></p>
                <p className="text-xs text-zinc-400 mb-3">Add up to 3 photos of the item being worn — helps buyers visualize the fit</p>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="aspect-square relative">
                      {styledPhotos[index] ? (
                        <div className="w-full h-full rounded-2xl overflow-hidden border border-zinc-100 relative group">
                          <img src={styledPhotos[index]!} alt={`Styled ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setStyledPhotos(prev => { const next = [...prev]; next[index] = null; return next; })}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} className="text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => styledFileRefs[index].current?.click()}
                          disabled={styledUploading[index]}
                          className="w-full h-full rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center hover:border-zinc-300 hover:bg-zinc-50 transition-all duration-200 disabled:opacity-50"
                        >
                          {styledUploading[index] ? (
                            <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                          ) : (
                            <Upload size={16} className="text-zinc-300" />
                          )}
                        </button>
                      )}
                      <input ref={styledFileRefs[index]} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleStyledPhotoFile(index, file); e.target.value = ''; }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — form fields */}
            <div className="space-y-4">
              {/* Listing type */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Item type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setListingType('secondhand')}
                    className={`py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                      listingType === 'secondhand'
                        ? 'bg-black text-white border-black'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-100 hover:border-zinc-200'
                    }`}
                  >
                    Secondhand
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingType('brand_new')}
                    className={`py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                      listingType === 'brand_new'
                        ? 'bg-black text-white border-black'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-100 hover:border-zinc-200'
                    }`}
                  >
                    Brand New
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Title</label>
                <input type="text" value={title}
                  onChange={(e) => { setTitle(e.target.value); setErrors(p => ({ ...p, title: undefined })); }}
                  className="w-full px-4 py-3 rounded-full border border-zinc-200 bg-zinc-100 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors duration-200"
                  placeholder="e.g. Nike Air Force 1 White" />
                {errors.title && <p className="text-xs text-zinc-400 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">GHS</span>
                  <input type="number" value={price}
                    onChange={(e) => { setPrice(e.target.value); setErrors(p => ({ ...p, price: undefined })); }}
                    className="w-full pl-12 pr-4 py-3 rounded-full border border-zinc-200 bg-zinc-100 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors duration-200"
                    placeholder="0.00" min="0" step="0.01" />
                </div>
                {errors.price && <p className="text-xs text-zinc-400 mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Condition</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => (
                    <button key={c} onClick={() => { setCondition(c); setErrors(p => ({ ...p, condition: undefined })); }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${condition === c ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                {errors.condition && <p className="text-xs text-zinc-400 mt-1">{errors.condition}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Category</label>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <button key={c} onClick={() => { setCategory(c); setErrors(p => ({ ...p, category: undefined })); }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${category === c ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                {errors.category && <p className="text-xs text-zinc-400 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Size</label>
                <input type="text" value={size} onChange={(e) => setSize(e.target.value)}
                  className="w-full px-4 py-3 rounded-full border border-zinc-200 bg-zinc-100 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors duration-200"
                  placeholder="e.g. M, L, 42, One Size" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Brand</label>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-4 py-3 rounded-full border border-zinc-200 bg-zinc-100 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors duration-200"
                  placeholder="e.g. Nike, Zara (optional)" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Quantity</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full border border-zinc-200 bg-zinc-100 text-zinc-700 text-lg font-medium flex items-center justify-center hover:bg-zinc-200 transition-colors">−</button>
                  <span className="text-sm font-semibold text-zinc-950 w-6 text-center">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 rounded-full border border-zinc-200 bg-zinc-100 text-zinc-700 text-lg font-medium flex items-center justify-center hover:bg-zinc-200 transition-colors">+</button>
                  <span className="text-xs text-zinc-400 ml-1">{quantity === 1 ? '1 of 1 (unique item)' : `${quantity} units available`}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors duration-200 resize-none"
                  placeholder="Describe the item — fabric, fit, any flaws..." />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100">
            <button onClick={() => setStep(1)}
              className="px-6 py-3 rounded-full text-sm font-medium text-zinc-500 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-700 transition-all duration-200">
              Back
            </button>
            <button onClick={handleNext}
              className="px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm and publish */}
      {step === 3 && (
        <div className="bg-white rounded-[24px] border border-zinc-100 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-zinc-950 mb-1">Confirm listing</h2>
          <p className="text-sm text-zinc-400 mb-6">Review your listing before publishing</p>

          <div className="flex gap-5 sm:gap-6">
            <div className="w-40 h-40 shrink-0 rounded-2xl overflow-hidden bg-white border border-zinc-100">
              <img src={imageCleanUrl || photo || ''} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="text-lg font-bold text-zinc-950 leading-tight">{title}</h3>
              <p className="text-xl font-bold text-zinc-950">GHS {parseFloat(price).toFixed(2)}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">{condition}</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">{category}</span>
              </div>
              {size && <p className="text-sm text-zinc-600">Size: {size}</p>}
              {brand && <p className="text-sm text-zinc-600">Brand: {brand}</p>}
              {description && <p className="text-sm text-zinc-600 line-clamp-3">{description}</p>}
              <p className="text-xs text-zinc-400 pt-1">Listed by you</p>
            </div>
          </div>

          {publishError && (
            <p className="text-sm text-zinc-400 mt-4 text-center">Something went wrong. Please try again.</p>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100">
            <button onClick={() => setStep(2)}
              className="px-6 py-3 rounded-full text-sm font-medium text-zinc-500 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-700 transition-all duration-200">
              Edit details
            </button>
            <button onClick={handlePublish} disabled={submitting}
              className="w-full max-w-[200px] py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors duration-200">
              {submitting ? 'Publishing...' : 'Publish listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
