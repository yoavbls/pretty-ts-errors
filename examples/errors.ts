interface Person {
  name: string;
  age: number;
  address: {
    street: string;
    city: string;
    country: string;
  };
}

const john: Person = {
  name: "John Doe",
  age: 30,
  address: {
    street: "123 Main St",
    city: "New York",
  },
};

type GetUserFunction = () => {
  user: {
    name: string;
    email: `${string}@${string}.${string}`;
    age: number;
  };
};

const getPerson: GetUserFunction = () => ({
  person: {
    username: "usr",
    email: "usr@usr.io",
  },
});

interface Animal {
  name: string;
  age: number;
}

function run<T extends Animal>(animal: T) {
  return animal;
}

run({ firstName: "John", weight: 20 });
