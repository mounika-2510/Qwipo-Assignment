# Customer CRUD Application

A full-stack web application for managing customers and their multiple addresses, built with React.js, Node.js, Express.js, and SQLite.

## 🚀 Features

### Customer Management
- ✅ Create, Read, Update, Delete (CRUD) operations for customers
- ✅ Input validation for customer data (name, phone, email)
- ✅ Search customers by name, phone, or email
- ✅ Filter customers by city, state, or pin code
- ✅ Pagination and sorting options
- ✅ Responsive design for mobile and desktop

### Address Management
- ✅ Multiple addresses per customer
- ✅ Primary address designation
- ✅ Address validation (city, state, pin code)
- ✅ Add, edit, and delete addresses
- ✅ View all addresses with customer information

### Advanced Features
- ✅ Dashboard with statistics and quick actions
- ✅ View customers with multiple addresses
- ✅ View customers with single addresses
- ✅ Real-time search and filtering
- ✅ Error handling and user feedback
- ✅ Responsive design with mobile-first approach
- ✅ Modern UI with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React.js** - User interface library
- **React Router** - Client-side routing
- **React Hook Form** - Form handling and validation
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library
- **Tailwind CSS** - Utility-first CSS framework

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **SQLite** - Lightweight database
- **Express Validator** - Input validation
- **Winston** - Logging library
- **Morgan** - HTTP request logger
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd customer-crud-app
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Start the application

#### Option 1: Run both frontend and backend simultaneously
```bash
# From the root directory
npm run dev
```

#### Option 2: Run frontend and backend separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### 4. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## 📁 Project Structure

```
customer-crud-app/
├── server/                 # Backend application
│   ├── database/          # Database configuration
│   │   └── database.js     # SQLite setup and initialization
│   ├── routes/            # API routes
│   │   ├── customers.js   # Customer CRUD operations
│   │   └── addresses.js   # Address CRUD operations
│   ├── index.js           # Main server file
│   └── package.json       # Server dependencies
├── client/                # Frontend application
│   ├── public/            # Static files
│   ├── src/               # React source code
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── App.js         # Main app component
│   │   └── index.js       # React entry point
│   ├── package.json       # Client dependencies
│   └── tailwind.config.js # Tailwind configuration
└── package.json           # Root package.json
```

## 🔧 API Endpoints

### Customers
- `GET /api/customers` - Get all customers with pagination and search
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/multiple-addresses` - Get customers with multiple addresses
- `GET /api/customers/single-address` - Get customers with single address

### Addresses
- `GET /api/addresses` - Get all addresses with pagination and search
- `GET /api/addresses/:id` - Get address by ID
- `POST /api/addresses` - Create new address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address
- `GET /api/addresses/customer/:customerId` - Get addresses for a customer

## 🎯 Key Features Implementation

### Mobile CRUD Operations ✅
- **Create New Customer**: Form validation, success messages
- **Read Customer Details**: Profile screen with all details
- **Update Customer**: Modify fields with confirmation
- **Delete Customer**: Confirmation before deletion
- **Multiple Addresses**: View and manage multiple addresses
- **Search & Filter**: By city, state, pin code
- **Page Navigation**: Pagination and sorting

### Web CRUD Operations ✅
- **Responsive Design**: Works on all screen sizes
- **Form Validation**: Client and server-side validation
- **Error Handling**: Comprehensive error management
- **Real-time Updates**: Immediate feedback
- **Advanced Search**: Full-text search capabilities
- **Infinite Scrolling**: Efficient data loading
- **Sorting Options**: Multiple sort criteria

### Database Features ✅
- **SQLite Database**: Lightweight and efficient
- **Foreign Key Relationships**: Customer-Address relationship
- **Indexes**: Optimized for performance
- **Cascade Deletes**: Automatic cleanup
- **Data Integrity**: Constraints and validation

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktop (1024px+)
- Large screens (1440px+)

## 🔒 Security Features

- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Helmet security headers
- Error handling without exposing sensitive data

## 📊 Performance Features

- Database indexing for faster queries
- Pagination to handle large datasets
- Optimized API responses
- Efficient React rendering
- Lazy loading where appropriate

## 🚀 Deployment

### Backend Deployment
```bash
cd server
npm run build
npm start
```

### Frontend Deployment
```bash
cd client
npm run build
# Deploy the build folder to your hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Joel J Mullananickal
- GitHub: https://github.com/joeljmullananickal

## 🙏 Acknowledgments

- React.js team for the amazing framework
- Tailwind CSS for the utility-first approach
- Express.js community for the robust backend framework
- SQLite for the lightweight database solution

---

**Note**: This application demonstrates proficiency in React.js, Node.js, Express.js, and SQLite with comprehensive CRUD operations, validation, error handling, and responsive design. It's ready for production use and can be extended with additional features as needed.
