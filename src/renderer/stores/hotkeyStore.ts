// Partially Verified
import { create } from 'zustand'
import { useSoundStore } from './soundStore'
import { toast } from 'sonner'
import { Sound } from '@/types'
import { useSettingsStore } from './settingsStore'
import { Settings } from '@/types'
export interface HotkeyStore {
	updateHotkeys: (sounds: Sound[]) => Promise<void>
	updateActionHotkeys: (
		actionKeys: { action: keyof Settings['hotkeys']; hotkey: string }[]
	) => Promise<void>
	initializeHotkeyListener: () => (() => void) | void
	togglePause: () => void
}
export const useHotkeyStore = create<HotkeyStore>(() => ({
	updateHotkeys: async (sounds) => {
		try {
			const soundKeys = sounds
				.filter((sound) => !!sound.hotkey)
				.map((sound) => ({
					soundId: sound.id,
					hotkey: sound.hotkey as string
				}))

			await window.api.setSoundHotkeys(soundKeys)
		} catch (error) {
			console.error('Failed to update hotkeys:', error)
			toast.error(
				`Failed to update hotkeys: ${error instanceof Error ? error.message : 'Unknown error'}`,
				{
					description: 'Please check your hotkey settings and try again.'
				}
			)
		}
	},

	updateActionHotkeys: async (actionKeys) => {
		try {
			const validActionKeys = actionKeys.filter((actionKey) => actionKey.hotkey.trim() !== '')
			await window.api.setActionHotkeys(validActionKeys)
		} catch (error) {
			console.error('Failed to update action hotkeys:', error)
			toast.error(
				`Failed to update action hotkeys: ${error instanceof Error ? error.message : 'Unknown error'}`,
				{
					description: 'Please check your action hotkey settings and try again.'
				}
			)
		}
	},

	initializeHotkeyListener: () => {
		const handler = (_event: any, soundId: string) => {
			const { sounds, playSound } = useSoundStore.getState()
			const sound = sounds.find((s) => s.id === soundId)
			if (sound) {
				playSound(sound)
			}
		}

		const actionHandler = (_event: any, action: keyof Settings['hotkeys']) => {
			const { togglePause, toggleLoop, forwardSound, rewindSound, stopSound, toggleMute } =
				useSoundStore.getState()
			const actionFunc: Record<keyof Settings['hotkeys'], () => void> = {
				playPause: togglePause,
				toggleLoop,
				forward: forwardSound,
				rewind: rewindSound,
				stop: stopSound,
				toggleMute: toggleMute
			}

			const func = actionFunc[action]
			if (func) {
				func()
			}
		}

		window.electron.ipcRenderer.on('playSound', handler)
		window.electron.ipcRenderer.on('triggerAction', actionHandler)

		return () => {
			window.electron.ipcRenderer.removeListener('playSound', handler)
			window.electron.ipcRenderer.removeListener('triggerAction', actionHandler)
		}
	},

	togglePause: () => {
		window.api.setSoundHotkeys([])
		window.api.setActionHotkeys([])
	}
}))

// Subscribe to sound store changes
useSoundStore.subscribe(
	(state) => state.sounds,
	(newSounds, oldSounds) => {
		if (newSounds !== oldSounds) {
			useHotkeyStore.getState().updateHotkeys(newSounds)
		}
	}
)

useSettingsStore.subscribe(
	(state) => state.settings.hotkeys,
	(state) => {
		const actionKeys = Object.entries(state)
			.filter(([_, hotkey]) => hotkey.trim() !== '')
			.map(([action, hotkey]) => ({
				action: action as keyof Settings['hotkeys'],
				hotkey: hotkey as string
			}))
		useHotkeyStore.getState().updateActionHotkeys(actionKeys)
	}
)

useHotkeyStore.getState().updateHotkeys(useSoundStore.getState().sounds)
useHotkeyStore.getState().updateActionHotkeys(
	Object.entries(useSettingsStore.getState().settings.hotkeys)
		.filter(([_, hotkey]) => hotkey.trim() !== '')
		.map(([action, hotkey]) => ({
			action: action as keyof Settings['hotkeys'],
			hotkey: hotkey as string
		}))
)

useHotkeyStore.getState().initializeHotkeyListener()
