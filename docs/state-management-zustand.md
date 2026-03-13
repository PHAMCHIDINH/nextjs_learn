# State Management voi Zustand

## Muc tieu

Frontend nay da dung `@tanstack/react-query` cho server state, nhung shared client state truoc day bi tach ra giua:

- React Context thu cong trong `auth-provider` va `notification-provider`
- `localStorage` tu quan ly trong `ChatPage`
- `useState` cuc bo cho mot so runtime state can dung lai qua nhieu component

Dot migrate nay dua codebase ve dung boundary:

- `React Query`: fetch, cache, invalidate, refetch server data
- `Zustand`: shared client state, session runtime, realtime UI state
- `react-hook-form`: form state va validation
- URL/search params: state can deep-link/share

## Pain points truoc khi migrate

- `AuthProvider` dung query cache lam source of truth cho session, nen session logic va server cache bi tron vai tro.
- `NotificationProvider` vua giu React Context, vua ghi truc tiep vao query cache de optimistic update, lam cho luong realtime kho theo doi.
- `ChatPage` tu doc/ghi `localStorage` cho mute state va khong co noi tap trung de giu draft text theo tung hoi thoai.
- Khong co taxonomy ro rang de quyet dinh khi nao dung React Query, khi nao dung shared client store.

## Kien truc moi

Thu muc moi:

```text
src/core/state/
├── auth-store.tsx
├── notification-store.tsx
└── chat-ui-store.tsx
```

Nguyen tac:

- Moi store duoc tao bang `createStore(...)` va cap qua provider client-side.
- Hook component chi doc state bang selector de tranh re-render khong can thiet.
- Khong dung module-global singleton store cho state co the bi anh huong boi App Router lifecycle.

## Store taxonomy

### 1. Auth store

Store nay la source of truth cho session client runtime:

- `user`
- `status`
- `bootstrap()`
- `setSession()`
- `refreshMe()`
- `logout()`
- `clear()`

Rule:

- Khong persist auth state vao `localStorage`
- Bootstrap session bang `authApi.me()` khi app mount
- Van dong bo `queryKeys.auth.me()` de giu compatibility voi code da co, nhung query cache khong con la source of truth

### 2. Notification store

Store nay gom shared realtime state:

- `notifications`
- `unreadCount`
- `socketConnected`
- `bootstrap()`
- `refresh()`
- `markRead()`
- `markAllRead()`
- `pushIncoming()`
- `clear()`

Rule:

- Feed thong bao khong persist
- Socket instance van nam trong provider, khong nam trong store
- Optimistic update xay ra trong store, khong thao tac truc tiep len React Query cache

### 3. Chat UI store

Store nay gom client UI state co gia tri dung lai:

- `mutedConversationIds`
- `draftTextByConversationId`
- `searchQuery`
- `selectedConversationId`
- `showMobileChat`

Rule:

- Chi persist `mutedConversationIds` va `draftTextByConversationId`
- `selectedConversationId`, `showMobileChat`, `searchQuery` chi la runtime state
- Server collections nhu `messages`, `conversations` van fetch bang API/React Query

## Cach chon cong cu state

### Dung React Query khi:

- State den tu backend
- Can cache/refetch/invalidate
- Can quan ly loading/error theo request

Vi du:

- danh sach hoi thoai
- message history
- dashboard summary
- listing detail

### Dung Zustand khi:

- State thuoc client runtime va duoc dung o nhieu component/provider
- Can giu state qua route change ma khong muon day len URL
- Co optimistic/realtime behavior khong phai server cache

Vi du:

- user session runtime
- notification badge state
- muted conversations
- draft text theo conversation

### Dung react-hook-form khi:

- State phuc vu form input, validation, submit

Vi du:

- auth forms
- listing editor
- chat composer validation

### Dung URL state khi:

- State can deep-link
- Refresh lai van phai mo dung context

Vi du:

- `conversation`, `product`, `seller` trong trang chat
- bo loc shareable cua marketplace

## Migration map

### `AuthProvider`

Truoc day:

- query `auth.me` la source of truth
- context chi wrap cac ham doc/ghi query cache

Sau migrate:

- provider chi bootstrap auth store va expose lai `useAuth()`
- caller khong can doi API

### `NotificationProvider`

Truoc day:

- dung query hooks + mutations + direct query cache writes
- socket event ghi vao query cache

Sau migrate:

- provider chi bootstrap/disconnect socket theo `user`
- notification store giu unread count, feed, optimistic mark-read
- caller van tiep tuc dung `useNotification()`

### `ChatPage`

Truoc day:

- mute state doc/ghi bang `localStorage` thu cong
- selected conversation, mobile mode, search query, draft text la local state

Sau migrate:

- mute + draft duoc dua vao chat UI store
- selected conversation va mobile mode cung di qua shared runtime store
- deep link tu URL van co uu tien hon runtime state cu

## Mẫu selector

Nen doc store theo selector nho:

```tsx
const unreadCount = useNotificationStore((state) => state.unreadCount)
const setSelectedConversationId = useChatUiStore(
  (state) => state.setSelectedConversationId,
)
```

Khong nen doc ca object lon neu component chi can mot truong:

```tsx
const state = useNotificationStore((state) => state)
```

Ly do:

- selector nho giup giam re-render
- boundary phu trach cua component ro hon

## Naming convention

- Store file: `*-store.tsx`
- Provider compatibility giu ten cu trong `src/core/providers/*`
- Hook compatibility:
  - `useAuth()`
  - `useNotification()`
- Hook store noi bo:
  - `useAuthStore(...)`
  - `useNotificationStore(...)`
  - `useChatUiStore(...)`

## Anti-pattern can tranh

- Khong dua query cache vao Zustand
- Khong dua `File`, `Socket`, upload progress dai han vao persisted store
- Khong dua listing/message collections vao global client store neu chung da la server data
- Khong dung module-global singleton store cho App Router request lifecycle
- Khong dung Context thu cong lam noi giu business state neu store selector da du

## Checklist khi mo rong ve sau

- Xac dinh state do la server state hay client runtime state
- Neu la shared client state, tao store action ro rang thay vi setState rỏi rac
- Persist chi khi state thuc su can qua reload
- Giu hook compatibility neu dang migrate dan, tranh churn lon cho caller
