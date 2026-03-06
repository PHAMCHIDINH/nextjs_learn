import EditPostPage from '@/modules/post/pages/EditPostPage'

type EditPostRouteProps = {
  params: Promise<{ id: string }>
}

export default function Page({ params }: EditPostRouteProps) {
  return <EditPostPage params={params} />
}
