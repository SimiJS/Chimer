import { Button } from './ui/button'
import { DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { File, Image } from 'lucide-react'
import { HotkeyRecorder } from './Components'
import { Soundcard } from './Soundcard'
import { FileService } from '@/services/fileService'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { Sound } from '@/types'
import { useState } from 'react'
import { useSound } from '@/hooks/useStores'

const DEFAULT_SOUND: Sound = {
	id: crypto.randomUUID(),
	name: '',
	soundSrc: '',
	imageSrc: '',
	hotkey: ''
}

interface AddSoundProps {
	onSubmit: (sound: Sound) => void
}

export function AddSound({ onSubmit }: AddSoundProps) {
	const [sound, setSound] = useState<Sound>(DEFAULT_SOUND)
	const [isRecording, setIsRecording] = useState(false)
	const { playSound, stopSound, currentSound } = useSound()

	const updateSound = (updates: Partial<Sound>) => setSound((prev) => ({ ...prev, ...updates }))

	const handleFilePick = async (type: 'sound' | 'image') => {
		try {
			const filePath =
				type === 'sound'
					? await FileService.selectAudioFile()
					: await FileService.selectImageFile()

			if (filePath) {
				const key = type === 'sound' ? 'soundSrc' : 'imageSrc'
				updateSound({ [key]: filePath })
			}
		} catch (error) {
			useErrorHandler().handleError(error as Error, 'Failed to select file')
		}
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!sound.name.trim() || !sound.soundSrc.trim()) return

		onSubmit(sound)
		setSound(DEFAULT_SOUND)
	}

	const handleSoundPlay = () => {
		if (sound.id === currentSound?.id) {
			stopSound()
		} else if (sound.soundSrc) {
			playSound(sound)
		}
	}

	const isFormValid = sound.name.trim() && sound.soundSrc.trim() && !isRecording

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Add Sound</DialogTitle>
			</DialogHeader>
			<div className="flex flex-row justify-between gap-4">
				<form className="flex-1 flex flex-col gap-4" onSubmit={handleSubmit}>
					<Input
						type="text"
						placeholder="Sound Name"
						value={sound.name}
						onChange={(e) => updateSound({ name: e.target.value })}
					/>
					<div className="flex gap-2">
						<Input
							type="text"
							placeholder="Sound Source"
							value={sound.soundSrc}
							onChange={(e) => updateSound({ soundSrc: e.target.value })}
						/>
						<Button type="button" onClick={() => handleFilePick('sound')} size="icon">
							<File />
						</Button>
					</div>
					<div className="flex gap-2">
						<Input
							type="text"
							placeholder="Image Source (optional)"
							value={sound.imageSrc || ''}
							onChange={(e) => updateSound({ imageSrc: e.target.value })}
						/>
						<Button type="button" onClick={() => handleFilePick('image')} size="icon">
							<Image />
						</Button>
					</div>
					<div className="flex gap-2">
						<HotkeyRecorder
							defaultValue={sound.hotkey}
							onFinish={(hotkey) => updateSound({ hotkey })}
							onRecordingChange={setIsRecording}
						/>
					</div>
					<Button type="submit" disabled={!isFormValid}>
						Add Sound
					</Button>
				</form>
				<Soundcard
					isPlaying={sound.id === currentSound?.id}
					imageSrc={sound.imageSrc}
					name={sound.name || 'New Sound'}
					onClick={handleSoundPlay}
				/>
			</div>
		</DialogContent>
	)
}
