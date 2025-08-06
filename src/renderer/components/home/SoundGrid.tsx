import { DndContext, DragOverEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Sound } from '@/types'
import { Soundcard } from '@/components/Soundcard'

interface DraggableSoundcardProps {
	sound: Sound
}

function DraggableSoundcard({ sound }: DraggableSoundcardProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: sound.id
	})

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				zIndex: isDragging ? 1000 : 'auto'
			}}
			{...attributes}
			{...listeners}
		>
			<Soundcard
				name={sound.name}
				imageSrc={sound.imageSrc}
				className={isDragging ? 'dragging' : 'inactive'}
			/>
		</div>
	)
}

interface SoundGridProps {
	sounds: Sound[]
	dragMode: boolean
	onDragEnd: (event: DragOverEvent) => void
	children?: (sound: Sound) => React.ReactNode
}

export function SoundGrid({ sounds, dragMode, onDragEnd, children }: SoundGridProps) {
	return (
		<div className="flex flex-wrap gap-4 mt-4">
			{dragMode ? (
				<DndContext
					autoScroll={false}
					collisionDetection={closestCenter}
					onDragEnd={onDragEnd}
				>
					<SortableContext items={sounds.map((s) => s.id)} strategy={rectSortingStrategy}>
						{sounds.map((sound) => (
							<DraggableSoundcard key={sound.id} sound={sound} />
						))}
					</SortableContext>
				</DndContext>
			) : (
				sounds.map((sound) => children?.(sound))
			)}
		</div>
	)
}
