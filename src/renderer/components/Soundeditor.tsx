import React, { useState, useEffect } from 'react'
import { Group, Sound } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HotkeyRecorder, TenorGif } from './Components'
import { useSound } from '@/hooks/useStores'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { FileImage, FileMusic } from 'lucide-react'
import { toast } from 'sonner'

interface SoundEditorProps {
	sound: Sound
	onSave: (sound: Sound) => void
	children?: React.ReactNode
}

export function SoundEditor({ sound, onSave }: SoundEditorProps) {
	const [editedSound, setEditedSound] = useState<Sound>(sound)
	const { groups, selectedGroup, updateSound, addSoundToGroup, removeSoundFromGroup } = useSound()
	const [currentGroup, setCurrentGroup] = useState<Group | undefined>(
		groups.find((g) => g.soundIds.includes(sound.id)) || undefined
	)
	const [isRecordingHotkey, setIsRecordingHotkey] = useState(false)

	// When a new sound is passed, the edited sound becomes the new sound
	useEffect(() => {
		setEditedSound(sound)
	}, [sound])

	// This function is used to easily update fields
	const updateField = <K extends keyof Sound>(key: K, value: Sound[K]) => {
		setEditedSound((prev) => ({ ...prev, [key]: value }))
	}

	const pickSound = async () => {
		try {
			const filePath = await window.api.openDialog({
				filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'flac'] }]
			})
			if (!filePath.success) {
				toast.error(filePath.message)
				return
			}
			if (filePath) {
				updateField('soundSrc', filePath.data)
			}
		} catch (error) {
			console.error('Failed to pick sound:', error)
		}
	}

	const pickImage = async () => {
		try {
			const filePath = await window.api.openDialog({
				filters: [{ name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif'] }]
			})
			if (!filePath.success) {
				toast.error(filePath.message)
				return
			}
			if (filePath) {
				updateField('imageSrc', filePath.data)
			}
		} catch (error) {
			console.error('Failed to pick image:', error)
		}
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!editedSound.name.trim() || !editedSound.soundSrc.trim()) return

		// Update the sound
		updateSound(editedSound)

		// Handle group membership changes
		const oldGroup = groups.find((g) => g.soundIds.includes(sound.id))
		if (currentGroup && oldGroup && oldGroup.id !== currentGroup.id) {
			removeSoundFromGroup(sound.id, oldGroup.id)
		}
		if (currentGroup && currentGroup.id && (!oldGroup || oldGroup.id !== currentGroup.id)) {
			addSoundToGroup(sound.id, currentGroup.id)
		}

		onSave(editedSound)
	}

	const isFormValid = editedSound.name.trim() && editedSound.soundSrc.trim() && !isRecordingHotkey

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Edit Sound</DialogTitle>
			</DialogHeader>
			<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
				<Input
					type="text"
					placeholder="Sound Name"
					value={editedSound.name}
					onChange={(e) => updateField('name', e.target.value)}
					required
				/>
				<div className="flex gap-2">
					<Input
						type="text"
						placeholder="Sound Source"
						value={editedSound.soundSrc}
						onChange={(e) => updateField('soundSrc', e.target.value)}
						required
					/>
					<Button type="button" variant="outline" onClick={pickSound} size="icon">
						<FileMusic />
					</Button>
				</div>
				<div className="flex gap-2">
					<Input
						type="text"
						placeholder="Image Source (optional)"
						value={editedSound.imageSrc || ''}
						onChange={(e) => updateField('imageSrc', e.target.value)}
					/>
					<TenorGif onSelect={(src) => updateField('imageSrc', src)} />
					<Button type="button" variant="outline" onClick={pickImage} size="icon">
						<FileImage />
					</Button>
				</div>
				<HotkeyRecorder
					defaultValue={editedSound.hotkey}
					onFinish={(value) => updateField('hotkey', value)}
					onRecordingChange={setIsRecordingHotkey}
				/>
				<Select
					value={currentGroup?.id || ''}
					onValueChange={(value) => setCurrentGroup(groups.find((g) => g.id === value))}
				>
					<SelectTrigger>
						<SelectValue placeholder={selectedGroup ? selectedGroup : 'Select Group'} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Ungrouped">No Group</SelectItem>
						{groups.map((group) => (
							<SelectItem key={group.id} value={group.id}>
								{group.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<DialogClose asChild>
					<Button type="submit" disabled={!isFormValid}>
						Save Changes
					</Button>
				</DialogClose>
			</form>
		</DialogContent>
	)
}
