'use client'

import { useState, useRef, useEffect } from 'react'
import { Edit3, Check, X } from 'lucide-react'

interface EditableTextProps {
  initialValue: string
  onSave: (newValue: string) => void
  className?: string
  style?: React.CSSProperties
  placeholder?: string
  multiline?: boolean
}

export default function EditableText({
  initialValue,
  onSave,
  className = '',
  style = {},
  placeholder = 'Clique para editar',
  multiline = false
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialValue || '')
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setValue(initialValue || '')
  }, [initialValue])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    onSave(value)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setValue(initialValue || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input'
    return (
      <div className="relative inline-block w-full">
        <InputComponent
          ref={inputRef as any}
          type={multiline ? undefined : 'text'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`${className} border-2 border-blue-500 rounded px-2 py-1 bg-white text-gray-900 outline-none w-full ${
            multiline ? 'min-h-[100px] resize-vertical' : ''
          }`}
          style={style}
          placeholder={placeholder}
        />
        <div className="absolute -top-8 right-0 flex space-x-1 bg-white border rounded px-2 py-1 shadow-lg z-10">
          <button
            onClick={handleSave}
            className="text-green-600 hover:text-green-700 p-1"
            title="Salvar (Enter)"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            className="text-red-600 hover:text-red-700 p-1"
            title="Cancelar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative inline-block cursor-pointer group ${className} ${
        isHovered ? 'ring-2 ring-blue-300 ring-opacity-50' : ''
      }`}
      style={style}
      onClick={handleEdit}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Clique para editar"
    >
      {value || placeholder}
      {isHovered && (
        <Edit3 className="absolute -top-2 -right-2 w-4 h-4 text-blue-500 bg-white rounded-full p-0.5 shadow-sm" />
      )}
    </div>
  )
}