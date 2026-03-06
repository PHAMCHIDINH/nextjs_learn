import Link from 'next/link'
import { Facebook, Mail, ShoppingBag } from 'lucide-react'

const footerLinks = {
  platform: [
    { name: 'Về chúng tôi', href: '#' },
    { name: 'Điều khoản sử dụng', href: '#' },
    { name: 'Chính sách bảo mật', href: '#' },
    { name: 'Hướng dẫn mua bán', href: '#' },
  ],
  categories: [
    { name: 'Giáo trình', href: '/marketplace?category=textbook' },
    { name: 'Điện tử', href: '/marketplace?category=electronics' },
    { name: 'Đồ phòng trọ', href: '/marketplace?category=dorm' },
    { name: 'Dụng cụ học tập', href: '/marketplace?category=study' },
  ],
  support: [
    { name: 'Trung tâm hỗ trợ', href: '#' },
    { name: 'Báo cáo vi phạm', href: '#' },
    { name: 'Câu hỏi thường gặp', href: '#' },
    { name: 'Liên hệ', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <ShoppingBag className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Chợ Sinh Viên</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Nền tảng mua bán nội bộ dành riêng cho sinh viên. An toàn, tiện lợi và tiết kiệm hơn cho từng học kỳ.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground transition-colors hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="mailto:support@chosinhvien.vn" className="text-muted-foreground transition-colors hover:text-primary">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Nền tảng</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Danh mục</h3>
            <ul className="space-y-3">
              {footerLinks.categories.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Hỗ trợ</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">2024 Chợ Sinh Viên. Đồ án tốt nghiệp - DEMO.</p>
          <p className="text-sm text-muted-foreground">Thiết kế với sự quan tâm đến trải nghiệm của sinh viên Việt Nam.</p>
        </div>
      </div>
    </footer>
  )
}
