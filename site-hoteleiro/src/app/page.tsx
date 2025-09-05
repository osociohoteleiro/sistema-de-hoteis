'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Sparkles, Globe, Zap, Users, Star, Play, Loader2 } from 'lucide-react'

interface Template {
  id: number
  name: string
  category: string
  description: string
  preview_image: string
  features: string[]
  is_premium: boolean
  price: string
}

export default function Home() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/site-templates')
        const data = await response.json()
        
        if (data.success) {
          setTemplates(data.data)
        } else {
          setError('Erro ao carregar templates')
        }
      } catch (err) {
        console.error('Erro ao buscar templates:', err)
        setError('Erro ao conectar com o servidor')
        
        // Fallback para dados locais em caso de erro
        setTemplates([
          {
            id: 1,
            name: 'Resort de Luxo',
            category: 'luxury',
            description: 'Design elegante para resorts de alto padrão',
            preview_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
            features: ['Galeria Premium', 'Reservas Online', 'Concierge Digital'],
            is_premium: true,
            price: '199.90'
          },
          {
            id: 2,
            name: 'Hotel Boutique',
            category: 'boutique',
            description: 'Template exclusivo para hotéis boutique',
            preview_image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop',
            features: ['Design Personalizado', 'História Local', 'Experiências Únicas'],
            is_premium: false,
            price: '0.00'
          },
          {
            id: 3,
            name: 'Hotel Executivo',
            category: 'business',
            description: 'Perfeito para hotéis de negócios',
            preview_image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
            features: ['Centro de Negócios', 'Salas de Reunião', 'Wi-Fi Premium'],
            is_premium: false,
            price: '0.00'
          },
          {
            id: 4,
            name: 'Hotel de Praia',
            category: 'beach',
            description: 'Ideal para hotéis à beira-mar',
            preview_image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop',
            features: ['Vista para o Mar', 'Esportes Aquáticos', 'Beach Club'],
            is_premium: false,
            price: '0.00'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const benefits = [
    {
      icon: <Globe className="w-8 h-8 text-blue-600" />,
      title: 'Aumento de Reservas Diretas',
      description: 'Reduza comissões de OTAs e aumente suas reservas diretas em até 40% com um site profissional.'
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-600" />,
      title: 'Criação Rápida',
      description: 'Seu site fica pronto em minutos! Escolha um template e personalize com nosso editor inline.'
    },
    {
      icon: <Users className="w-8 h-8 text-green-600" />,
      title: 'Experiência do Hóspede',
      description: 'Ofereça uma experiência digital completa, desde a descoberta até o check-out.'
    }
  ]

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Gerente Geral - Hotel Vista Mar',
      content: 'Em 2 meses, nossas reservas diretas aumentaram 45%. O site é lindo e fácil de usar!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b830?w=64&h=64&fit=crop&crop=face'
    },
    {
      name: 'Carlos Santos',
      role: 'Proprietário - Pousada dos Sonhos',
      content: 'Nunca pensei que seria tão fácil ter um site profissional. Em minutos estava online!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Site Hoteleiro</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#templates" className="text-gray-700 hover:text-blue-600 font-medium">Templates</a>
              <a href="#beneficios" className="text-gray-700 hover:text-blue-600 font-medium">Benefícios</a>
              <a href="#depoimentos" className="text-gray-700 hover:text-blue-600 font-medium">Depoimentos</a>
              <a href="#precos" className="text-gray-700 hover:text-blue-600 font-medium">Preços</a>
            </nav>

            <div className="flex items-center space-x-4">
              <button className="text-gray-700 hover:text-blue-600 font-medium">Login</button>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors">
                Criar Site Grátis
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              Mais de 1000 hotéis já criaram seus sites conosco
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Crie um Site{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Profissional
              </span>{' '}
              para seu Hotel
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Aumente suas reservas diretas e reduza comissões com um site moderno, 
              responsivo e otimizado para conversão. <strong>Pronto em minutos!</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="#templates" className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-700 transition-all hover:scale-105 inline-flex items-center">
                Ver Templates
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              
              <button className="flex items-center text-gray-700 hover:text-blue-600 font-semibold">
                <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center mr-3">
                  <Play className="w-5 h-5 text-blue-600" />
                </div>
                Ver Demonstração
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">+40%</div>
                <div className="text-sm text-gray-600">Reservas Diretas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">2 min</div>
                <div className="text-sm text-gray-600">Para Criar</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">1000+</div>
                <div className="text-sm text-gray-600">Hotéis Ativos</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Por que ter um site próprio para seu hotel?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Não dependa apenas de plataformas de terceiros. Tenha controle total sobre suas reservas e relacionamento com os hóspedes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all">
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Escolha o Template Perfeito
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Templates profissionais criados especificamente para hotéis. 
              Clique em qualquer template para ver funcionando.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Carregando templates...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-red-600 mb-4">⚠️ {error}</div>
              <p className="text-gray-600">Mostrando templates em modo offline</p>
            </div>
          ) : null}

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {templates.map((template) => (
              <div key={template.id} className="group cursor-pointer">
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={template.preview_image}
                      alt={template.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold capitalize">
                        {template.category}
                      </span>
                      {template.is_premium && (
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      {template.is_premium && (
                        <span className="text-lg font-bold text-orange-500">
                          R$ {template.price}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                    
                    <div className="space-y-2 mb-6">
                      {template.features.slice(0, 3).map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                      {template.features.length > 3 && (
                        <div className="text-xs text-gray-500 italic">
                          +{template.features.length - 3} recursos adicionais
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link 
                        href={`/preview/${template.id}`}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                      >
                        Ver Preview
                      </Link>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors">
                        {template.is_premium ? 'Comprar' : 'Usar Grátis'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {!loading && templates.length === 0 && (
            <div className="text-center py-20">
              <div className="text-gray-600 mb-4">Nenhum template disponível no momento</div>
              <button 
                onClick={() => window.location.reload()} 
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                
                <div className="flex items-center">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Crie seu site profissional agora e comece a receber mais reservas diretas.
          </p>
          <Link href="#templates" className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center">
            Criar Meu Site Agora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">Site Hoteleiro</span>
            </div>
            <p className="text-gray-400 mb-8">
              Criando experiências digitais excepcionais para hotéis em todo o Brasil
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white">Termos de Uso</a>
              <a href="#" className="hover:text-white">Privacidade</a>
              <a href="#" className="hover:text-white">Suporte</a>
              <a href="#" className="hover:text-white">Contato</a>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-400">
              © 2024 Site Hoteleiro. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}