import { create } from 'zustand'
import { Settings } from '@/types'
import { dataStore } from '@/services/storage'
import { subscribeWithSelector } from 'zustand/middleware'
import { faDiscord } from '@fortawesome/free-brands-svg-icons'

const defaultSettings: Settings = {
	mainOutputVol: 100,
	mainOutputDeviceId: 'default',
	enableAuxOutput: false,
	auxOutputVol: 50,
	auxOutputDeviceId: 'communications',
	hotkeys: {
		playPause: '',
		stop: '',
		forward: '',
		rewind: '',
		toggleMute: '',
		toggleLoop: ''
	},
	soundDatabases: [],
	currentDatabase: 'default',
	discord: true,
}

export interface SettingsStore {
	settings: Settings

	setSettings: (settings: Settings) => void
	updateSettings: (partial: Partial<Settings>) => void
	loadSettings: () => Promise<void>
	setCurrentDatabase: (databaseName: string) => void
}

export const useSettingsStore = create<SettingsStore>()(
	subscribeWithSelector((set, get) => ({
		settings: defaultSettings,

		setSettings: (settings) => {
			set({ settings })
			dataStore.saveSettings(settings)
		},

		updateSettings: (partial) => {
			const newSettings = { ...get().settings, ...partial }
			set({ settings: newSettings })
			dataStore.saveSettings(newSettings)
		},

		setCurrentDatabase: (databaseName: string) => {
			const { updateSettings } = get()
			updateSettings({ currentDatabase: databaseName })
		},

		loadSettings: async () => {
			const loadedSettings = dataStore.loadSettings()
			if (loadedSettings) {
				set({ settings: loadedSettings })
			}
		}
	}))
)

useSettingsStore.getState().loadSettings()

useSettingsStore.subscribe(
	(state) => state.settings.discord,
	(discord) => {
		if (discord) {
			window.api.startDiscordRPC()
		} else {
			window.api.stopDiscordRPC()
		}
	}
)
