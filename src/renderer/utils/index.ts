import { useSettingsStore } from '@/stores/settingsStore'
import { useSoundStore } from '@/stores/soundStore'
import { Settings, Sound } from '@/types'

class Tools {
	getHotkeyHolder(hotkey: string): Sound | keyof Settings['hotkeys'] | undefined {
		const soundStore = useSoundStore.getState()
		const settingsStore = useSettingsStore.getState()

		const soundHotkey = soundStore.sounds.find((sound) => sound.hotkey === hotkey)
		if (soundHotkey) return soundHotkey

		const actionHotkey = Object.keys(settingsStore.settings.hotkeys).find(
			(key) => settingsStore.settings.hotkeys[key as keyof Settings['hotkeys']] === hotkey
		) as keyof Settings['hotkeys'] | undefined

		return actionHotkey
	}
}

export const tools = new Tools()
