import { useCallback } from 'react'
import { toast } from 'sonner'
import { FileService } from '@/services/fileService'
import { useSound } from '@/hooks/useStores'
import { Sound } from '@/types'
import { typeTools } from '@/types/tools'
import { useErrorHandler } from './useErrorHandler'

export interface FileOperations {
	addFiles: () => Promise<void>
	selectAudioFile: () => Promise<string | null>
	selectImageFile: () => Promise<string | null>
}

export function useFileOperations(): FileOperations {
	const { addSound, addSoundToGroup, selectedGroup } = useSound()

	const addFiles = useCallback(async () => {
		try {
			const result = await FileService.selectAudioFiles()

			if (!result.success) {
				toast.error(result.message || 'Failed to select files')
				return
			}

			if (!result.data?.length) {
				return
			}

			const newSounds = result.data.map((path) => {
				const soundData = FileService.createSoundFromPath(path)
				return {
					id: crypto.randomUUID(),
					...soundData
				} as Sound
			})

			newSounds.forEach((sound) => {
				addSound(sound)
				if (typeTools.isCustomGroup(selectedGroup)) {
					addSoundToGroup(sound.id, selectedGroup)
				}
			})

			toast.success(`Added ${newSounds.length} sound${newSounds.length > 1 ? 's' : ''}`)
		} catch (error) {
			console.error('Failed to add files:', error)
			toast.error('Failed to add files')
		}
	}, [addSound, addSoundToGroup, selectedGroup])

	const selectAudioFile = useCallback(async (): Promise<string | null> => {
		try {
			const result = await FileService.selectAudioFile()

			if (!result.success) {
				if (result.message !== 'No file selected') {
					toast.error(result.message || 'Failed to select audio file')
				}
				return null
			}

			return result.data || null
		} catch (error) {
			useErrorHandler().handleError(error as Error, 'Failed to select audio file')
			return null
		}
	}, [])

	const selectImageFile = useCallback(async (): Promise<string | null> => {
		try {
			const result = await FileService.selectImageFile()

			if (!result.success) {
				if (result.message !== 'No file selected') {
					toast.error(result.message || 'Failed to select image file')
				}
				return null
			}

			return result.data || null
		} catch (error) {
			useErrorHandler().handleError(error as Error, 'Failed to select image file')
			return null
		}
	}, [])

	return {
		addFiles,
		selectAudioFile,
		selectImageFile
	}
}
