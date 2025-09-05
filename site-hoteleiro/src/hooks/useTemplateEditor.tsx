'use client'

import { useState, useCallback } from 'react'

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

interface EditedContent {
  [key: string]: any
}

export function useTemplateEditor(template: Template | null) {
  const [editedContent, setEditedContent] = useState<EditedContent>({})
  const [isEditing, setIsEditing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const updateContent = useCallback((key: string, value: any) => {
    setEditedContent(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
  }, [])

  const getContent = useCallback((key: string, fallback: string = '') => {
    if (editedContent.hasOwnProperty(key)) {
      return editedContent[key]
    }
    
    // Buscar no template original
    if (template?.default_content) {
      const content = template.default_content as any
      return content[key] || fallback
    }
    
    return fallback
  }, [editedContent, template])

  const saveChanges = useCallback(async (templateId: string) => {
    if (!hasChanges) return true

    try {
      const response = await fetch(`http://localhost:3001/api/site-templates/${templateId}/content`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent
        })
      })

      if (response.ok) {
        setHasChanges(false)
        return true
      } else {
        throw new Error('Erro ao salvar alterações')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      return false
    }
  }, [editedContent, hasChanges])

  const discardChanges = useCallback(() => {
    setEditedContent({})
    setHasChanges(false)
  }, [])

  const toggleEditing = useCallback(() => {
    setIsEditing(prev => !prev)
  }, [])

  return {
    editedContent,
    isEditing,
    hasChanges,
    updateContent,
    getContent,
    saveChanges,
    discardChanges,
    toggleEditing
  }
}