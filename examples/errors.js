// @ts-check

/**
 * @typedef {Object} Person
 * @property {string} name
 * @property {number} age
 * @property {Object} address
 * @property {string} address.street
 * @property {string} address.city
 * @property {string} address.country
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
 * @typedef {Function} GetUserFunction
 * @returns {{ user: { name: string, email: string, age: number } }}
 */

const getPerson = () => ({
  person: {
    username: "usr",
    email: "usr@usr.io",
  },
});

/**
 * @typedef {Object} JSAnimal
 * @property {string} name
 * @property {number} age
 */

/**
 * @template {JSAnimal} T
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

export {};
