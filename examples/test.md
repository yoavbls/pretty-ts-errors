# Test Type Language in Markdown

```type
interface User {
  name: string;
  age: number;
}

type Status = "active" | "inactive";
```

```type
"active" | "inactive" | 3 | string;

```

For comparison, regular TypeScript:

```typescript
interface User {
  name: string;
  age: number;
}
```
