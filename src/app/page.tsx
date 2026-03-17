'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setResultImage(null);

    // Show original preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to API
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to process image');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'removed-bg.png';
    link.click();
  };

  const reset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="py-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          🖼️ Image Background Remover
        </h1>
        <p className="text-slate-400">
          Upload an image to remove its background automatically
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-12">
        {/* Upload Area */}
        {!originalImage && (
          <div
            className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragActive
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
            <div className="text-6xl mb-4">📁</div>
            <p className="text-xl text-slate-300 mb-2">
              Drag & drop your image here
            </p>
            <p className="text-slate-500 text-sm">
              or{' '}
              <span
                className="text-cyan-400 cursor-pointer hover:underline"
                onClick={handleClick}
              >
                click to browse
              </span>
            </p>
            <p className="text-slate-600 text-xs mt-4">
              Supports JPG, PNG, WEBP (max 10MB)
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Processing */}
        {isProcessing && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800 rounded-xl">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-300">Processing image...</span>
            </div>
          </div>
        )}

        {/* Result */}
        {originalImage && !isProcessing && (
          <div className="mt-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original */}
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <h3 className="text-slate-400 text-sm mb-3 text-center">Original</h3>
                <div className="relative aspect-square bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xNkRpr/UAAABOSURBVDhPY/hPIBgVGBgYGBgYGBgY/jMwMDAw/M/AwMDAwPCfgYGBgYGBgYHhPwMDA8N/BgYGBgYGhvwMDAz/GRgY8BqAkYGBAT4AMDAWYCRoAEYmYCBsAJ8LYCJuABcVFhDPAcQAAGH9ECFwxz2aAAAAAElFTkSuQmCC')] rounded-xl overflow-hidden">
                  <Image
                    src={originalImage}
                    alt="Original"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Result */}
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <h3 className="text-slate-400 text-sm mb-3 text-center">Result</h3>
                <div className="relative aspect-square bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xNkRpr/UAAABOSURBVDhPY/hPIBgVGBgYGBgYGBgY/jMwMDAw/M/AwMDAwPCfgYGBgYGBgYHhPwMDA8N/BgYGBgYGhvwMDAz/GRgY8BqAkYGBAT4AMDAWYCRoAEYmYCBsAJ8LYCJuABcVFhDPAcQAAGH9ECFwxz2aAAAAAElFTkSuQmCC')] rounded-xl overflow-hidden">
                  {resultImage ? (
                    <Image
                      src={resultImage}
                      alt="Result"
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                      No result yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4 mt-6">
              {resultImage && (
                <button
                  onClick={downloadResult}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all"
                >
                  ⬇️ Download Result
                </button>
              )}
              <button
                onClick={reset}
                className="px-6 py-3 bg-slate-700 text-slate-300 font-medium rounded-xl hover:bg-slate-600 transition-all"
              >
                🔄 Try Another
              </button>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-12 p-6 bg-slate-800/30 rounded-xl">
          <h3 className="text-slate-400 text-sm font-medium mb-3">💡 Tips</h3>
          <ul className="text-slate-500 text-sm space-y-1">
            <li>• Works best with photos containing clear subjects (people, products, objects)</li>
            <li>• Avoid images with transparent backgrounds already</li>
            <li>• Higher resolution images produce better results</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-600 text-sm">
        Powered by Remove.bg API
      </footer>
    </div>
  );
}
