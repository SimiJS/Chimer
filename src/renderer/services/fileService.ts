import { Sound } from '@/types'
import { Status } from '@/types'

export class FileService {
	/**
	 * Opens file dialog for audio files
	 */
	static async selectAudioFiles(): Promise<Status> {
		try {
			const result = await window.api.openDialog({
				filters: [
					{
						extensions: ['mp3', 'wav', 'ogg'],
						name: 'Audio Files'
					}
				]
			})
			if (!result.success) {
				return { success: false, message: result.message }
			}
			return {
				success: true,
				message: 'Audio files selected successfully',
				data: result.data
			}
		} catch (error) {
			console.error('Failed to select audio files:', error)
			return { success: false, message: 'Failed to select audio files' }
		}
	}

	/**
	 * Opens file dialog for single audio file
	 */
	static async selectAudioFile(): Promise<Status> {
		try {
			const result = await window.api.openDialog({
				filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg'] }]
			})
			if (!result.success) {
				return { success: false, message: result.message }
			}
			return { success: true, message: 'Audio file selected successfully', data: result.data }
		} catch (error) {
			console.error('Failed to select audio file:', error)
			return { success: false, message: 'Failed to select audio file' }
		}
	}

	/**
	 * Opens file dialog for image file
	 */
	static async selectImageFile(): Promise<Status> {
		try {
			const result = await window.api.openDialog({
				filters: [{ name: 'Image Files', extensions: ['png', 'jpg', 'jpeg', 'gif'] }]
			})
			if (!result.success) {
				return { success: false, message: result.message }
			}
			return { success: true, message: 'Image file selected successfully', data: result.data }
		} catch (error) {
			console.error('Failed to select image file:', error)
			return { success: false, message: 'Failed to select image file' }
		}
	}

	/**
	 * Creates a Sound object from a file path
	 */
	static createSoundFromPath(path: string): Omit<Sound, 'id'> {
		const name =
			path
				.split(/[\\\/]/)
				.pop()
				?.replace(/\.[^/.]+$/, '') || 'Unknown Sound'

		return {
			name,
			soundSrc: path,
			imageSrc: '',
			hotkey: ''
		}
	}

	/**
	 * Creates multiple Sound objects from file paths
	 */
	static createSoundsFromPaths(paths: string[]): Omit<Sound, 'id'>[] {
		return paths.map((path) => this.createSoundFromPath(path))
	}
}
