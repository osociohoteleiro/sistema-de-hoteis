'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, MapPin, Phone, Mail, Wifi, Car, Utensils, Waves, Dumbbell, Shield, Edit, Save, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import EditableText from '../../../components/EditableText'
import { useTemplateEditor } from '../../../hooks/useTemplateEditor'

interface Template {
  id: number
  name: string
  category: string
  description: string
  preview_image: string
  features: string[]
  is_premium: boolean
  price: string
  css_styles: {
    primary_color: string
    secondary_color: string
    font_family: string
  }
  default_content: {
    hero_title: string
    hero_subtitle: string
    about_text?: string
    story_text?: string
    business_text?: string
    beach_text?: string
  }
}

export default function TemplatePreview() {
  const params = useParams()
  const templateId = params.templateId as string
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const {
    isEditing,
    hasChanges,
    updateContent,
    getContent,
    saveChanges,
    discardChanges,
    toggleEditing
  } = useTemplateEditor(template)

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/site-templates/${templateId}`)
        const data = await response.json()
        
        if (data.success) {
          setTemplate(data.data)
        }
      } catch (error) {
        console.error('Erro ao buscar template:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [templateId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Template não encontrado</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Voltar para início
          </Link>
        </div>
      </div>
    )
  }

  const primaryColor = template.css_styles.primary_color
  const secondaryColor = template.css_styles.secondary_color
  
  return (
    <div className="min-h-screen" style={{ fontFamily: template.css_styles.font_family }}>
      {/* Fixed Header with Back Button */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Link>
          <div className="text-center">
            <h1 className="font-semibold text-gray-900">{template.name}</h1>
            <p className="text-sm text-gray-500 capitalize">Preview - {template.category}</p>
          </div>
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <>
                <button
                  onClick={() => saveChanges(templateId)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
                <button
                  onClick={discardChanges}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Descartar</span>
                </button>
              </>
            )}
            <button
              onClick={toggleEditing}
              className={`px-3 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-1 ${
                isEditing ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              <Edit className="w-4 h-4" />
              <span>{isEditing ? 'Sair da Edição' : 'Editar'}</span>
            </button>
            <button 
              className="px-4 py-2 rounded-lg font-semibold transition-colors"
              style={{ 
                backgroundColor: primaryColor, 
                color: 'white' 
              }}
            >
              Usar Template
            </button>
          </div>
        </div>
      </header>

      {/* Template Content */}
      <div className="pt-20">
        {template.category === 'luxury' && (
          <LuxuryTemplate 
            template={template} 
            isEditing={isEditing}
            getContent={getContent}
            updateContent={updateContent}
          />
        )}
        {template.category === 'boutique' && (
          <BoutiqueTemplate 
            template={template} 
            isEditing={isEditing}
            getContent={getContent}
            updateContent={updateContent}
          />
        )}
        {template.category === 'business' && (
          <BusinessTemplate 
            template={template} 
            isEditing={isEditing}
            getContent={getContent}
            updateContent={updateContent}
          />
        )}
        {template.category === 'beach' && (
          <BeachTemplate 
            template={template} 
            isEditing={isEditing}
            getContent={getContent}
            updateContent={updateContent}
          />
        )}
      </div>
    </div>
  )
}

// Luxury Template
function LuxuryTemplate({ 
  template, 
  isEditing, 
  getContent, 
  updateContent 
}: { 
  template: Template
  isEditing: boolean
  getContent: (key: string, fallback?: string) => string
  updateContent: (key: string, value: string) => void
}) {
  const { primary_color, secondary_color } = template.css_styles

  return (
    <>
      {/* Hero Section */}
      <section 
        className="min-h-screen flex items-center justify-center relative bg-cover bg-center"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${template.preview_image}')` 
        }}
      >
        <div className="text-center text-white max-w-4xl px-4">
          {isEditing ? (
            <EditableText
              initialValue={getContent('hero_title', 'Hotel de Luxo')}
              onSave={(value) => updateContent('hero_title', value)}
              className="text-6xl md:text-8xl font-bold mb-6 block"
              style={{ color: primary_color }}
              placeholder="Título do Hotel"
            />
          ) : (
            <h1 className="text-6xl md:text-8xl font-bold mb-6" style={{ color: primary_color }}>
              {getContent('hero_title', 'Hotel de Luxo')}
            </h1>
          )}
          {isEditing ? (
            <EditableText
              initialValue={getContent('hero_subtitle', 'Experiência Única e Sofisticada')}
              onSave={(value) => updateContent('hero_subtitle', value)}
              className="text-2xl md:text-3xl mb-8 opacity-90 block"
              placeholder="Subtítulo do Hotel"
            />
          ) : (
            <p className="text-2xl md:text-3xl mb-8 opacity-90">
              {getContent('hero_subtitle', 'Experiência Única e Sofisticada')}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105"
              style={{ backgroundColor: primary_color, color: secondary_color }}
            >
              Reservar Agora
            </button>
            <button className="px-8 py-4 border-2 border-white rounded-lg font-semibold text-lg hover:bg-white hover:text-gray-900 transition-colors">
              Ver Quartos
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          {isEditing ? (
            <EditableText
              initialValue={getContent('about_title', 'Experiência Única')}
              onSave={(value) => updateContent('about_title', value)}
              className="text-4xl font-bold mb-8 block"
              style={{ color: secondary_color }}
              placeholder="Título da Seção Sobre"
            />
          ) : (
            <h2 className="text-4xl font-bold mb-8" style={{ color: secondary_color }}>
              {getContent('about_title', 'Experiência Única')}
            </h2>
          )}
          {isEditing ? (
            <EditableText
              initialValue={getContent('about_text', 'Descubra o melhor em hospitalidade e conforto em nosso hotel de luxo. Cada detalhe foi cuidadosamente planejado para oferecer uma experiência inesquecível.')}
              onSave={(value) => updateContent('about_text', value)}
              className="text-xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed block"
              placeholder="Descrição da seção sobre"
              multiline={true}
            />
          ) : (
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed">
              {getContent('about_text', 'Descubra o melhor em hospitalidade e conforto em nosso hotel de luxo. Cada detalhe foi cuidadosamente planejado para oferecer uma experiência inesquecível.')}
            </p>
          )}
          <div className="grid md:grid-cols-3 gap-8">
            {template.features.map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-xl shadow-lg">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                     style={{ backgroundColor: primary_color }}>
                  {idx === 0 && <Shield className="w-8 h-8 text-white" />}
                  {idx === 1 && <Phone className="w-8 h-8 text-white" />}
                  {idx === 2 && <Utensils className="w-8 h-8 text-white" />}
                  {idx === 3 && <Dumbbell className="w-8 h-8 text-white" />}
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: secondary_color }}>
                  {feature}
                </h3>
                <p className="text-gray-600">
                  Serviço premium com atenção aos mínimos detalhes para sua experiência única.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ color: secondary_color }}>
            Acomodações de Luxo
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            {[
              { name: 'Suíte Master', price: 'R$ 1.200/noite', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop' },
              { name: 'Suíte Presidencial', price: 'R$ 2.500/noite', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop' }
            ].map((room, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="relative h-64">
                  <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold mb-2" style={{ color: secondary_color }}>
                    {room.name}
                  </h3>
                  <p className="text-xl font-bold mb-4" style={{ color: primary_color }}>
                    {room.price}
                  </p>
                  <p className="text-gray-600 mb-6">
                    Acomodação luxuosa com vista panorâmica e serviços exclusivos.
                  </p>
                  <button 
                    className="w-full py-3 rounded-lg font-semibold transition-colors hover:opacity-90"
                    style={{ backgroundColor: primary_color, color: 'white' }}
                  >
                    Reservar Suíte
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20" style={{ backgroundColor: secondary_color }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-bold mb-8">Entre em Contato</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <MapPin className="w-8 h-8 mb-4" style={{ color: primary_color }} />
              <h3 className="text-xl font-semibold mb-2">Localização</h3>
              <p className="opacity-90">Av. Paradisíaca, 1000<br />Resort de Luxo</p>
            </div>
            <div className="flex flex-col items-center">
              <Phone className="w-8 h-8 mb-4" style={{ color: primary_color }} />
              <h3 className="text-xl font-semibold mb-2">Telefone</h3>
              <p className="opacity-90">+55 (11) 9999-9999</p>
            </div>
            <div className="flex flex-col items-center">
              <Mail className="w-8 h-8 mb-4" style={{ color: primary_color }} />
              <h3 className="text-xl font-semibold mb-2">E-mail</h3>
              <p className="opacity-90">contato@luxuryresort.com</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// Boutique Template
function BoutiqueTemplate({ 
  template, 
  isEditing, 
  getContent, 
  updateContent 
}: { 
  template: Template
  isEditing: boolean
  getContent: (key: string, fallback?: string) => string
  updateContent: (key: string, value: string) => void
}) {
  const { primary_color, secondary_color } = template.css_styles

  return (
    <>
      <section 
        className="min-h-screen flex items-center justify-center relative"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${template.preview_image}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="text-center text-white max-w-4xl px-4">
          {isEditing ? (
            <EditableText
              initialValue={getContent('hero_title', 'Hotel Boutique')}
              onSave={(value) => updateContent('hero_title', value)}
              className="text-5xl md:text-7xl font-light mb-6 block"
              placeholder="Título do Hotel"
            />
          ) : (
            <h1 className="text-5xl md:text-7xl font-light mb-6">
              {getContent('hero_title', 'Hotel Boutique')}
            </h1>
          )}
          {isEditing ? (
            <EditableText
              initialValue={getContent('hero_subtitle', 'Charme e Elegância Únicos')}
              onSave={(value) => updateContent('hero_subtitle', value)}
              className="text-xl md:text-2xl mb-8 opacity-90 block"
              placeholder="Subtítulo do Hotel"
            />
          ) : (
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {getContent('hero_subtitle', 'Charme e Elegância Únicos')}
            </p>
          )}
          <button 
            className="px-8 py-3 rounded-none font-medium text-lg transition-colors border-2 hover:bg-white hover:text-gray-900"
            style={{ borderColor: secondary_color, color: secondary_color }}
          >
            Descobrir Nossa História
          </button>
        </div>
      </section>
    </>
  )
}

// Business Template
function BusinessTemplate({ 
  template, 
  isEditing, 
  getContent, 
  updateContent 
}: { 
  template: Template
  isEditing: boolean
  getContent: (key: string, fallback?: string) => string
  updateContent: (key: string, value: string) => void
}) {
  const { primary_color, secondary_color } = template.css_styles

  return (
    <>
      <section className="min-h-screen flex items-center bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            {isEditing ? (
              <EditableText
                initialValue={getContent('hero_title', 'Hotel Business')}
                onSave={(value) => updateContent('hero_title', value)}
                className="text-5xl font-bold mb-6 block"
                style={{ color: secondary_color }}
                placeholder="Título do Hotel"
              />
            ) : (
              <h1 className="text-5xl font-bold mb-6" style={{ color: secondary_color }}>
                {getContent('hero_title', 'Hotel Business')}
              </h1>
            )}
            {isEditing ? (
              <EditableText
                initialValue={getContent('hero_subtitle', 'Conforto Profissional para Executivos')}
                onSave={(value) => updateContent('hero_subtitle', value)}
                className="text-xl mb-8 opacity-90 block"
                placeholder="Subtítulo do Hotel"
              />
            ) : (
              <p className="text-xl mb-8 opacity-90">
                {getContent('hero_subtitle', 'Conforto Profissional para Executivos')}
              </p>
            )}
            <button 
              className="px-8 py-3 rounded font-semibold text-lg transition-colors"
              style={{ backgroundColor: secondary_color, color: 'white' }}
            >
              Fazer Reserva Corporativa
            </button>
          </div>
          <div className="relative h-96">
            <Image
              src={template.preview_image}
              alt={template.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        </div>
      </section>
    </>
  )
}

// Beach Template
function BeachTemplate({ 
  template, 
  isEditing, 
  getContent, 
  updateContent 
}: { 
  template: Template
  isEditing: boolean
  getContent: (key: string, fallback?: string) => string
  updateContent: (key: string, value: string) => void
}) {
  const { primary_color, secondary_color } = template.css_styles

  return (
    <>
      <section 
        className="min-h-screen flex items-center justify-center relative"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url('${template.preview_image}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="text-center text-white max-w-4xl px-4">
          {isEditing ? (
            <EditableText
              initialValue={getContent('hero_title', 'Beach Resort')}
              onSave={(value) => updateContent('hero_title', value)}
              className="text-6xl md:text-8xl font-bold mb-6 block"
              style={{ color: primary_color }}
              placeholder="Título do Resort"
            />
          ) : (
            <h1 className="text-6xl md:text-8xl font-bold mb-6" style={{ color: primary_color }}>
              {getContent('hero_title', 'Beach Resort')}
            </h1>
          )}
          {isEditing ? (
            <EditableText
              initialValue={getContent('hero_subtitle', 'Paraíso Tropical à Beira Mar')}
              onSave={(value) => updateContent('hero_subtitle', value)}
              className="text-2xl md:text-3xl mb-8 opacity-90 block"
              placeholder="Subtítulo do Resort"
            />
          ) : (
            <p className="text-2xl md:text-3xl mb-8 opacity-90">
              {getContent('hero_subtitle', 'Paraíso Tropical à Beira Mar')}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              className="px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105"
              style={{ backgroundColor: primary_color, color: 'white' }}
            >
              Reservar Vista Mar
            </button>
            <button 
              className="px-8 py-4 border-2 rounded-full font-semibold text-lg hover:bg-white hover:text-gray-900 transition-colors"
              style={{ borderColor: secondary_color, color: secondary_color }}
            >
              Atividades Aquáticas
            </button>
          </div>
        </div>
      </section>

      <section className="py-20" style={{ backgroundColor: secondary_color }}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8 text-white">Experiência Tropical</h2>
          {isEditing ? (
            <EditableText
              initialValue={getContent('beach_text', 'Descubra o paraíso tropical com nossas praias cristalinas, atividades aquáticas exclusivas e serviços de luxo à beira mar.')}
              onSave={(value) => updateContent('beach_text', value)}
              className="text-xl text-white/90 max-w-3xl mx-auto mb-12 block"
              placeholder="Descrição da experiência tropical"
              multiline={true}
            />
          ) : (
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-12">
              {getContent('beach_text', 'Descubra o paraíso tropical com nossas praias cristalinas, atividades aquáticas exclusivas e serviços de luxo à beira mar.')}
            </p>
          )}
          <div className="grid md:grid-cols-4 gap-6">
            {template.features.map((feature, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" 
                     style={{ backgroundColor: primary_color }}>
                  {idx === 0 && <Waves className="w-6 h-6 text-white" />}
                  {idx === 1 && <Dumbbell className="w-6 h-6 text-white" />}
                  {idx === 2 && <Utensils className="w-6 h-6 text-white" />}
                  {idx === 3 && <Waves className="w-6 h-6 text-white" />}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {feature}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}