import { useState, useCallback } from 'react'
import { Sound } from '@/types'

export interface SelectionState {
	selectedSounds: Sound[]
	selectMode: boolean
	isAllSelected: boolean
	hasSelection: boolean
}

export interface SelectionActions {
	toggleSelect: (sound: Sound) => void
	toggleSelectAll: (allSounds: Sound[]) => void
	clearSelection: () => void
	enterSelectMode: () => void
	exitSelectMode: () => void
	setSelectedSounds: (sounds: Sound[]) => void
}

export function useSelectionMode(): [SelectionState, SelectionActions] {
	const [selectedSounds, setSelectedSounds] = useState<Sound[]>([])
	const [selectMode, setSelectMode] = useState(false)

	const toggleSelect = useCallback((sound: Sound) => {
		setSelectedSounds((prev) =>
			prev.some((s) => s.id === sound.id)
				? prev.filter((s) => s.id !== sound.id)
				: [...prev, sound]
		)
	}, [])

	const toggleSelectAll = useCallback((allSounds: Sound[]) => {
		setSelectedSounds((prev) => (prev.length > 0 ? [] : [...allSounds]))
	}, [])

	const clearSelection = useCallback(() => {
		setSelectedSounds([])
	}, [])

	const enterSelectMode = useCallback(() => {
		setSelectMode(true)
	}, [])

	const exitSelectMode = useCallback(() => {
		setSelectMode(false)
		setSelectedSounds([])
	}, [])

	const state: SelectionState = {
		selectedSounds,
		selectMode,
		isAllSelected: selectedSounds.length > 0,
		hasSelection: selectedSounds.length > 0
	}

	const actions: SelectionActions = {
		toggleSelect,
		toggleSelectAll,
		clearSelection,
		enterSelectMode,
		exitSelectMode,
		setSelectedSounds
	}

	return [state, actions]
}
