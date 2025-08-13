import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { toast } from 'sonner'
import { Sound, Group, GroupSelection, Settings, Database } from '@/types'
import { useSettingsStore } from './settingsStore'
import { dataStore } from '@/services/storage'
import { DatabaseService } from '@/services/databaseService'
import { audioEngine } from './audioEngine'

// Cache management constants
const MAX_CACHE_SIZE = 100 // Maximum number of cached items
const CACHE_CLEANUP_THRESHOLD = 0.8 // Clean when 80% full

// Legacy PlayState removed; AudioEngine handles playback lifecycle

export interface AudioState {
	currentSound: Sound | null
	isPlaying: boolean
	isLooping: boolean
	isPaused: boolean
	rate: number
}

export interface SoundStore {
	// Data State
	audio: AudioState
	sounds: Sound[]
	groups: Group[]
	selectedGroup: GroupSelection

	// Caches (blob URL only)
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
	changeRate: (rate: number) => void

	parseSoundSource: (sound: Sound) => Promise<string>

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
			isPaused: false,
			rate: 100 // percent (100 = 1.00x)
		},

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
			audioEngine.onEnded(() => {
				set((state) => ({
					audio: { ...state.audio, currentSound: null, isPlaying: false }
				}))
			})
		},

		playSound: async (sound) => {
			if (!sound.soundSrc) return
			try {
				const path = await get().parseSoundSource(sound)
				await audioEngine.play(path, get().audio.isLooping)
				set((state) => ({
					audio: { ...state.audio, currentSound: sound, isPlaying: true }
				}))
			} catch (e) {
				toast.error('Failed to play sound')
				console.error(e)
			}
		},

		previewSound: async (sound) => {
			const { audio, stopSound } = get()
			if (audio.currentSound?.id === sound.id) {
				stopSound()
				return
			}
			stopSound()
			try {
				const path = await get().parseSoundSource(sound)
				await audioEngine.play(path, false)
				set((state) => ({
					audio: { ...state.audio, currentSound: sound, isPlaying: true }
				}))
			} catch (e) {
				console.error('Failed to preview sound', e)
				toast.error('Preview failed')
			}
		},

		previewYoutube: async (sound: Sound) => {
			const { audio, stopSound, soundCache } = get()
			stopSound()
			if (audio.currentSound?.id === sound.id) return
			let soundPath = sound.soundSrc
			if (!soundCache.has(sound.id)) {
				const audioData = await window.api.previewYoutube(sound.soundSrc)
				const blobUrl = URL.createObjectURL(
					new Blob([new Uint8Array(audioData)], { type: 'audio/mpeg' })
				)
				cleanOldCacheEntries(soundCache)
				soundCache.set(sound.id, blobUrl)
				soundPath = blobUrl
			} else {
				soundPath = soundCache.get(sound.id) || sound.soundSrc
			}
			try {
				await audioEngine.play(soundPath, false)
				set((state) => ({
					audio: { ...state.audio, currentSound: sound, isPlaying: true }
				}))
			} catch (e) {
				console.error('Failed to preview youtube', e)
				toast.error('Preview failed')
			}
		},

		stopSound: () => {
			audioEngine.stop()
			set((state) => ({ audio: { ...state.audio, currentSound: null, isPlaying: false } }))
		},

		togglePause: () => {
			const { audio } = get()
			if (!audio.currentSound) return
			if (audioEngine.isPlaying()) {
				audioEngine.pause()
				set((state) => ({ audio: { ...state.audio, isPlaying: false } }))
			} else {
				audioEngine.resume()
				set((state) => ({ audio: { ...state.audio, isPlaying: true } }))
			}
		},

		toggleLoop: () => {
			const newLoop = !get().audio.isLooping
			audioEngine.setLooping(newLoop)
			set((state) => ({ audio: { ...state.audio, isLooping: newLoop } }))
		},

		toggleMute: () => {
			const muted = (audioEngine as any)._muted
			;(audioEngine as any)._muted = !muted
			const factor = (audioEngine as any)._muted ? 0 : 1
			;(audioEngine as any).mainOutputGain.gain.value = factor
			;(audioEngine as any).auxOutputGain.gain.value = (audioEngine as any).auxEnabled
				? factor
				: 0
		},

		rewindSound: () => {
			audioEngine.rewind(5)
		},

		forwardSound: () => {
			audioEngine.forward(5)
		},

		changeRate: (percent: number) => {
			audioEngine.setPlaybackRatePercent(percent)
			set((state) => ({
				audio: { ...state.audio, rate: audioEngine.getPlaybackRatePercent() }
			}))
		},

		// Decide whether we use cache, pass it raw, or read from main proc
		parseSoundSource: async (sound: Sound): Promise<string> => {
			let src = sound.soundSrc
			if (!src) return ''
			if (src.startsWith('blob:') || src.startsWith('http')) return src
			const cache = get().soundCache
			if (cache.has(src)) {
				return cache.get(src)!
			}
			try {
				const fileData = await window.api.readData(src)
				if (!fileData.success) throw new Error(fileData.message)
				const blobUrl = URL.createObjectURL(
					new Blob([new Uint8Array(fileData.data)], { type: 'audio/ogg' })
				)
				cleanOldCacheEntries(cache)
				cache.set(src, blobUrl)
				return blobUrl
			} catch (err) {
				console.error('Failed to cache sound path, falling back to direct path', err)
				return src
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
			audioEngine.setAuxEnabled(settings.enableAuxOutput)
			audioEngine.setOutputVolumes(settings.mainOutputVol, settings.auxOutputVol)
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
