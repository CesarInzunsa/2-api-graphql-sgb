const {ApolloServer, gql} = require('apollo-server');
const fs = require('fs');

const schema = fs.readFileSync('./schema.graphql', 'utf8');

const authors = [
    {id: '1', nombre: 'J.K. Rowling', nacionalidad: 'British'},
    {id: '2', nombre: 'J.R.R. Tolkien', nacionalidad: 'British'},
    {id: '3', nombre: 'George Orwell', nacionalidad: 'British'},
];

const books = [
    {
        id: '1',
        titulo: 'Harry Potter and the Philosopher\'s Stone',
        autor: '1',
        ISBN: '0-7475-3269-9',
        aPublicacion: 1997
    },
    {id: '2', titulo: 'The Lord of the Rings', autor: '2', ISBN: '0-395-19395-8', aPublicacion: 1954},
    {id: '3', titulo: 'Animal Farm', autor: '3', ISBN: '0-452-28423-4', aPublicacion: 1945},
    {id: '4', titulo: '1984', autor: '3', ISBN: '0-322-55423-1', aPublicacion: 1949},
    {id: '5', titulo: 'The Silmarillion', autor: '2', ISBN: '0-395-25730-1', aPublicacion: 1977},
];

const loans = [
    {
        id: '1',
        libro: '1',
        usuario: 'Juanito Perez Gonzalez',
        fechaPrestamo: '2024-01-10',
        fechaDevolucion: '2024-01-13'
    },
    {id: '2', libro: '2', usuario: 'Maria Perez Gonzalez', fechaPrestamo: '2024-02-10', fechaDevolucion: '2021-02-15'},
    {
        id: '3',
        libro: '3',
        usuario: 'Juanito Perez Gonzalez',
        fechaPrestamo: '2024-03-10',
        fechaDevolucion: '2021-03-15'
    },
    {id: '4', libro: '4', usuario: 'Maria Perez Gonzalez', fechaPrestamo: '2024-03-12', fechaDevolucion: '2021-03-13'},
    {id: '5', libro: '5', usuario: 'Juanito Perez Gonzalez', fechaPrestamo: '2024-03-20', fechaDevolucion: ''},
];

const resolvers = {
    Query: {
        allBooks: () => {
            return books.map(book => ({
                id: book.id,
                titulo: book.titulo,
                autor: JSON.parse(JSON.stringify(authors.find(author => author.id === book.autor))),
                ISBN: book.ISBN,
                aPublicacion: book.aPublicacion
            }));
        },
        bookById: (root, args) => {
            // Encontrar el libro
            const book = JSON.parse(JSON.stringify(books.find(book => book.id === args.id)));

            // Encontrar el autor
            const author = JSON.parse(JSON.stringify(authors.find(author => author.id === book.autor)));

            // Retornar el libro con el autor
            return {
                id: book.id,
                titulo: book.titulo,
                autor: author,
                ISBN: book.ISBN,
                aPublicacion: book.aPublicacion
            }
        },
        allAuthors: () => {
            return authors
        },
        activeLoans: () => {

            // Crear una copia de los préstamos
            let activeLoans = JSON.parse(JSON.stringify(loans));

            // Recuperar solo los prestamos activos
            activeLoans = JSON.parse(JSON.stringify(activeLoans.filter(loan => loan.fechaDevolucion === '')));

            // Reemplazar el id del libro por el objeto libro
            activeLoans.forEach(loan => {
                loan.libro = JSON.parse(JSON.stringify(books.find(book => book.id === loan.libro)));
            });

            // Ahora reemplazar el autor del libro por el objeto autor
            activeLoans.forEach(loan => {
                loan.libro.autor = JSON.parse(JSON.stringify(authors.find(author => author.id === loan.libro.autor)));
            });

            return activeLoans;
        }
    },
    Mutation: {
        createBook: (root, args) => {

            if (!args.titulo || !args.autor || !args.ISBN || !args.aPublicacion) return ('Faltan datos');

            if (!args.aPublicacion.toString().match(/^[0-9]{4}$/)) return ('El año de publicación debe ser un número de 4 dígitos');

            if (!args.autor.match(/^[0-9]+$/)) return ('El autor debe ser un número positivo');

            if (!authors.find(author => author.id === args.autor)) return ('El autor no existe');

            // Crear un nuevo libro
            const newBook = {
                id: (books.length + 1).toString(),
                titulo: args.titulo,
                autor: args.autor,
                ISBN: args.ISBN,
                aPublicacion: args.aPublicacion
            };

            // Agregar el libro al array de libros
            books.push(newBook);

            // Retornar el nuevo libro
            return 'Libro creado con éxito!'
        },
        createAuthor: (root, args) => {

            if (args.nombre === '' || args.nacionalidad === '') return 'Faltan datos';

            if (authors.find(author => author.nombre === args.nombre)) return 'El autor ya existe';

            // Crear un nuevo autor
            const newAuthor = {
                id: (authors.length + 1).toString(),
                nombre: args.nombre,
                nacionalidad: args.nacionalidad
            };

            // Agregar el autor al array de autores
            authors.push(newAuthor);

            // Retornar el nuevo autor
            return 'Autor creado con éxito!'
        },
        createLoan: (root, args) => {

            if (!args.libro || !args.usuario) return 'Faltan datos';

            // Crear un nuevo préstamo
            const newLoan = {
                id: (loans.length + 1).toString(),
                libro: args.libro,
                usuario: args.usuario,
                fechaPrestamo: Date.now().toString(),
                fechaDevolucion: ''
            };

            // Agregar el préstamo al array de préstamos
            loans.push(newLoan);

            // Retornar el nuevo préstamo
            return 'Préstamo creado con éxito!'
        },
        returnLoan: (root, args) => {

            if (!args.id) return 'Falta el id del préstamo';

            if (!loans.find(loan => loan.id === args.id)) return 'El préstamo no existe o ya fue devuelto';

            // me falta esta parte
            if (loans.find(loan => loan.id === args.id).fechaDevolucion !== '') return 'El préstamo ya fue devuelto';

            // Encontrar el préstamo
            const loan = loans.find(loan => loan.id === args.id);

            // Actualizar la fecha de devolución
            loan.fechaDevolucion = Date.now().toString();

            // Retornar el préstamo actualizado
            return 'Préstamo devuelto con éxito!'
        }
    }
}

const server = new ApolloServer({
    typeDefs: gql(schema),
    resolvers,
});

server.listen().then(({url}) => {
    console.log(`Server running at ${url}`);
});