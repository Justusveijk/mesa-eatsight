'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface VideoPlayerProps {
  src?: string
  poster?: string
  placeholder?: boolean
}

export function VideoPlayer({ src, poster, placeholder = false }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  if (placeholder || !src) {
    return (
      <div className="relative aspect-video bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-[#722F37]/20 flex items-center justify-center mb-4 border-2 border-[#722F37]/30">
            <Play className="w-10 h-10 text-[#722F37] ml-1" />
          </div>
          <p className="text-white/70 font-medium">Demo video</p>
          <p className="text-white/40 text-sm mt-1">Coming soon</p>
        </div>

        {/* Decorative window controls */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-video bg-[#1a1a1a] rounded-2xl overflow-hidden group shadow-2xl">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster}
        muted={isMuted}
        loop
        playsInline
        onClick={togglePlay}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center hover:scale-105 transition">
            <Play className="w-8 h-8 text-[#1a1a1a] ml-1" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition">
        <div className="flex items-center gap-4">
          <button onClick={togglePlay} className="text-white hover:text-white/80">
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button onClick={toggleMute} className="text-white hover:text-white/80">
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>
      </div>
    </div>
  )
}
