import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Laptop,
  MessageSquareText,
  PenTool,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Warehouse,
} from 'lucide-react'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import type { Category } from '@/lib/types'

const categorySpotlights: Array<{
  key: Category
  name: string
  count: string
  accent: string
  icon: typeof BookOpen
  summary: string
}> = [
  {
    key: 'textbook',
    name: 'Giáo trình',
    count: '234 tin',
    accent: 'from-sky-500/20 to-cyan-500/5',
    icon: BookOpen,
    summary: 'Sách chuyên ngành, note môn học và bộ đề từ sinh viên khóa trên.',
  },
  {
    key: 'electronics',
    name: 'Đồ điện tử',
    count: '156 tin',
    accent: 'from-amber-500/20 to-orange-500/5',
    icon: Laptop,
    summary: 'Laptop, máy tính bảng, phụ kiện học tập và đồ công nghệ đã qua sử dụng.',
  },
  {
    key: 'dorm',
    name: 'Đồ phòng trọ',
    count: '189 tin',
    accent: 'from-emerald-500/20 to-lime-500/5',
    icon: Warehouse,
    summary: 'Quạt, bàn học, đèn bàn, tủ mini và các món giúp ở trọ gọn gàng hơn.',
  },
  {
    key: 'study',
    name: 'Dụng cụ học tập',
    count: '98 tin',
    accent: 'from-rose-500/20 to-fuchsia-500/5',
    icon: PenTool,
    summary: 'Máy tính cầm tay, bút vẽ, bảng viết và nhiều món phục vụ học nhóm.',
  },
]

const trustPoints = [
  {
    icon: Shield,
    title: 'Xác minh sinh viên',
    description: 'Mua bán trong một mạng lưới đã được xác thực thay vì chợ rộng ngoài trường.',
  },
  {
    icon: MessageSquareText,
    title: 'Chat và chốt nhanh',
    description: 'Liên lạc trực tiếp, hẹn xem hàng tại campus và đồng bộ theo từng sản phẩm.',
  },
  {
    icon: Clock3,
    title: 'Lên tin trong vài phút',
    description: 'Đăng bài gọn, rõ, tập trung vào ảnh, giá và thông tin người bán cần biết.',
  },
]

const storyStats = [
  { value: '5,000+', label: 'sinh viên tham gia' },
  { value: '12,000+', label: 'sản phẩm đã đăng' },
  { value: '8,500+', label: 'giao dịch đã khớp' },
  { value: '98%', label: 'người dùng quay lại' },
]

const steps = [
  {
    index: '01',
    title: 'Tạo tài khoản bằng email trường',
    description: 'Đăng ký nhanh, xác minh danh tính và bắt đầu tham gia chợ nội bộ.',
  },
  {
    index: '02',
    title: 'Đăng tin hoặc tìm theo danh mục',
    description: 'Lọc theo giá, khoa, tình trạng và xem được người đăng có xác minh hay không.',
  },
  {
    index: '03',
    title: 'Chat, hẹn gặp, giao dịch',
    description: 'Chốt giá, hẹn điểm trong campus và hoàn tất giao dịch an toàn hơn.',
  },
]

const testimonials = [
  {
    name: 'Minh Anh',
    role: 'CNTT năm 3',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anh',
    content: 'Bán giáo trình xong trong buổi tối, tiền chốt vào ví ngay trong tuần đầu.',
  },
  {
    name: 'Văn Hùng',
    role: 'Kinh tế năm 2',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hung',
    content: 'Mua được laptop cũ giá dễ hơn chợ ngoài mà vẫn gặp người bán cùng trường.',
  },
  {
    name: 'Thu Hương',
    role: 'Marketing năm 4',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huong',
    content: 'Lúc chuyển trọ chỉ cần đăng lô đồ, từ bàn học đến quạt mini đều có người hỏi.',
  },
]

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_28%),linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)]">
      <Header />

      <main className="relative">
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_32%),radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_30%)]" />
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="max-w-3xl">
                <Badge className="mb-5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-primary hover:bg-primary/10">
                  Nơi mua bán riêng cho sinh viên
                </Badge>
                <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
                  Mua bán đồ cũ trong trường theo cách nhanh, đẹp và đáng tin hơn.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                  Từ giáo trình, laptop đến đồ phòng trọ. Mỗi giao dịch đều bắt đầu từ một cộng đồng nhỏ hơn,
                  rõ người bán hơn và dễ hẹn gặp hơn.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/marketplace">
                    <Button size="lg" className="h-12 gap-2 rounded-full px-6 text-base">
                      Vào marketplace
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/auth?mode=register">
                    <Button size="lg" variant="outline" className="h-12 rounded-full px-6 text-base">
                      Tạo tài khoản
                    </Button>
                  </Link>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5">
                    <Shield className="h-4 w-4 text-primary" />
                    Xác minh theo email trường
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5">
                    <MessageSquareText className="h-4 w-4 text-primary" />
                    Chat theo từng sản phẩm
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Giá tốt hơn chợ rộng
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                <Card className="overflow-hidden border-border/60 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/10">
                  <CardContent className="p-0">
                    <div className="border-b border-white/10 px-6 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm uppercase tracking-[0.24em] text-emerald-300/80">Market Pulse</p>
                          <h2 className="mt-2 text-2xl font-semibold">Sinh viên đang cần mua gì tuần này?</h2>
                        </div>
                        <Sparkles className="h-5 w-5 text-amber-300" />
                      </div>
                    </div>
                    <div className="grid gap-3 p-6">
                      {[
                        { label: 'Giáo trình môn đại cương', delta: '+26%' },
                        { label: 'Tai nghe và bàn phím học online', delta: '+18%' },
                        { label: 'Quạt mini và bàn học phòng trọ', delta: '+14%' },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-zinc-100">{item.label}</p>
                            <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                              {item.delta}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2">
                  {storyStats.map((stat) => (
                    <Card key={stat.label} className="border-border/60 bg-white/80 shadow-sm backdrop-blur">
                      <CardContent className="p-5">
                        <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="max-w-2xl">
              <Badge variant="outline" className="rounded-full bg-background/80">
                Danh mục hot
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Chọn nhanh khu vực mua bán mà sinh viên vào nhiều nhất.
              </h2>
            </div>
            <Link href="/marketplace" className="hidden md:block">
              <Button variant="ghost" className="gap-2">
                Xem tất cả
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {categorySpotlights.map((category) => {
              const Icon = category.icon

              return (
                <Link key={category.key} href={`/marketplace?category=${category.key}`}>
                  <Card className="group h-full overflow-hidden border-border/60 bg-white/85 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                    <CardContent className="relative p-6">
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.accent} opacity-80`} />
                      <div className="relative flex h-full flex-col justify-between gap-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-lg shadow-zinc-950/10">
                            <Icon className="h-5 w-5" />
                          </div>
                          <Badge className="rounded-full bg-background/85 text-foreground hover:bg-background/85">
                            {category.count}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold tracking-tight">{category.name}</h3>
                          <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                            {category.summary}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                          Khám phá danh mục
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="border-y border-border/60 bg-zinc-950 py-16 text-white md:py-20">
          <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
            {trustPoints.map((item) => {
              const Icon = item.icon

              return (
                <Card key={item.title} className="border-white/10 bg-white/5 text-white shadow-none backdrop-blur">
                  <CardContent className="p-6">
                    <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/10">
                      <Icon className="h-5 w-5 text-emerald-300" />
                    </div>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">{item.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="max-w-xl">
              <Badge variant="outline" className="rounded-full bg-background/80">
                Quy trình 3 bước
              </Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Đúng như một chợ nội bộ, nhưng được tổ chức gọn và dễ giao dịch hơn.
              </h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                Mục tiêu không phải là thêm nhiều tính năng. Mục tiêu là giúp sinh viên đăng, tìm, chat và chốt
                nhanh hơn trong một không gian nhỏ và dễ tin hơn.
              </p>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <Card key={step.index} className="border-border/60 bg-white/80 shadow-sm">
                  <CardContent className="flex gap-4 p-6">
                    <div className="flex flex-col items-center">
                      <div className="flex size-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {step.index}
                      </div>
                      {index < steps.length - 1 ? <div className="mt-3 h-full w-px bg-border" /> : null}
                    </div>
                    <div className="pb-2">
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16 md:pb-20">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="overflow-hidden border-border/60 bg-white/85 shadow-xl shadow-zinc-950/5">
              <CardHeader className="pb-0">
                <Badge variant="outline" className="w-fit rounded-full bg-background/80">
                  Phản hồi từ người dùng
                </Badge>
                <CardTitle className="mt-4 text-3xl font-semibold tracking-tight">
                  Sinh viên sử dụng và quay lại vì nó giải quyết đúng một việc.
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-6 md:grid-cols-3">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.name} className="rounded-3xl border border-border/70 bg-background/80 p-5">
                    <div className="mb-4 flex gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={`${testimonial.name}-${index}`} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="min-h-20 text-sm leading-7 text-muted-foreground">{testimonial.content}</p>
                    <Separator className="my-4" />
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-[linear-gradient(135deg,_rgba(9,9,11,1)_0%,_rgba(39,39,42,0.96)_70%,_rgba(34,197,94,0.22)_100%)] text-white shadow-xl shadow-zinc-950/10">
              <CardContent className="flex h-full flex-col justify-between p-8">
                <div>
                  <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">Sẵn sàng bắt đầu?</Badge>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
                    Đăng ký miễn phí và đưa món đồ tiếp theo của bạn lên chợ ngay hôm nay.
                  </h2>
                  <p className="mt-4 text-sm leading-8 text-zinc-300">
                    Phù hợp cho tân sinh viên cần tiết kiệm, người chuyển trọ cần thanh lý nhanh, và bất kỳ ai muốn
                    mua đồ cũ gọn hơn cho mỗi học kỳ.
                  </p>
                </div>
                <div className="mt-8 space-y-4">
                  {[
                    'Đăng ký và xác minh nhanh',
                    'Không mất phí đăng bài',
                    'Dễ hẹn gặp tại trường và ký túc xá',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-zinc-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/auth?mode=register">
                    <Button size="lg" className="w-full rounded-full bg-white text-zinc-950 hover:bg-zinc-100 sm:w-auto">
                      Đăng ký ngay
                    </Button>
                  </Link>
                  <Link href="/marketplace">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
                    >
                      Xem marketplace
                    </Button>
                  </Link>
                </div>
                <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex size-11 items-center justify-center rounded-full bg-white/10">
                    <Users className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cộng đồng nhỏ, tốc độ nhanh</p>
                    <p className="text-xs text-zinc-300">Phù hợp với giao dịch cần gặp người thật thay vì lang mang trên chợ rộng.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pb-6">
          <div className="container mx-auto px-4">
            <div className="rounded-[2rem] border border-border/60 bg-white/70 p-6 shadow-sm backdrop-blur md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Chợ Sinh Viên</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                    Giữ cho mua bán trong trường gọn, nhanh và dễ tin hơn.
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Tập trung vào trải nghiệm frontend và luồng giao dịch thực tế của sinh viên.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
