import { useState } from 'react'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { HotkeyRecorder } from '@/components/Components'
import { useSettings } from '@/hooks/useStores'
import { ACTION_NAME } from '@/types'

export function HotkeySettings() {
	const { settings, updateSettings } = useSettings()
	const [selectedAction, setSelectedAction] = useState<keyof typeof ACTION_NAME>('playPause')

	const updateHotkey = (combo: string) => {
		updateSettings({
			hotkeys: { ...settings.hotkeys, [selectedAction]: combo }
		})
	}

	return (
		<div className="flex flex-col gap-2">
			<Label className="font-bold text-xl">Hotkeys</Label>
			<span className="flex flex-row items-center gap-4">
				<Select
					value={selectedAction}
					onValueChange={(value) => setSelectedAction(value as keyof typeof ACTION_NAME)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select Action To Change Hotkey" />
					</SelectTrigger>
					<SelectContent>
						{Object.entries(ACTION_NAME).map(([key, label]) => (
							<SelectItem key={key} value={key}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<HotkeyRecorder
					key={selectedAction}
					defaultValue={settings.hotkeys[selectedAction]}
					onFinish={updateHotkey}
				/>
			</span>
			<Separator />
		</div>
	)
}
