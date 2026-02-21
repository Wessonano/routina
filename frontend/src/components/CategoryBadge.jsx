import { CATEGORIES } from '../categories';

export default function CategoryBadge({ category }) {
  const cat = CATEGORIES[category] || CATEGORIES.autre;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cat.bgLight} ${cat.text}`}>
      {cat.label}
    </span>
  );
}
