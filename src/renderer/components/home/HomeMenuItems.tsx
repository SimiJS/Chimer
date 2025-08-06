import { BoxSelectIcon, Files, GroupIcon, HandIcon, Plus, Trash2 } from 'lucide-react'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { SelectionState } from '@/hooks/useSelectSounds'
import { DragState } from '@/hooks/useDragDrop'

interface HomeMenuItemsProps {
	selectionState: SelectionState
	dragState: DragState
	soundsCount: number
	onToggleSelectMode: () => void
	onToggleDragMode: () => void
	onToggleSelectAll: () => void
	onDeleteSelected: () => void
	onOpenGroups: () => void
	onOpenAddSound: () => void
	onAddFiles: () => void
}

export function HomeMenuItems({
	selectionState,
	dragState,
	soundsCount,
	onToggleSelectMode,
	onToggleDragMode,
	onToggleSelectAll,
	onDeleteSelected,
	onOpenGroups,
	onOpenAddSound,
	onAddFiles
}: HomeMenuItemsProps) {
	const { selectMode, hasSelection } = selectionState
	const { dragMode } = dragState

	return (
		<>
			{selectMode && hasSelection && (
				<DropdownMenuItem variant="destructive" onClick={onDeleteSelected}>
					<Trash2 />
					Delete Selected
				</DropdownMenuItem>
			)}

			{selectMode && (
				<DropdownMenuItem onClick={onToggleSelectAll}>
					<GroupIcon />
					{hasSelection ? 'Unselect All' : 'Select All'}
				</DropdownMenuItem>
			)}

			{soundsCount > 1 && (
				<DropdownMenuItem onClick={onToggleSelectMode}>
					<BoxSelectIcon />
					{selectMode ? 'Stop Selecting' : 'Select Mode'}
				</DropdownMenuItem>
			)}

			{!selectMode && soundsCount > 1 && (
				<DropdownMenuItem onClick={onToggleDragMode}>
					<HandIcon />
					{dragMode ? 'Stop Arranging' : 'Arrange Mode'}
				</DropdownMenuItem>
			)}

			{!selectMode && (
				<>
					{soundsCount > 1 && <DropdownMenuSeparator className="bg-neutral-700" />}
					<DropdownMenuItem onClick={onOpenGroups}>
						<GroupIcon />
						Groups
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onOpenAddSound}>
						<Plus />
						New Sound
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onAddFiles}>
						<Files />
						Add Files
					</DropdownMenuItem>
				</>
			)}
		</>
	)
}
