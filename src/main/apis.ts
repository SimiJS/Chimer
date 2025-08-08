import { BrowserWindow, dialog, globalShortcut, ipcMain } from 'electron'
import fs from 'fs/promises'
import fsExtra from 'fs'
import { GetListByKeyword, GetVideoDetails } from 'youtube-search-api'
import { Status } from './types'
import ytdl from '@distube/ytdl-core'
import RPC from 'discord-rpc'
import 'dotenv/config'

export function ipcHandlers(): void {
	let currentSoundKeys: { soundId: string; hotkey: string }[] = []
	let currentActionKeys: { action: string; hotkey: string }[] = []

	const registerAllHotkeys = () => {
		globalShortcut.unregisterAll()

		const win = BrowserWindow.getAllWindows()[0]
		if (!win) return

		const allHotkeys = [
			...currentSoundKeys.map((soundKey) => ({
				hotkey: soundKey.hotkey,
				handler: () => {
					win.webContents.send('playSound', soundKey.soundId)
					console.log(`Sound played: ${soundKey.soundId}`)
				}
			})),
			...currentActionKeys.map((actionKey) => ({
				hotkey: actionKey.hotkey,
				handler: () => {
					win.webContents.send('triggerAction', actionKey.action)
					console.log(`Action triggered: ${actionKey.action}`)
				}
			}))
		]

		allHotkeys.forEach(({ hotkey, handler }) => {
			if (hotkey && hotkey.trim()) {
				globalShortcut.register(hotkey, handler)
				console.log(`Registered hotkey: ${hotkey}`)
			}
		})
	}

	ipcMain.handle('readData', async (_event, filePath: string): Promise<Status> => {
		try {
			if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
				const response = await fetch(filePath)
				if (!response.ok) throw new Error(`Failed to fetch sound: ${response.statusText}`)
				return {
					success: true,
					message: 'File loaded successfully.',
					data: await response.arrayBuffer()
				}
			}

			return {
				success: true,
				message: 'File loaded successfully.',
				data: await fs.readFile(filePath)
			}
		} catch (error) {
			return {
				success: false,
				message: `An error occurred while loading the file: ${(error as Error).message}`
			}
		}
	})

	ipcMain.handle(
		'writeData',
		async (_event, filePath: string, data: ArrayBuffer): Promise<Status> => {
			try {
				await fs.writeFile(filePath, Buffer.from(data))
				return {
					success: true,
					message: 'File saved successfully.',
					data: filePath
				}
			} catch (error) {
				return {
					success: false,
					message: `An error occurred while saving the file: ${(error as Error).message}`
				}
			}
		}
	)

	ipcMain.handle(
		'openDialog',
		async (_event, options: Electron.OpenDialogOptions): Promise<Status> => {
			try {
				const file = await dialog.showOpenDialog({
					properties: ['openFile'],
					...options
				})
				if (file.canceled || file.filePaths.length === 0) {
					throw new Error('No file selected.')
				}
				return {
					success: true,
					message: 'File selected successfully.',
					data: file.filePaths[0]
				}
			} catch (error) {
				return {
					success: false,
					message: `An error occurred when picking a file: ${(error as Error).message}`
				}
			}
		}
	)

	ipcMain.handle(
		'saveDialog',
		async (_event, options: Electron.SaveDialogOptions): Promise<Status> => {
			try {
				const file = await dialog.showSaveDialog(BrowserWindow.getAllWindows()[0], {
					...options
				})
				if (file.canceled || !file.filePath) {
					throw new Error('No file path selected.')
				}
				return {
					success: true,
					message: 'File path selected successfully.',
					data: file.filePath
				}
			} catch (error) {
				return {
					success: false,
					message: `An error occurred when saving the file: ${(error as Error).message}`
				}
			}
		}
	)

	ipcMain.handle(
		'setSoundHotkeys',
		(_event, soundKeys: { soundId: string; hotkey: string }[]): Status => {
			currentSoundKeys = soundKeys
			registerAllHotkeys()
			return {
				success: true,
				message: 'Sound Hotkeys registered successfully.'
			}
		}
	)

	ipcMain.handle(
		'setActionHotkeys',
		(_event, actionKeys: { action: string; hotkey: string }[]): Status => {
			currentActionKeys = actionKeys
			registerAllHotkeys()
			return {
				success: true,
				message: 'Action Hotkeys registered successfully.'
			}
		}
	)

	ipcMain.handle('downloadYoutube', async (_event, videoId: string): Promise<Status> => {
		try {
			const url = `https://www.youtube.com/watch?v=${videoId}`
			const info = await ytdl.getInfo(url)
			const format = ytdl.chooseFormat(info.formats, {
				filter: 'audioonly',
				quality: 'highestaudio'
			})

			const { filePath: savePath } = await dialog.showSaveDialog({
				filters: [{ name: 'Audio Files', extensions: ['ogg'] }]
			})

			if (!savePath) {
				return {
					success: false,
					message: 'Download canceled by user.'
				}
			}

			const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })

			const totalBytes = parseInt(format.contentLength, 10)
			let downloadedBytes: number = 0

			stream.on('data', (chunk: Buffer) => {
				downloadedBytes += chunk.length
				const progress = Math.round((downloadedBytes / totalBytes) * 100)
				console.log(`Progress: ${progress}%`)
			})

			const fileStream = fsExtra.createWriteStream(savePath)
			stream.pipe(fileStream)

			// Wait for the download to complete
			return new Promise<Status>((resolve, reject) => {
				fileStream.on('finish', () => {
					console.log(`Download finished: ${savePath}`)
					resolve({
						success: true,
						message: `Download completed successfully: ${savePath}`,
						data: savePath
					})
				})

				stream.on('error', (err) => {
					console.error('Download error:', err)
					reject(new Error(`Download error: ${err.message}`))
				})

				fileStream.on('error', (err) => {
					console.error('File write error:', err)
					reject(new Error(`File write error: ${err.message}`))
				})
			})
		} catch (error) {
			return {
				success: false,
				message: `An error occurred during the download: ${(error as Error).message}`
			}
		}
	})

	ipcMain.handle('searchYoutube', async (_event, searchTerm: string): Promise<Status> => {
		try {
			return {
				success: true,
				message: 'YouTube search completed successfully.',
				data: await GetListByKeyword(searchTerm, false, 50, [{ type: 'video' }])
			}
		} catch (error) {
			return {
				success: false,
				message: `An error occurred while searching YouTube: ${(error as Error).message}`
			}
		}
	})

	ipcMain.handle('getYoutubeVideoData', async (_event, id: string): Promise<Status> => {
		try {
			return {
				success: true,
				message: 'Video data fetched successfully.',
				data: await GetVideoDetails(id)
			}
		} catch (error) {
			return {
				success: false,
				message: `An error occurred while fetching video data: ${(error as Error).message}`
			}
		}
	})

	ipcMain.handle('previewYoutube', async (_event, videoId: string): Promise<Buffer> => {
		const url = `https://www.youtube.com/watch?v=${videoId}`
		const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
		const chunks: Buffer[] = []
		return new Promise<Buffer>((resolve, reject) => {
			stream.on('data', (chunk: Buffer) => chunks.push(chunk))
			stream.on('end', () => resolve(Buffer.concat(chunks)))
			stream.on('error', (err: Error) => reject(err))
		})
	})

	ipcMain.handle('startDiscordRPC', (_event): void => {
		discordRPC()
	})
}

let rpcClient: RPC.Client | null = null
export function discordRPC(): void | Status {
	try {
		if (rpcClient) {
			return {
				success: false,
				message: 'Discord RPC is already running.'
			}
		}
		RPC.register('1386864810339340489')
		rpcClient = new RPC.Client({ transport: 'ipc' })
		rpcClient.login({ clientId: '1386864810339340489' })

		const startTimestamp = Math.floor(Date.now() / 1000)

		rpcClient.on('ready', () => {
			rpcClient?.setActivity({
				largeImageKey: 'chimer',
				largeImageText: 'Chimer',
				details: 'Idle',
				startTimestamp: startTimestamp,
				instance: false,
				buttons: [{ label: 'Download Chimer', url: 'https://github.com/SimiJS/Chimer' }]
			})
		})
		ipcMain.handle('setDiscordActivity', (_event, activity: RPC.Presence) => {
			rpcClient?.setActivity({
				...activity,
				details: activity.details || '',
				startTimestamp: activity.startTimestamp || startTimestamp,
				buttons: activity.buttons || [
					{ label: 'Download Chimer', url: 'https://github.com/SimiJS/Chimer' }
				]
			})
		})

		ipcMain.handle('clearDiscordActivity', () => {
			rpcClient?.setActivity({
				details: 'Idle',
				largeImageKey: 'chimer',
				largeImageText: 'Chimer',
				startTimestamp: startTimestamp,
				instance: false,
				buttons: [{ label: 'Download Chimer', url: 'https://github.com/SimiJS/Chimer' }]
			})
		})

		ipcMain.handle('stopDiscordRPC', () => {
			if (rpcClient) {
				rpcClient.destroy()
				rpcClient = null
			}
		})
	} catch (error) {
		return {
			success: false,
			message: `An error occurred while starting Discord RPC: ${(error as Error).message}`
		}
	}
}
