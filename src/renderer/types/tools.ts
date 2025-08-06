import { GroupSelection, RESERVED_GROUPS } from '.'

class TypeTools {
	isDuplicateGroup(name: string, existingGroups: { name: string }[]): boolean {
		return (
			existingGroups.some(
				(group) => group.name.toLowerCase() === name.trim().toLowerCase()
			) || RESERVED_GROUPS.some((reserved) => reserved.toLowerCase() === name.toLowerCase())
		)
	}

	isCustomGroup(groupSelection: GroupSelection): boolean {
		return !RESERVED_GROUPS.includes(groupSelection as any)
	}
}

export const typeTools = new TypeTools()
