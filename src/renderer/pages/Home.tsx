import { useState } from 'react'
import { MenuIcon } from 'lucide-react'

import { useSound } from '@/hooks/useStores'
import { useSelectionMode } from '@/hooks/useSelectSounds'
import { useDragOperations } from '@/hooks/useDragDrop'
import { useFileOperations } from '@/hooks/useFileOperations'
import { Sound } from '@/types'
import { DeleteDialog } from '@/components/Dialogs'
import { HomeHeader } from '@/components/home/HomeHeader'
import { HomeMenuItems } from '@/components/home/HomeMenuItems'
import { SoundGrid } from '@/components/home/SoundGrid'
import { InteractiveSoundcard } from '@/components/home/InteractiveSoundcard'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import '@/assets/styles/pages/home.css'
import { typeTools } from '@/types/tools'
import { AddSound } from '@/components/SoundDialogs'
import { GroupList } from '@/components/GroupDialogs'

export default function Home() {
	const {
		sounds,
		selectedGroup,
		setSelectedGroup,
		addSoundToGroup,
		getGroupedSounds,
		addSound,
		removeSound
	} = useSound()

	// Custom hooks for state management
	const [selectionState, selectionActions] = useSelectionMode()
	const fileOperations = useFileOperations()

	// Dialog state
	const [dialogType, setDialogType] = useState<'sound' | 'group' | null>(null)
	const [searchQuery, setSearchQuery] = useState('')

	// Filtered sounds based on group and search
	const filteredSounds = getGroupedSounds().filter((sound) =>
		sound.name.toLowerCase().includes(searchQuery.toLowerCase())
	)

	// Drag operations hook
	const [dragState, dragOperations] = useDragOperations(filteredSounds)

	const handleAddSound = (sound: Sound) => {
		addSound(sound)
		if (typeTools.isCustomGroup(selectedGroup)) {
			addSoundToGroup(sound.id, selectedGroup)
		}
		setDialogType(null)
	}

	const deleteSelected = () => {
		selectionState.selectedSounds.forEach((sound) => removeSound(sound.id))
		selectionActions.clearSelection()
		if (selectionState.selectedSounds.length >= sounds.length) {
			selectionActions.exitSelectMode()
		}
	}

	const toggleMode = (mode: 'select' | 'drag') => {
		if (mode === 'select') {
			if (selectionState.selectMode) {
				selectionActions.exitSelectMode()
			} else {
				selectionActions.enterSelectMode()
				dragOperations.exitDragMode()
			}
		} else {
			dragOperations.toggleDragMode()
			selectionActions.exitSelectMode()
		}
	}

	return (
		<div>
			<Dialog
				open={dialogType === 'sound'}
				onOpenChange={(open) => setDialogType(open ? 'sound' : null)}
			>
				{dialogType === 'sound' && <AddSound onSubmit={handleAddSound} />}
			</Dialog>
			<Dialog
				open={dialogType === 'group'}
				onOpenChange={(open) => setDialogType(open ? 'group' : null)}
			>
				{dialogType === 'group' && <GroupList />}
			</Dialog>

			<ScrollArea className="h-[calc(100vh-3rem)] p-3 px-4">
				<span className="inline-flex flex-row gap-2 mt-1">
					<AlertDialog>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon">
									<MenuIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent side="top" className="ml-4 mt-4">
								<HomeMenuItems
									selectionState={selectionState}
									dragState={dragState}
									soundsCount={sounds.length}
									onToggleSelectMode={() => toggleMode('select')}
									onToggleDragMode={() => toggleMode('drag')}
									onToggleSelectAll={() =>
										selectionActions.toggleSelectAll(sounds)
									}
									onDeleteSelected={deleteSelected}
									onOpenGroups={() => setDialogType('group')}
									onOpenAddSound={() => setDialogType('sound')}
									onAddFiles={fileOperations.addFiles}
								/>
							</DropdownMenuContent>
						</DropdownMenu>
						<DeleteDialog
							message="Are you sure you want to delete these sounds?"
							title="Delete Sounds"
							onAccept={deleteSelected}
						/>
					</AlertDialog>

					<HomeHeader
						selectedGroup={selectedGroup}
						onGroupChange={setSelectedGroup}
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
					/>
				</span>

				<SoundGrid
					sounds={filteredSounds}
					dragMode={dragState.dragMode}
					onDragEnd={dragOperations.handleDragEnd}
				>
					{(sound) => {
						const isSelected = selectionState.selectedSounds.some(
							(s) => s.id === sound.id
						)
						return (
							<InteractiveSoundcard
								key={sound.id}
								sound={sound}
								className={
									selectionState.selectMode
										? isSelected
											? 'active'
											: 'inactive'
										: ''
								}
								onClick={
									selectionState.selectMode
										? () => selectionActions.toggleSelect(sound)
										: undefined
								}
							/>
						)
					}}
				</SoundGrid>
			</ScrollArea>
		</div>
	)
}
