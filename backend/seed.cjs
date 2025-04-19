const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const BookSchema = new mongoose.Schema({
    bookName: {
        type: String,
        required: true,
        index: true
    },
    alternateTitle: {
        type: String,
        default: ""
    },
    author: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: ""
    },
    publisher: {
        type: String,
        default: ""
    },
    bookCountAvailable: {
        type: Number,
        required: true
    },
    bookStatus: {
        type: String,
        default: "Available"
    },
    categories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BookCategory",
        },
    ],
    transactions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BookTransaction",
        },
    ],
},
{
    timestamps: true
});

const BookCategorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        unique: true,
        index: true
    },
    books: [{
        type: mongoose.Types.ObjectId,
        ref: "Book"
    }],
},
{
    timestamps: true,
});

const BookTransactionSchema = new mongoose.Schema(
    {
    bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
        },
        borrowerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        bookName: {
            type: String,
            required: true,
        },
        borrowerName: {
            type: String,
            required: true,
        },
        transactionType: {
            //Issue or Reservation
            type: String,
            required: true,
        },
        fromDate: {
            type: String,
            required: true,
        },
        toDate: {
            type: String,
            required: true,
        },
        returnDate: {
            type: String
        },
        transactionStatus: {
            type: String,
            default: "Active"
        }
},
{
    timestamps: true,
}
);

const UserSchema = new mongoose.Schema({
    userType: {
        type: String,
        required: true,
        index: true
    },
    userFullName: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    admissionId: {
        type: String,
        min: 3,
        max: 15,
    },
    employeeId: {
        type: String,
        min: 3,
        max: 15,
    },
    age: {
        type: Number
    },
    gender: {
        type: String
    },
    dob: {
        type: String
    },
    address: {
        type: String,
        default: ""
    },
    mobileNumber: {
        type: String,
        required: true
    },
            photo: {
            type: String,
            default: ""
        },
        email: {
            type: String,
            required: true,
            max: 50,
            unique: true,
            index: true
        },
        password: {
            type: String,
            required: true,
            min: 6
        },
        points: {
            type: Number,
            default: 0
        },
            activeTransactions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "BookTransaction",
            },
            ],
        prevTransactions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BookTransaction",
        },
        ],
        isAdmin: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const Book = mongoose.model('Book', BookSchema);
const BookCategory = mongoose.model('BookCategory', BookCategorySchema);
const BookTransaction = mongoose.model('BookTransaction', BookTransactionSchema);
const User = mongoose.model('User', UserSchema);

async function seedDatabase() {
    async function hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

try {
    const path = require('path');
    dotenv.config({ path: path.resolve(__dirname, '.env') });

    console.log('Connecting to database...');
    console.log('MONGO_URL:', process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    console.log('Dropping existing collections...');
    await mongoose.connection.db.dropCollection('books').catch(e => { if (e.code != 26) throw e; });
    await mongoose.connection.db.dropCollection('bookcategories').catch(e => { if (e.code != 26) throw e; });
    await mongoose.connection.db.dropCollection('booktransactions').catch(e => { if (e.code != 26) throw e; });
    await mongoose.connection.db.dropCollection('users').catch(e => { if (e.code != 26) throw e; });
    console.log('Existing collections dropped.');

    console.log('Seeding categories...');
    const categories = await BookCategory.insertMany([
        { categoryName: "Fiction" },
        { categoryName: "Science Fiction" },
        { categoryName: "Mystery" },
        { categoryName: "Thriller" },
        { categoryName: "Non-Fiction" },
        { categoryName: "Biography" },
        { categoryName: "History" },
        { categoryName: "Technology" },
    ]);
    console.log('Categories seeded.');

    const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.categoryName] = cat._id;
        return acc;
    }, {});

    console.log('Seeding users...');
    const usersData = [        { userType: "Member", userFullName: "John Doe", email: "john.doe@example.com", password: "password123", mobileNumber: "1234567890", admissionId: "JD123" },
        { userType: "Member", userFullName: "Jane Smith", email: "jane.smith@example.com", password: "password456", mobileNumber: "9876543210", admissionId: "JS456" },
        { userType: "Admin", userFullName: "Admin User", email: "admin@example.com", password: "adminPassword", mobileNumber: "1122334455", isAdmin: true, employeeId: "AD001" },
    ];

    const users = [];
    for (const userData of usersData) {
        const hashedPassword = await hashPassword(userData.password);
        const newUser = new User({
            ...userData,
            password: hashedPassword,
        });
        users.push(newUser);
    }
    await User.insertMany(users);
    console.log('Users seeded.');

    const userMap = users.reduce((acc, user) => {
        acc[user.userFullName] = user._id;
        return acc;
    }, {});

    console.log('Seeding books...');
    const books = await Book.insertMany([
        {
            bookName: "The Lord of the Rings",
            author: "J.R.R. Tolkien",
            bookCountAvailable: 5,
            categories: [categoryMap["Fiction"]],
        },
        {
            bookName: "Dune",
            author: "Frank Herbert",
            bookCountAvailable: 3,
            categories: [categoryMap["Science Fiction"]],
        },
        {
            bookName: "The Girl with the Dragon Tattoo",
            author: "Stieg Larsson",
            bookCountAvailable: 2,
            categories: [categoryMap["Mystery"], categoryMap["Thriller"]],
        },
        {
            bookName: "Sapiens: A Brief History of Humankind",
            author: "Yuval Noah Harari",
            bookCountAvailable: 4,
            categories: [categoryMap["Non-Fiction"], categoryMap["History"]],
        },
        {
            bookName: "Steve Jobs",
            author: "Walter Isaacson",
            bookCountAvailable: 1,
            categories: [categoryMap["Biography"], categoryMap["Technology"]],
        },
    ]);
    console.log('Books seeded.');

    const bookMap = books.reduce((acc, book) => {
        acc[book.bookName] = book._id;
        return acc;
    }, {});

    console.log('Seeding transactions...');
    await BookTransaction.insertMany([
        {
            bookId: bookMap["The Lord of the Rings"],
            borrowerId: userMap["John Doe"],
            bookName: "The Lord of the Rings",
            borrowerName: "John Doe",
            transactionType: "Issue",
            fromDate: "2024-01-15",
            toDate: "2024-02-15",
        },
        {
            bookId: bookMap["Dune"],
            borrowerId: userMap["Jane Smith"],
            bookName: "Dune",
            borrowerName: "Jane Smith",
            transactionType: "Reservation",
            fromDate: "2024-02-20",
            toDate: "2024-03-20",
        },
        {
            bookId: bookMap["Sapiens: A Brief History of Humankind"],
            borrowerId: userMap["John Doe"],
            bookName: "Sapiens: A Brief History of Humankind",
            borrowerName: "John Doe",
            transactionType: "Issue",
            fromDate: "2023-11-10",
            toDate: "2023-12-10",
            returnDate: "2023-12-05",
            transactionStatus: "Completed",
        },
    ]);
console.log('Transactions seeded.');
console.log('Database seeding complete.');
} catch (error) {
    console.error('Error seeding database:', error);
} finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
}
}
seedDatabase()