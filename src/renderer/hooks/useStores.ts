import { useSoundStore } from '@/stores/soundStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useHotkeyStore } from '@/stores/hotkeyStore'
import { useErrorHandler } from './useErrorHandler'
import { Sound } from '@/types'

export function useSound() {
	const { handleError } = useErrorHandler()
	const store = useSoundStore()

	// Wrap async methods with simple error handling
	const playSound = async (sound: Sound) => {
		await store.playSound(sound)
	}

	const previewSound = async (sound: Sound) => {
		await store.previewSound(sound)
	}

	const previewYoutube = async (sound: Sound) => {
		await store.previewYoutube(sound)
	}

	const getImage = async (imageSrc: string) => {
		try {
			return await store.getImage(imageSrc)
		} catch (error) {
			handleError(error as Error, 'Loading image')
			return
		}
	}

	return {
		// State
		sounds: store.sounds,
		groups: store.groups,
		selectedGroup: store.selectedGroup,
		currentSound: store.audio.currentSound,
		isPlaying: store.audio.isPlaying,
		isLooping: store.audio.isLooping,

		// Data actions
		setSounds: store.setSounds,
		addSound: store.addSound,
		updateSound: store.updateSound,
		removeSound: store.removeSound,
		addGroup: store.addGroup,
		updateGroup: store.updateGroup,
		removeGroup: store.removeGroup,
		addSoundToGroup: store.addSoundToGroup,
		removeSoundFromGroup: store.removeSoundFromGroup,
		setSelectedGroup: store.setSelectedGroup,

		// Audio actions (with error handling)
		playSound,
		previewSound,
		previewYoutube,
		stopSound: store.stopSound,
		togglePause: store.togglePause,
		toggleLoop: store.toggleLoop,
		toggleMute: store.toggleMute,
		rewindSound: store.rewindSound,
		forwardSound: store.forwardSound,

		// Utilities
		getImage,
		getGroupedSounds: store.getGroupedSounds
	}
}
export { useSettingsStore as useSettings }
export { useHotkeyStore as useHotkeys }

// Specific selectors for common use cases
export const useAudioState = () => useSoundStore((state) => state.audio)
export const useSounds = () => useSoundStore((state) => state.sounds)
export const useGroups = () => useSoundStore((state) => state.groups)
export const useSelectedGroup = () => useSoundStore((state) => state.selectedGroup)
