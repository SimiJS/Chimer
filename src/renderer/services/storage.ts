import { useErrorHandler } from '@/hooks/useErrorHandler'
import { Group, Settings, Sound } from '@/types'

const SOUNDS_STORAGE_KEY = 'local_sounds' as const
const GROUPS_STORAGE_KEY = 'local_groups' as const
const SETTINGS_STORAGE_KEY = 'settings' as const

export const dataStore = {
	// Simple CRUD operations
	saveSounds(sounds: readonly Sound[]): void {
		try {
			localStorage.setItem(SOUNDS_STORAGE_KEY, JSON.stringify(sounds))
		} catch (error) {
			useErrorHandler().handleError(error as Error, 'Saving sounds')
		}
	},

	loadSounds(): Sound[] {
		try {
			const stored = localStorage.getItem(SOUNDS_STORAGE_KEY)
			return stored ? JSON.parse(stored) : []
		} catch (error) {
			useErrorHandler().handleError(error as Error, 'Loading sounds')
			return []
		}
	},

	saveGroups(groups: readonly Group[]): void {
		try {
			localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups))
		} catch (error) {
			useErrorHandler().handleError(error as Error, 'Saving groups')
		}
	},

	loadGroups(): Group[] {
		try {
			const stored = localStorage.getItem(GROUPS_STORAGE_KEY)
			return stored ? JSON.parse(stored) : []
		} catch (error) {
			useErrorHandler().handleError(error as Error, 'Loading groups')
			return []
		}
	},

	saveSettings(settings: Settings): void {
		try {
			localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
		} catch (error) {
			useErrorHandler().handleError(error as Error, 'Saving settings')
		}
	},

	loadSettings(): Settings | null {
		try {
			const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
			return stored ? JSON.parse(stored) : null
		} catch (error) {
			useErrorHandler().handleError(error as Error, 'Loading settings')
			return null
		}
	}
}
