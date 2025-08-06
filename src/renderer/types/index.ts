import { Settings } from '@/pages/Settings'

// Base Types
export interface Sound {
	id: string
	name: string
	soundSrc: string
	imageSrc?: string
	hotkey?: string
}

export interface Group {
	id: string
	name: string
	soundIds: readonly string[]
}

export interface Settings {
	mainOutputVol: number
	mainOutputDeviceId: string
	enableAuxOutput: boolean
	auxOutputVol: number
	auxOutputDeviceId: string
	readonly hotkeys: {
		readonly playPause: string
		readonly stop: string
		readonly forward: string
		readonly rewind: string
		readonly toggleMute: string
		readonly toggleLoop: string
	}
	soundDatabases: {
		readonly path: string
		readonly name: string
	}[]
	currentDatabase: string
}

export interface Status {
	readonly success: boolean
	readonly message: string
	readonly data?: any
}

export interface Database {
	name: string
	readonly sounds: Sound[]
	readonly groups: Group[]
}

// Group selection types
export const RESERVED_GROUPS = ['All', 'Ungrouped'] as const
export type GroupSelection = (typeof RESERVED_GROUPS)[number] | string

export const ACTION_NAME: Record<keyof Settings['hotkeys'], string> = {
	playPause: 'Play/Pause',
	stop: 'Stop',
	rewind: 'Rewind',
	forward: 'Forward',
	toggleLoop: 'Toggle Loop',
	toggleMute: 'Toggle Mute'
}
