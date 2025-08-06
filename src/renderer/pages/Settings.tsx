import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { HotkeySettings } from '@/components/settings/HotkeySettings'
import { DatabaseSettings } from '@/components/settings/DatabaseSettings'
import { AudioSettings } from '@/components/settings/AudioSettings'

export function Settings(): React.JSX.Element {
	return (
		<div className="p-4 ">
			<Tabs defaultValue="main">
				<TabsList>
					<TabsTrigger value="main">Main</TabsTrigger>
					<TabsTrigger value="audio">Audio</TabsTrigger>
				</TabsList>
				<Card className="w-[500px] p-4">
					<TabsContent value="main">
						<div className="flex flex-col gap-2 max-w-md p-2">
							<HotkeySettings />
							<DatabaseSettings />
						</div>
					</TabsContent>
					<TabsContent value="audio">
						<AudioSettings />
					</TabsContent>
				</Card>
			</Tabs>
		</div>
	)
}
