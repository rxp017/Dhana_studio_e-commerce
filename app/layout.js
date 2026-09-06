import './globals.css'
import { Fraunces, Archivo, Noto_Serif_Devanagari } from 'next/font/google'
import AppProvider from '@/components/providers'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import Cursor from '@/components/Cursor'

const d = Fraunces({ subsets: ['latin'], variable: '--font-d', style: ['normal', 'italic'] })
const b = Archivo({ subsets: ['latin'], variable: '--font-b' })
const dev = Noto_Serif_Devanagari({ subsets: ['devanagari'], variable: '--font-dev' })

export const metadata = {
  title: 'Dhana Studio — Wear Your Vibe. Be You.',
  description: 'Custom-printed t-shirts and bespoke printed sarees, crafted in India. Free shipping over ₹999, delivery in 4–6 days, secure Razorpay checkout.',
  icons: { icon: [{ url: '/logo.jpeg', type: 'image/jpeg' }] },
}

const themeBoot = `(function(){try{var t=localStorage.getItem('dhana_theme');if(t!=='dark'){t='light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${d.variable} ${b.variable} ${dev.variable}`} data-theme="light" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <AppProvider>
          <Cursor />
          <Nav />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
        </AppProvider>
      </body>
    </html>
  )
}