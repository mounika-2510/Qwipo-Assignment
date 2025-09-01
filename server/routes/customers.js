const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { db } = require('../database/database');
const router = express.Router();

// Validation middleware
const validateCustomer = [
  body('first_name').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('last_name').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('phone_number').matches(/^[0-9]{10}$/).withMessage('Phone number must be exactly 10 digits'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('addresses').optional().isArray().withMessage('Addresses must be an array')
];

// GET /api/customers - Get all customers with pagination and search
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('city').optional().isString().withMessage('City must be a string'),
  query('state').optional().isString().withMessage('State must be a string'),
  query('pin_code').optional().isString().withMessage('Pin code must be a string'),
  query('sort').optional().isIn(['first_name', 'last_name', 'created_at', 'phone_number']).withMessage('Invalid sort field'),
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
    const search = req.query.search || '';
    const city = req.query.city || '';
    const state = req.query.state || '';
    const pinCode = req.query.pin_code || '';
    const sort = req.query.sort || 'created_at';
    const order = req.query.order || 'desc';

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone_number LIKE ? OR c.email LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
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
    let countQuery = 'SELECT COUNT(*) as total FROM customers c';
    let countParams = [];
    
    // If we have address filters, we need to count customers that have matching addresses
    if (city || state || pinCode) {
      countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM customers c
        INNER JOIN addresses a ON c.id = a.customer_id
        WHERE 1=1
      `;
      
      if (city) {
        countQuery += ' AND a.city LIKE ?';
        countParams.push(`%${city}%`);
      }
      if (state) {
        countQuery += ' AND a.state LIKE ?';
        countParams.push(`%${state}%`);
      }
      if (pinCode) {
        countQuery += ' AND a.pin_code LIKE ?';
        countParams.push(`%${pinCode}%`);
      }
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Error counting customers:', err);
        return res.status(500).json({
          success: false,
          message: 'Error counting customers'
        });
      }

      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);

      // Get customers with addresses
      let query = 'SELECT c.* FROM customers c';
      let queryParams = [];
      
      // If we have address filters, we need to join with addresses
      if (city || state || pinCode) {
        query = `
          SELECT DISTINCT c.*
          FROM customers c
          INNER JOIN addresses a ON c.id = a.customer_id
          WHERE 1=1
        `;
        
        if (city) {
          query += ' AND a.city LIKE ?';
          queryParams.push(`%${city}%`);
        }
        if (state) {
          query += ' AND a.state LIKE ?';
          queryParams.push(`%${state}%`);
        }
        if (pinCode) {
          query += ' AND a.pin_code LIKE ?';
          queryParams.push(`%${pinCode}%`);
        }
      }
      
      query += ` ORDER BY c.${sort} ${order.toUpperCase()} LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);

      db.all(query, queryParams, async (err, customers) => {
        if (err) {
          console.error('Error fetching customers:', err);
          return res.status(500).json({
            success: false,
            message: 'Error fetching customers'
          });
        }

        // Fetch addresses for each customer with filtering
        const customersWithAddresses = await Promise.all(customers.map(async (customer) => {
          return new Promise((resolve) => {
            let addressQuery = 'SELECT * FROM addresses WHERE customer_id = ?';
            let addressParams = [customer.id];
            
            // Apply address filters if they exist
            if (city) {
              addressQuery += ' AND city LIKE ?';
              addressParams.push(`%${city}%`);
            }
            if (state) {
              addressQuery += ' AND state LIKE ?';
              addressParams.push(`%${state}%`);
            }
            if (pinCode) {
              addressQuery += ' AND pin_code LIKE ?';
              addressParams.push(`%${pinCode}%`);
            }
            
            db.all(addressQuery, addressParams, (err, addresses) => {
              if (err) {
                console.error('Error fetching addresses for customer:', customer.id, err);
                customer.addresses = [];
              } else {
                customer.addresses = addresses || [];
              }
              resolve(customer);
            });
          });
        }));

        res.json({
          success: true,
          data: customersWithAddresses,
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
    console.error('Error in GET /customers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/customers/multiple-addresses - Get customers with multiple addresses
router.get('/multiple-addresses', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*,
        COUNT(a.id) as address_count
      FROM customers c
      INNER JOIN addresses a ON c.id = a.customer_id
      GROUP BY c.id
      HAVING COUNT(a.id) > 1
      ORDER BY address_count DESC
    `;

    db.all(query, [], async (err, customers) => {
      if (err) {
        console.error('Error fetching customers with multiple addresses:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching customers with multiple addresses'
        });
      }

      // Fetch addresses for each customer
      const customersWithAddresses = await Promise.all(customers.map(async (customer) => {
        return new Promise((resolve) => {
          db.all('SELECT * FROM addresses WHERE customer_id = ?', [customer.id], (err, addresses) => {
            if (err) {
              console.error('Error fetching addresses for customer:', customer.id, err);
              customer.addresses = [];
            } else {
              customer.addresses = addresses || [];
            }
            resolve(customer);
          });
        });
      }));

      res.json({
        success: true,
        data: customersWithAddresses
      });
    });
  } catch (error) {
    console.error('Error in GET /customers/multiple-addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/customers/single-address - Get customers with only one address
router.get('/single-address', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*,
        COUNT(a.id) as address_count
      FROM customers c
      INNER JOIN addresses a ON c.id = a.customer_id
      GROUP BY c.id
      HAVING COUNT(a.id) = 1
      ORDER BY c.created_at DESC
    `;

    db.all(query, [], async (err, customers) => {
      if (err) {
        console.error('Error fetching customers with single address:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching customers with single address'
        });
      }

      // Fetch addresses for each customer
      const customersWithAddresses = await Promise.all(customers.map(async (customer) => {
        return new Promise((resolve) => {
          db.all('SELECT * FROM addresses WHERE customer_id = ?', [customer.id], (err, addresses) => {
            if (err) {
              console.error('Error fetching addresses for customer:', customer.id, err);
              customer.addresses = [];
            } else {
              customer.addresses = addresses || [];
            }
            resolve(customer);
          });
        });
      }));

      res.json({
        success: true,
        data: customersWithAddresses
      });
    });
  } catch (error) {
    console.error('Error in GET /customers/single-address:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);

    const query = `
      SELECT c.*
      FROM customers c
      WHERE c.id = ?
    `;

    db.get(query, [customerId], async (err, customer) => {
      if (err) {
        console.error('Error fetching customer:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching customer'
        });
      }

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Fetch addresses for the customer
      db.all('SELECT * FROM addresses WHERE customer_id = ?', [customerId], (err, addresses) => {
        if (err) {
          console.error('Error fetching addresses for customer:', customerId, err);
          customer.addresses = [];
        } else {
          customer.addresses = addresses || [];
        }

        res.json({
          success: true,
          data: customer
        });
      });
    });
  } catch (error) {
    console.error('Error in GET /customers/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/customers - Create new customer
router.post('/', validateCustomer, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { first_name, last_name, phone_number, email, addresses } = req.body;
    console.log('Received customer creation request:', { first_name, last_name, phone_number, email, addresses });

    // Check for duplicate phone number
    db.get('SELECT id FROM customers WHERE phone_number = ?', [phone_number], (err, existingCustomer) => {
      if (err) {
        console.error('Error checking duplicate phone:', err);
        return res.status(500).json({
          success: false,
          message: 'Error checking duplicate phone number'
        });
      }

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }

      // Check for duplicate email if provided
      if (email) {
        db.get('SELECT id FROM customers WHERE email = ?', [email], (err, existingEmail) => {
          if (err) {
            console.error('Error checking duplicate email:', err);
            return res.status(500).json({
              success: false,
              message: 'Error checking duplicate email'
            });
          }

          if (existingEmail) {
            return res.status(400).json({
              success: false,
              message: 'Email already exists'
            });
          }

          createCustomerWithAddresses();
        });
      } else {
        createCustomerWithAddresses();
      }

      function createCustomerWithAddresses() {
        db.run(
          'INSERT INTO customers (first_name, last_name, phone_number, email) VALUES (?, ?, ?, ?)',
          [first_name, last_name, phone_number, email],
          function(err) {
            if (err) {
              console.error('Error creating customer:', err);
              return res.status(500).json({
                success: false,
                message: 'Error creating customer'
              });
            }

            const customerId = this.lastID;

            // Insert addresses if provided
            if (addresses && addresses.length > 0) {
              console.log('Creating addresses for customer:', customerId, 'Addresses:', addresses);
              let addressCount = 0;
              addresses.forEach((address, index) => {
                console.log('Inserting address:', address);
                db.run(
                  'INSERT INTO addresses (customer_id, address_line1, address_line2, city, state, pin_code, country, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                  [
                    customerId,
                    address.address_line1,
                    address.address_line2 || '',
                    address.city,
                    address.state,
                    address.pin_code,
                    address.country || 'India',
                    address.is_primary || false
                  ],
                  function(err) {
                    if (err) {
                      console.error('Error inserting address:', err);
                    } else {
                      console.log('Address inserted successfully with ID:', this.lastID);
                    }
                    
                    addressCount++;
                    if (addressCount === addresses.length) {
                      updateAddressFlags(customerId);
                    }
                  }
                );
              });
            } else {
              console.log('No addresses provided for customer:', customerId);
              updateAddressFlags(customerId);
            }

            function updateAddressFlags(customerId) {
              console.log('Updating address flags for customer:', customerId);
              // Update has_multiple_addresses flag
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
              `, [customerId, customerId, customerId], function(err) {
                if (err) {
                  console.error('Error updating address flags:', err);
                } else {
                  console.log('Address flags updated successfully. Changes:', this.changes);
                }
              });

              res.status(201).json({
                success: true,
                message: 'Customer created successfully',
                data: { id: customerId, first_name, last_name, phone_number, email }
              });
            }
          }
        );
      }
    });
  } catch (error) {
    console.error('Error in POST /customers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', validateCustomer, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const customerId = parseInt(req.params.id);
    const { first_name, last_name, phone_number, email, addresses } = req.body;
    console.log('Received customer update request:', { customerId, first_name, last_name, phone_number, email, addresses });

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

      // Check for duplicate phone number (excluding current customer)
      db.get('SELECT id FROM customers WHERE phone_number = ? AND id != ?', [phone_number, customerId], (err, existingCustomer) => {
        if (err) {
          console.error('Error checking duplicate phone:', err);
          return res.status(500).json({
            success: false,
            message: 'Error checking duplicate phone number'
          });
        }

        if (existingCustomer) {
          return res.status(400).json({
            success: false,
            message: 'Phone number already exists'
          });
        }

        // Check for duplicate email if provided
        if (email) {
          db.get('SELECT id FROM customers WHERE email = ? AND id != ?', [email, customerId], (err, existingEmail) => {
            if (err) {
              console.error('Error checking duplicate email:', err);
              return res.status(500).json({
                success: false,
                message: 'Error checking duplicate email'
              });
            }

            if (existingEmail) {
              return res.status(400).json({
                success: false,
                message: 'Email already exists'
              });
            }

            updateCustomer();
          });
        } else {
          updateCustomer();
        }

        function updateCustomer() {
          db.run(
            'UPDATE customers SET first_name = ?, last_name = ?, phone_number = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [first_name, last_name, phone_number, email, customerId],
            function(err) {
              if (err) {
                console.error('Error updating customer:', err);
                return res.status(500).json({
                  success: false,
                  message: 'Error updating customer'
                });
              }

              if (this.changes === 0) {
                return res.status(404).json({
                  success: false,
                  message: 'Customer not found'
                });
              }

              // Handle addresses if provided
              if (addresses && addresses.length > 0) {
                console.log('Updating addresses for customer:', customerId, 'Addresses:', addresses);
                
                // First, delete existing addresses
                db.run('DELETE FROM addresses WHERE customer_id = ?', [customerId], function(err) {
                  if (err) {
                    console.error('Error deleting existing addresses:', err);
                  } else {
                    console.log('Deleted existing addresses for customer:', customerId);
                  }

                  // Then insert new addresses
                  let addressCount = 0;
                  addresses.forEach((address, index) => {
                    console.log('Inserting address:', address);
                    db.run(
                      'INSERT INTO addresses (customer_id, address_line1, address_line2, city, state, pin_code, country, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                      [
                        customerId,
                        address.address_line1,
                        address.address_line2 || '',
                        address.city,
                        address.state,
                        address.pin_code,
                        address.country || 'India',
                        address.is_primary || false
                      ],
                      function(err) {
                        if (err) {
                          console.error('Error inserting address:', err);
                        } else {
                          console.log('Address inserted successfully with ID:', this.lastID);
                        }
                        
                        addressCount++;
                        if (addressCount === addresses.length) {
                          updateAddressFlags(customerId);
                        }
                      }
                    );
                  });
                });
              } else {
                // No addresses provided, delete all existing addresses
                db.run('DELETE FROM addresses WHERE customer_id = ?', [customerId], function(err) {
                  if (err) {
                    console.error('Error deleting addresses:', err);
                  }
                  updateAddressFlags(customerId);
                });
              }

              function updateAddressFlags(customerId) {
                console.log('Updating address flags for customer:', customerId);
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
                `, [customerId, customerId, customerId], function(err) {
                  if (err) {
                    console.error('Error updating address flags:', err);
                  } else {
                    console.log('Address flags updated successfully. Changes:', this.changes);
                  }
                });

                res.json({
                  success: true,
                  message: 'Customer updated successfully',
                  data: { id: customerId, first_name, last_name, phone_number, email }
                });
              }
            }
          );
        }
      });
    });
  } catch (error) {
    console.error('Error in PUT /customers/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);

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

      // Delete customer (addresses will be deleted automatically due to CASCADE)
      db.run('DELETE FROM customers WHERE id = ?', [customerId], function(err) {
        if (err) {
          console.error('Error deleting customer:', err);
          return res.status(500).json({
            success: false,
            message: 'Error deleting customer'
          });
        }

        res.json({
          success: true,
          message: 'Customer deleted successfully'
        });
      });
    });
  } catch (error) {
    console.error('Error in DELETE /customers/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
