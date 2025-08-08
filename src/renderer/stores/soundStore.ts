import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { toast } from 'sonner'
import { Sound, Group, GroupSelection, Settings, Database } from '@/types'
import { useSettingsStore } from './settingsStore'
import { dataStore } from '@/services/storage'
import { DatabaseService } from '@/services/databaseService'

// Cache management constants
const MAX_CACHE_SIZE = 100 // Maximum number of cached items
const CACHE_CLEANUP_THRESHOLD = 0.8 // Clean when 80% full

interface PlayState {
	promise: Promise<void>
	controller: AbortController
}

let currentPlayState: PlayState | null = null

export interface AudioState {
	currentSound: Sound | null
	isPlaying: boolean
	isLooping: boolean
	isPaused: boolean
}

export interface SoundStore {
	// Data State
	audio: AudioState
	sounds: Sound[]
	groups: Group[]
	selectedGroup: GroupSelection

	// Audio Refs (directly accessing these may break synchronization)
	audioRef: HTMLAudioElement | null
	auxAudioRef: HTMLAudioElement | null

	// Caches
	soundCache: Map<string, string>
	imageCache: Map<string, string>

	// State Management Functions
	setSounds: (sounds: Sound[]) => void
	addSound: (sound: Sound) => void
	updateSound: (sound: Sound) => void
	removeSound: (soundId: string) => void

	addGroup: (group: Group) => void
	updateGroup: (group: Group) => void
	removeGroup: (groupId: string) => void

	addSoundToGroup: (soundId: string, groupId: string) => void
	removeSoundFromGroup: (soundId: string, groupId: string) => void

	setSelectedGroup: (group: GroupSelection) => void

	// Main AudioEngine functions
	startEngine: () => void
	playSound: (sound: Sound) => Promise<void>
	previewSound: (sound: Sound) => Promise<void>
	previewYoutube: (sound: Sound) => Promise<void>
	stopSound: () => void
	togglePause: () => void
	toggleLoop: () => void
	toggleMute: () => void
	rewindSound: () => void
	forwardSound: () => void

	// Utility Actions
	getImage: (imageSrc: string) => Promise<string | undefined>
	getGroupedSounds: () => Sound[]

	// Audio settings functions
	updateAudioSettings: (settings: Settings) => void
	loadDatabase: (data: Database) => void
}

// Helper function to clean up old cache entries when cache is getting full
const cleanOldCacheEntries = (cache: Map<string, string>) => {
	if (cache.size >= MAX_CACHE_SIZE * CACHE_CLEANUP_THRESHOLD) {
		// Convert to array, sort by insertion order (Map maintains insertion order)
		// and remove the oldest 25% of entries
		const entries = Array.from(cache.entries())
		const entriesToRemove = Math.floor(cache.size * 0.25)

		for (let i = 0; i < entriesToRemove; i++) {
			const [key, url] = entries[i]
			URL.revokeObjectURL(url)
			cache.delete(key)
		}
	}
}

export const useSoundStore = create<SoundStore>()(
	subscribeWithSelector((set, get) => ({
		// Initial state
		sounds: dataStore.loadSounds(),
		groups: dataStore.loadGroups(),
		selectedGroup: 'All',

		audio: {
			currentSound: null,
			isPlaying: false,
			isLooping: false,
			isPaused: false
		},

		audioRef: null,
		auxAudioRef: null,
		soundCache: new Map(),
		imageCache: new Map(),

		// State management functions
		setSounds: (sounds) => {
			set({ sounds })
			dataStore.saveSounds(sounds)
		},

		addSound: (sound) => {
			const currentSounds = get().sounds
			const newSounds = [...currentSounds, sound]
			set({ sounds: newSounds })
			dataStore.saveSounds(newSounds)
		},

		updateSound: (sound) => {
			const newSounds = get().sounds.map((s) => (s.id === sound.id ? sound : s))
			set({ sounds: newSounds })
			dataStore.saveSounds(newSounds)
		},

		removeSound: (soundId) => {
			// Remove sound from groups
			const newGroups = get().groups.map((group) => ({
				...group,
				soundIds: group.soundIds.filter((id) => id !== soundId)
			}))

			// Remove from sounds
			const newSounds = get().sounds.filter((s) => s.id !== soundId)

			set({
				sounds: newSounds,
				groups: newGroups
			})

			dataStore.saveSounds(newSounds)
			dataStore.saveGroups(newGroups)
		},

		addGroup: (group) => {
			const newGroups = [...get().groups, group]
			set({ groups: newGroups })
			dataStore.saveGroups(newGroups)
		},

		updateGroup: (group) => {
			const newGroups = get().groups.map((g) => (g.id === group.id ? group : g))
			set({ groups: newGroups })
			dataStore.saveGroups(newGroups)
		},

		removeGroup: (groupId) => {
			const newGroups = get().groups.filter((g) => g.id !== groupId)
			set({ groups: newGroups })
			dataStore.saveGroups(newGroups)
		},

		addSoundToGroup: (soundId, groupId) => {
			const newGroups = get().groups.map((group) =>
				group.id === groupId ? { ...group, soundIds: [...group.soundIds, soundId] } : group
			)
			set({ groups: newGroups })
			dataStore.saveGroups(newGroups)
		},

		removeSoundFromGroup: (soundId, groupId) => {
			const newGroups = get().groups.map((group) =>
				group.id === groupId
					? { ...group, soundIds: group.soundIds.filter((id) => id !== soundId) }
					: group
			)
			set({ groups: newGroups })
			dataStore.saveGroups(newGroups)
		},

		setSelectedGroup: (selectedGroup) => {
			set({ selectedGroup })
		},

		// Main AudioEngine Actions
		startEngine: () => {
			if (!get().audioRef) {
				const audioRef = new Audio()
				const auxAudioRef = new Audio()

				// Add ended event listener with cleanup tracking
				const endedHandler = () => {
					set((state) => ({
						audio: {
							...state.audio,
							currentSound: null,
							isPlaying: false
						}
					}))
				}

				audioRef.addEventListener('ended', endedHandler)

				// Store cleanup function for later use
				;(audioRef as any).__endedHandler = endedHandler

				set({ audioRef, auxAudioRef })
			}
		},

		playSound: async (sound) => {
			if (!sound.soundSrc) return

			// Cancel any existing play operation
			if (currentPlayState) {
				currentPlayState.controller.abort()
				currentPlayState = null
			}

			const { stopSound, audioRef, auxAudioRef, soundCache, audio } = get()
			const abortController = new AbortController()

			stopSound()

			// Create and store the new promise
			const playPromise = (async () => {
				if (abortController.signal.aborted) throw new DOMException('Aborted', 'AbortError')

				let audioUrl = soundCache.get(sound.soundSrc)
				if (!audioUrl) {
					const fileData = await window.api.readData(sound.soundSrc)
					if (!fileData.success) {
						toast.error(fileData.message)
						return
					}
					if (abortController.signal.aborted)
						throw new DOMException('Aborted', 'AbortError')

					audioUrl = URL.createObjectURL(new Blob([new Uint8Array(fileData.data)]))
					cleanOldCacheEntries(soundCache)
					soundCache.set(sound.soundSrc, audioUrl)
				}

				const audioElements = [audioRef, auxAudioRef].filter(Boolean) as HTMLAudioElement[]

				await Promise.all(
					audioElements.map(async (audioEl) => {
						if (abortController.signal.aborted)
							throw new DOMException('Aborted', 'AbortError')

						audioEl.volume
						audioEl.src = audioUrl!
						audioEl.loop = audio.isLooping
						audioEl.load()
						await audioEl.play()
					})
				)

				if (abortController.signal.aborted) throw new DOMException('Aborted', 'AbortError')

				set((state) => ({
					audio: {
						...state.audio,
						currentSound: sound,
						isPlaying: true
					}
				}))
			})()

			currentPlayState = { promise: playPromise, controller: abortController }

			try {
				await playPromise
			} catch (error) {
				// Only show errors that aren't from cancellation/abort
				if (error instanceof Error && error.name !== 'AbortError') {
					console.error('Failed to play sound:', error)
					throw error
				}
			} finally {
				// Clear the promise when done
				if (currentPlayState?.controller === abortController) {
					currentPlayState = null
				}
			}
		},

		previewSound: async (sound) => {
			const { audioRef, audio, stopSound } = get()

			if (audio.currentSound?.id === sound.id) {
				stopSound()
				return
			}

			stopSound()

			try {
				if (audioRef) {
					audioRef.src = sound.soundSrc
					audioRef.currentTime = 0
					audioRef.loop = false
					await audioRef.play()

					set((state) => ({
						audio: {
							...state.audio,
							currentSound: sound,
							isPlaying: true
						}
					}))
				}
			} catch (error) {
				console.error('Failed to preview sound:', error)
				throw error
			}
		},

		previewYoutube: async (sound: Sound) => {
			const { audioRef, audio, stopSound, soundCache } = get()

			stopSound()
			if (audio.currentSound?.id === sound.id) {
				return
			}

			let soundSrc = sound.soundSrc
			if (soundCache.has(sound.id)) {
				soundSrc = soundCache.get(sound.id) ?? sound.soundSrc
			} else {
				const audioData = await window.api.previewYoutube(sound.soundSrc)
				soundSrc = URL.createObjectURL(
					new Blob([new Uint8Array(audioData)], { type: 'audio/mpeg' })
				)
			}

			try {
				if (audioRef) {
					audioRef.src = soundSrc
					audioRef.currentTime = 0
					audioRef.loop = false
					await audioRef.play()

					set((state) => ({
						audio: {
							...state.audio,
							currentSound: sound,
							isPlaying: true
						}
					}))
				}
			} catch (error) {
				console.error('Failed to preview sound:', error)
				throw error
			}
			if (!soundCache.has(sound.id)) {
				cleanOldCacheEntries(soundCache)
				soundCache.set(sound.id, soundSrc)
			}
		},

		stopSound: () => {
			const { audioRef, auxAudioRef } = get()

			;[audioRef, auxAudioRef].filter(Boolean).forEach((audioEl) => {
				audioEl!.pause()
				audioEl!.currentTime = 0
				audioEl!.src = ''
			})

			set((state) => ({
				audio: {
					...state.audio,
					currentSound: null,
					isPlaying: false
				}
			}))
		},

		togglePause: () => {
			const { audioRef, auxAudioRef, audio } = get()

			if (!audio.currentSound) return

			const audioElements = [audioRef, auxAudioRef].filter(Boolean) as HTMLAudioElement[]
			const isPaused = audioRef?.paused ?? true

			if (isPaused) {
				audioElements.forEach((audioEl) => audioEl.play().catch(console.error))
				set((state) => ({ audio: { ...state.audio, isPlaying: true } }))
			} else {
				audioElements.forEach((audioEl) => audioEl.pause())
				set((state) => ({ audio: { ...state.audio, isPlaying: false } }))
			}
		},

		toggleLoop: () => {
			const { audioRef, auxAudioRef, audio } = get()
			const newLoop = !audio.isLooping

			;[audioRef, auxAudioRef].filter(Boolean).forEach((audioEl) => {
				audioEl!.loop = newLoop
			})

			set((state) => ({
				audio: { ...state.audio, isLooping: newLoop }
			}))
		},

		toggleMute: () => {
			const { audioRef, auxAudioRef } = get()
			const newMuted = !audioRef?.muted

			;[audioRef, auxAudioRef].filter(Boolean).forEach((audioEl) => {
				audioEl!.muted = newMuted
			})
		},

		rewindSound: () => {
			const { audioRef, auxAudioRef } = get()
			if (audioRef) {
				const newTime = Math.max(0, audioRef.currentTime - 5)
				;[audioRef, auxAudioRef].filter(Boolean).forEach((audioEl) => {
					audioEl!.currentTime = newTime
				})
			}
		},

		forwardSound: () => {
			const { audioRef, auxAudioRef } = get()
			if (audioRef) {
				const duration = audioRef.duration || 0
				const newTime = Math.min(duration, audioRef.currentTime + 5)
				;[audioRef, auxAudioRef].filter(Boolean).forEach((audioEl) => {
					audioEl!.currentTime = newTime
				})
			}
		},

		// Utility Functions
		getImage: async (imageSrc) => {
			if (!imageSrc) return undefined

			const { imageCache } = get()
			const cached = imageCache.get(imageSrc)
			if (cached) return cached

			try {
				const fileData = await window.api.readData(imageSrc)
				if (!fileData.success) {
					toast.error(fileData.message)
					return
				}
				const imageUrl = URL.createObjectURL(new Blob([new Uint8Array(fileData.data)]))
				cleanOldCacheEntries(imageCache)
				imageCache.set(imageSrc, imageUrl)
				return imageUrl
			} catch (error) {
				console.error('Failed to load image:', error)
				return undefined
			}
		},

		getGroupedSounds: () => {
			const { sounds, groups, selectedGroup } = get()

			if (selectedGroup === 'All') return sounds

			if (selectedGroup === 'Ungrouped') {
				const groupedSoundIds = new Set(groups.flatMap((group) => group.soundIds))
				return sounds.filter((sound) => !groupedSoundIds.has(sound.id))
			}

			const group = groups.find((g) => g.id === selectedGroup || g.name === selectedGroup)
			return group ? sounds.filter((sound) => group.soundIds.includes(sound.id)) : []
		},

		updateAudioSettings: (settings: Settings) => {
			const { audioRef, auxAudioRef } = get()

			if (audioRef) {
				audioRef.volume = Math.min((settings.mainOutputVol / 100) * 1.25, 1)
				audioRef.setSinkId?.(settings.mainOutputDeviceId).catch(console.error)
			}

			if (settings.enableAuxOutput && auxAudioRef && settings.auxOutputDeviceId) {
				auxAudioRef.volume = Math.min((settings.auxOutputVol / 100) * 1.25, 1)
				auxAudioRef.setSinkId?.(settings.auxOutputDeviceId).catch(console.error)
			}
		},

		loadDatabase: (data: Database) => {
			set({
				sounds: data.sounds,
				groups: data.groups
			})

			dataStore.saveSounds(data.sounds)
			dataStore.saveGroups(data.groups)

			toast.success(`Loaded database: ${data.name}`)
		}
	}))
)

// Start the audio system
useSoundStore.getState().startEngine()

// Synchronize audio settings with the settings store
useSettingsStore.subscribe((state) => {
	useSoundStore.getState().updateAudioSettings(state.settings)
})

Promise.resolve().then(() => {
	useSoundStore.getState().updateAudioSettings(useSettingsStore.getState().settings)
})

useSoundStore.subscribe(
	(state) => ({ sounds: state.sounds, groups: state.groups }),
	(current) => {
		const currentDatabase = useSettingsStore.getState().settings.currentDatabase
		DatabaseService.autoSave(currentDatabase, current.sounds, current.groups)
	}
)

useSoundStore.subscribe(
	(state) => state.audio.currentSound,
	async (currentSound) => {
		if (currentSound && useSettingsStore.getState().settings.discord) {
			let largeImageKey = currentSound.imageSrc?.startsWith('http')
				? currentSound.imageSrc
				: undefined

			window.api.setDiscordActivity({
				details: 'Playing',
				state: currentSound.name,
				largeImageKey
			})
		} else if (!currentSound && useSettingsStore.getState().settings.discord) {
			window.api.clearDiscordActivity()
		}
	}
)
