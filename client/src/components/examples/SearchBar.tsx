import { useState } from 'react';
import SearchBar from '../SearchBar';

export default function SearchBarExample() {
  const [search, setSearch] = useState('');

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-md">
        <SearchBar value={search} onChange={setSearch} />
      </div>
    </div>
  );
}
