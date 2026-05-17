"use client";

import React from "react";
import { TextInput, Select } from "flowbite-react";

type Option = { value: string; label: string };

type Props = {
  search?: string;
  onSearchChange: (v: string) => void;
  filter?: string;
  onFilterChange: (v: string) => void;
  placeholder?: string;
  filterOptions?: Option[];
  filter2?: string;
  onFilter2Change?: (v: string) => void;
  filterOptions2?: Option[];
  className?: string;
};

export default function SearchFilter({
  search = "",
  onSearchChange,
  filter = "all",
  onFilterChange,
  placeholder = "Cari",
  filterOptions = [],
  filter2,
  onFilter2Change,
  filterOptions2 = [],
  className = "",
}: Props) {
  return (
    <div className={`flex gap-3 items-center ${className}`}>
      <TextInput
        placeholder={placeholder}
        value={search}
        onChange={(e) => onSearchChange((e.target as HTMLInputElement).value)}
        className="max-w-md"
        aria-label="search"
      />

      <Select
        value={filter}
        onChange={(e) => onFilterChange((e.target as HTMLSelectElement).value)}
        className="w-40"
        aria-label="filter"
      >
        {filterOptions.length === 0 ? (
          <>
            <option value="all">Semua</option>
          </>
        ) : (
          filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        )}
      </Select>

      {onFilter2Change && (
        <Select
          value={filter2}
          onChange={(e) => onFilter2Change((e.target as HTMLSelectElement).value)}
          className="w-40"
          aria-label="filter2"
        >
          {filterOptions2.length === 0 ? (
            <option value="all">Semua</option>
          ) : (
            filterOptions2.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          )}
        </Select>
      )}
    </div>
  );
}
