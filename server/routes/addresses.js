const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { db } = require('../database/database');
const router = express.Router();

// Validation middleware
const validateAddress = [
  body('address_line1').trim().isLength({ min: 5, max: 200 }).withMessage('Address line 1 must be between 5 and 200 characters'),
  body('address_line2').optional().trim().isLength({ max: 200 }).withMessage('Address line 2 must be less than 200 characters'),
  body('city').trim().isLength({ min: 2, max: 50 }).withMessage('City must be between 2 and 50 characters'),
  body('state').trim().isLength({ min: 2, max: 50 }).withMessage('State must be between 2 and 50 characters'),
  body('pin_code').matches(/^[0-9]{6}$/).withMessage('Pin code must be exactly 6 digits'),
  body('country').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Country must be between 2 and 50 characters'),
  body('is_primary').optional().isBoolean().withMessage('is_primary must be a boolean')
];

// GET /api/addresses - Get all addresses with pagination and search
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('city').optional().isString().withMessage('City must be a string'),
  query('state').optional().isString().withMessage('State must be a string'),
  query('pin_code').optional().isString().withMessage('Pin code must be a string'),
  query('sort').optional().isIn(['city', 'state', 'created_at']).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const customerId = req.query.customer_id;
    const city = req.query.city || '';
    const state = req.query.state || '';
    const pinCode = req.query.pin_code || '';
    const sort = req.query.sort || 'created_at';
    const order = req.query.order || 'desc';

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (customerId) {
      whereClause += ' AND a.customer_id = ?';
      params.push(customerId);
    }

    if (city) {
      whereClause += ' AND a.city LIKE ?';
      params.push(`%${city}%`);
    }

    if (state) {
      whereClause += ' AND a.state LIKE ?';
      params.push(`%${state}%`);
    }

    if (pinCode) {
      whereClause += ' AND a.pin_code LIKE ?';
      params.push(`%${pinCode}%`);
    }

    // Count total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM addresses a
      ${whereClause}
    `;

    db.get(countQuery, params, (err, countResult) => {
      if (err) {
        console.error('Error counting addresses:', err);
        return res.status(500).json({
          success: false,
          message: 'Error counting addresses'
        });
      }

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);

      // Get addresses with customer info
      const query = `
        SELECT 
          a.*,
          c.first_name,
          c.last_name,
          c.phone_number,
          c.email
        FROM addresses a
        LEFT JOIN customers c ON a.customer_id = c.id
        ${whereClause}
        ORDER BY a.${sort} ${order.toUpperCase()}
        LIMIT ? OFFSET ?
      `;

      db.all(query, [...params, limit, offset], (err, addresses) => {
        if (err) {
          console.error('Error fetching addresses:', err);
          return res.status(500).json({
            success: false,
            message: 'Error fetching addresses'
          });
        }

        res.json({
          success: true,
          data: addresses,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in GET /addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/addresses/:id - Get address by ID
router.get('/:id', async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);

    const query = `
      SELECT 
        a.*,
        c.first_name,
        c.last_name,
        c.phone_number,
        c.email
      FROM addresses a
      LEFT JOIN customers c ON a.customer_id = c.id
      WHERE a.id = ?
    `;

    db.get(query, [addressId], (err, address) => {
      if (err) {
        console.error('Error fetching address:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching address'
        });
      }

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      res.json({
        success: true,
        data: address
      });
    });
  } catch (error) {
    console.error('Error in GET /addresses/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/addresses - Create new address
router.post('/', validateAddress, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { customer_id, address_line1, address_line2, city, state, pin_code, country, is_primary } = req.body;

    // Check if customer exists
    db.get('SELECT id FROM customers WHERE id = ?', [customer_id], (err, customer) => {
      if (err) {
        console.error('Error checking customer existence:', err);
        return res.status(500).json({
          success: false,
          message: 'Error checking customer existence'
        });
      }

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // If this is a primary address, unset other primary addresses for this customer
      if (is_primary) {
        db.run('UPDATE addresses SET is_primary = FALSE WHERE customer_id = ?', [customer_id], (err) => {
          if (err) {
            console.error('Error updating primary addresses:', err);
          }
        });
      }

      // Insert new address
      db.run(
        'INSERT INTO addresses (customer_id, address_line1, address_line2, city, state, pin_code, country, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [customer_id, address_line1, address_line2 || '', city, state, pin_code, country || 'India', is_primary || false],
        function(err) {
          if (err) {
            console.error('Error creating address:', err);
            return res.status(500).json({
              success: false,
              message: 'Error creating address'
            });
          }

          const addressId = this.lastID;

          // Update customer address flags
          updateCustomerAddressFlags(customer_id);

          res.status(201).json({
            success: true,
            message: 'Address created successfully',
            data: { 
              id: addressId, 
              customer_id, 
              address_line1, 
              address_line2, 
              city, 
              state, 
              pin_code, 
              country, 
              is_primary 
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Error in POST /addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/addresses/:id - Update address
router.put('/:id', validateAddress, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const addressId = parseInt(req.params.id);
    const { address_line1, address_line2, city, state, pin_code, country, is_primary } = req.body;

    // Check if address exists and get customer_id
    db.get('SELECT customer_id FROM addresses WHERE id = ?', [addressId], (err, address) => {
      if (err) {
        console.error('Error checking address existence:', err);
        return res.status(500).json({
          success: false,
          message: 'Error checking address existence'
        });
      }

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      const customerId = address.customer_id;

      // If this is a primary address, unset other primary addresses for this customer
      if (is_primary) {
        db.run('UPDATE addresses SET is_primary = FALSE WHERE customer_id = ? AND id != ?', [customerId, addressId], (err) => {
          if (err) {
            console.error('Error updating primary addresses:', err);
          }
        });
      }

      // Update address
      db.run(
        'UPDATE addresses SET address_line1 = ?, address_line2 = ?, city = ?, state = ?, pin_code = ?, country = ?, is_primary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [address_line1, address_line2 || '', city, state, pin_code, country || 'India', is_primary || false, addressId],
        function(err) {
          if (err) {
            console.error('Error updating address:', err);
            return res.status(500).json({
              success: false,
              message: 'Error updating address'
            });
          }

          if (this.changes === 0) {
            return res.status(404).json({
              success: false,
              message: 'Address not found'
            });
          }

          // Update customer address flags
          updateCustomerAddressFlags(customerId);

          res.json({
            success: true,
            message: 'Address updated successfully',
            data: { 
              id: addressId, 
              customer_id: customerId, 
              address_line1, 
              address_line2, 
              city, 
              state, 
              pin_code, 
              country, 
              is_primary 
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Error in PUT /addresses/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/addresses/:id - Delete address
router.delete('/:id', async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);

    // Check if address exists and get customer_id
    db.get('SELECT customer_id FROM addresses WHERE id = ?', [addressId], (err, address) => {
      if (err) {
        console.error('Error checking address existence:', err);
        return res.status(500).json({
          success: false,
          message: 'Error checking address existence'
        });
      }

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      const customerId = address.customer_id;

      // Delete address
      db.run('DELETE FROM addresses WHERE id = ?', [addressId], function(err) {
        if (err) {
          console.error('Error deleting address:', err);
          return res.status(500).json({
            success: false,
            message: 'Error deleting address'
          });
        }

        // Update customer address flags
        updateCustomerAddressFlags(customerId);

        res.json({
          success: true,
          message: 'Address deleted successfully'
        });
      });
    });
  } catch (error) {
    console.error('Error in DELETE /addresses/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/addresses/customer/:customerId - Get all addresses for a customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);

    // Check if customer exists
    db.get('SELECT id FROM customers WHERE id = ?', [customerId], (err, customer) => {
      if (err) {
        console.error('Error checking customer existence:', err);
        return res.status(500).json({
          success: false,
          message: 'Error checking customer existence'
        });
      }

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Get all addresses for the customer
      const query = `
        SELECT 
          a.*,
          c.first_name,
          c.last_name,
          c.phone_number,
          c.email
        FROM addresses a
        LEFT JOIN customers c ON a.customer_id = c.id
        WHERE a.customer_id = ?
        ORDER BY a.is_primary DESC, a.created_at ASC
      `;

      db.all(query, [customerId], (err, addresses) => {
        if (err) {
          console.error('Error fetching customer addresses:', err);
          return res.status(500).json({
            success: false,
            message: 'Error fetching customer addresses'
          });
        }

        res.json({
          success: true,
          data: addresses
        });
      });
    });
  } catch (error) {
    console.error('Error in GET /addresses/customer/:customerId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to update customer address flags
function updateCustomerAddressFlags(customerId) {
  db.run(`
    UPDATE customers 
    SET has_multiple_addresses = (
      SELECT COUNT(*) > 1 
      FROM addresses 
      WHERE customer_id = ?
    ),
    only_one_address = (
      SELECT COUNT(*) = 1 
      FROM addresses 
      WHERE customer_id = ?
    )
    WHERE id = ?
  `, [customerId, customerId, customerId], (err) => {
    if (err) {
      console.error('Error updating customer address flags:', err);
    }
  });
}

module.exports = router;
