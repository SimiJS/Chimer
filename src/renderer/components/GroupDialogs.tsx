import { DialogClose } from '@radix-ui/react-dialog'
import { Soundcard } from './Soundcard'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from './ui/dialog'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Button } from './ui/button'
import { AlertCircleIcon, Edit, Plus, Save, Trash2 } from 'lucide-react'
import { useSound } from '@/hooks/useStores'
import { useState } from 'react'
import { typeTools } from '@/types/tools'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Separator } from './ui/separator'
import { AlertDialog, AlertDialogTrigger } from './ui/alert-dialog'
import { DeleteDialog } from './Dialogs'
import { Group } from '@/types'

export function CreateGroup() {
	const { addGroup, groups } = useSound()
	const [groupName, setGroupName] = useState<string>('')

	const trimmedName = groupName.trim()
	const isDuplicate = typeTools.isDuplicateGroup(groupName, groups)
	const error = isDuplicate ? 'Group already exists.' : null
	const isFormValid = !!trimmedName && !isDuplicate

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!isFormValid) return

		addGroup({
			id: crypto.randomUUID(),
			name: trimmedName,
			soundIds: []
		})
		setGroupName('')
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setGroupName(e.target.value)
	}

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Create Group</DialogTitle>
			</DialogHeader>
			{error && (
				<Alert variant="destructive">
					<AlertCircleIcon />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
				<Input
					type="text"
					value={groupName}
					onChange={handleInputChange}
					placeholder="Group Name"
				/>
				<DialogClose asChild>
					<Button type="submit" disabled={!isFormValid}>
						Create Group
					</Button>
				</DialogClose>
			</form>
		</DialogContent>
	)
}

export function GroupList() {
	const { groups, removeGroup } = useSound()

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Groups</DialogTitle>
			</DialogHeader>
			<Separator />
			<div className="flex flex-col gap-2">
				{groups.map((group) => (
					<div key={group.id} className="flex gap-2 w-full">
						<div className="flex-1 flex items-center justify-center border rounded-md p-2 text-sm font-medium">
							{group.name}
						</div>
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="outline" size="icon">
									<Edit />
								</Button>
							</DialogTrigger>
							<EditGroup group={group} />
						</Dialog>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="destructive" size="icon">
									<Trash2 />
								</Button>
							</AlertDialogTrigger>
							<DeleteDialog
								title="Delete Group"
								message="Are you sure you want to delete this group? This action cannot be undone."
								onAccept={() => removeGroup(group.id)}
							/>
						</AlertDialog>
					</div>
				))}
			</div>
			<Separator />
			<Dialog>
				<DialogTrigger asChild>
					<Button variant="outline">
						<Plus />
						Create Group
					</Button>
				</DialogTrigger>
				<CreateGroup />
			</Dialog>
		</DialogContent>
	)
}

export function EditGroup({ group }: { group: Group }) {
	const { sounds, updateGroup, addSoundToGroup, removeSoundFromGroup } = useSound()
	const [groupName, setGroupName] = useState(group.name)
	const [selectedSounds, setSelectedSounds] = useState<Set<string>>(new Set(group.soundIds))

	const toggleSoundSelection = (soundId: string) => {
		setSelectedSounds((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(soundId)) {
				newSet.delete(soundId)
			} else {
				newSet.add(soundId)
			}
			return newSet
		})
	}

	const handleSave = () => {
		const currentSounds = new Set(group.soundIds)

		// Update group name if changed
		if (groupName.trim() !== group.name) {
			updateGroup({ ...group, name: groupName.trim() })
		}

		// Remove unselected sounds
		currentSounds.forEach((soundId) => {
			if (!selectedSounds.has(soundId)) {
				removeSoundFromGroup(soundId, group.id)
			}
		})

		// Add selected sounds
		selectedSounds.forEach((soundId) => {
			if (!currentSounds.has(soundId)) {
				addSoundToGroup(soundId, group.id)
			}
		})
	}

	return (
		<DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
			<DialogHeader>
				<Input
					type="text"
					placeholder="Group Name"
					value={groupName}
					onChange={(e) => setGroupName(e.target.value)}
					className="w-1/2"
				/>
			</DialogHeader>

			<DialogDescription>
				<ScrollArea className="h-90">
					<div className="grid grid-cols-3 gap-4 mr-5">
						{sounds.map((sound) => {
							const isSelected = selectedSounds.has(sound.id)
							return (
								<div
									key={sound.id}
									className="cursor-pointer flex justify-center"
									onClick={() => toggleSoundSelection(sound.id)}
								>
									<Soundcard
										name={sound.name}
										imageSrc={sound.imageSrc}
										isPlaying={false}
										className={isSelected ? 'active' : 'inactive'}
									/>
								</div>
							)
						})}
					</div>
				</ScrollArea>
			</DialogDescription>

			<DialogFooter>
				<DialogClose asChild>
					<Button onClick={handleSave}>
						<Save />
						Save Changes
					</Button>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	)
}
