import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
	readData: async (filePath: string) => {
		return await ipcRenderer.invoke('readData', filePath)
	},
	writeData: async (filePath: string, data: ArrayBuffer) => {
		return await ipcRenderer.invoke('writeData', filePath, data)
	},
	openDialog: async (options: Electron.OpenDialogOptions) => {
		return await ipcRenderer.invoke('openDialog', options)
	},
	saveDialog: async (options: Electron.SaveDialogOptions) => {
		return await ipcRenderer.invoke('saveDialog', options)
	},
	close: () => {
		ipcRenderer.invoke('closeWindow')
	},
	minimize: () => {
		ipcRenderer.invoke('minimizeWindow')
	},
	pinWindow: async () => {
		return await ipcRenderer.invoke('pinWindow')
	},
	getPinState: async () => {
		return await ipcRenderer.invoke('getPinState')
	},
	setSoundHotkeys: async (soundKeys: { soundId: string; hotkey: string }[]) => {
		return await ipcRenderer.invoke('setSoundHotkeys', soundKeys)
	},
	downloadYoutube: async (videoId: string) => {
		return await ipcRenderer.invoke('downloadYoutube', videoId)
	},
	searchYoutube: async (searchTerm: string) => {
		return await ipcRenderer.invoke('searchYoutube', searchTerm)
	},
	previewYoutube: async (videoId: string) => {
		return await ipcRenderer.invoke('previewYoutube', videoId)
	},
	getYoutubeVideoData: async (id: string) => {
		return await ipcRenderer.invoke('getYoutubeVideoData', id)
	},
	setActionHotkeys: async (actionKeys: { action: string; hotkey: string }[]) => {
		return await ipcRenderer.invoke('setActionHotkeys', actionKeys)
	}
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('electron', electronAPI)
		contextBridge.exposeInMainWorld('api', api)
	} catch (error) {
		console.error(error)
	}
} else {
	// @ts-ignore (define in dts)
	window.electron = electronAPI
	// @ts-ignore (define in dts)
	window.api = api
}
