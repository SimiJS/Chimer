import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { useRecordHotkeys } from 'react-hotkeys-hook'
import { Camera, ImagePlay, Save, Search } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from './ui/dialog'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { useHotkeys } from '@/hooks/useStores'
import { useSoundStore } from '@/stores/soundStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { AlertDialog } from './ui/alert-dialog'
import {
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogFooter
} from './ui/alert-dialog'
import { Sound, Settings, ACTION_NAME } from '@/types'
import { tools } from '@/utils'

type HotkeyRecorderProps = {
	onFinish?: (combo: string, conflictingHolder?: Sound | keyof Settings['hotkeys']) => void
	defaultValue?: string
	onRecordingChange?: (isRecording: boolean) => void
}

export function HotkeyRecorder({ onFinish, defaultValue, onRecordingChange }: HotkeyRecorderProps) {
	const [combo, setCombo] = useState(defaultValue || '')
	const [keys, { start, stop, isRecording }] = useRecordHotkeys()
	const [wasRecording, setWasRecording] = useState(false)
	const { togglePause } = useHotkeys()
	const [hotkeyConflict, setHotkeyConflict] = useState<boolean>(false)
	const [conflictingHolder, setConflictingHolder] = useState<
		Sound | keyof Settings['hotkeys'] | null
	>(null)
	const [pendingCombo, setPendingCombo] = useState<string>('')

	useEffect(() => {
		return () => {
			stop()
			setWasRecording(false)
		}
	}, [stop])

	useEffect(() => {
		if (isRecording && keys.size > 0) {
			setCombo(
				Array.from(keys)
					.join('+')
					.replace(/^./, (c) => c.toUpperCase())
			)
		}
	}, [isRecording, keys])

	useEffect(() => {
		if (isRecording) {
			// Clear all hotkeys while recording to prevent interference
			togglePause()
		}
		// When recording stops, the subscriptions in hotkeyStore will automatically refill hotkeys
	}, [isRecording, togglePause])

	useEffect(() => {
		onRecordingChange?.(isRecording)
	}, [isRecording])

	useEffect(() => {
		if (wasRecording && !isRecording) {
			setWasRecording(false)

			if (keys.size > 0) {
				const currentCombo = Array.from(keys)
					.join('+')
					.replace(/^./, (c) => c.toUpperCase())

				const hotkeyHolder = tools.getHotkeyHolder(currentCombo)
				if (hotkeyHolder) {
					// Skip dialog if setting the same hotkey as before
					if (currentCombo === defaultValue) {
						onFinish?.(currentCombo)
						return
					}

					// Show conflict dialog if the hotkey is already assigned
					setConflictingHolder(hotkeyHolder)
					setPendingCombo(currentCombo)
					setHotkeyConflict(true)
					return
				}

				onFinish?.(currentCombo)
			}
		}

		if (isRecording && !wasRecording) {
			setWasRecording(true)
		}
	}, [isRecording, wasRecording, keys, onFinish])

	const handleToggle = () => {
		if (isRecording) {
			stop()
		} else {
			start()
		}
	}

	const handleOverrideHotkey = () => {
		if (conflictingHolder && pendingCombo) {
			if (typeof conflictingHolder === 'string') {
				const settingsStore = useSettingsStore.getState()
				const updatedHotkeys = { ...settingsStore.settings.hotkeys }
				updatedHotkeys[conflictingHolder] = ''
				settingsStore.updateSettings({ hotkeys: updatedHotkeys })
			} else {
				const soundStore = useSoundStore.getState()
				soundStore.updateSound({ ...conflictingHolder, hotkey: '' })
			}

			onFinish?.(pendingCombo, conflictingHolder)
		}
		setHotkeyConflict(false)
		setConflictingHolder(null)
		setPendingCombo('')
	}

	const handleCancelOverride = () => {
		setCombo(defaultValue || '')
		setHotkeyConflict(false)
		setConflictingHolder(null)
		setPendingCombo('')
	}

	const getDisplayName = (holder: Sound | keyof Settings['hotkeys']) => {
		return typeof holder === 'string'
			? ACTION_NAME[holder] || holder
			: holder.name || 'Unknown Sound'
	}

	const getHolderType = (holder: Sound | keyof Settings['hotkeys']) => {
		return typeof holder === 'string' ? 'action' : 'sound'
	}

	return (
		<>
			<AlertDialog open={hotkeyConflict} onOpenChange={setHotkeyConflict}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hotkey Conflict</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogDescription>
						{conflictingHolder && (
							<>
								This hotkey is already assigned to the{' '}
								{getHolderType(conflictingHolder)}
								<strong> {getDisplayName(conflictingHolder)}</strong>
								<br />
								Do you want to override the existing hotkey?
							</>
						)}
					</AlertDialogDescription>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={handleCancelOverride}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleOverrideHotkey}>
							Override
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<div
				className={`rounded-md p-1 px-1 border flex flex-row items-center gap-2 transition-all w-fit ${isRecording ? 'border-red-400' : ''}`}
			>
				<span className="mx-4 whitespace-nowrap">
					{isRecording ? combo || 'Recording...' : combo || 'Set Hotkey'}
				</span>
				<Button type="button" variant="outline" size="icon" onClick={handleToggle}>
					{isRecording ? <Save className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
				</Button>
			</div>
		</>
	)
}

export function TenorGif({ onSelect }: { onSelect: (url: string) => void }) {
	const [searchTerm, setSearchTerm] = useState('')
	const [results, setResults] = useState<any[]>([])
	const [loading, setLoading] = useState(false)

	const searchTenor = async () => {
		if (!searchTerm.trim()) return
		setLoading(true)
		try {
			const res = await axios.get('https://tenor.googleapis.com/v2/search', {
				params: {
					q: searchTerm,
					key: import.meta.env.VITE_TENOR_KEY
				}
			})
			setResults(res.data.results)
		} catch (error) {
			toast.error('Failed to fetch GIFs.')
		}
		setLoading(false)
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" size="icon">
					<ImagePlay />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Search GIFs</DialogTitle>
				</DialogHeader>
				<DialogDescription>
					<div className="flex flex-col gap-2">
						<span className="flex flex-row items-center gap-2">
							<Input
								placeholder="Search GIFs..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
							<Button onClick={searchTenor} disabled={loading}>
								<Search />
							</Button>
						</span>
						<ScrollArea className="w-full h-96">
							<div className="columns-2 gap-2 p-1 space-y-2 pr-4">
								{results.map((gif) => (
									<DialogClose
										asChild
										key={gif.id}
										className="break-inside-avoid overflow-hidden rounded-lg cursor-pointer border-2 border-transparent hoverable transition-all mb-2"
										onClick={() =>
											onSelect(
												gif.media_formats?.gif?.url ||
													gif.media_formats?.tinygif?.url
											)
										}
									>
										<img
											// deepcode ignore DOMXSS: Fixed url
											src={gif.media_formats?.tinygif?.url}
											alt="gif"
											className="w-full h-auto object-contain"
										/>
									</DialogClose>
								))}
							</div>
						</ScrollArea>
					</div>
				</DialogDescription>
			</DialogContent>
		</Dialog>
	)
}
