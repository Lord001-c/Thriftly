import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Upload, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import { CONDITIONS, type Condition } from '../lib/types';

type Step = 1 | 2 | 3 | 4;

export default function SellPage() {
  const [step, setStep] = useState<Step>(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<Condition>('Good');
  const [size, setSize] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto(e.target?.result as string);
      setProcessing(true);
      setTimeout(() => {
        setProcessing(false);
        setTitle('Vintage Designer Piece');
        setDescription('Premium quality item in excellent condition. Carefully curated and authenticated.');
        setStep(3);
      }, 2000);
      setStep(2);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const handleSubmit = () => {
    setStep(4);
  };

  const stepLabels: Record<Step, string> = {
    1: 'Upload Photo',
    2: 'Processing',
    3: 'Details',
    4: 'Pricing & Condition',
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <button
          onClick={() => step === 1 ? null : setStep((step - 1) as Step)}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 mb-6"
        >
          <ArrowLeft size={16} />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-black' : 'bg-zinc-200'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[24px] border border-zinc-100 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-zinc-950 mb-1">
            {stepLabels[step]}
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            {step === 1 && 'Add a clear photo of your item'}
            {step === 2 && 'Removing background...'}
            {step === 3 && 'AI-generated details — feel free to edit'}
            {step === 4 && 'Set your price and item condition'}
          </p>

          {step === 1 && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-zinc-200 rounded-[20px] p-12 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-300 hover:bg-zinc-50/50 transition-all duration-200 group"
            >
              <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-4 group-hover:bg-zinc-200 transition-colors duration-200">
                <Upload size={24} className="text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-700 mb-1">
                Drop your photo here
              </p>
              <p className="text-xs text-zinc-400">
                or click to browse · JPG, PNG
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center">
              <div className="relative w-64 h-64 rounded-[20px] overflow-hidden bg-white border border-zinc-100 mb-6">
                {photo && (
                  <img
                    src={photo}
                    alt="Upload"
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      processing ? 'opacity-50' : 'opacity-100'
                    }`}
                  />
                )}
                {processing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="shimmer w-full h-full absolute inset-0 opacity-30" />
                    <div className="relative flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Sparkles size={14} className="text-zinc-500 animate-pulse-soft" />
                      <span className="text-xs font-medium text-zinc-600">Removing background</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-20 h-20 rounded-[16px] overflow-hidden bg-white border border-zinc-100 shrink-0">
                  {photo && <img src={photo} alt="Upload" className="w-full h-full object-cover" />}
                </div>
                <button
                  onClick={() => { setPhoto(null); setStep(1); }}
                  className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  Replace photo
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors duration-200"
                  placeholder="Item title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-[20px] border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors duration-200 resize-none"
                  placeholder="Describe your item"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="w-full py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Continue
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors duration-200"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Condition</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCondition(c)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                        condition === c
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Size</label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-4 py-3 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors duration-200"
                  placeholder="e.g. M, W 32, US 10"
                />
              </div>

              <button
                disabled={!price || !size.trim()}
                className="w-full py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                List item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
