import UserProfilePage from '@/modules/users/pages/UserProfilePage'

type UserProfileRouteProps = {
  params: Promise<{ id: string }>
}

export default function Page({ params }: UserProfileRouteProps) {
  return <UserProfilePage params={params} />
}
