const db = require('../config/database');

class LogoHistory {
  constructor(data = {}) {
    this.id = data.id;
    this.hotel_id = data.hotel_id;
    this.logo_url = data.logo_url;
    this.is_active = data.is_active || false;
    this.upload_date = data.upload_date;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Buscar todos os logotipos de um hotel (ou globais se hotel_id = null)
  static async findAllByHotel(hotelId = null) {
    const result = await db.query(
      'SELECT * FROM logo_history WHERE hotel_id = ? ORDER BY upload_date DESC',
      [hotelId]
    );
    return result.map(row => new LogoHistory(row));
  }

  // Buscar logotipo ativo de um hotel
  static async findActiveByHotel(hotelId = null) {
    const result = await db.query(
      'SELECT * FROM logo_history WHERE hotel_id = ? AND is_active = TRUE LIMIT 1',
      [hotelId]
    );
    return result.length > 0 ? new LogoHistory(result[0]) : null;
  }

  // Adicionar novo logotipo (inativo por padrão)
  static async create(hotelId, logoUrl, isActive = false) {
    const result = await db.query(
      'INSERT INTO logo_history (hotel_id, logo_url, is_active) VALUES (?, ?, ?)',
      [hotelId, logoUrl, isActive]
    );
    
    if (result.affectedRows > 0) {
      const newLogo = await db.query(
        'SELECT * FROM logo_history WHERE id = ?',
        [result.insertId]
      );
      return new LogoHistory(newLogo[0]);
    }
    return null;
  }

  // Definir um logotipo como ativo (desativa todos os outros do mesmo hotel)
  static async setActive(logoId, hotelId = null) {
    try {
      // Desativar todos os logotipos do hotel
      await db.query(
        'UPDATE logo_history SET is_active = FALSE WHERE hotel_id = ?',
        [hotelId]
      );
      
      // Ativar o logotipo selecionado
      const result = await db.query(
        'UPDATE logo_history SET is_active = TRUE WHERE id = ? AND hotel_id = ?',
        [logoId, hotelId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erro ao definir logotipo ativo:', error);
      throw error;
    }
  }

  // Buscar logotipo por ID
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM logo_history WHERE id = ?',
      [id]
    );
    return result.length > 0 ? new LogoHistory(result[0]) : null;
  }

  // Deletar logotipo (apenas se não estiver ativo)
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM logo_history WHERE id = ? AND is_active = FALSE',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Contar total de logotipos de um hotel
  static async countByHotel(hotelId = null) {
    const result = await db.query(
      'SELECT COUNT(*) as total FROM logo_history WHERE hotel_id = ?',
      [hotelId]
    );
    return result[0].total;
  }

  // Salvar alterações na instância atual
  async save() {
    if (this.id) {
      // Update
      const result = await db.query(
        'UPDATE logo_history SET hotel_id = ?, logo_url = ?, is_active = ? WHERE id = ?',
        [this.hotel_id, this.logo_url, this.is_active, this.id]
      );
      return result.affectedRows > 0;
    } else {
      // Create
      const result = await db.query(
        'INSERT INTO logo_history (hotel_id, logo_url, is_active) VALUES (?, ?, ?)',
        [this.hotel_id, this.logo_url, this.is_active]
      );
      
      if (result.affectedRows > 0) {
        this.id = result.insertId;
        return true;
      }
      return false;
    }
  }
}

module.exports = LogoHistory;