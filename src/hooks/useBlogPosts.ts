import { useState, useEffect } from 'react'
import { STATIC_BLOG_POSTS, type BlogPost } from '../data/staticBlogPosts'

interface UseBlogData {
  posts: BlogPost[]
  loading: boolean
  error: string | null
}

export function useBlogPosts(): UseBlogData {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    // TODO: fetch from Supabase blog_posts table when migration is applied
    // For now, use static fallback
    setPosts(STATIC_BLOG_POSTS)
    setLoading(false)
  }, [])

  return { posts, loading, error }
}

export function useBlogPostBySlug(slug: string): UseBlogData & { post: BlogPost | null } {
  const { posts, loading, error } = useBlogPosts()
  const post = posts.find(p => p.slug === slug) || null

  return { posts, post, loading, error }
}
