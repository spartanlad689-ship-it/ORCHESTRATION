import React from 'react';
import { LogIn, LogOut, User as UserIcon, Cloud, CloudCheck, Key } from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';

interface AuthHeaderProps {
  onOpenVault: () => void;
  configuredCount: number;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ onOpenVault, configuredCount }) => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <div className="flex items-center gap-3">
      {/* Cloud DB Status indicator */}
      <div className="hidden md:flex items-center gap-1.5 text-xs bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
        <Cloud className="h-3.5 w-3.5 text-cyan-400" />
        <span>Firestore Cloud Sync</span>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </div>

      {/* API Key Vault Trigger */}
      <button
        onClick={onOpenVault}
        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-200 shadow-sm hover:border-indigo-500 hover:bg-slate-800 transition-all"
      >
        <Key className="h-3.5 w-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Key Vault</span>
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
            configuredCount === 3 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
          }`}
        >
          {configuredCount}/3
        </span>
      </button>

      {/* Google Auth user button */}
      {loading ? (
        <div className="h-8 w-8 rounded-full bg-slate-800 animate-pulse" />
      ) : user ? (
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-1 pr-2.5">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="h-7 w-7 rounded-lg object-cover border border-slate-700"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-300">
              <UserIcon className="h-4 w-4" />
            </div>
          )}
          <span className="text-xs font-medium text-slate-200 hidden lg:inline max-w-[120px] truncate">
            {user.displayName || user.email?.split('@')[0]}
          </span>
          <button
            onClick={() => signOut()}
            title="Sign out of Firebase"
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => signInWithGoogle()}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:opacity-95 transition-opacity"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Sign In with Google</span>
        </button>
      )}
    </div>
  );
};
