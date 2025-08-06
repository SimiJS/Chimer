import { toast } from 'sonner'
import { useSettings } from '@/hooks/useStores'
import { useSoundStore } from '@/stores/soundStore'
import { DatabaseService } from '@/services/databaseService'
import { Sound, Group, Status } from '@/types'
import { DEFAULT_SOUNDBANK } from '@/constants'
import { useErrorHandler } from './useErrorHandler'

export function useDatabaseOperations() {
	const { settings, updateSettings } = useSettings()
	const { loadDatabase, sounds, groups } = useSoundStore()
	const errorHandler = useErrorHandler()

	const exportDatabase = async (): Promise<string | undefined> => {
		try {
			const result = await DatabaseService.exportDatabase(sounds, groups)

			if (!result.success) {
				errorHandler.handleError(new Error(result.message), 'Failed to export soundbank.')
				return
			}

			if (settings.currentDatabase === DEFAULT_SOUNDBANK.id && result.message) {
				const fileName =
					result.message
						.split(/[\\/]/)
						.pop()
						?.replace(/\.sdb$/, '') || DEFAULT_SOUNDBANK.name
				updateSettings({
					soundDatabases: [
						...settings.soundDatabases,
						{ path: result.message, name: fileName }
					],
					currentDatabase: result.message
				})
				toast.success(`Soundbank Saved.`)
			} else {
				toast.success('Soundbank Exported.')
			}
			return result.data
		} catch (error) {
			errorHandler.handleError(error as Error, 'Failed to export soundbank.')
			return
		}
	}

	const importDatabase = async (path?: string) => {
		try {
			let result: Status
			if (path) {
				result = await DatabaseService.loadDatabase(path)
			} else {
				result = await DatabaseService.importDatabase()
			}

			if (!result.success) {
				toast.error(result.message)
				return
			}

			if (!result.data) {
				toast.error('No database data received')
				return
			}

			if (settings.soundDatabases.some((db) => db.path === result.data!.path)) {
				toast.error('Database already imported')
				return
			}

			updateSettings({
				soundDatabases: [...settings.soundDatabases, result.data]
			})

			toast.success(`Imported database: "${result.data.name}"`)
		} catch (error) {
			errorHandler.handleError(error as Error, 'Failed to import database.')
		}
	}

	const switchDatabase = async (databasePath: string) => {
		try {
			if (databasePath === DEFAULT_SOUNDBANK.id) {
				updateSettings({ currentDatabase: DEFAULT_SOUNDBANK.id })
				loadDatabase({ name: DEFAULT_SOUNDBANK.name, sounds: [], groups: [] })
				toast.success('Switched to default soundbank.')
				return
			}

			const selectedDb = settings.soundDatabases.find((db) => db.path === databasePath)

			if (!selectedDb) {
				toast.error('Database not found in imported list')
				return
			}

			const result = await DatabaseService.loadDatabase(databasePath)

			if (!result.success || !result.data) {
				toast.error(result.message || 'Failed to load database')
				return
			}

			updateSettings({ currentDatabase: databasePath })
			loadDatabase(result.data)
			toast.success(`Switched to database: "${result.data.name}"`)
		} catch (error) {
			errorHandler.handleError(error as Error, 'Failed to switch database.')
		}
	}

	const clearDefault = () => {
		updateSettings({ currentDatabase: DEFAULT_SOUNDBANK.id })
		loadDatabase({ name: DEFAULT_SOUNDBANK.name, sounds: [], groups: [] })
		toast.success('Cleared Default Soundbank.')
	}

	const saveData = async (sounds: Sound[], groups: Group[]): Promise<Status | undefined> => {
		try {
			if (settings.currentDatabase === DEFAULT_SOUNDBANK.id) {
				return { success: true, message: 'No changes to save.' }
			}

			if (!settings.currentDatabase) {
				return { success: false, message: 'No database selected.' }
			}

			const result = await DatabaseService.saveToDatabase(
				settings.currentDatabase,
				sounds,
				groups
			)

			return result
		} catch (error) {
			errorHandler.handleError(error as Error, 'Failed to save data.')
			return { success: false, message: 'Failed to save data.' }
		}
	}

	return {
		exportDatabase,
		importDatabase,
		switchDatabase,
		clearDefault,
		saveData
	}
}
