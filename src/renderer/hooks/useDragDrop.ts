import { useState, useCallback } from 'react'
import { useSound } from '@/hooks/useStores'
import { Sound } from '@/types'
import { DragOverEvent } from '@dnd-kit/core'

export interface DragState {
	dragMode: boolean
}

export interface DragOperations {
	toggleDragMode: () => void
	exitDragMode: () => void
	handleDragEnd: (event: DragOverEvent) => void
}

export function useDragOperations(filteredSounds: Sound[]): [DragState, DragOperations] {
	const [dragMode, setDragMode] = useState(false)
	const { sounds, setSounds } = useSound()

	const toggleDragMode = useCallback(() => {
		setDragMode((prev) => !prev)
	}, [])

	const exitDragMode = useCallback(() => {
		setDragMode(false)
	}, [])

	const handleDragEnd = useCallback(
		(event: DragOverEvent) => {
			const { active, over } = event
			if (!over || active.id === over.id) return

			const activeIndex = filteredSounds.findIndex((s) => s.id === active.id)
			const overIndex = filteredSounds.findIndex((s) => s.id === over.id)
			if (activeIndex === -1 || overIndex === -1) return

			const newSounds = [...sounds]
			const activeSound = newSounds.find((s) => s.id === active.id)
			const overSound = newSounds.find((s) => s.id === over.id)

			if (activeSound && overSound) {
				const activeSoundIndex = newSounds.findIndex((s) => s.id === active.id)
				const overSoundIndex = newSounds.findIndex((s) => s.id === over.id)

				newSounds.splice(activeSoundIndex, 1)
				newSounds.splice(overSoundIndex, 0, activeSound)
				setSounds(newSounds)
			}
		},
		[filteredSounds, sounds, setSounds]
	)

	const state: DragState = {
		dragMode
	}

	const operations: DragOperations = {
		toggleDragMode,
		exitDragMode,
		handleDragEnd
	}

	return [state, operations]
}
