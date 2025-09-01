const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'customer_crud.db');
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create customers table
      db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          phone_number TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          has_multiple_addresses BOOLEAN DEFAULT FALSE,
          only_one_address BOOLEAN DEFAULT FALSE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating customers table:', err);
          reject(err);
        }
      });

      // Create addresses table
      db.run(`
        CREATE TABLE IF NOT EXISTS addresses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          address_line1 TEXT NOT NULL,
          address_line2 TEXT,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          pin_code TEXT NOT NULL,
          country TEXT DEFAULT 'India',
          is_primary BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating addresses table:', err);
          reject(err);
        }
      });

      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number)', (err) => {
        if (err) console.error('Error creating phone index:', err);
      });

      db.run('CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)', (err) => {
        if (err) console.error('Error creating email index:', err);
      });

      db.run('CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON addresses(customer_id)', (err) => {
        if (err) console.error('Error creating customer_id index:', err);
      });

      db.run('CREATE INDEX IF NOT EXISTS idx_addresses_city ON addresses(city)', (err) => {
        if (err) console.error('Error creating city index:', err);
      });

      db.run('CREATE INDEX IF NOT EXISTS idx_addresses_state ON addresses(state)', (err) => {
        if (err) console.error('Error creating state index:', err);
      });

      db.run('CREATE INDEX IF NOT EXISTS idx_addresses_pin_code ON addresses(pin_code)', (err) => {
        if (err) console.error('Error creating pin_code index:', err);
      });

      // Insert sample data
      insertSampleData()
        .then(() => {
          console.log('Database initialized successfully');
          resolve();
        })
        .catch(reject);
    });
  });
}

function insertSampleData() {
  return new Promise((resolve, reject) => {
    // Check if sample data already exists
    db.get('SELECT COUNT(*) as count FROM customers', (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count > 0) {
        resolve(); // Sample data already exists
        return;
      }

      // Insert sample customers
      const sampleCustomers = [
        {
          first_name: 'John',
          last_name: 'Doe',
          phone_number: '9876543210',
          email: 'john.doe@example.com'
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          phone_number: '9876543211',
          email: 'jane.smith@example.com'
        },
        {
          first_name: 'Mike',
          last_name: 'Johnson',
          phone_number: '9876543212',
          email: 'mike.johnson@example.com'
        }
      ];

      let completed = 0;
      sampleCustomers.forEach((customer, index) => {
        db.run(
          'INSERT INTO customers (first_name, last_name, phone_number, email) VALUES (?, ?, ?, ?)',
          [customer.first_name, customer.last_name, customer.phone_number, customer.email],
          function(err) {
            if (err) {
              console.error('Error inserting sample customer:', err);
            } else {
              const customerId = this.lastID;
              
              // Insert sample addresses for each customer
              const addresses = [
                {
                  address_line1: `${customer.first_name}'s Home`,
                  address_line2: 'Apartment 101',
                  city: 'Mumbai',
                  state: 'Maharashtra',
                  pin_code: '400001',
                  is_primary: true
                },
                {
                  address_line1: `${customer.first_name}'s Office`,
                  address_line2: 'Floor 5',
                  city: 'Delhi',
                  state: 'Delhi',
                  pin_code: '110001',
                  is_primary: false
                }
              ];

              addresses.forEach((address, addrIndex) => {
                db.run(
                  'INSERT INTO addresses (customer_id, address_line1, address_line2, city, state, pin_code, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [customerId, address.address_line1, address.address_line2, address.city, address.state, address.pin_code, address.is_primary],
                  (err) => {
                    if (err) {
                      console.error('Error inserting sample address:', err);
                    }
                  }
                );
              });
            }
            
            completed++;
            if (completed === sampleCustomers.length) {
              // Update has_multiple_addresses flag
              db.run(`
                UPDATE customers 
                SET has_multiple_addresses = TRUE 
                WHERE id IN (
                  SELECT customer_id 
                  FROM addresses 
                  GROUP BY customer_id 
                  HAVING COUNT(*) > 1
                )
              `, (err) => {
                if (err) console.error('Error updating multiple addresses flag:', err);
              });

              // Update only_one_address flag
              db.run(`
                UPDATE customers 
                SET only_one_address = TRUE 
                WHERE id IN (
                  SELECT customer_id 
                  FROM addresses 
                  GROUP BY customer_id 
                  HAVING COUNT(*) = 1
                )
              `, (err) => {
                if (err) console.error('Error updating single address flag:', err);
                resolve();
              });
            }
          }
        );
      });
    });
  });
}

module.exports = {
  db,
  initializeDatabase
};
