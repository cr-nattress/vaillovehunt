export interface FeedPost {
  id: string
  teamName: string
  teamEmoji: string
  locationName: string
  stopTitle: string
  imageUrl: string
  caption: string
  timestamp: string
  reactions: {
    likes: number
    comments: number
    shares: number
  }
}

export interface TeamInfo {
  name: string
  emoji: string
  color: string
}