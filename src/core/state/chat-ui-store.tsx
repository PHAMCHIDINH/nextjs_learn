'use client'

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useStore } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createStore } from 'zustand/vanilla'

type ChatUiStoreState = {
  mutedConversationIds: string[]
  draftTextByConversationId: Record<string, string>
  searchQuery: string
  selectedConversationId: string | null
  showMobileChat: boolean
  toggleMutedConversation: (conversationId: string) => boolean
  setDraftText: (conversationId: string, value: string) => void
  clearDraft: (conversationId: string) => void
  setSearchQuery: (value: string) => void
  setSelectedConversationId: (conversationId: string | null) => void
  setShowMobileChat: (value: boolean) => void
  clearRuntimeState: () => void
}

type ChatUiStoreApi = ReturnType<typeof createChatUiStore>

const ChatUiStoreContext = createContext<ChatUiStoreApi | null>(null)

const createChatUiStore = () =>
  createStore<ChatUiStoreState>()(
    persist(
      (set) => ({
        mutedConversationIds: [],
        draftTextByConversationId: {},
        searchQuery: '',
        selectedConversationId: null,
        showMobileChat: false,
        toggleMutedConversation: (conversationId) => {
          let isMuted = false

          set((state) => {
            const mutedIds = new Set(state.mutedConversationIds)
            if (mutedIds.has(conversationId)) {
              mutedIds.delete(conversationId)
              isMuted = false
            } else {
              mutedIds.add(conversationId)
              isMuted = true
            }

            return {
              mutedConversationIds: Array.from(mutedIds),
            }
          })

          return isMuted
        },
        setDraftText: (conversationId, value) => {
          set((state) => ({
            draftTextByConversationId: {
              ...state.draftTextByConversationId,
              [conversationId]: value,
            },
          }))
        },
        clearDraft: (conversationId) => {
          set((state) => {
            const nextDrafts = { ...state.draftTextByConversationId }
            delete nextDrafts[conversationId]

            return {
              draftTextByConversationId: nextDrafts,
            }
          })
        },
        setSearchQuery: (value) => {
          set({ searchQuery: value })
        },
        setSelectedConversationId: (conversationId) => {
          set({ selectedConversationId: conversationId })
        },
        setShowMobileChat: (value) => {
          set({ showMobileChat: value })
        },
        clearRuntimeState: () => {
          set({
            searchQuery: '',
            selectedConversationId: null,
            showMobileChat: false,
          })
        },
      }),
      {
        name: 'cho-sinh-vien-chat-ui',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          mutedConversationIds: state.mutedConversationIds,
          draftTextByConversationId: state.draftTextByConversationId,
        }),
      },
    ),
  )

export function ChatUiStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createChatUiStore)

  return (
    <ChatUiStoreContext.Provider value={store}>
      {children}
    </ChatUiStoreContext.Provider>
  )
}

export const useChatUiStore = <T,>(
  selector: (state: ChatUiStoreState) => T,
): T => {
  const store = useContext(ChatUiStoreContext)
  if (!store) {
    throw new Error('useChatUiStore must be used within ChatUiStoreProvider')
  }

  return useStore(store, selector)
}
