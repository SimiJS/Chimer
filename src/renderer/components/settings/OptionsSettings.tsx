import { useSettings } from '@/hooks/useStores'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'

export function OptionSettings() {
	const { settings, updateSettings } = useSettings()
	return (
		<div className="flex flex-col gap-2">
			<Label className="font-bold">Discord Integration</Label>
			<Switch
				checked={settings.discord}
				onCheckedChange={(checked) => updateSettings({ discord: checked })}
			/>
		</div>
	)
}
