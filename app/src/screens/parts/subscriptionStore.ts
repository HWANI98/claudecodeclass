export type SavedSubscription = {
  id: string
  planId: string
  name: string
  phone: string
  createdAt: string
}

// 모듈 메모리에만 둔다. 새로고침하면 사라진다.
let saved: SavedSubscription | null = null

export function saveSubscription(next: SavedSubscription) {
  saved = next
}

export function readSubscription() {
  return saved
}
