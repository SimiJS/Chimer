import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/hooks/useStores'

interface OutputDeviceSelectorProps {
	onSelect: (deviceId: string) => void
	defaultDeviceId?: string
}

function OutputDeviceSelector({ onSelect, defaultDeviceId }: OutputDeviceSelectorProps) {
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [selected, setSelected] = useState(defaultDeviceId || '')

	useEffect(() => {
		navigator.mediaDevices.enumerateDevices().then((all) => {
			const audioOutputs = all.filter((d) => d.kind === 'audiooutput')
			setDevices(audioOutputs)
			if (defaultDeviceId && audioOutputs.some((d) => d.deviceId === defaultDeviceId)) {
				setSelected(defaultDeviceId)
			}
		})
	}, [defaultDeviceId])

	const handleValueChange = (value: string) => {
		setSelected(value)
		onSelect(value)
	}

	return (
		<Select value={selected} onValueChange={handleValueChange}>
			<SelectTrigger>
				<SelectValue placeholder="Select Output Device" />
			</SelectTrigger>
			<SelectContent>
				{devices.map((device) => (
					<SelectItem key={device.deviceId} value={device.deviceId}>
						{device.label || 'Unknown Device'}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

export function AudioSettings() {
	const { settings, updateSettings } = useSettings()

	return (
		<div className="flex flex-col gap-4 p-1 max-w-md">
			<div className="flex flex-col gap-2">
				<Label className="font-bold text-xl">Main Output</Label>
				<OutputDeviceSelector
					onSelect={(deviceId) => updateSettings({ mainOutputDeviceId: deviceId })}
					defaultDeviceId={settings.mainOutputDeviceId}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<Label>
					Main Volume
					<span className="ml-2 text-muted-foreground">{settings.mainOutputVol}%</span>
				</Label>
				<Slider
					min={0}
					max={100}
					step={1}
					value={[settings.mainOutputVol]}
					onValueChange={([val]) => updateSettings({ mainOutputVol: val })}
				/>
			</div>
			<Separator />
			<div className="flex flex-col gap-2">
				<Label className="font-bold gap-4">
					Aux Output
					<Switch
						checked={settings.enableAuxOutput}
						onCheckedChange={(checked) => updateSettings({ enableAuxOutput: checked })}
					/>
				</Label>
				{settings.enableAuxOutput && (
					<>
						<div className="flex flex-col gap-2 mt-2">
							<OutputDeviceSelector
								onSelect={(deviceId) =>
									updateSettings({ auxOutputDeviceId: deviceId })
								}
								defaultDeviceId={settings.auxOutputDeviceId}
							/>
						</div>
						<div className="flex flex-col gap-2 mt-2">
							<Label>
								Aux Volume
								<span className="ml-2 text-muted-foreground">
									{settings.auxOutputVol}%
								</span>
							</Label>
							<Slider
								min={0}
								max={100}
								step={1}
								value={[settings.auxOutputVol]}
								onValueChange={([val]) => updateSettings({ auxOutputVol: val })}
							/>
						</div>
					</>
				)}
			</div>
		</div>
	)
}
