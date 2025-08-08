import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes, useNavigate } from 'react-router'
import { ThemeProvider } from './providers/ThemeProvider'
import { useSound } from '@/hooks/useStores'
import { Settings } from './pages/Settings'
import '@/assets/styles/index.css'
import Home from './pages/Home'
import { Button } from './components/ui/button'
import { Menubar } from './components/ui/menubar'
import { Toaster } from './components/ui/sonner'

import {
	Download,
	FastForward,
	HomeIcon,
	Minus,
	Pause,
	Pin,
	Play,
	Repeat,
	Rewind,
	SettingsIcon,
	X
} from 'lucide-react'
import { Downloader } from './pages/Download'
import { useSettingsStore } from './stores/settingsStore'

window.name = 'Chimer'

interface Page {
	path: string
	element: React.JSX.Element
	index?: boolean
	bar?: {
		showBar: boolean
		icon: React.ReactNode
	}
}

const routes: Page[] = [
	{ element: <Home />, path: '/', index: true, bar: { showBar: true, icon: <HomeIcon /> } },
	{
		element: <Downloader />,
		path: '/download',
		bar: { showBar: true, icon: <Download /> }
	},
	{
		element: <Settings />,
		path: '/settings',
		bar: { showBar: true, icon: <SettingsIcon /> }
	}
]

function ShadBar({ routes }: { routes: Page[] }) {
	const navigate = useNavigate()
	const [isPinned, setIsPinned] = React.useState(false)
	const {
		currentSound,
		isLooping,
		isPlaying,
		toggleLoop,
		togglePause,
		stopSound,
		forwardSound,
		rewindSound
	} = useSound()

	const handlePinToggle = async () => {
		const newPinState = await window.api.pinWindow()
		setIsPinned(newPinState)
	}

	// Initialize state on app mount
	React.useEffect(() => {
		const initializePinState = async () => {
			const pinState = await window.api.getPinState()
			setIsPinned(pinState)
		}
		initializePinState()
		if (useSettingsStore.getState().settings?.discord) {
			window.api.startDiscordRPC()
		}
	}, [])

	return (
		<Menubar className="h-12 px-2 justify-between statusBar">
			<div className="inline-flex flex-row items-center gap-1">
				{routes.map(
					(route) =>
						route.bar?.showBar && (
							<Button
								key={route.path}
								variant="outline"
								className="size-8"
								size="icon"
								onClick={() => navigate(route.path)}
							>
								{route.bar.icon}
							</Button>
						)
				)}
			</div>
			{currentSound ? (
				<div className="inline-flex py-0.5 pl-2 pr-0.5 flex-row items-center gap-2 border rounded-md max-w-[50%] min-w-0">
					<p className="px-2 truncate min-w-0">{currentSound.name}</p>
					<div className="inline-flex gap-1 flex-shrink-0">
						<Button
							className={`size-8 ${isLooping ? 'enabled' : ''}`}
							variant="outline"
							size="icon"
							onClick={() => toggleLoop()}
						>
							<Repeat />
						</Button>
						<Button
							className="size-8"
							variant="outline"
							size="icon"
							onClick={() => rewindSound()}
						>
							<Rewind />
						</Button>
						<Button
							className="size-8"
							variant="outline"
							size="icon"
							onClick={() => togglePause()}
							onContextMenu={() => stopSound()}
						>
							{isPlaying ? <Pause /> : <Play />}
						</Button>
						<Button
							className="size-8"
							variant="outline"
							size="icon"
							onClick={() => forwardSound()}
						>
							<FastForward />
						</Button>
					</div>
				</div>
			) : (
				window.name
			)}
			<div className="inline-flex flex-row items-center gap-2">
				<Button
					variant={'outline'}
					className={`size-8 ${isPinned ? 'enabled' : ''}`}
					size="icon"
					onClick={handlePinToggle}
					title={isPinned ? 'Unpin window' : 'Pin window to top'}
				>
					<Pin />
				</Button>
				<Button
					variant="outline"
					className="size-8"
					size="icon"
					onClick={() => window.api.minimize()}
				>
					<Minus />
				</Button>
				<Button
					variant="outline"
					className="size-8 hover:text-red-400"
					size="icon"
					onClick={() => window.api.close()}
				>
					<X />
				</Button>
			</div>
		</Menubar>
	)
}

createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<ThemeProvider defaultTheme="system">
			<HashRouter>
				<ShadBar routes={routes} />
				<Routes>
					{routes.map((route) => (
						<Route
							key={route.path}
							path={route.path}
							{...(route.index && { index: true })}
							element={route.element}
						/>
					))}
				</Routes>
			</HashRouter>
			<Toaster />
		</ThemeProvider>
	</React.StrictMode>
)
