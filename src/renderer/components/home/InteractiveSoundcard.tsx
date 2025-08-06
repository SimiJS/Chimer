import { Edit2, Trash2 } from 'lucide-react'
import { Sound } from '@/types'
import { useSound } from '@/hooks/useStores'
import { Soundcard } from '@/components/Soundcard'
import { SoundEditor } from '@/components/Soundeditor'
import { DeleteDialog } from '@/components/Dialogs'
import { AlertDialog, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger
} from '@/components/ui/context-menu'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'

interface InteractiveSoundcardProps {
	sound: Sound
	className?: string
	onClick?: () => void
}

export function InteractiveSoundcard({ sound, className, onClick }: InteractiveSoundcardProps) {
	const { currentSound, playSound, removeSound, updateSound } = useSound()

	const handleDefaultClick = () => {
		if (!onClick) {
			playSound(sound)
		}
	}

	return (
		<Dialog>
			<AlertDialog>
				<ContextMenu>
					<ContextMenuTrigger>
						<Soundcard
							name={sound.name}
							imageSrc={sound.imageSrc}
							isPlaying={currentSound?.id === sound.id}
							onClick={onClick || handleDefaultClick}
							className={className}
							hotkey={sound.hotkey}
						/>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<DialogTrigger asChild>
							<ContextMenuItem>
								<Edit2 />
								Edit
							</ContextMenuItem>
						</DialogTrigger>
						<AlertDialogTrigger asChild>
							<ContextMenuItem variant="destructive">
								<Trash2 />
								Delete
							</ContextMenuItem>
						</AlertDialogTrigger>
					</ContextMenuContent>
				</ContextMenu>
				<DeleteDialog
					message="Are you sure you want to delete this sound?"
					title="Delete Sound"
					onAccept={() => removeSound(sound.id)}
				/>
			</AlertDialog>
			<SoundEditor sound={sound} onSave={updateSound} />
		</Dialog>
	)
}
