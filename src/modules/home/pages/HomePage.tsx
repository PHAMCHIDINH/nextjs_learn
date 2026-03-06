import Link from 'next/link'
import { 
  ShoppingBag, 
  Shield, 
  Users, 
  Zap, 
  BookOpen, 
  Laptop, 
  Home, 
  PenTool,
  ArrowRight,
  CheckCircle2,
  Star
} from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

const features = [
  {
    icon: Shield,
    title: 'Xác minh sinh viên',
    description: 'Chỉ sinh viên cùng trường mới được tham gia. Xác minh qua email trường hoặc mã số sinh viên.'
  },
  {
    icon: Users,
    title: 'Cộng đồng tin cậy',
    description: 'Mua bán với bạn bè cùng trường, gặp mặt trực tiếp tại campus, an toàn và thuận tiện.'
  },
  {
    icon: Zap,
    title: 'Giao dịch nhanh chóng',
    description: 'Chat trực tiếp với người bán, thỏa thuận giá và hẹn gặp chỉ trong vài phút.'
  }
]

const categories = [
  { icon: BookOpen, name: 'Giáo trình', count: 234, color: 'bg-blue-500/10 text-blue-600' },
  { icon: Laptop, name: 'Điện tử', count: 156, color: 'bg-orange-500/10 text-orange-600' },
  { icon: Home, name: 'Đồ phòng trọ', count: 189, color: 'bg-green-500/10 text-green-600' },
  { icon: PenTool, name: 'Dụng cụ học tập', count: 98, color: 'bg-purple-500/10 text-purple-600' },
]

const stats = [
  { value: '5,000+', label: 'Sinh viên' },
  { value: '12,000+', label: 'Sản phẩm' },
  { value: '8,500+', label: 'Giao dịch' },
  { value: '98%', label: 'Hài lòng' },
]

const testimonials = [
  {
    name: 'Nguyễn Minh Anh',
    role: 'Sinh viên năm 3 - CNTT',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anh',
    content: 'Mình đã bán được bộ giáo trình cũ với giá tốt và mua được laptop secondhand chất lượng. Rất tiện lợi!'
  },
  {
    name: 'Trần Văn Hùng',
    role: 'Sinh viên năm 2 - Kinh tế',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hung',
    content: 'Tiết kiệm được khá nhiều tiền khi mua đồ từ các anh chị khóa trên. Giao dịch nhanh gọn, an toàn.'
  },
  {
    name: 'Lê Thu Hương',
    role: 'Sinh viên năm 4 - Marketing',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Huong',
    content: 'Sắp ra trường nên bán hết đồ trong phòng. Chỉ cần đăng tin là có người liên hệ ngay!'
  }
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20">
                Dành riêng cho sinh viên
              </Badge>
              <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-6xl">
                Chợ mua bán nội bộ
                <span className="text-primary"> sinh viên đại học</span>
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Nền tảng mua bán đồ cũ an toàn, tiện lợi. Từ giáo trình, đồ điện tử đến đồ phòng trọ - 
                tất cả đều có giá tốt nhất từ sinh viên cùng trường.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/auth?mode=register">
                  <Button size="lg" className="gap-2 text-base">
                    Bắt đầu ngay
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button size="lg" variant="outline" className="text-base">
                    Khám phá chợ
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        </section>

        {/* Stats Section */}
        <section className="border-y border-border bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Tại sao chọn Chợ Sinh Viên?
              </h2>
              <p className="text-muted-foreground">
                Được thiết kế riêng cho sinh viên, với những tính năng giúp việc mua bán an toàn và tiện lợi hơn bao giờ hết.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="relative overflow-hidden border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-muted/30 py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Danh mục phổ biến
              </h2>
              <p className="text-muted-foreground">
                Tìm kiếm theo danh mục để nhanh chóng tìm được món đồ bạn cần.
              </p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <Link key={category.name} href={`/marketplace?category=${category.name.toLowerCase()}`}>
                  <Card className="group cursor-pointer border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${category.color}`}>
                        <category.icon className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.count} sản phẩm</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Bắt đầu trong 3 bước đơn giản
              </h2>
              <p className="text-muted-foreground">
                Tham gia cộng đồng mua bán sinh viên chỉ trong vài phút.
              </p>
            </div>
            
            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
              {[
                { step: '01', title: 'Đăng ký tài khoản', desc: 'Xác minh bằng email trường hoặc mã số sinh viên' },
                { step: '02', title: 'Đăng tin hoặc tìm kiếm', desc: 'Đăng bán đồ của bạn hoặc tìm kiếm món đồ cần mua' },
                { step: '03', title: 'Chat và giao dịch', desc: 'Liên hệ người bán, thỏa thuận và giao dịch trực tiếp' },
              ].map((item, index) => (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                  {index < 2 && (
                    <div className="absolute left-[60%] top-8 hidden h-0.5 w-full bg-border md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-muted/30 py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Sinh viên nói gì về chúng tôi?
              </h2>
              <p className="text-muted-foreground">
                Hàng nghìn sinh viên đã tin tưởng sử dụng Chợ Sinh Viên.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="mb-4 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="mb-6 text-muted-foreground">&quot;{testimonial.content}&quot;</p>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
              <CardContent className="flex flex-col items-center gap-8 p-12 text-center md:flex-row md:text-left">
                <div className="flex-1">
                  <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                    Sẵn sàng tham gia chưa?
                  </h2>
                  <p className="mb-6 text-muted-foreground">
                    Đăng ký miễn phí ngay hôm nay và bắt đầu mua bán với sinh viên cùng trường.
                  </p>
                  <ul className="mb-6 space-y-2">
                    {['Đăng ký miễn phí', 'Không mất phí giao dịch', 'Hỗ trợ 24/7'].map((item) => (
                      <li key={item} className="flex items-center justify-center gap-2 text-sm md:justify-start">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/auth?mode=register">
                    <Button size="lg" className="gap-2">
                      Đăng ký ngay
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/marketplace">
                    <Button size="lg" variant="outline">
                      Xem chợ
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
