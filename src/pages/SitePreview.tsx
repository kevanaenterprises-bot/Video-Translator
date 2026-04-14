import React, { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  Button, HStack, VStack, Badge, Persona, Container,
} from '@blinkdotnew/ui'
import {
  ArrowLeft, Phone, MapPin, Clock, Star, ChevronRight, CheckCircle2,
  Quote, Navigation, ExternalLink, Utensils, Wrench, Scissors,
  Home, ShoppingBag, Award, Shield, Zap,
} from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { blink } from '@/blink/client'
import { LEADS } from '../data/leads'

function getIndustryConfig(category: string, businessName = '') {
  const cat = (category || '').toLowerCase()
  const biz = (businessName || '').toLowerCase()

  if (cat.includes('shoe') || biz.includes('shoe') || biz.includes('cobbler')) {
    return {
      icon: ShoppingBag,
      heroImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop',
      aboutImage: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=2070&auto=format&fit=crop',
      trustBars: ['EXPERT CRAFTSMEN', 'ALL BRANDS', 'SAME-DAY SERVICE', 'QUALITY GUARANTEED'],
      primaryCta: 'Get a Repair Quote', secondaryCta: 'Our Services',
      serviceLabel: 'Our Services', serviceSubtitle: 'Master Craftsmanship',
      guaranteeText: 'Quality Guaranteed',
      bulletPoints: ['Master cobblers with decades of experience', 'All brands repaired — from everyday to luxury', 'Leather, soles, heels, bags & more'],
      defaultReviews: [
        { author: 'Maria T.', text: 'Brought in my favorite leather boots and they came back looking brand new. Incredible craftsmanship!', rating: 5 },
        { author: 'James K.', text: 'Same-day service on my dress shoes. You saved my business meeting. Thank you!', rating: 5 },
        { author: 'Sandra L.', text: 'Repaired my designer heels perfectly. Couldn\'t believe the quality of the work for the price.', rating: 5 },
      ],
    }
  }

  if (biz.includes('donut') || biz.includes('doughnut') || cat.includes('donut') || cat.includes('bakery')) {
    return {
      icon: Utensils,
      heroImage: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=2070&auto=format&fit=crop',
      aboutImage: 'https://images.unsplash.com/photo-1525193612562-0ec53b0e5d7c?q=80&w=2070&auto=format&fit=crop',
      trustBars: ['FRESH EVERY MORNING', 'MADE FROM SCRATCH', 'FAMILY OWNED', 'OPEN EARLY'],
      primaryCta: 'Order Today', secondaryCta: 'See Full Menu',
      serviceLabel: 'Our Menu', serviceSubtitle: 'Baked Fresh Daily',
      guaranteeText: 'Made Fresh Daily',
      bulletPoints: ['Hand-crafted donuts made every morning', 'Classic glazed to custom creations', 'Wholesale & custom orders welcome'],
      defaultReviews: [
        { author: 'Chris M.', text: 'Best donuts in Frisco, hands down. Fresh every single morning and the staff is always so friendly!', rating: 5 },
        { author: 'Priya S.', text: 'We get birthday donuts from here every year. The custom orders are always perfect and delicious.', rating: 5 },
        { author: 'Tyler B.', text: 'Showed up at 6am and they were already fully stocked. Hot, fresh, and absolutely worth the early trip.', rating: 5 },
      ],
    }
  }

  if (biz.includes('ice') || biz.includes('shaved') || biz.includes('cream') || biz.includes('frozen')) {
    return {
      icon: Utensils,
      heroImage: 'https://images.unsplash.com/photo-1567206563114-c179706b1149?q=80&w=2070&auto=format&fit=crop',
      aboutImage: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?q=80&w=2070&auto=format&fit=crop',
      trustBars: ['DOZENS OF FLAVORS', 'FAMILY FAVORITE', 'FRESH DAILY', 'BEAT THE TEXAS HEAT'],
      primaryCta: 'See Full Menu', secondaryCta: 'Our Flavors',
      serviceLabel: 'Our Menu', serviceSubtitle: 'Cool Treats for Everyone',
      guaranteeText: 'Smiles Guaranteed',
      bulletPoints: ['Dozens of flavors made fresh daily', 'Authentic mangonadas & elote', 'Perfect for families & groups'],
      defaultReviews: [
        { author: 'Ana R.', text: 'The mango chamoy is absolutely incredible. My kids beg to come here every weekend!', rating: 5 },
        { author: 'Kevin D.', text: 'Perfect treat on a hot Texas day. The portions are huge and the flavors are amazing.', rating: 5 },
        { author: 'Lisa M.', text: 'Brought my whole family and everyone loved it. The elote cup is a must-try!', rating: 5 },
      ],
    }
  }

  if (biz.includes('glass') || biz.includes('seal') || biz.includes('windshield')) {
    return {
      icon: Wrench,
      heroImage: 'https://images.unsplash.com/photo-1617531653332-bd46c16f4d68?q=80&w=2070&auto=format&fit=crop',
      aboutImage: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=80&w=2070&auto=format&fit=crop',
      trustBars: ['MOBILE SERVICE', 'OEM QUALITY GLASS', 'FREE ESTIMATES', 'SAME-DAY REPAIR'],
      primaryCta: 'Get a Free Quote', secondaryCta: 'Our Services',
      serviceLabel: 'Our Services', serviceSubtitle: 'Mobile Auto Glass Experts',
      guaranteeText: 'Work Guaranteed',
      bulletPoints: ['We come to your home or office', 'Dealer-quality glass at local prices', 'Rock chips fixed in as little as 20 minutes'],
      defaultReviews: [
        { author: 'Robert H.', text: 'They came to my office and fixed my windshield in 20 minutes. Couldn\'t even tell there was a crack!', rating: 5 },
        { author: 'Diane W.', text: 'Insurance handled everything and the tech was professional and fast. Highly recommend!', rating: 5 },
        { author: 'Marcus J.', text: 'Same-day appointment, showed up on time, and the repair looks flawless. Great service!', rating: 5 },
      ],
    }
  }

  if (cat.includes('food') || cat.includes('drink') || cat.includes('restaurant')) {
    return {
      icon: Utensils,
      heroImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop',
      aboutImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2074&auto=format&fit=crop',
      trustBars: ['FRESH DAILY', 'LOCAL FAVORITE', 'FAMILY OWNED', 'DINE IN & TAKEOUT'],
      primaryCta: 'Order Online', secondaryCta: 'See Full Menu',
      serviceLabel: 'Our Menu', serviceSubtitle: 'Made with Love',
      guaranteeText: 'Made Fresh Daily',
      bulletPoints: ['Fresh ingredients sourced locally', 'Family recipes passed down for generations', 'Friendly, fast service every visit'],
      defaultReviews: [
        { author: 'Jennifer A.', text: 'This place has become our family\'s go-to spot. The food is always fresh and the service is wonderful.', rating: 5 },
        { author: 'Carlos V.', text: 'Authentic flavors and generous portions. Reminds me of home cooking. We\'ll be back every week!', rating: 5 },
        { author: 'Natalie P.', text: 'The staff remembers your order by the third visit. Amazing food and even better people.', rating: 5 },
      ],
    }
  }

  if (cat.includes('clean')) {
    return {
      icon: Home,
      heroImage: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=2070&auto=format&fit=crop',
      aboutImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop',
      trustBars: ['FULLY INSURED', 'BACKGROUND CHECKED', 'SAME-DAY AVAILABLE', '5-STAR RATED'],
      primaryCta: 'Book a Cleaning', secondaryCta: 'Our Services',
      serviceLabel: 'Our Services', serviceSubtitle: 'Spotless Every Time',
      guaranteeText: '100% Satisfaction',
      bulletPoints: ['Fully insured and background-checked team', 'Eco-friendly products available', 'Residential & commercial cleaning'],
      defaultReviews: [
        { author: 'Michelle T.', text: 'My house has never been this clean. They paid attention to every corner. Will definitely rebook!', rating: 5 },
        { author: 'David F.', text: 'Reliable, professional, and thorough. I\'ve tried 3 other services and this is by far the best.', rating: 5 },
        { author: 'Karen B.', text: 'Showed up on time, worked quickly, and left the place spotless. Exactly what I needed!', rating: 5 },
      ],
    }
  }

  if (cat.includes('auto') || cat.includes('car') || cat.includes('dent') || cat.includes('detail')) {
    return {
      icon: Wrench,
      heroImage: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?q=80&w=2070&auto=format&fit=crop',
      aboutImage: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2074&auto=format&fit=crop',
      trustBars: ['LICENSED & CERTIFIED', 'FREE ESTIMATES', 'SAME-DAY SERVICE', 'WARRANTY INCLUDED'],
      primaryCta: 'Get a Free Quote', secondaryCta: 'Our Services',
      serviceLabel: 'Our Services', serviceSubtitle: 'Expert Auto Care',
      guaranteeText: 'Work Guaranteed',
      bulletPoints: ['ASE-certified technicians on staff', 'Dealer-quality service at local prices', 'Mobile service available at your location'],
      defaultReviews: [
        { author: 'Steve A.', text: 'Honest mechanics are hard to find. These guys told me exactly what was wrong and fixed it fast.', rating: 5 },
        { author: 'Pam N.', text: 'My car looks brand new after the detailing. They went above and beyond what I expected.', rating: 5 },
        { author: 'Tom G.', text: 'Fair pricing, fast turnaround, and excellent work. I won\'t take my car anywhere else.', rating: 5 },
      ],
    }
  }

  if (cat.includes('beauty') || cat.includes('barber') || biz.includes('barber') || biz.includes('blade') || cat.includes('salon')) {
    return {
      icon: Scissors,
      heroImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2074&auto=format&fit=crop',
      aboutImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2069&auto=format&fit=crop',
      trustBars: ['LICENSED STYLISTS', 'WALK-INS WELCOME', 'PREMIUM PRODUCTS', 'ONLINE BOOKING'],
      primaryCta: 'Book an Appointment', secondaryCta: 'View Services',
      serviceLabel: 'Our Services', serviceSubtitle: 'Look & Feel Your Best',
      guaranteeText: 'Satisfaction Guaranteed',
      bulletPoints: ['Licensed and experienced stylists', 'Premium salon-quality products only', 'Personalized service for every client'],
      defaultReviews: [
        { author: 'Brandon K.', text: 'Best fade I\'ve had in years. The barber took his time and the result was absolutely clean.', rating: 5 },
        { author: 'Amber S.', text: 'Always leave feeling amazing. The atmosphere is great and the stylists really listen to what you want.', rating: 5 },
        { author: 'Derek R.', text: 'Walk-in friendly and no long wait. Got exactly the cut I wanted. This is my new regular spot.', rating: 5 },
      ],
    }
  }

  if (cat.includes('home') || cat.includes('junk') || cat.includes('haul')) {
    return {
      icon: Home,
      heroImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop',
      aboutImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2076&auto=format&fit=crop',
      trustBars: ['LICENSED & INSURED', 'SAME-DAY SERVICE', 'FREE ESTIMATES', '5-STAR RATED'],
      primaryCta: 'Get a Free Estimate', secondaryCta: 'Our Services',
      serviceLabel: 'Our Services', serviceSubtitle: 'Professional Home Care',
      guaranteeText: '100% Satisfaction',
      bulletPoints: ['Licensed, bonded, and fully insured', 'Transparent pricing with no hidden fees', 'Background-checked technicians'],
      defaultReviews: [
        { author: 'Greg M.', text: 'Cleared my entire garage in under an hour. Friendly crew and great pricing. Highly recommend!', rating: 5 },
        { author: 'Susan T.', text: 'They handled everything — even swept up afterward. Will definitely call them again for our next cleanout.', rating: 5 },
        { author: 'Phil D.', text: 'Fast, professional, and no hidden fees. Exactly what they quoted is what I paid. Refreshing!', rating: 5 },
      ],
    }
  }

  return {
    icon: Award,
    heroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop',
    aboutImage: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070&auto=format&fit=crop',
    trustBars: ['LOCALLY OWNED', 'EXPERT STAFF', 'QUALITY BRANDS', 'COMMUNITY TRUSTED'],
    primaryCta: 'Contact Us', secondaryCta: 'Our Services',
    serviceLabel: 'Our Specialties', serviceSubtitle: 'Crafted with Care',
    guaranteeText: 'Quality Guaranteed',
    bulletPoints: ['Expert craftsmen with decades of experience', 'Premium materials from trusted suppliers', 'Locally owned and community-focused'],
    defaultReviews: [
      { author: 'Rachel H.', text: 'Outstanding service from start to finish. The team was professional and the results were excellent.', rating: 5 },
      { author: 'Mark S.', text: 'They went above and beyond what I expected. Truly a business that cares about its customers.', rating: 5 },
      { author: 'Amy J.', text: 'I\'ve been coming here for years and they never disappoint. The quality is consistently excellent.', rating: 5 },
    ],
  }
}

function safeParse(val: any, fallback: any = {}) {
  if (!val) return fallback
  if (typeof val === 'object') return val
  try { return JSON.parse(val) } catch { return fallback }
}

export default function SitePreview() {
  const { id } = useParams({ from: '/preview/$id' })
  const navigate = useNavigate()
  const { scrollY } = useScroll()

  const { data: siteRaw, isLoading } = useQuery({
    queryKey: ['site', id],
    queryFn: () => blink.db.sites.list({ where: { leadId: id } }).then(res => res[0]),
    retry: false,
  })

  const leadRaw = LEADS.find(l => l.id === id)

  const site = siteRaw ? { ...siteRaw, theme_config: safeParse(siteRaw.theme_config), content: safeParse(siteRaw.content) } : null
  const lead = leadRaw || {} as any

  const theme = site?.theme_config || {}
  const content = site?.content || {}
  const hero = content.hero || {}
  const services = Array.isArray(content.services) ? content.services : []
  const contentReviews = Array.isArray(content.reviews) ? content.reviews : []
  const aboutText = content.about || 'We are proud to serve the Frisco community with the highest level of quality and professionalism.'
  const headline = hero.tagline || lead.business_name || 'Premium Service'
  const ctaLabel = hero.cta || 'Contact Us'
  const rating = hero.rating || lead.google_rating || 5.0
  const reviewCount = lead.review_count || 0
  const phone = lead.phone || ''
  const address = lead.full_address || 'Frisco, TX'
  const hours = lead.hours || 'Mon – Sat: 9AM – 6PM'
  const businessName = lead.business_name || 'Business Name'
  const category = lead.category || ''

  const industry = useMemo(() => getIndustryConfig(category, businessName), [category, businessName])

  // Use content reviews if available, otherwise use industry defaults
  const displayReviews = contentReviews.length > 0 ? contentReviews : industry.defaultReviews

  useEffect(() => {
    if (theme.primary) document.documentElement.style.setProperty('--preview-primary', theme.primary)
    return () => {
      document.documentElement.style.removeProperty('--preview-primary')
    }
  }, [theme])

  const heroY = useTransform(scrollY, [0, 500], [0, 180])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])

  const primaryColor = theme.primary || 'hsl(243, 75%, 59%)'

  if (!leadRaw && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Business Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn't find a preview for this business.</p>
        <Button onClick={() => navigate({ to: '/' })}>Back to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Admin Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-6 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <HStack gap={4} className="items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/' })} className="group">
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Dashboard
          </Button>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <Persona name={businessName} subtitle={category} />
        </HStack>
        <HStack gap={3}>
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs tracking-wider">PREVIEW MODE</Badge>
          <Button size="sm">
            Publish Live
            <ExternalLink className="h-3 w-3 ml-2" />
          </Button>
        </HStack>
      </div>

      {/* Hero */}
      <section className="relative h-screen overflow-hidden flex items-center justify-center pt-14">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/20 z-10" />
          <img src={industry.heroImage} alt={businessName} className="w-full h-full object-cover scale-110" />
        </motion.div>
        <Container className="relative z-20 text-white text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Badge className="mb-4 px-4 py-1.5 uppercase tracking-widest text-xs font-bold border-none" style={{ backgroundColor: primaryColor }}>
              {category}
            </Badge>
            <h2 className="text-2xl md:text-3xl font-semibold text-white/90 mb-2 tracking-wide">{businessName}</h2>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">{headline}</h1>

            {/* Clickable stars/review count → scrolls to reviews */}
            <button
              type="button"
              onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center justify-center gap-2 mb-6 mx-auto cursor-pointer bg-transparent border-none hover:opacity-80 transition-opacity"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/30'}`} />
              ))}
              <span className="font-bold text-lg text-white ml-1">{rating}</span>
              {reviewCount > 0 && (
                <span className="text-white/70 text-sm underline underline-offset-2 decoration-white/50">
                  ({reviewCount} reviews)
                </span>
              )}
            </button>

            <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
              {category} · {address.split(',').slice(-2).join(',').trim()}
            </p>
            <HStack gap={4} className="justify-center flex-wrap">
              <Button size="lg" className="h-13 px-8 text-lg rounded-full font-semibold shadow-2xl" style={{ backgroundColor: primaryColor, color: '#fff' }}
                onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}>
                {ctaLabel}
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
              <Button variant="outline" size="lg" className="h-13 px-8 text-lg rounded-full bg-white/10 backdrop-blur-md border-white/30 hover:bg-white/20 text-white"
                onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}>
                {industry.secondaryCta}
              </Button>
            </HStack>
          </motion.div>
        </Container>
      </section>

      {/* Trust Bar */}
      <section className="py-8 border-y border-gray-100 bg-white">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {industry.trustBars.map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-2 text-gray-500 font-bold text-xs tracking-widest">
                {i === 0 && <Zap className="h-4 w-4" style={{ color: primaryColor }} />}
                {i === 1 && <Shield className="h-4 w-4" style={{ color: primaryColor }} />}
                {i === 2 && <Award className="h-4 w-4" style={{ color: primaryColor }} />}
                {i === 3 && <CheckCircle2 className="h-4 w-4" style={{ color: primaryColor }} />}
                {item}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* About */}
      <section className="py-24 bg-white overflow-hidden">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative">
              <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ backgroundColor: primaryColor }} />
              <img src={industry.aboutImage} alt={`About ${businessName}`} className="rounded-2xl shadow-2xl relative z-10 w-full h-80 object-cover" />
              <div className="absolute -bottom-6 -right-6 bg-white p-5 rounded-xl shadow-xl border border-gray-100 z-20 max-w-[220px]">
                <HStack gap={3} className="items-center mb-2">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold">{industry.guaranteeText}</span>
                </HStack>
                <p className="text-xs text-gray-500">Trusted by hundreds of local customers.</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <p className="text-sm font-bold tracking-[0.2em] uppercase mb-4" style={{ color: primaryColor }}>About Us</p>
              <h3 className="text-4xl font-bold mb-6 leading-tight text-gray-900">{businessName}</h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">{aboutText}</p>
              <VStack gap={3}>
                {industry.bulletPoints.map((point, i) => (
                  <HStack key={i} gap={3} className="items-start">
                    <div className="mt-1 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}22` }}>
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                    </div>
                    <p className="text-base font-medium text-gray-800">{point}</p>
                  </HStack>
                ))}
              </VStack>
              {phone && (
                <a href={`tel:${phone}`} className="inline-block mt-8">
                  <Button className="rounded-full" style={{ backgroundColor: primaryColor }}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call {phone}
                  </Button>
                </a>
              )}
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Services */}
      <section id="services-section" className="py-24" style={{ backgroundColor: '#f8fafc' }}>
        <Container>
          <div className="text-center mb-16">
            <p className="text-sm font-bold tracking-[0.2em] uppercase mb-3" style={{ color: primaryColor }}>{industry.serviceSubtitle}</p>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900">{industry.serviceLabel}</h3>
          </div>
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((service: any, i: number) => {
                const name = typeof service === 'string' ? service : service?.name || 'Service'
                const desc = typeof service === 'string' ? '' : service?.desc || ''
                const price = typeof service === 'string' ? '' : service?.price || ''
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} whileHover={{ y: -8 }}
                    className="bg-white p-8 rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300">
                    <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: `${primaryColor}18` }}>
                      <industry.icon className="h-7 w-7" style={{ color: primaryColor }} />
                    </div>
                    <h4 className="text-xl font-bold mb-3 text-gray-900">{name}</h4>
                    {desc && <p className="text-gray-500 leading-relaxed mb-4 text-sm">{desc}</p>}
                    {price && <span className="text-sm font-bold" style={{ color: primaryColor }}>{price}</span>}
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['Expert Service', 'Quality Work', 'Customer First'].map((name, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} whileHover={{ y: -8 }}
                  className="bg-white p-8 rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300">
                  <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: `${primaryColor}18` }}>
                    <industry.icon className="h-7 w-7" style={{ color: primaryColor }} />
                  </div>
                  <h4 className="text-xl font-bold mb-3 text-gray-900">{name}</h4>
                  <p className="text-gray-500 leading-relaxed text-sm">Premium quality service tailored to your needs, delivered by experienced professionals.</p>
                </motion.div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Reviews Section */}
      <section id="reviews-section" className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <p className="text-sm font-bold tracking-[0.2em] uppercase mb-3" style={{ color: primaryColor }}>What Customers Say</p>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900">Real Reviews</h3>
            <div className="flex items-center justify-center gap-2 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="font-bold text-gray-900 ml-1">{rating}</span>
              <span className="text-gray-400 text-sm">· {reviewCount} Google reviews</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayReviews.map((review: any, i: number) => {
              const author = typeof review === 'string' ? 'Customer' : review?.author || review?.name || 'Customer'
              const text = typeof review === 'string' ? review : review?.text || review?.body || ''
              const stars = typeof review === 'string' ? 5 : review?.rating || 5
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-gray-50 p-8 rounded-2xl border border-gray-100 relative"
                >
                  <Quote className="h-8 w-8 mb-4 opacity-20" style={{ color: primaryColor }} />
                  <p className="text-gray-700 leading-relaxed mb-6 text-base italic">"{text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                      {author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{author}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: stars }).map((_, si) => (
                          <Star key={si} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* Contact / Hours */}
      <section id="contact-section" className="py-24" style={{ backgroundColor: '#f8fafc' }}>
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-bold tracking-[0.2em] uppercase mb-4" style={{ color: primaryColor }}>Get In Touch</p>
              <h3 className="text-4xl font-bold mb-8 text-gray-900">Visit Us Today</h3>
              <VStack gap={5}>
                {phone && (
                  <a href={`tel:${phone}`} className="no-underline w-full">
                    <HStack gap={4} className="items-center hover:opacity-80 transition-opacity">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}18` }}>
                        <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Phone</p>
                        <p className="font-semibold text-gray-900">{phone}</p>
                      </div>
                    </HStack>
                  </a>
                )}
                <HStack gap={4} className="items-center">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}18` }}>
                    <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Address</p>
                    <p className="font-semibold text-gray-900">{address}</p>
                  </div>
                </HStack>
                <HStack gap={4} className="items-center">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}18` }}>
                    <Clock className="h-5 w-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Hours</p>
                    <p className="font-semibold text-gray-900">{hours}</p>
                  </div>
                </HStack>
              </VStack>
            </div>
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-md">
              <div className="flex justify-center mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-5xl font-bold text-gray-900 mb-2">{rating}</p>
              <p className="text-gray-500 mb-6">Based on {reviewCount} Google reviews</p>
              <Button className="rounded-full px-8" style={{ backgroundColor: primaryColor }}
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank')}>
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-gray-100 bg-gray-50">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-bold text-gray-900">{businessName}</p>
            <p className="text-sm text-gray-400">© 2025 {businessName}. All rights reserved.</p>
            <p className="text-xs text-gray-300">Preview generated by AgencyGenius AI</p>
          </div>
        </Container>
      </footer>
    </div>
  )
}
