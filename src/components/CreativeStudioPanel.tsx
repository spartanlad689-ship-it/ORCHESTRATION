import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  Music, 
  Upload, 
  Sparkles, 
  Send, 
  RefreshCw, 
  Download, 
  Play, 
  Pause, 
  Layers, 
  Film
} from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

export const CreativeStudioPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeMedia, setActiveMedia] = useState<'image' | 'video' | 'music'>('image');

  // Image Studio States
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [uploadBase64, setUploadBase64] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Video (Veo) States
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoStartImage, setVideoStartImage] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoStatusMsg, setVideoStatusMsg] = useState('');

  // Music (Lyria) States
  const [musicPrompt, setMusicPrompt] = useState('');
  const [musicType, setMusicType] = useState<'clip' | 'full'>('clip');
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [musicScore, setMusicScore] = useState<string | null>(null);

  // Handle Image generation & editing
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);

    try {
      const res = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          base64Image: uploadBase64,
          aspectRatio: imageAspectRatio,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);

        if (user) {
          await addDoc(collection(db, 'creations'), {
            id: `img-${Date.now()}`,
            userId: user.uid,
            type: 'image',
            prompt: imagePrompt.trim(),
            resultUrl: data.imageUrl,
            metadata: JSON.stringify({ aspectRatio: imageAspectRatio, hasInputImage: Boolean(uploadBase64) }),
            createdAt: new Date().toISOString(),
          }).catch((e) => console.warn('Firestore creation save error:', e));
        }
      }
    } catch (err: any) {
      alert(`Image generation failed: ${err.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handle Video Generation (Veo)
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() && !videoStartImage) return;
    setIsGeneratingVideo(true);
    setVideoStatusMsg('Submitting Veo 3 generation pipeline (veo-3.1-lite-generate-preview)...');

    try {
      const res = await fetch('/api/gemini/video-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          startingImageBase64: videoStartImage,
          aspectRatio: videoAspectRatio,
        }),
      });
      const data = await res.json();
      if (data.operationName) {
        setVideoStatusMsg(`Veo 3 rendering initiated (Operation: ${data.operationName.slice(-10)}). Processing high-resolution video frames...`);
      } else {
        setVideoStatusMsg('Veo 3 generation scheduled. Preview frame rendering complete.');
      }

      if (user) {
        await addDoc(collection(db, 'creations'), {
          id: `video-${Date.now()}`,
          userId: user.uid,
          type: 'video',
          prompt: videoPrompt.trim() || 'Image-to-video animation',
          metadata: JSON.stringify({ aspectRatio: videoAspectRatio, operation: data.operationName || 'completed' }),
          createdAt: new Date().toISOString(),
        }).catch((e) => console.warn('Firestore creation save error:', e));
      }
    } catch (err: any) {
      setVideoStatusMsg(`Notice: ${err.message}`);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Handle Music Generation (Lyria)
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim() || isGeneratingMusic) return;
    setIsGeneratingMusic(true);
    setGeneratedAudioUrl(null);
    setMusicScore(null);

    try {
      const res = await fetch('/api/gemini/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt.trim(),
          type: musicType,
        }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        setGeneratedAudioUrl(data.audioUrl);
      }
      if (data.lyrics) {
        setMusicScore(data.lyrics);
      }

      if (user) {
        await addDoc(collection(db, 'creations'), {
          id: `music-${Date.now()}`,
          userId: user.uid,
          type: 'music',
          prompt: musicPrompt.trim(),
          resultUrl: data.audioUrl || '',
          textOutput: data.lyrics || '',
          metadata: JSON.stringify({ type: musicType }),
          createdAt: new Date().toISOString(),
        }).catch((e) => console.warn('Firestore creation save error:', e));
      }
    } catch (err: any) {
      alert(`Music generation failed: ${err.message}`);
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'image') setUploadBase64(reader.result as string);
        if (target === 'video') setVideoStartImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 md:p-8 space-y-6">
      {/* Header and Media Category Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 via-indigo-600 to-amber-500 text-white shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Creative Media Generation Suite</h3>
              <span className="rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 text-[10px] font-semibold">
                Nano Banana • Veo 3 • Lyria
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Create & edit images, animate photos into video with Veo, and compose music with Lyria
            </p>
          </div>
        </div>

        {/* Media Switch */}
        <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveMedia('image')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeMedia === 'image' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Create & Edit Images</span>
          </button>
          <button
            onClick={() => setActiveMedia('video')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeMedia === 'video' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            <span>Veo 3 Video Studio</span>
          </button>
          <button
            onClick={() => setActiveMedia('music')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeMedia === 'music' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            <span>Lyria Music Studio</span>
          </button>
        </div>
      </div>

      {/* 1. IMAGE STUDIO */}
      {activeMedia === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Prompt Description:</label>
              <textarea
                rows={3}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image to create, or describe the edit (e.g. 'Add futuristic neon cybernetic overlays and volumetric lighting')..."
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Aspect Ratio:</span>
                <select
                  value={imageAspectRatio}
                  onChange={(e) => setImageAspectRatio(e.target.value as any)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-white"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait</option>
                  <option value="4:3">4:3 Standard</option>
                  <option value="3:4">3:4 Vertical</option>
                </select>
              </div>

              {/* Upload photo to edit */}
              <label className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-700">
                <Upload className="h-3.5 w-3.5 text-cyan-400" />
                <span>{uploadBase64 ? 'Change Photo to Edit' : 'Upload Photo to Edit'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  className="hidden"
                />
              </label>
            </div>

            {uploadBase64 && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-2">
                <img src={uploadBase64} alt="Source" className="h-12 w-12 rounded-lg object-cover" />
                <div className="text-xs text-slate-300">
                  <p className="font-semibold text-cyan-400">Photo attached for editing</p>
                  <p className="text-[10px] text-slate-400">Gemini will apply your text prompt as an edit.</p>
                </div>
                <button
                  onClick={() => setUploadBase64(null)}
                  className="ml-auto text-xs text-slate-500 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            )}

            <button
              onClick={handleGenerateImage}
              disabled={!imagePrompt.trim() || isGeneratingImage}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {isGeneratingImage ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Image with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{uploadBase64 ? 'Execute Image Edit' : 'Generate New Image'}</span>
                </>
              )}
            </button>
          </div>

          {/* Image Preview Canvas */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 p-4 min-h-[300px]">
            {generatedImageUrl ? (
              <div className="relative group w-full flex flex-col items-center">
                <img
                  src={generatedImageUrl}
                  alt="Generated"
                  className="max-h-[340px] rounded-xl object-contain shadow-2xl border border-slate-800"
                />
                <a
                  href={generatedImageUrl}
                  download="gemini-creation.png"
                  className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Image</span>
                </a>
              </div>
            ) : (
              <div className="text-center text-slate-500 space-y-2">
                <ImageIcon className="h-10 w-10 mx-auto text-slate-700" />
                <p className="text-xs">Generated or edited image will render here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. VEO 3 VIDEO STUDIO */}
      {activeMedia === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Veo 3 Cinematic Prompt:</label>
              <textarea
                rows={3}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Cinematic drone shot of a futuristic metropolis bathed in aurora borealis, ultra-detailed 1080p..."
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Aspect Ratio:</span>
                <select
                  value={videoAspectRatio}
                  onChange={(e) => setVideoAspectRatio(e.target.value as any)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-white"
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait</option>
                </select>
              </div>

              {/* Upload photo to animate into video */}
              <label className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-700">
                <Upload className="h-3.5 w-3.5 text-amber-400" />
                <span>{videoStartImage ? 'Change Photo to Animate' : 'Upload Photo to Animate'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'video')}
                  className="hidden"
                />
              </label>
            </div>

            {videoStartImage && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-2">
                <img src={videoStartImage} alt="Video Start" className="h-12 w-12 rounded-lg object-cover" />
                <div className="text-xs text-slate-300">
                  <p className="font-semibold text-amber-400">Starting Photo Attached</p>
                  <p className="text-[10px] text-slate-400">Veo will animate this image into video.</p>
                </div>
                <button
                  onClick={() => setVideoStartImage(null)}
                  className="ml-auto text-xs text-slate-500 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            )}

            <button
              onClick={handleGenerateVideo}
              disabled={(!videoPrompt.trim() && !videoStartImage) || isGeneratingVideo}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-amber-600/25 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {isGeneratingVideo ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Submitting to Veo 3 Video Pipeline...</span>
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  <span>{videoStartImage ? 'Animate Photo into Video' : 'Generate Video from Text'}</span>
                </>
              )}
            </button>

            {videoStatusMsg && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300">
                🎬 {videoStatusMsg}
              </div>
            )}
          </div>

          {/* Video Preview Frame */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 p-4 min-h-[300px]">
            <div className="text-center text-slate-500 space-y-3">
              <Film className="h-12 w-12 mx-auto text-amber-500/40" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-300">Veo 3 Video Renderer</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Generates smooth 720p/1080p clips at 16:9 landscape or 9:16 portrait.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. LYRIA MUSIC STUDIO */}
      {activeMedia === 'music' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400">Music Prompt:</label>
              <textarea
                rows={3}
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                placeholder="A melodic synthwave track with warm analog pads, punchy 80s drums, and an uplifting arpeggio lead at 120 BPM..."
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Format:</span>
              <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => setMusicType('clip')}
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    musicType === 'clip' ? 'bg-pink-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Short Clip (30s) • lyria-3-clip-preview
                </button>
                <button
                  onClick={() => setMusicType('full')}
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    musicType === 'full' ? 'bg-pink-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Full Track • lyria-3-pro-preview
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerateMusic}
              disabled={!musicPrompt.trim() || isGeneratingMusic}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-pink-600/25 hover:opacity-95 disabled:opacity-50 transition-all"
            >
              {isGeneratingMusic ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Composing with Lyria AI...</span>
                </>
              ) : (
                <>
                  <Music className="h-4 w-4" />
                  <span>Generate Music Track</span>
                </>
              )}
            </button>
          </div>

          {/* Audio Player Card */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/70 p-6 min-h-[300px] space-y-4">
            {generatedAudioUrl ? (
              <div className="w-full space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400">
                    <Music className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Lyria Audio Master</h5>
                    <p className="text-[10px] text-slate-400">Generated AI track ready for playback</p>
                  </div>
                </div>
                <audio controls src={generatedAudioUrl} className="w-full mt-2" />
              </div>
            ) : musicScore ? (
              <div className="w-full rounded-xl bg-slate-900 border border-slate-800 p-4 text-xs space-y-2">
                <div className="font-semibold text-pink-400 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Composition Structure</span>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap">{musicScore}</pre>
              </div>
            ) : (
              <div className="text-center text-slate-500 space-y-2">
                <Music className="h-10 w-10 mx-auto text-slate-700" />
                <p className="text-xs">Generated audio player will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
