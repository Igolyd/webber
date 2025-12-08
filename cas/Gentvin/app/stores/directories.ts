import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export interface Directory {
  id: string
  groupId: string
  name: string
  position: number
  isCollapsed?: boolean
  createdAt: string
}

export const useDirectoriesStore = defineStore('directories', () => {
  const directories = useStorage<Directory[]>('app.directories', [])

  function addDirectory(payload: Omit<Directory, 'id' | 'createdAt'>) {
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const dir: Directory = { id, createdAt, ...payload }
    directories.value.push(dir)
    return dir
  }

  function removeDirectory(id: string) {
    directories.value = directories.value.filter(d => d.id !== id)
  }

  function updateDirectory(id: string, patch: Partial<Omit<Directory, 'id' | 'groupId'>>) {
    const idx = directories.value.findIndex(d => d.id === id)
    if (idx === -1) return
    const copy = [...directories.value]
    copy[idx] = { ...copy[idx], ...patch }
    directories.value = copy
  }

  function getByGroup(groupId: string) {
    return directories.value
      .filter(d => d.groupId === groupId)
      .sort((a, b) => a.position - b.position)
  }

  function getById(id: string) {
    return directories.value.find(d => d.id === id) || null
  }

  return {
    directories,
    addDirectory,
    removeDirectory,
    updateDirectory,
    getByGroup,
    getById,
  }
})