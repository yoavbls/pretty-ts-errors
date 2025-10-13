// @ts-check

/**
 * @typedef {Object} Person
 * @property {string} name - The person's name.
 * @property {number} age - The person's age.
 * @property {Object} address - The person's address.
 * @property {string} address.street - The street address.
 * @property {string} address.city - The city.
 * @property {string} address.country - The country.
 */

/**
 * @type {Person}
 */
const john = {
  name: "John Doe",
  age: 30,
  address: {
    street: "123 Main St",
    city: "New York",
  },
};

/**
 * Represents a function that returns a user object.
 * @typedef {Function} GetUserFunction
 * @returns {{ user: { name: string, email: string, age: number } }} The user object.
 */

const getPerson = () => ({
  person: {
    username: "usr",
    email: "usr@usr.io",
  },
});


/**
 * @typedef {Object} Animal
 * @property {string} name
 * @property {number} age
 */

/**
 * @template {Animal} T
 * @param {T} animal
 * @returns
 */
function run(animal) {
  return animal;
}

run({ firstName: "John", weight: 20 });

/**
 * @typedef {Object} MyError
 * @property {number} code
 */

try {
  // ...
} catch (/** @type {MyError} */ error) {
  console.log(error.code);
}

export {}