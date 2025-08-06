import { app, shell, BrowserWindow, ipcMain, autoUpdater } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { ipcHandlers } from './apis'

function startupChecks() {
	autoUpdater.checkForUpdates()
	autoUpdater.on('update-available', () => {
		autoUpdater.quitAndInstall()
	})

	const gotTheLock = app.requestSingleInstanceLock()
	if (!gotTheLock) {
		app.quit()
		return
	}

	app.on('second-instance', (_event, _commandLine) => {
		const win = BrowserWindow.getAllWindows()[0]
		if (win) {
			if (win.isMinimized()) win.restore()
			win.focus()
		} else {
			createWindow()
		}
	})
}

function createWindow(): BrowserWindow {
	startupChecks()
	global
	const mainWindow = new BrowserWindow({
		title: 'Chimer',
		minHeight: 50,
		minWidth: 540,
		width: 900,
		height: 670,
		show: false,
		autoHideMenuBar: true,
		frame: false,
		darkTheme: true,
		titleBarStyle: 'hidden',
		...(process.platform === 'linux' ? { icon } : {}),
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			// snyk:ignore
			nodeIntegration: true,
			sandbox: false
		}
	})

	mainWindow.on('ready-to-show', () => {
		mainWindow.show()
	})

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url)
		return { action: 'deny' }
	})

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
		mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
	} else {
		mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
	}

	return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	electronApp.setAppUserModelId('com.simi.chimer')

	app.on('browser-window-created', (_, window) => {
		optimizer.watchWindowShortcuts(window)
	})

	const window = createWindow()
	ipcMain.handle('closeWindow', () => {
		window.close()
	})

	ipcMain.handle('minimizeWindow', () => {
		window.minimize()
	})

	ipcMain.handle('pinWindow', () => {
		const isPinned = window.isAlwaysOnTop()
		if (isPinned) {
			window.setAlwaysOnTop(false)
			window.setOpacity(1.0) // Restore full opacity when unpinning
		} else {
			window.setAlwaysOnTop(true, 'screen-saver')
			window.setOpacity(0.87) // Set opacity only when pinning
			window.focus()
			window.show()
		}
		return !isPinned
	})

	ipcMain.handle('getPinState', () => {
		return window.isAlwaysOnTop()
	})

	ipcHandlers()
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})

	if (process.argv.find((arg) => arg.endsWith('.sdb'))) {
		window.webContents.send(
			'openFile',
			process.argv.find((arg) => arg.endsWith('.sdb'))
		)
	}
})

// Clean up resources before app quits
app.on('before-quit', () => {
	const { globalShortcut } = require('electron')
	globalShortcut.unregisterAll()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})
