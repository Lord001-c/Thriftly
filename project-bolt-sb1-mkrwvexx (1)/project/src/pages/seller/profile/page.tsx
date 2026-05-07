import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

export default function SellerProfilePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) setFullName(profile.full_name || '');
  }, [profile]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-950">Profile</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your seller account</p>
      </div>

      <div className="bg-white rounded-[24px] border border-zinc-100 p-6 sm:p-8 mb-4">
        <div className="flex items-center gap-4 mb-6">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'User'}
              className="w-16 h-16 rounded-full object-cover border border-zinc-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center text-xl font-semibold text-zinc-900">
              {profile?.full_name?.[0]?.toUpperCase() || 'S'}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-zinc-950">{profile?.full_name || 'Seller'}</p>
            <p className="text-sm text-zinc-400">{user?.email}</p>
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
              Seller
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors duration-200"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !fullName.trim()}
            className={`w-full py-3.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              saved
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed'
            }`}
          >
            {saved ? 'Saved' : saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 bg-white rounded-[20px] border border-zinc-100 px-6 py-4 text-sm font-medium text-zinc-500 hover:text-zinc-950 hover:border-zinc-200 transition-all duration-200"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}
