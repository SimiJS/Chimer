import { toast } from 'sonner'
import { Sound, Settings } from '@/types'

interface SoundCacheEntry {
	url: string
	createdAt: number
}

export class SoundEngine {
	private mainAudio: HTMLAudioElement
	private auxAudio: HTMLAudioElement
	private soundCache = new Map<string, SoundCacheEntry>()
	private endedCallback: (() => void) | null = null

	constructor() {
		this.mainAudio = new Audio()
		this.auxAudio = new Audio()

		// Only listen to ended event on main audio
		this.mainAudio.addEventListener('ended', () => {
			if (this.endedCallback) {
				this.endedCallback()
			}
		})
	}

	cleanupOldCache = () => {
		const maxAge = 5 * 60 * 1000
		this.soundCache.forEach((entry, key) => {
			if (Date.now() - entry.createdAt > maxAge) {
				URL.revokeObjectURL(entry.url)
				this.soundCache.delete(key)
			}
		})
	}

	setEndedCallback(callback: () => void) {
		this.endedCallback = callback
	}

	async playSound(sound: Sound, settings: Settings, isLooping: boolean): Promise<void> {
		if (!sound.soundSrc) return

		this.stopSound()

		// Get or load audio file with proper cache management
		let cacheEntry = this.soundCache.get(sound.soundSrc)
		let audioUrl: string

		if (!cacheEntry) {
			const fileData = await window.api.readData(sound.soundSrc)
			if (!fileData.success) {
				toast.error(fileData.message)
				return
			}
			audioUrl = URL.createObjectURL(new Blob([new Uint8Array(fileData.data)]))
			this.soundCache.set(sound.soundSrc, {
				url: audioUrl,
				createdAt: Date.now()
			})
			// Clean old cache entries periodically
			this.cleanupOldCache()
		} else {
			audioUrl = cacheEntry.url
		}

		// Set up main audio
		this.mainAudio.src = audioUrl
		this.mainAudio.loop = isLooping
		this.mainAudio.volume = Math.min((settings.mainOutputVol / 100) * 1.25, 1)
		this.mainAudio.setSinkId?.(settings.mainOutputDeviceId).catch(console.error)

		// Set up aux audio if enabled
		if (settings.enableAuxOutput && settings.auxOutputDeviceId) {
			this.auxAudio.src = audioUrl
			this.auxAudio.loop = isLooping
			this.auxAudio.volume = Math.min((settings.auxOutputVol / 100) * 1.25, 1)
			this.auxAudio.setSinkId?.(settings.auxOutputDeviceId).catch(console.error)
		}

		// Play both at the same time
		const playPromises = [this.mainAudio.play()]
		if (settings.enableAuxOutput && settings.auxOutputDeviceId) {
			playPromises.push(this.auxAudio.play())
		}

		await Promise.all(playPromises)
	}

	stopSound() {
		this.mainAudio.pause()
		this.mainAudio.currentTime = 0
		this.mainAudio.src = ''

		this.auxAudio.pause()
		this.auxAudio.currentTime = 0
		this.auxAudio.src = ''
	}

	togglePause(): boolean {
		const isPaused = this.mainAudio.paused

		if (isPaused) {
			this.mainAudio.play().catch(console.error)
			if (this.auxAudio.src) {
				this.auxAudio.play().catch(console.error)
			}
			return true // now playing
		} else {
			this.mainAudio.pause()
			this.auxAudio.pause()
			return false // now paused
		}
	}

	toggleLoop(): boolean {
		const newLoop = !this.mainAudio.loop
		this.mainAudio.loop = newLoop
		this.auxAudio.loop = newLoop
		return newLoop
	}

	toggleMute(): boolean {
		const newMuted = !this.mainAudio.muted
		this.mainAudio.muted = newMuted
		this.auxAudio.muted = newMuted
		return newMuted
	}

	rewindSound(seconds: number = 5) {
		const newTime = Math.max(0, this.mainAudio.currentTime - seconds)
		this.mainAudio.currentTime = newTime
		this.auxAudio.currentTime = newTime
	}

	forwardSound(seconds: number = 5) {
		const duration = this.mainAudio.duration || 0
		const newTime = Math.min(duration, this.mainAudio.currentTime + seconds)
		this.mainAudio.currentTime = newTime
		this.auxAudio.currentTime = newTime
	}

	seekTo(time: number) {
		this.mainAudio.currentTime = time
		this.auxAudio.currentTime = time
	}

	updateAudioSettings(settings: Settings) {
		this.mainAudio.volume = Math.min((settings.mainOutputVol / 100) * 1.25, 1)
		this.mainAudio.setSinkId?.(settings.mainOutputDeviceId).catch(console.error)

		if (settings.enableAuxOutput && settings.auxOutputDeviceId) {
			this.auxAudio.volume = Math.min((settings.auxOutputVol / 100) * 1.25, 1)
			this.auxAudio.setSinkId?.(settings.auxOutputDeviceId).catch(console.error)
		}
	}

	// Simple getters
	get isPlaying(): boolean {
		return !this.mainAudio.paused
	}

	get isPaused(): boolean {
		return this.mainAudio.paused && this.mainAudio.currentTime > 0
	}

	get isLooping(): boolean {
		return this.mainAudio.loop
	}

	get isMuted(): boolean {
		return this.mainAudio.muted
	}

	get currentTime(): number {
		return this.mainAudio.currentTime
	}

	get duration(): number {
		return this.mainAudio.duration || 0
	}

	destroy() {
		this.stopSound()

		// Clean up all event listeners
		this.mainAudio.removeEventListener('ended', this.endedCallback!)

		// Properly clean up cache
		this.soundCache.forEach((entry) => URL.revokeObjectURL(entry.url))
		this.soundCache.clear()

		// Clean up audio sources if they're blob URLs
		if (this.mainAudio.src && this.mainAudio.src.startsWith('blob:')) {
			URL.revokeObjectURL(this.mainAudio.src)
		}
		if (this.auxAudio.src && this.auxAudio.src.startsWith('blob:')) {
			URL.revokeObjectURL(this.auxAudio.src)
		}
	}
}
