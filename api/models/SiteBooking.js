const db = require('../config/database');

class SiteBooking {
  constructor(data = {}) {
    this.id = data.id;
    this.booking_uuid = data.booking_uuid;
    this.site_id = data.site_id;
    this.hotel_id = data.hotel_id;
    this.guest_name = data.guest_name;
    this.guest_email = data.guest_email;
    this.guest_phone = data.guest_phone;
    this.check_in = data.check_in;
    this.check_out = data.check_out;
    this.rooms = data.rooms ? (typeof data.rooms === 'string' ? JSON.parse(data.rooms) : data.rooms) : [];
    this.total_amount = data.total_amount;
    this.payment_status = data.payment_status || 'PENDING';
    this.payment_method = data.payment_method;
    this.confirmation_code = data.confirmation_code;
    this.special_requests = data.special_requests;
    this.source = data.source || 'WEBSITE';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // CRUD Methods
  static async findById(id) {
    const result = await db.query('SELECT * FROM site_bookings WHERE id = ?', [id]);
    return result.length > 0 ? new SiteBooking(result[0]) : null;
  }

  static async findByUuid(uuid) {
    const result = await db.query('SELECT * FROM site_bookings WHERE booking_uuid = ?', [uuid]);
    return result.length > 0 ? new SiteBooking(result[0]) : null;
  }

  static async findByConfirmationCode(code) {
    const result = await db.query('SELECT * FROM site_bookings WHERE confirmation_code = ?', [code]);
    return result.length > 0 ? new SiteBooking(result[0]) : null;
  }

  static async findBySite(siteId, filters = {}) {
    let query = 'SELECT * FROM site_bookings WHERE site_id = ?';
    const params = [siteId];
    
    if (filters.payment_status) {
      query += ' AND payment_status = ?';
      params.push(filters.payment_status);
    }
    
    if (filters.check_in_from) {
      query += ' AND check_in >= ?';
      params.push(filters.check_in_from);
    }
    
    if (filters.check_in_to) {
      query += ' AND check_in <= ?';
      params.push(filters.check_in_to);
    }
    
    if (filters.check_out_from) {
      query += ' AND check_out >= ?';
      params.push(filters.check_out_from);
    }
    
    if (filters.check_out_to) {
      query += ' AND check_out <= ?';
      params.push(filters.check_out_to);
    }
    
    if (filters.guest_email) {
      query += ' AND guest_email = ?';
      params.push(filters.guest_email);
    }
    
    if (filters.search) {
      query += ' AND (guest_name LIKE ? OR guest_email LIKE ? OR confirmation_code LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => new SiteBooking(row));
  }

  static async findByHotel(hotelId, filters = {}) {
    let query = 'SELECT * FROM site_bookings WHERE hotel_id = ?';
    const params = [hotelId];
    
    if (filters.payment_status) {
      query += ' AND payment_status = ?';
      params.push(filters.payment_status);
    }
    
    if (filters.check_in_from) {
      query += ' AND check_in >= ?';
      params.push(filters.check_in_from);
    }
    
    if (filters.check_in_to) {
      query += ' AND check_in <= ?';
      params.push(filters.check_in_to);
    }
    
    if (filters.source) {
      query += ' AND source = ?';
      params.push(filters.source);
    }
    
    if (filters.search) {
      query += ' AND (guest_name LIKE ? OR guest_email LIKE ? OR confirmation_code LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    
    query += ' ORDER BY check_in DESC, created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => new SiteBooking(row));
  }

  static async findByGuest(guestEmail, filters = {}) {
    let query = 'SELECT * FROM site_bookings WHERE guest_email = ?';
    const params = [guestEmail];
    
    if (filters.payment_status) {
      query += ' AND payment_status = ?';
      params.push(filters.payment_status);
    }
    
    if (filters.check_in_from) {
      query += ' AND check_in >= ?';
      params.push(filters.check_in_from);
    }
    
    query += ' ORDER BY check_in DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const result = await db.query(query, params);
    return result.map(row => new SiteBooking(row));
  }

  async save() {
    if (this.id) {
      // Update existing booking
      const result = await db.query(`
        UPDATE site_bookings SET 
        guest_name = ?, guest_email = ?, guest_phone = ?, check_in = ?, 
        check_out = ?, rooms = ?, total_amount = ?, payment_status = ?, 
        payment_method = ?, special_requests = ?, source = ?
        WHERE id = ?
      `, [
        this.guest_name, this.guest_email, this.guest_phone, this.check_in,
        this.check_out, JSON.stringify(this.rooms), this.total_amount,
        this.payment_status, this.payment_method, this.special_requests,
        this.source, this.id
      ]);
      return result;
    } else {
      // Generate confirmation code if not provided
      if (!this.confirmation_code) {
        this.confirmation_code = await this.generateConfirmationCode();
      }
      
      // Create new booking
      const result = await db.query(`
        INSERT INTO site_bookings (site_id, hotel_id, guest_name, guest_email, guest_phone, 
                                  check_in, check_out, rooms, total_amount, payment_status, 
                                  payment_method, confirmation_code, special_requests, source) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        this.site_id, this.hotel_id, this.guest_name, this.guest_email, this.guest_phone,
        this.check_in, this.check_out, JSON.stringify(this.rooms), this.total_amount,
        this.payment_status, this.payment_method, this.confirmation_code,
        this.special_requests, this.source
      ]);
      
      this.id = result.insertId;
      
      // Get the generated UUID
      const newBooking = await SiteBooking.findById(this.id);
      this.booking_uuid = newBooking.booking_uuid;
      
      return result;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete booking without ID');
    }
    return await db.query('DELETE FROM site_bookings WHERE id = ?', [this.id]);
  }

  // Payment Status Management
  async markAsPaid(paymentMethod = null) {
    this.payment_status = 'PAID';
    if (paymentMethod) this.payment_method = paymentMethod;
    await db.query(
      'UPDATE site_bookings SET payment_status = ?, payment_method = ? WHERE id = ?',
      [this.payment_status, this.payment_method, this.id]
    );
  }

  async markAsFailed() {
    this.payment_status = 'FAILED';
    await db.query('UPDATE site_bookings SET payment_status = ? WHERE id = ?', [this.payment_status, this.id]);
  }

  async markAsRefunded() {
    this.payment_status = 'REFUNDED';
    await db.query('UPDATE site_bookings SET payment_status = ? WHERE id = ?', [this.payment_status, this.id]);
  }

  async setPending() {
    this.payment_status = 'PENDING';
    await db.query('UPDATE site_bookings SET payment_status = ? WHERE id = ?', [this.payment_status, this.id]);
  }

  // Site and Hotel Information
  async getSite() {
    const Site = require('./Site');
    return await Site.findById(this.site_id);
  }

  async getHotel() {
    const Hotel = require('./Hotel');
    return await Hotel.findById(this.hotel_id);
  }

  // Room Management
  addRoom(roomData) {
    if (!this.rooms) this.rooms = [];
    
    const room = {
      id: roomData.id || Date.now(),
      type: roomData.type,
      quantity: roomData.quantity || 1,
      rate: roomData.rate,
      total: (roomData.rate || 0) * (roomData.quantity || 1),
      ...roomData
    };
    
    this.rooms.push(room);
    this.recalculateTotal();
    
    return room.id;
  }

  updateRoom(roomId, updates) {
    if (!this.rooms) return false;
    
    const roomIndex = this.rooms.findIndex(room => room.id === roomId);
    if (roomIndex === -1) return false;
    
    this.rooms[roomIndex] = {
      ...this.rooms[roomIndex],
      ...updates
    };
    
    // Recalculate room total
    const room = this.rooms[roomIndex];
    room.total = (room.rate || 0) * (room.quantity || 1);
    
    this.recalculateTotal();
    return true;
  }

  removeRoom(roomId) {
    if (!this.rooms) return false;
    
    const roomIndex = this.rooms.findIndex(room => room.id === roomId);
    if (roomIndex === -1) return false;
    
    this.rooms.splice(roomIndex, 1);
    this.recalculateTotal();
    
    return true;
  }

  recalculateTotal() {
    if (!this.rooms) {
      this.total_amount = 0;
      return;
    }
    
    const nights = this.getNights();
    this.total_amount = this.rooms.reduce((total, room) => {
      return total + ((room.rate || 0) * (room.quantity || 1) * nights);
    }, 0);
  }

  // Date calculations
  getNights() {
    if (!this.check_in || !this.check_out) return 0;
    
    const checkIn = new Date(this.check_in);
    const checkOut = new Date(this.check_out);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  getDuration() {
    const nights = this.getNights();
    return {
      nights: nights,
      days: nights + 1
    };
  }

  isUpcoming() {
    const today = new Date();
    const checkIn = new Date(this.check_in);
    return checkIn > today;
  }

  isActive() {
    const today = new Date();
    const checkIn = new Date(this.check_in);
    const checkOut = new Date(this.check_out);
    return checkIn <= today && checkOut > today;
  }

  isPast() {
    const today = new Date();
    const checkOut = new Date(this.check_out);
    return checkOut <= today;
  }

  // Confirmation Code Generation
  async generateConfirmationCode() {
    let code;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      code = this.generateRandomCode();
      const existing = await SiteBooking.findByConfirmationCode(code);
      attempts++;
    } while (existing && attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique confirmation code');
    }
    
    return code;
  }

  generateRandomCode() {
    // Generate code like: HTL-ABC123
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let code = 'HTL-';
    
    // Add 3 letters
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Add 3 numbers
    for (let i = 0; i < 3; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return code;
  }

  // Email notifications
  async sendConfirmationEmail() {
    // This would integrate with your email service
    // For now, just return the email data that should be sent
    const site = await this.getSite();
    const hotel = await this.getHotel();
    
    return {
      to: this.guest_email,
      subject: `Confirmação de Reserva - ${this.confirmation_code}`,
      template: 'booking-confirmation',
      data: {
        booking: this.toObject(),
        site: site ? site.toObject() : null,
        hotel: hotel ? hotel.toObject() : null,
        confirmation_url: `${site?.getSetting('base_url', '')}/booking/${this.confirmation_code}`
      }
    };
  }

  async sendCancellationEmail() {
    const site = await this.getSite();
    const hotel = await this.getHotel();
    
    return {
      to: this.guest_email,
      subject: `Cancelamento de Reserva - ${this.confirmation_code}`,
      template: 'booking-cancellation',
      data: {
        booking: this.toObject(),
        site: site ? site.toObject() : null,
        hotel: hotel ? hotel.toObject() : null
      }
    };
  }

  // Validation
  static validateBookingData(data) {
    const errors = [];

    if (!data.guest_name || data.guest_name.length < 2) {
      errors.push('Nome do hóspede é obrigatório');
    }

    if (!data.guest_email || !data.guest_email.includes('@')) {
      errors.push('Email válido é obrigatório');
    }

    if (!data.check_in) {
      errors.push('Data de check-in é obrigatória');
    }

    if (!data.check_out) {
      errors.push('Data de check-out é obrigatória');
    }

    if (data.check_in && data.check_out) {
      const checkIn = new Date(data.check_in);
      const checkOut = new Date(data.check_out);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) {
        errors.push('Data de check-in não pode ser no passado');
      }

      if (checkOut <= checkIn) {
        errors.push('Data de check-out deve ser posterior ao check-in');
      }
    }

    if (!data.rooms || !Array.isArray(data.rooms) || data.rooms.length === 0) {
      errors.push('Pelo menos um quarto deve ser selecionado');
    }

    if (data.total_amount && (isNaN(data.total_amount) || data.total_amount <= 0)) {
      errors.push('Valor total deve ser maior que zero');
    }

    return errors;
  }

  // Statistics
  static async getBookingStats(siteId = null, hotelId = null, dateFrom = null, dateTo = null) {
    let query = 'SELECT ';
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (siteId) {
      whereClause += ' AND site_id = ?';
      params.push(siteId);
    }

    if (hotelId) {
      whereClause += ' AND hotel_id = ?';
      params.push(hotelId);
    }

    if (dateFrom) {
      whereClause += ' AND created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND created_at <= ?';
      params.push(dateTo);
    }

    // Total bookings and revenue
    const totalQuery = `${query} COUNT(*) as total_bookings, SUM(total_amount) as total_revenue FROM site_bookings ${whereClause}`;
    const totalResult = await db.query(totalQuery, params);

    // By payment status
    const statusQuery = `${query} payment_status, COUNT(*) as count, SUM(total_amount) as revenue FROM site_bookings ${whereClause} GROUP BY payment_status`;
    const statusResult = await db.query(statusQuery, params);

    // By month (last 12 months)
    const monthQuery = `${query} DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as bookings, SUM(total_amount) as revenue FROM site_bookings ${whereClause} AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY month ORDER BY month`;
    const monthResult = await db.query(monthQuery, params);

    return {
      total: totalResult[0],
      by_status: statusResult,
      by_month: monthResult
    };
  }

  // Utility methods
  isPaid() {
    return this.payment_status === 'PAID';
  }

  isPending() {
    return this.payment_status === 'PENDING';
  }

  isFailed() {
    return this.payment_status === 'FAILED';
  }

  isRefunded() {
    return this.payment_status === 'REFUNDED';
  }

  getTotalRooms() {
    if (!this.rooms) return 0;
    return this.rooms.reduce((total, room) => total + (room.quantity || 1), 0);
  }

  getFormattedDates() {
    return {
      check_in: this.check_in ? new Date(this.check_in).toLocaleDateString('pt-BR') : '',
      check_out: this.check_out ? new Date(this.check_out).toLocaleDateString('pt-BR') : ''
    };
  }

  getFormattedAmount() {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.total_amount || 0);
  }

  toObject() {
    return {
      id: this.id,
      booking_uuid: this.booking_uuid,
      site_id: this.site_id,
      hotel_id: this.hotel_id,
      guest_name: this.guest_name,
      guest_email: this.guest_email,
      guest_phone: this.guest_phone,
      check_in: this.check_in,
      check_out: this.check_out,
      rooms: this.rooms,
      total_amount: this.total_amount,
      payment_status: this.payment_status,
      payment_method: this.payment_method,
      confirmation_code: this.confirmation_code,
      special_requests: this.special_requests,
      source: this.source,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = SiteBooking;