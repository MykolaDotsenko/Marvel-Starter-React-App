import { useState } from "react";
import { Icon } from "./Icon.jsx";

export const CompactSearch = ({ activeQuery, onSubmit }) => {
  const [value, setValue] = useState(activeQuery);


  const submit = (event) => {
    event.preventDefault();

    const normalized = value.trim().replace(/\s+/g, " ");
    const input = event.currentTarget.elements.namedItem("header-q");

    if (normalized.length === 1) {
      input?.setCustomValidity("Use at least 2 characters for title search.");
      input?.reportValidity();
      return;
    }

    input?.setCustomValidity("");
    onSubmit(normalized);
  };

  return (
    <form
      className="header-search"
      role="search"
      aria-label="Sticky comic search"
      onSubmit={submit}
    >
      <label className="sr-only" htmlFor="header-issue-search">
        Search Marvel comics from the sticky header
      </label>
      <Icon name="search" size={16} className="header-search__icon" />
      <input
        id="header-issue-search"
        name="header-q"
        type="search"
        value={value}
        maxLength={80}
        autoComplete="off"
        placeholder="Search Marvel…"
        onChange={(event) => {
          event.currentTarget.setCustomValidity("");
          setValue(event.target.value);
        }}
      />
      <button type="submit" aria-label="Search from sticky header">
        <Icon name="search" size={15} />
      </button>
    </form>
  );
};
