import { Status } from '@/types'
import { ElectronAPI } from '@electron-toolkit/preload'
import { StatSyncFn } from 'fs'
import { SearchResult, VideoDetails } from 'youtube-search-api'
import { Presence } from 'discord-rpc'

declare global {
	interface Window {
		electron: ElectronAPI
		api: {
			readData: (filePath: string) => Promise<Status>
			writeData: (filePath: string, data: ArrayBuffer) => Promise<Status>
			setSoundHotkeys: (soundKeys: { soundId: string; hotkey: string }[]) => Promise<Status>
			setActionHotkeys: (actionKeys: { action: string; hotkey: string }[]) => Promise<Status>
			openDialog: (options?: Electron.OpenDialogOptions) => Promise<Status>
			saveDialog: (filters?: Electron.SaveDialogOptions) => Promise<Status>
			close: () => void
			minimize: () => void
			pinWindow: () => Promise<boolean>
			getPinState: () => Promise<boolean>
			downloadYoutube: (videoId: string) => Promise<Status>
			searchYoutube: (searchTerm: string) => Promise<Status>
			previewYoutube: (videoId: string) => Promise<Buffer>
			getYoutubeVideoData: (id: string) => Promise<Status>

			startDiscordRPC: () => Promise<Status>
			stopDiscordRPC: () => Promise<Status>
			setDiscordActivity: (activity: Presence) => Promise<Status>
			clearDiscordActivity: () => Promise<Status>
		}
	}
}
