import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { loadFavorites, saveFavorites } from '@/services/storage'
import { STORAGE_KEY } from '@/types/pokemon'
import type { FavoritePokemon } from '@/types/pokemon'

const pikachuFavorite: FavoritePokemon = {
  name: 'pikachu',
  id: 25,
  imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
  types: ['electric'],
  addedAt: '2026-08-15T10:00:00.000Z',
}

const bulbasaurFavorite: FavoritePokemon = {
  name: 'bulbasaur',
  id: 1,
  imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
  types: ['grass', 'poison'],
  addedAt: '2026-08-15T10:05:00.000Z',
}

describe('favorites storage', () => {
  let getItemSpy: ReturnType<typeof vi.spyOn>
  let setItemSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    window.localStorage.clear()
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('round-trips favorites under the pokemon-favorites key', () => {
    saveFavorites([pikachuFavorite, bulbasaurFavorite])

    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify([pikachuFavorite, bulbasaurFavorite]))
    expect(loadFavorites()).toEqual([pikachuFavorite, bulbasaurFavorite])
  })

  it('returns an empty list when nothing is stored', () => {
    expect(loadFavorites()).toEqual([])
  })

  it('discards corrupt JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid json')

    expect(loadFavorites()).toEqual([])
  })

  it('discards JSON that is not an array', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 'pikachu' }))

    expect(loadFavorites()).toEqual([])
  })

  it('falls back to in-memory storage when localStorage throws', () => {
    getItemSpy.mockImplementation(() => {
      throw new Error('SecurityError: access denied')
    })
    setItemSpy.mockImplementation(() => {
      throw new Error('SecurityError: access denied')
    })

    expect(() => saveFavorites([pikachuFavorite])).not.toThrow()
    expect(loadFavorites()).toEqual([pikachuFavorite])
  })

  it('recovers once localStorage works again', () => {
    getItemSpy.mockImplementation(() => {
      throw new Error('SecurityError: access denied')
    })
    setItemSpy.mockImplementation(() => {
      throw new Error('SecurityError: access denied')
    })
    saveFavorites([pikachuFavorite])

    vi.restoreAllMocks()
    window.localStorage.clear()

    saveFavorites([bulbasaurFavorite])
    expect(loadFavorites()).toEqual([bulbasaurFavorite])
  })
})
