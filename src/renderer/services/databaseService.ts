import { Sound, Group, Status } from '@/types'

export interface DatabaseData {
	name: string
	sounds: Sound[]
	groups: Group[]
}

export interface DatabaseInfo {
	name: string
	path: string
}

export class DatabaseService {
	/**
	 * Validates database data structure
	 */
	static validateDatabaseData(data: unknown): data is DatabaseData {
		if (!data || typeof data !== 'object') return false

		const candidate = data as Record<string, unknown>

		return (
			typeof candidate.name === 'string' &&
			Array.isArray(candidate.sounds) &&
			Array.isArray(candidate.groups) &&
			candidate.sounds.every(
				(sound: unknown) =>
					sound &&
					typeof sound === 'object' &&
					typeof (sound as any).id === 'string' &&
					typeof (sound as any).name === 'string' &&
					typeof (sound as any).soundSrc === 'string'
			) &&
			candidate.groups.every(
				(group: unknown) =>
					group &&
					typeof group === 'object' &&
					typeof (group as any).id === 'string' &&
					typeof (group as any).name === 'string' &&
					Array.isArray((group as any).soundIds)
			)
		)
	}

	/**
	 * Creates a new database file
	 */
	static async createDatabase(name: string, sounds: Sound[], groups: Group[]): Promise<Status> {
		try {
			const trimmedName = name.trim()
			if (!trimmedName) {
				return { success: false, message: 'Database name cannot be empty' }
			}

			// Open save dialog
			const result = await window.api.saveDialog({
				filters: [{ name: 'Sound Database', extensions: ['sdb'] }]
			})

			if (!result.success) {
				return {
					success: false,
					message: result.message || 'Failed to select save location'
				}
			}

			// Create database data
			const databaseData: DatabaseData = {
				name: trimmedName,
				sounds: sounds || [],
				groups: groups || []
			}

			// Write file
			const jsonString = JSON.stringify(databaseData, null, 2)
			const buffer = new TextEncoder().encode(jsonString).buffer as ArrayBuffer
			const writeResult = await window.api.writeData(result.data, buffer)

			if (!writeResult.success) {
				return {
					success: false,
					message: writeResult.message || 'Failed to create database file'
				}
			}

			return { success: true, message: 'Database created', data: result.data }
		} catch (error) {
			console.error('Database creation failed:', error)
			return { success: false, message: 'Failed to create database' }
		}
	}

	/**
	 * Imports an existing database file
	 */
	static async importDatabase(): Promise<Status> {
		try {
			const result = await window.api.openDialog({
				filters: [{ name: 'Sound Database', extensions: ['sdb'] }]
			})

			if (!result.success) {
				if (result.message !== 'No file selected.') {
					return { success: false, message: result.message || 'Failed to select file' }
				}
				return { success: false, message: 'No file selected' }
			}

			// Load and validate file
			const fileData = await window.api.readData(result.data)
			if (!fileData.success) {
				return { success: false, message: fileData.message || 'Failed to read file' }
			}

			let databaseData: DatabaseData
			try {
				databaseData = JSON.parse(new TextDecoder().decode(fileData.data))
			} catch (parseError) {
				return { success: false, message: 'Invalid JSON format' }
			}

			if (!this.validateDatabaseData(databaseData)) {
				return { success: false, message: 'Invalid database format' }
			}

			return {
				success: true,
				message: 'Database imported',
				data: { path: result.data, name: databaseData.name }
			}
		} catch (error) {
			console.error('Import failed:', error)
			return { success: false, message: 'Failed to import database' }
		}
	}

	/**
	 * Loads database data from file
	 */
	static async loadDatabase(path: string): Promise<Status> {
		try {
			const fileData = await window.api.readData(path)
			if (!fileData.success) {
				return {
					success: false,
					message: fileData.message || 'Failed to load database file'
				}
			}

			let databaseData: DatabaseData
			try {
				databaseData = JSON.parse(new TextDecoder().decode(fileData.data))
			} catch (parseError) {
				return { success: false, message: 'Corrupted database file - invalid JSON' }
			}

			if (!this.validateDatabaseData(databaseData)) {
				return { success: false, message: 'Corrupted database file - invalid format' }
			}

			return { success: true, message: 'Database loaded', data: databaseData }
		} catch (error) {
			console.error('Database load failed:', error)
			return { success: false, message: 'Failed to load database' }
		}
	}

	/**
	 * Exports current data to a database file
	 */
	static async exportDatabase(
		sounds: Sound[],
		groups: Group[],
		defaultName?: string
	): Promise<Status> {
		try {
			if (!sounds?.length && !groups?.length) {
				return { success: false, message: 'No sounds or groups to export' }
			}

			const result = await window.api.saveDialog({
				filters: [{ name: 'Sound Database', extensions: ['sdb'] }]
			})

			if (!result.success) {
				return {
					success: false,
					message: result.message || 'Failed to select save location'
				}
			}

			// Extract name from file path or use default
			const fileName =
				result.data
					.split(/[\\/]/)
					.pop()
					?.replace(/\.sdb$/, '') ||
				defaultName ||
				'Database'

			const databaseData: DatabaseData = {
				name: fileName,
				sounds: sounds || [],
				groups: groups || []
			}

			const jsonString = JSON.stringify(databaseData, null, 2)
			const buffer = new TextEncoder().encode(jsonString).buffer as ArrayBuffer
			const writeResult = await window.api.writeData(result.data, buffer)

			if (!writeResult.success) {
				return {
					success: false,
					message: writeResult.message || 'Failed to write database file'
				}
			}

			return { success: true, message: 'Database exported', data: result.data }
		} catch (error) {
			console.error('Export failed:', error)
			return { success: false, message: 'Failed to export database' }
		}
	}

	/**
	 * Saves data to an existing database file
	 */
	static async saveToDatabase(path: string, sounds: Sound[], groups: Group[]): Promise<Status> {
		try {
			// First load the existing database to get the name
			const loadResult = await this.loadDatabase(path)
			if (!loadResult.success || !loadResult.data) {
				return {
					success: false,
					message: (loadResult as Status).message || 'Failed to load existing database'
				}
			}

			// Create updated database data
			const databaseData: DatabaseData = {
				name: loadResult.data.name,
				sounds: sounds || [],
				groups: groups || []
			}

			// Write updated data back to file
			const jsonString = JSON.stringify(databaseData, null, 2)
			const buffer = new TextEncoder().encode(jsonString).buffer as ArrayBuffer
			const writeResult = await window.api.writeData(path, buffer)

			if (!writeResult.success) {
				return {
					success: false,
					message: writeResult.message || 'Failed to save database file'
				}
			}

			return { success: true, message: 'Database saved' }
		} catch (error) {
			console.error('Save to database failed:', error)
			return { success: false, message: 'Failed to save to database' }
		}
	}

	/**
	 * Adds a single sound to an existing database
	 */
	static async addSoundToDatabase(path: string, sound: Sound): Promise<Status> {
		try {
			const loadResult = await this.loadDatabase(path)
			if (!loadResult.success || !loadResult.data) {
				return {
					success: false,
					message: (loadResult as Status).message || 'Failed to load database'
				}
			}

			const updatedSounds = [...loadResult.data.sounds, sound]
			return await this.saveToDatabase(path, updatedSounds, loadResult.data.groups)
		} catch (error) {
			console.error('Add sound to database failed:', error)
			return { success: false, message: 'Failed to add sound to database' }
		}
	}

	/**
	 * Updates a sound in an existing database
	 */
	static async updateSoundInDatabase(path: string, updatedSound: Sound): Promise<Status> {
		try {
			const loadResult = await this.loadDatabase(path)
			if (!loadResult.success || !loadResult.data) {
				return {
					success: false,
					message: (loadResult as Status).message || 'Failed to load database'
				}
			}

			const updatedSounds = loadResult.data.sounds.map((sound) =>
				sound.id === updatedSound.id ? updatedSound : sound
			)

			return await this.saveToDatabase(path, updatedSounds, loadResult.data.groups)
		} catch (error) {
			console.error('Update sound in database failed:', error)
			return { success: false, message: 'Failed to update sound in database' }
		}
	}

	/**
	 * Removes a sound from an existing database
	 */
	static async removeSoundFromDatabase(path: string, soundId: string): Promise<Status> {
		try {
			const loadResult = await this.loadDatabase(path)
			if (!loadResult.success || !loadResult.data) {
				return {
					success: false,
					message: (loadResult as Status).message || 'Failed to load database'
				}
			}

			const updatedSounds = loadResult.data.sounds.filter((sound) => sound.id !== soundId)
			return await this.saveToDatabase(path, updatedSounds, loadResult.data.groups)
		} catch (error) {
			console.error('Remove sound from database failed:', error)
			return { success: false, message: 'Failed to remove sound from database' }
		}
	}

	/**
	 * Adds a group to an existing database
	 */
	static async addGroupToDatabase(path: string, group: Group): Promise<Status> {
		try {
			const loadResult = await this.loadDatabase(path)
			if (!loadResult.success || !loadResult.data) {
				return {
					success: false,
					message: (loadResult as Status).message || 'Failed to load database'
				}
			}

			const updatedGroups = [...loadResult.data.groups, group]
			return await this.saveToDatabase(path, loadResult.data.sounds, updatedGroups)
		} catch (error) {
			console.error('Add group to database failed:', error)
			return { success: false, message: 'Failed to add group to database' }
		}
	}

	/**
	 * Updates a group in an existing database
	 */
	static async updateGroupInDatabase(path: string, updatedGroup: Group): Promise<Status> {
		try {
			const loadResult = await this.loadDatabase(path)
			if (!loadResult.success || !loadResult.data) {
				return {
					success: false,
					message: (loadResult as Status).message || 'Failed to load database'
				}
			}

			const updatedGroups = loadResult.data.groups.map((group) =>
				group.id === updatedGroup.id ? updatedGroup : group
			)

			return await this.saveToDatabase(path, loadResult.data.sounds, updatedGroups)
		} catch (error) {
			console.error('Update group in database failed:', error)
			return { success: false, message: 'Failed to update group in database' }
		}
	}

	/**
	 * Removes a group from an existing database
	 */
	static async removeGroupFromDatabase(path: string, groupId: string): Promise<Status> {
		try {
			const loadResult = await this.loadDatabase(path)
			if (!loadResult.success || !loadResult.data) {
				return {
					success: false,
					message: (loadResult as Status).message || 'Failed to load database'
				}
			}

			const updatedGroups = loadResult.data.groups.filter((group) => group.id !== groupId)
			return await this.saveToDatabase(path, loadResult.data.sounds, updatedGroups)
		} catch (error) {
			console.error('Remove group from database failed:', error)
			return { success: false, message: 'Failed to remove group from database' }
		}
	}

	/**
	 * Auto-saves current data to the active database (utility for store subscriptions)
	 */
	static async autoSave(
		currentDatabasePath: string | undefined,
		sounds: Sound[],
		groups: Group[]
	): Promise<void> {
		try {
			// Skip if pseudo soundbank or no database selected
			if (!currentDatabasePath || currentDatabasePath === 'default') {
				return
			}

			await this.saveToDatabase(currentDatabasePath, sounds, groups)
		} catch (error) {
			console.error('Auto-save failed:', error)
			// Silent fail for auto-save to avoid interrupting user experience
		}
	}
}
